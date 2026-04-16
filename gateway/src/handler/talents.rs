use actix_web::{web, HttpRequest, HttpResponse};

use crate::database::MockDb;
use crate::middleware::get_claims;
use crate::model::*;

pub async fn discover_talents(db: web::Data<MockDb>) -> HttpResponse {
    let suggestions = db.get_talent_suggestions();
    HttpResponse::Ok().json(success_response(
        &suggestions,
        "Talent suggestions generated successfully",
    ))
}

#[derive(Debug, serde::Deserialize)]
pub struct TrackProgressRequest {
    pub talent_id: String,
    pub progress: i32,
    #[serde(default)]
    pub notes: String,
}

pub async fn track_talent_progress(
    req: HttpRequest,
    body: web::Json<TrackProgressRequest>,
) -> HttpResponse {
    let claims = match get_claims(&req) {
        Some(c) => c,
        None => {
            return HttpResponse::Unauthorized().json(error_response(
                "user_not_found",
                error_type::AUTH,
                "User not found in context",
            ))
        }
    };

    if body.progress < 0 || body.progress > 100 {
        return HttpResponse::BadRequest().json(error_response(
            "validation_error",
            error_type::CLIENT,
            "Progress must be between 0 and 100",
        ));
    }

    let result = serde_json::json!({
        "user_id": claims.user_id,
        "talent_id": body.talent_id,
        "progress": body.progress,
        "notes": body.notes,
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "ember_gained": body.progress * 2,
        "level_up": body.progress >= 90,
    });

    HttpResponse::Ok().json(success_response(&result, "Talent progress tracked successfully"))
}

pub async fn get_talent_analytics(req: HttpRequest, db: web::Data<MockDb>) -> HttpResponse {
    let claims = match get_claims(&req) {
        Some(c) => c,
        None => {
            return HttpResponse::Unauthorized().json(error_response(
                "user_not_found",
                error_type::AUTH,
                "User not found in context",
            ))
        }
    };

    let soul = match db.get_soul_by_user(&claims.user_id) {
        Some(s) => s,
        None => {
            return HttpResponse::Ok().json(success_response(
                serde_json::json!({"error": "User not found"}),
                "Talent analytics retrieved successfully",
            ))
        }
    };

    let total_ember: i64 = soul.talents.iter().map(|t| t.ember_earned).sum();
    let total_progress: i32 = soul.talents.iter().map(|t| t.progress_percentage).sum();
    let active_count = soul.talents.iter().filter(|t| t.progress_percentage > 0).count();
    let avg_progress = if !soul.talents.is_empty() {
        total_progress / soul.talents.len() as i32
    } else {
        0
    };

    let growth_trend = if soul.conviction_level > 70 {
        "accelerating"
    } else if soul.conviction_level > 40 {
        "steady"
    } else {
        "slow"
    };

    // Find most active category
    let mut categories: std::collections::HashMap<String, i32> = std::collections::HashMap::new();
    for t in &soul.talents {
        *categories.entry(t.category.clone()).or_insert(0) += t.progress_percentage;
    }
    let most_active = categories
        .iter()
        .max_by_key(|(_, v)| *v)
        .map(|(k, _)| k.as_str())
        .unwrap_or("none");

    let analytics = serde_json::json!({
        "total_talents": soul.talents.len(),
        "active_talents": active_count,
        "total_ember_earned": total_ember,
        "average_progress": avg_progress,
        "conviction_level": soul.conviction_level,
        "current_level": soul.current_level,
        "arena_eligible": soul.arena_eligible,
        "growth_trend": growth_trend,
        "most_active_category": most_active,
    });

    HttpResponse::Ok().json(success_response(&analytics, "Talent analytics retrieved successfully"))
}

pub async fn get_trending_talents(db: web::Data<MockDb>) -> HttpResponse {
    let trending = db.get_trending_talents();
    HttpResponse::Ok().json(success_response(
        &trending,
        "Trending talents retrieved successfully",
    ))
}
