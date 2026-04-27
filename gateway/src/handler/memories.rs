//! Unified memories timeline (6 tabs).
//!
//! `journal`   — committed diary_entries
//! `chat`      — diary_entries with role in (user, assistant) AND committed_at NULL
//! `discovery` — embers.discovery_conversation (unwrapped)
//! `stage`     — embers (current stage per ember)
//! `mint`      — souls where status = 'minted'
//! `capsule`   — committed diary_entries with unlocks_at set

use actix_web::{web, HttpResponse};
use serde::Deserialize;
use serde_json::json;

use crate::database::{urlencoding, SupabaseClient};
use crate::model::{error_response, error_type, success_response};

#[derive(Deserialize)]
pub struct MemoriesQuery {
    pub email: String,
    #[serde(default = "default_tab")]
    pub tab: String,
}

fn default_tab() -> String {
    "journal".to_string()
}

pub async fn list_memories(
    sb: web::Data<Option<SupabaseClient>>,
    q: web::Query<MemoriesQuery>,
) -> HttpResponse {
    let sb = match sb.get_ref() {
        Some(c) => c,
        None => return db_unavailable(),
    };

    if q.email.trim().is_empty() {
        return HttpResponse::BadRequest().json(error_response(
            "validation_error",
            error_type::CLIENT,
            "email required",
        ));
    }

    let (user_id, _) = match sb.resolve_user_and_ember(&q.email).await {
        Ok(v) => v,
        Err(e) => return db_error(&e),
    };
    let id_filter = if let Some(uid) = &user_id {
        format!("user_id=eq.{}", uid)
    } else {
        format!("email=eq.{}", urlencoding(&q.email.to_lowercase()))
    };

    let now = chrono::Utc::now().date_naive();

    let items = match q.tab.as_str() {
        "journal" => {
            let filter = format!(
                "{}&committed_at=not.is.null&deleted_at=is.null&order=date.desc&limit=200",
                id_filter
            );
            let rows = match sb.select("diary_entries", &filter).await {
                Ok(v) => v,
                Err(e) => return db_error(&e),
            };
            rows.as_array()
                .cloned()
                .unwrap_or_default()
                .into_iter()
                .map(|e| {
                    let unlocks = e
                        .get("unlocks_at")
                        .and_then(|v| v.as_str())
                        .and_then(|s| chrono::NaiveDate::parse_from_str(s, "%Y-%m-%d").ok());
                    let locked = unlocks.map(|d| d > now).unwrap_or(false);
                    json!({
                        "id": e.get("id"),
                        "kind": "journal",
                        "date": e.get("date"),
                        "state": e.get("state"),
                        "content": if locked { json!("") } else { e.get("content").cloned().unwrap_or(json!("")) },
                        "locked": locked,
                        "unlocks_at": e.get("unlocks_at"),
                    })
                })
                .collect::<Vec<_>>()
        }
        "capsule" => {
            let filter = format!(
                "{}&committed_at=not.is.null&unlocks_at=not.is.null&order=unlocks_at.asc",
                id_filter
            );
            let rows = match sb.select("diary_entries", &filter).await {
                Ok(v) => v,
                Err(e) => return db_error(&e),
            };
            rows.as_array()
                .cloned()
                .unwrap_or_default()
                .into_iter()
                .map(|e| {
                    let unlocks = e
                        .get("unlocks_at")
                        .and_then(|v| v.as_str())
                        .and_then(|s| chrono::NaiveDate::parse_from_str(s, "%Y-%m-%d").ok());
                    let locked = unlocks.map(|d| d > now).unwrap_or(false);
                    json!({
                        "id": e.get("id"),
                        "kind": "capsule",
                        "date": e.get("unlocks_at"),
                        "writtenOn": e.get("date"),
                        "state": e.get("state"),
                        "content": if locked { json!("") } else { e.get("content").cloned().unwrap_or(json!("")) },
                        "locked": locked,
                    })
                })
                .collect()
        }
        "chat" => {
            let filter = format!(
                "{}&committed_at=is.null&deleted_at=is.null&order=created_at.desc&limit=200",
                id_filter
            );
            let rows = match sb.select("diary_entries", &filter).await {
                Ok(v) => v,
                Err(e) => return db_error(&e),
            };
            rows.as_array()
                .cloned()
                .unwrap_or_default()
                .into_iter()
                .map(|e| {
                    let date = e
                        .get("date")
                        .and_then(|v| v.as_str())
                        .map(|s| s.to_string())
                        .or_else(|| {
                            e.get("created_at")
                                .and_then(|v| v.as_str())
                                .and_then(|s| s.get(..10).map(|x| x.to_string()))
                        });
                    json!({
                        "id": e.get("id"),
                        "kind": "chat",
                        "date": date,
                        "role": e.get("role"),
                        "content": e.get("content"),
                    })
                })
                .collect()
        }
        "discovery" => {
            let filter = format!("{}&order=created_at.desc", id_filter);
            let rows = match sb.select("embers", &filter).await {
                Ok(v) => v,
                Err(e) => return db_error(&e),
            };
            let mut items = vec![];
            for ember in rows.as_array().cloned().unwrap_or_default() {
                let ember_id = ember.get("id").cloned().unwrap_or(json!(""));
                let talent = ember.get("talent").cloned().unwrap_or(json!(""));
                let created = ember
                    .get("created_at")
                    .and_then(|v| v.as_str())
                    .and_then(|s| s.get(..10))
                    .map(|s| s.to_string());
                let conv = ember
                    .get("discovery_conversation")
                    .cloned()
                    .unwrap_or(json!([]));
                let conv_arr = conv.as_array().cloned().unwrap_or_default();
                for (i, entry) in conv_arr.iter().enumerate() {
                    items.push(json!({
                        "id": format!("{}-disc-{}", ember_id.as_str().unwrap_or(""), i),
                        "kind": "discovery",
                        "date": created,
                        "key": entry.get("key"),
                        "content": entry.get("content"),
                        "role": entry.get("role"),
                        "talent": talent,
                    }));
                }
            }
            items
        }
        "stage" => {
            let filter = format!("{}&order=updated_at.desc", id_filter);
            let rows = match sb.select("embers", &filter).await {
                Ok(v) => v,
                Err(e) => return db_error(&e),
            };
            rows.as_array()
                .cloned()
                .unwrap_or_default()
                .into_iter()
                .map(|e| {
                    let id = e.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string();
                    json!({
                        "id": format!("{}-stage", id),
                        "kind": "stage",
                        "date": e.get("updated_at").and_then(|v| v.as_str()).and_then(|s| s.get(..10)),
                        "stage": e.get("ember_stage"),
                        "talent": e.get("talent"),
                    })
                })
                .collect()
        }
        "mint" => {
            let filter = format!(
                "{}&status=eq.minted&order=created_at.desc",
                id_filter
            );
            let rows = match sb.select("souls", &filter).await {
                Ok(v) => v,
                Err(e) => return db_error(&e),
            };
            rows.as_array()
                .cloned()
                .unwrap_or_default()
                .into_iter()
                .map(|s| {
                    json!({
                        "id": s.get("id"),
                        "kind": "mint",
                        "date": s.get("created_at").and_then(|v| v.as_str()).and_then(|x| x.get(..10)),
                        "talent": s.get("talent_label"),
                        "mint_tx": s.get("mint_tx"),
                        "mint_address": s.get("mint_address"),
                    })
                })
                .collect()
        }
        _ => {
            return HttpResponse::BadRequest().json(error_response(
                "validation_error",
                error_type::CLIENT,
                "unknown tab",
            ));
        }
    };

    HttpResponse::Ok().json(success_response(json!({ "items": items }), "memories"))
}

fn db_unavailable() -> HttpResponse {
    HttpResponse::ServiceUnavailable().json(error_response(
        "db_unavailable",
        error_type::SERVER,
        "database not configured",
    ))
}

fn db_error(detail: &str) -> HttpResponse {
    log::error!("memories db error: {}", detail);
    HttpResponse::InternalServerError().json(error_response(
        "db_error",
        error_type::SERVER,
        "database error",
    ))
}
