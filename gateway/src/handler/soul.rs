//! Soul (SBT record) — draft creation and lookup.
//!
//! Back-compat note: this replaces the old mock `souls.rs` which hard-coded
//! a demo Soul. All ops now hit the real `souls` table.

use actix_web::{web, HttpResponse};
use serde::Deserialize;
use serde_json::json;

use crate::database::{urlencoding, SupabaseClient};
use crate::model::{error_response, error_type, success_response};

#[derive(Deserialize)]
pub struct SoulQuery {
    pub email: String,
}

#[derive(Deserialize)]
pub struct SoulPostBody {
    pub email: String,
    pub talent_label: String,
    pub traits: Option<Vec<String>>,
    pub wallet_address: Option<String>,
}

pub async fn list_souls(
    sb: web::Data<Option<SupabaseClient>>,
    q: web::Query<SoulQuery>,
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
    let filter = if let Some(uid) = &user_id {
        format!("user_id=eq.{}&deleted_at=is.null&order=created_at.desc", uid)
    } else {
        format!(
            "email=eq.{}&deleted_at=is.null&order=created_at.desc",
            urlencoding(&q.email.to_lowercase())
        )
    };

    match sb.select("souls", &filter).await {
        Ok(v) => {
            let souls = v.as_array().cloned().unwrap_or_default();
            HttpResponse::Ok().json(success_response(json!({ "souls": souls }), "souls"))
        }
        Err(e) => db_error(&e),
    }
}

pub async fn create_soul(
    sb: web::Data<Option<SupabaseClient>>,
    body: web::Json<SoulPostBody>,
) -> HttpResponse {
    let sb = match sb.get_ref() {
        Some(c) => c,
        None => return db_unavailable(),
    };

    if body.talent_label.trim().is_empty() || body.email.trim().is_empty() {
        return HttpResponse::BadRequest().json(error_response(
            "validation_error",
            error_type::CLIENT,
            "email and talent_label required",
        ));
    }

    let user_id = sb.resolve_user_id(&body.email).await.ok().flatten();

    let mut row = serde_json::Map::new();
    row.insert("email".into(), json!(body.email.to_lowercase()));
    if let Some(uid) = &user_id {
        row.insert("user_id".into(), json!(uid));
    }
    row.insert("talent_label".into(), json!(body.talent_label));
    row.insert(
        "traits".into(),
        json!(body.traits.clone().unwrap_or_default()),
    );
    if let Some(addr) = &body.wallet_address {
        row.insert("wallet_address".into(), json!(addr));
    }
    row.insert("stage".into(), json!("sparked"));
    row.insert("status".into(), json!("draft"));
    row.insert("created_at".into(), json!(chrono::Utc::now().to_rfc3339()));

    match sb.insert("souls", &json!(vec![row])).await {
        Ok(v) => {
            let soul = v.as_array().and_then(|a| a.first().cloned()).unwrap_or(json!({}));
            HttpResponse::Created()
                .json(success_response(json!({ "soul": soul }), "soul created"))
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
    log::error!("soul db error: {}", detail);
    HttpResponse::InternalServerError().json(error_response(
        "db_error",
        error_type::SERVER,
        "database error",
    ))
}
