//! Timecapsule — forward (schedule unlock) and backward (surface past entries).
//!
//!   POST /api/timecapsule              — set unlocks_at on an entry you own
//!   GET  /api/timecapsule?mode=locked  — list entries with future unlocks_at
//!   GET  /api/timecapsule?mode=surfacing&days=N — "N days ago today"

use actix_web::{web, HttpResponse};
use serde::Deserialize;
use serde_json::json;

use crate::database::{urlencoding, SupabaseClient};
use crate::model::{error_response, error_type, success_response};

#[derive(Deserialize)]
pub struct CapsulePostBody {
    pub email: String,
    pub entry_id: String,
    pub unlocks_at: String, // YYYY-MM-DD
}

#[derive(Deserialize)]
pub struct CapsuleQuery {
    pub email: String,
    #[serde(default = "default_mode")]
    pub mode: String,
    #[serde(default = "default_days")]
    pub days: i64,
}

fn default_mode() -> String {
    "locked".into()
}
fn default_days() -> i64 {
    180
}

pub async fn schedule_capsule(
    sb: web::Data<Option<SupabaseClient>>,
    body: web::Json<CapsulePostBody>,
) -> HttpResponse {
    let sb = match sb.get_ref() {
        Some(c) => c,
        None => return db_unavailable(),
    };

    if body.email.trim().is_empty()
        || body.entry_id.trim().is_empty()
        || body.unlocks_at.trim().is_empty()
    {
        return HttpResponse::BadRequest().json(error_response(
            "validation_error",
            error_type::CLIENT,
            "email, entry_id, unlocks_at required",
        ));
    }

    let target = match chrono::NaiveDate::parse_from_str(&body.unlocks_at, "%Y-%m-%d") {
        Ok(d) => d,
        Err(_) => {
            return HttpResponse::BadRequest().json(error_response(
                "validation_error",
                error_type::CLIENT,
                "unlocks_at must be YYYY-MM-DD",
            ))
        }
    };
    if target <= chrono::Utc::now().date_naive() {
        return HttpResponse::BadRequest().json(error_response(
            "validation_error",
            error_type::CLIENT,
            "unlocks_at must be a future date",
        ));
    }

    let user_id = sb
        .resolve_user_id(&body.email)
        .await
        .ok()
        .flatten();

    let mut filter = format!("id=eq.{}", urlencoding(&body.entry_id));
    if let Some(uid) = &user_id {
        filter.push_str(&format!("&user_id=eq.{}", uid));
    } else {
        filter.push_str(&format!(
            "&email=eq.{}",
            urlencoding(&body.email.to_lowercase())
        ));
    }

    let row = json!({ "unlocks_at": body.unlocks_at });
    match sb.update("diary_entries", &filter, &row).await {
        Ok(v) => {
            let entry = v.as_array().and_then(|a| a.first().cloned()).unwrap_or(json!({}));
            HttpResponse::Ok().json(success_response(
                json!({ "entry": entry }),
                "capsule scheduled",
            ))
        }
        Err(e) => db_error(&e),
    }
}

pub async fn list_capsule(
    sb: web::Data<Option<SupabaseClient>>,
    q: web::Query<CapsuleQuery>,
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

    let user_id = sb.resolve_user_id(&q.email).await.ok().flatten();

    // "surfacing" mode — "N days ago today"
    if q.mode == "surfacing" {
        if let Some(uid) = &user_id {
            match sb
                .rpc(
                    "timecapsule_backward",
                    &json!({ "match_user_id": uid, "days_ago": q.days }),
                )
                .await
            {
                Ok(v) => {
                    let entries = v.as_array().cloned().unwrap_or_default();
                    return HttpResponse::Ok()
                        .json(success_response(json!({ "entries": entries }), "surfacing"));
                }
                Err(e) => return db_error(&e),
            }
        }
        // Fallback: email-keyed path (no user row yet)
        let target = chrono::Utc::now().date_naive() - chrono::Duration::days(q.days);
        let filter = format!(
            "email=eq.{}&date=eq.{}&committed_at=not.is.null",
            urlencoding(&q.email.to_lowercase()),
            target.format("%Y-%m-%d")
        );
        match sb.select("diary_entries", &filter).await {
            Ok(v) => {
                let entries = v.as_array().cloned().unwrap_or_default();
                return HttpResponse::Ok()
                    .json(success_response(json!({ "entries": entries }), "surfacing"));
            }
            Err(e) => return db_error(&e),
        }
    }

    // "locked" mode (default)
    let id_filter = if let Some(uid) = &user_id {
        format!("user_id=eq.{}", uid)
    } else {
        format!("email=eq.{}", urlencoding(&q.email.to_lowercase()))
    };
    let filter = format!(
        "{}&unlocks_at=not.is.null&committed_at=not.is.null&order=unlocks_at.asc",
        id_filter
    );
    match sb.select("diary_entries", &filter).await {
        Ok(v) => {
            let now = chrono::Utc::now().date_naive();
            let entries: Vec<_> = v
                .as_array()
                .cloned()
                .unwrap_or_default()
                .into_iter()
                .map(|mut e| {
                    let unlocks = e
                        .get("unlocks_at")
                        .and_then(|v| v.as_str())
                        .and_then(|s| chrono::NaiveDate::parse_from_str(s, "%Y-%m-%d").ok());
                    let locked = unlocks.map(|d| d > now).unwrap_or(false);
                    if let Some(obj) = e.as_object_mut() {
                        obj.insert("locked".into(), json!(locked));
                    }
                    e
                })
                .collect();
            HttpResponse::Ok().json(success_response(json!({ "entries": entries }), "capsules"))
        }
        Err(e) => db_error(&e),
    }
}

fn db_unavailable() -> HttpResponse {
    HttpResponse::ServiceUnavailable().json(error_response(
        "db_unavailable",
        error_type::SERVER,
        "database not configured",
    ))
}

fn db_error(detail: &str) -> HttpResponse {
    log::error!("capsule db error: {}", detail);
    HttpResponse::InternalServerError().json(error_response(
        "db_error",
        error_type::SERVER,
        "database error",
    ))
}
