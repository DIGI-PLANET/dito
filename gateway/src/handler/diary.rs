//! Journal entries (daily ritual).
//!
//! Invariants enforced (DB trigger + here):
//!   * One committed entry per (user, ember, local date)
//!   * Committed rows are immutable — no UPDATE, no DELETE
//!   * `unlocks_at` (optional future date) hides content until that day
//!
//! Identity: we key on `email` from the query/body, resolve to `user_id`
//! via the `users` table, then fall back to the legacy `email` column if
//! the user row doesn't exist yet. This matches the Next.js pattern and
//! lets pre-auth callers still write.

use actix_web::{web, HttpResponse};
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::database::{urlencoding, SupabaseClient};
use crate::model::{error_response, error_type, success_response};

const STAGES: &[&str] = &["dormant", "sparked", "burning", "blazing", "radiant", "eternal"];

// ── Query / body ─────────────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct DiaryGetQuery {
    pub email: String,
    pub date: Option<String>,
}

#[derive(Deserialize)]
pub struct DiaryPostBody {
    pub email: String,
    pub content: String,
    pub date: Option<String>,
    pub ember_id: Option<String>,
    pub state: Option<String>,
    #[serde(default)]
    pub committed: bool,
    pub unlocks_at: Option<String>,
}

#[derive(Serialize)]
struct PublicEntry {
    #[serde(flatten)]
    inner: serde_json::Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    locked: Option<bool>,
}

// ── GET /api/diary ───────────────────────────────────────────────────────

pub async fn list_diary(
    sb: web::Data<Option<SupabaseClient>>,
    q: web::Query<DiaryGetQuery>,
) -> HttpResponse {
    let sb = match sb.get_ref() {
        Some(c) => c,
        None => return db_unavailable(),
    };

    let email = q.email.trim();
    if email.is_empty() {
        return HttpResponse::BadRequest().json(error_response(
            "validation_error",
            error_type::CLIENT,
            "email required",
        ));
    }

    let (user_id, _) = match sb.resolve_user_and_ember(email).await {
        Ok(v) => v,
        Err(e) => return db_error(&e),
    };

    let mut filter = if let Some(uid) = &user_id {
        format!("user_id=eq.{}", uid)
    } else {
        format!("email=eq.{}", urlencoding(&email.to_lowercase()))
    };
    if let Some(d) = &q.date {
        filter.push_str(&format!("&date=eq.{}", urlencoding(d)));
    }
    filter.push_str("&order=created_at.desc&limit=100");

    let rows = match sb.select("diary_entries", &filter).await {
        Ok(v) => v,
        Err(e) => return db_error(&e),
    };

    // Hide locked content (unlocks_at in the future)
    let now = chrono::Utc::now().date_naive();
    let entries: Vec<serde_json::Value> = rows
        .as_array()
        .cloned()
        .unwrap_or_default()
        .into_iter()
        .map(|mut row| {
            let locked = row
                .get("unlocks_at")
                .and_then(|v| v.as_str())
                .and_then(|s| chrono::NaiveDate::parse_from_str(s, "%Y-%m-%d").ok())
                .map(|d| d > now)
                .unwrap_or(false);
            if locked {
                if let Some(obj) = row.as_object_mut() {
                    obj.insert("content".into(), json!(""));
                    obj.insert("locked".into(), json!(true));
                }
            }
            row
        })
        .collect();

    HttpResponse::Ok().json(success_response(
        json!({ "entries": entries }),
        "diary entries",
    ))
}

// ── POST /api/diary ──────────────────────────────────────────────────────

pub async fn create_diary(
    sb: web::Data<Option<SupabaseClient>>,
    body: web::Json<DiaryPostBody>,
) -> HttpResponse {
    let sb = match sb.get_ref() {
        Some(c) => c,
        None => return db_unavailable(),
    };

    if body.email.trim().is_empty() || body.content.trim().is_empty() {
        return HttpResponse::BadRequest().json(error_response(
            "validation_error",
            error_type::CLIENT,
            "email and content required",
        ));
    }

    if body.committed && body.state.is_none() {
        return HttpResponse::BadRequest().json(error_response(
            "validation_error",
            error_type::CLIENT,
            "state required when committing",
        ));
    }
    if let Some(state) = &body.state {
        if !STAGES.contains(&state.as_str()) {
            return HttpResponse::BadRequest().json(error_response(
                "validation_error",
                error_type::CLIENT,
                "invalid state",
            ));
        }
    }

    let (user_id, resolved_ember_id) = match sb.resolve_user_and_ember(&body.email).await {
        Ok(v) => v,
        Err(e) => return db_error(&e),
    };
    let ember_id = body.ember_id.clone().or(resolved_ember_id);
    let resolved_date = body
        .date
        .clone()
        .unwrap_or_else(|| chrono::Utc::now().date_naive().format("%Y-%m-%d").to_string());

    // Permanence check: reject if a committed entry already exists
    if body.committed {
        let mut filter = if let Some(uid) = &user_id {
            format!("user_id=eq.{}", uid)
        } else {
            format!("email=eq.{}", urlencoding(&body.email.to_lowercase()))
        };
        filter.push_str(&format!(
            "&date=eq.{}&committed_at=not.is.null&limit=1",
            urlencoding(&resolved_date)
        ));
        match sb.select("diary_entries", &filter).await {
            Ok(rows) => {
                if rows.as_array().map(|a| !a.is_empty()).unwrap_or(false) {
                    return HttpResponse::Conflict().json(error_response(
                        "already_committed",
                        error_type::CLIENT,
                        "already committed for this date",
                    ));
                }
            }
            Err(e) => return db_error(&e),
        }
    }

    let mut row = serde_json::Map::new();
    row.insert("content".into(), json!(body.content));
    row.insert("date".into(), json!(resolved_date));
    row.insert("email".into(), json!(body.email.to_lowercase()));
    if let Some(uid) = &user_id {
        row.insert("user_id".into(), json!(uid));
    }
    if let Some(eid) = &ember_id {
        row.insert("ember_id".into(), json!(eid));
    }
    if let Some(state) = &body.state {
        row.insert("state".into(), json!(state));
    }
    if body.committed {
        row.insert(
            "committed_at".into(),
            json!(chrono::Utc::now().to_rfc3339()),
        );
    }
    if let Some(unlocks) = &body.unlocks_at {
        row.insert("unlocks_at".into(), json!(unlocks));
    }

    match sb.insert("diary_entries", &json!(vec![row])).await {
        Ok(arr) => {
            let entry = arr.as_array().and_then(|a| a.first().cloned()).unwrap_or(json!({}));
            HttpResponse::Created().json(success_response(
                json!({ "entry": entry }),
                "entry saved",
            ))
        }
        Err(e) => db_error(&e),
    }
}

// ── helpers ──────────────────────────────────────────────────────────────

fn db_unavailable() -> HttpResponse {
    HttpResponse::ServiceUnavailable().json(error_response(
        "db_unavailable",
        error_type::SERVER,
        "database not configured",
    ))
}

fn db_error(detail: &str) -> HttpResponse {
    log::error!("diary db error: {}", detail);
    HttpResponse::InternalServerError().json(error_response(
        "db_error",
        error_type::SERVER,
        "database error",
    ))
}
