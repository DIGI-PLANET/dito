//! Ember (SBT = 잠재력의 불꽃) CRUD.
//!
//!   GET  /api/ember?email=             — active ember for this user
//!   GET  /api/ember?email=&all=1       — every ember (for Ashes list)
//!   POST /api/ember                    — create (onboarding → ignite)
//!   PUT  /api/ember                    — update (e.g. mark abandoned_at)

use actix_web::{web, HttpResponse};
use serde::Deserialize;
use serde_json::json;

use crate::database::{urlencoding, SupabaseClient};
use crate::model::{error_response, error_type, success_response};

#[derive(Deserialize)]
pub struct EmberQuery {
    pub email: String,
    #[serde(default)]
    pub all: Option<String>,
}

#[derive(Deserialize)]
pub struct EmberPostBody {
    pub email: String,
    pub ember_name: String,
    pub talent: String,
    pub talent_category: Option<String>,
    pub discovery_conversation: Option<serde_json::Value>,
    pub lang: Option<String>,
}

#[derive(Deserialize)]
pub struct EmberPutBody {
    pub id: String,
    #[serde(flatten)]
    pub updates: serde_json::Value,
}

pub async fn get_ember(
    sb: web::Data<Option<SupabaseClient>>,
    q: web::Query<EmberQuery>,
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

    let user_id = match sb.resolve_user_id(&q.email).await {
        Ok(Some(id)) => id,
        Ok(None) => {
            return HttpResponse::Ok().json(success_response(
                json!({ "ember": null, "embers": [] }),
                "no ember",
            ));
        }
        Err(e) => return db_error(&e),
    };

    let list_all = q.all.is_some();
    let filter = if list_all {
        format!("user_id=eq.{}&order=created_at.desc", user_id)
    } else {
        format!(
            "user_id=eq.{}&abandoned_at=is.null&order=created_at.desc&limit=1",
            user_id
        )
    };

    match sb.select("embers", &filter).await {
        Ok(rows) => {
            let arr = rows.as_array().cloned().unwrap_or_default();
            if list_all {
                HttpResponse::Ok().json(success_response(
                    json!({ "embers": arr }),
                    "embers retrieved",
                ))
            } else {
                HttpResponse::Ok().json(success_response(
                    json!({ "ember": arr.first() }),
                    "ember retrieved",
                ))
            }
        }
        Err(e) => db_error(&e),
    }
}

pub async fn create_ember(
    sb: web::Data<Option<SupabaseClient>>,
    body: web::Json<EmberPostBody>,
) -> HttpResponse {
    let sb = match sb.get_ref() {
        Some(c) => c,
        None => return db_unavailable(),
    };

    if body.email.trim().is_empty()
        || body.ember_name.trim().is_empty()
        || body.talent.trim().is_empty()
    {
        return HttpResponse::BadRequest().json(error_response(
            "validation_error",
            error_type::CLIENT,
            "email, ember_name, talent required",
        ));
    }

    let user_id = match sb.resolve_user_id(&body.email).await {
        Ok(v) => v,
        Err(e) => return db_error(&e),
    };

    let now = chrono::Utc::now().to_rfc3339();
    let mut row = serde_json::Map::new();
    row.insert("email".into(), json!(body.email.to_lowercase()));
    if let Some(uid) = &user_id {
        row.insert("user_id".into(), json!(uid));
    }
    row.insert("ember_name".into(), json!(body.ember_name));
    row.insert("talent".into(), json!(body.talent));
    row.insert(
        "talent_category".into(),
        json!(body.talent_category.clone().unwrap_or_else(|| "Hybrid".into())),
    );
    row.insert(
        "discovery_conversation".into(),
        body.discovery_conversation.clone().unwrap_or(json!([])),
    );
    row.insert("ember_stage".into(), json!("sparked"));
    row.insert(
        "lang".into(),
        json!(body.lang.clone().unwrap_or_else(|| "ko".into())),
    );
    row.insert("created_at".into(), json!(now));
    row.insert("updated_at".into(), json!(now));

    match sb.insert("embers", &json!(vec![row])).await {
        Ok(v) => {
            let ember = v.as_array().and_then(|a| a.first().cloned()).unwrap_or(json!({}));
            HttpResponse::Created().json(success_response(
                json!({ "ember": ember }),
                "ember created",
            ))
        }
        Err(e) => db_error(&e),
    }
}

pub async fn update_ember(
    sb: web::Data<Option<SupabaseClient>>,
    body: web::Json<EmberPutBody>,
) -> HttpResponse {
    let sb = match sb.get_ref() {
        Some(c) => c,
        None => return db_unavailable(),
    };

    if body.id.trim().is_empty() {
        return HttpResponse::BadRequest().json(error_response(
            "validation_error",
            error_type::CLIENT,
            "id required",
        ));
    }

    let mut updates = body.updates.clone();
    if let Some(obj) = updates.as_object_mut() {
        obj.remove("id");
        obj.insert("updated_at".into(), json!(chrono::Utc::now().to_rfc3339()));
    }

    let filter = format!("id=eq.{}", urlencoding(&body.id));
    match sb.update("embers", &filter, &updates).await {
        Ok(v) => {
            let ember = v.as_array().and_then(|a| a.first().cloned()).unwrap_or(json!({}));
            HttpResponse::Ok().json(success_response(
                json!({ "ember": ember }),
                "ember updated",
            ))
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
    log::error!("ember db error: {}", detail);
    HttpResponse::InternalServerError().json(error_response(
        "db_error",
        error_type::SERVER,
        "database error",
    ))
}
