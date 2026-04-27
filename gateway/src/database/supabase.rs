//! Minimal Supabase PostgREST client over `reqwest`.
//!
//! Keeps the abstraction surface tiny — four ops (`select`, `insert`,
//! `update`, `rpc`) that map 1:1 to PostgREST verbs. Callers build their own
//! query strings (`email=eq.foo&order=created_at.desc`) — this mirrors how
//! the JS `@supabase/supabase-js` client serialises filters, so moving
//! Next.js code over is a syntax translation, not a rewrite.
//!
//! Errors are `String` on purpose: handlers map them to `HttpResponse::InternalServerError`
//! with the message preserved for logs.

use log::warn;
use reqwest::{Client, Method};
use serde_json::Value;

#[derive(Clone)]
pub struct SupabaseClient {
    url: String,
    key: String,
    client: Client,
}

impl SupabaseClient {
    /// Build from env. Returns `None` if either `SUPABASE_URL` or
    /// `SUPABASE_SERVICE_KEY` is unset / empty. Handlers should treat a `None`
    /// as "DB unavailable → 503".
    pub fn from_env() -> Option<Self> {
        let url = std::env::var("SUPABASE_URL").ok()?;
        let key = std::env::var("SUPABASE_SERVICE_KEY").ok()?;
        if url.is_empty() || key.is_empty() {
            warn!("SupabaseClient: SUPABASE_URL or SUPABASE_SERVICE_KEY missing — DB disabled");
            return None;
        }
        Some(Self {
            url: url.trim_end_matches('/').to_string(),
            key,
            client: Client::new(),
        })
    }

    fn table_url(&self, table: &str) -> String {
        format!("{}/rest/v1/{}", self.url, table)
    }

    fn rpc_url(&self, name: &str) -> String {
        format!("{}/rest/v1/rpc/{}", self.url, name)
    }

    fn headers(&self, request: reqwest::RequestBuilder) -> reqwest::RequestBuilder {
        request
            .header("apikey", &self.key)
            .header("Authorization", format!("Bearer {}", self.key))
            .header("Content-Type", "application/json")
            .header("Prefer", "return=representation")
    }

    async fn send(&self, req: reqwest::RequestBuilder) -> Result<Value, String> {
        let res = req.send().await.map_err(|e| format!("network: {e}"))?;
        let status = res.status();
        let text = res.text().await.unwrap_or_default();
        if !status.is_success() {
            return Err(format!("supabase {}: {}", status.as_u16(), text));
        }
        if text.is_empty() {
            return Ok(Value::Null);
        }
        serde_json::from_str(&text).map_err(|e| format!("parse: {e}"))
    }

    /// GET /rest/v1/{table}?select=...&{query}
    ///
    /// `query` is the PostgREST filter string, e.g.
    /// `"email=eq.roy@example.com&order=created_at.desc&limit=10"`.
    /// If empty, returns all rows (capped server-side).
    pub async fn select(&self, table: &str, query: &str) -> Result<Value, String> {
        let url = if query.is_empty() {
            format!("{}?select=*", self.table_url(table))
        } else {
            format!("{}?select=*&{}", self.table_url(table), query)
        };
        self.send(self.headers(self.client.get(&url))).await
    }

    /// Same as `select` but returns the first row (or `None`).
    pub async fn select_one(&self, table: &str, query: &str) -> Result<Option<Value>, String> {
        let arr = self.select(table, query).await?;
        Ok(arr
            .as_array()
            .and_then(|a| a.first().cloned()))
    }

    /// POST /rest/v1/{table} with body
    pub async fn insert(&self, table: &str, body: &Value) -> Result<Value, String> {
        let url = self.table_url(table);
        self.send(self.headers(self.client.post(&url)).json(body))
            .await
    }

    /// PATCH /rest/v1/{table}?{filter} with body
    ///
    /// Only rows matching the filter are updated. PostgREST returns the
    /// updated row(s).
    pub async fn update(
        &self,
        table: &str,
        filter: &str,
        body: &Value,
    ) -> Result<Value, String> {
        let url = format!("{}?{}", self.table_url(table), filter);
        self.send(self.headers(self.client.patch(&url)).json(body))
            .await
    }

    /// POST /rest/v1/rpc/{name} — call a stored function.
    pub async fn rpc(&self, name: &str, args: &Value) -> Result<Value, String> {
        let url = self.rpc_url(name);
        self.send(self.headers(self.client.post(&url)).json(args))
            .await
    }

    /// Resolve email → user_id. Returns `None` if not found.
    pub async fn resolve_user_id(&self, email: &str) -> Result<Option<String>, String> {
        let q = format!(
            "email=eq.{}&select=id&limit=1",
            urlencoding(&email.to_lowercase())
        );
        let arr = self.select("users", &q).await?;
        Ok(arr
            .as_array()
            .and_then(|a| a.first())
            .and_then(|row| row.get("id"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()))
    }

    /// Resolve email → (user_id, active ember_id). Either can be None.
    pub async fn resolve_user_and_ember(
        &self,
        email: &str,
    ) -> Result<(Option<String>, Option<String>), String> {
        let user_id = match self.resolve_user_id(email).await? {
            Some(id) => id,
            None => return Ok((None, None)),
        };
        let q = format!(
            "user_id=eq.{}&abandoned_at=is.null&order=created_at.desc&limit=1",
            user_id
        );
        let ember_id = self
            .select_one("embers", &q)
            .await?
            .and_then(|v| v.get("id").and_then(|id| id.as_str()).map(|s| s.to_string()));
        Ok((Some(user_id), ember_id))
    }
}

/// Minimal URL encoder for PostgREST values. Replaces a small fixed set of
/// characters that break the `key=op.value` grammar.
pub fn urlencoding(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            'a'..='z' | 'A'..='Z' | '0'..='9' | '-' | '_' | '.' | '~' => out.push(c),
            ' ' => out.push_str("%20"),
            c => {
                let mut buf = [0u8; 4];
                for byte in c.encode_utf8(&mut buf).as_bytes() {
                    out.push_str(&format!("%{:02X}", byte));
                }
            }
        }
    }
    out
}
