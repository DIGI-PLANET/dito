use actix_web::{web, HttpRequest, HttpResponse};

use crate::database::MockDb;
use crate::middleware::get_claims;
use crate::model::*;

pub async fn get_live_arena_events(db: web::Data<MockDb>) -> HttpResponse {
    let events = db.get_arena_events();
    let live: Vec<_> = events
        .into_iter()
        .filter(|e| e.status == "live" || e.status == "upcoming")
        .collect();
    let count = live.len();
    HttpResponse::Ok().json(success_response(
        &live,
        &format!("Retrieved {} live arena events", count),
    ))
}

#[derive(Debug, serde::Deserialize)]
pub struct JoinArenaRequest {
    pub event_id: String,
}

pub async fn join_arena_event(
    req: HttpRequest,
    body: web::Json<JoinArenaRequest>,
    db: web::Data<MockDb>,
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

    let events = db.get_arena_events();
    let target = events.iter().find(|e| e.id == body.event_id);

    match target {
        Some(event) => {
            let result = serde_json::json!({
                "event_id": body.event_id,
                "user_id": claims.user_id,
                "status": "joined",
                "event_title": event.title,
            });
            HttpResponse::Ok().json(success_response(
                &result,
                &format!("Successfully joined arena event {}", body.event_id),
            ))
        }
        None => HttpResponse::NotFound().json(error_response(
            "event_not_found",
            error_type::NOT_FOUND,
            &format!(
                "Arena event {} not found or not joinable",
                body.event_id
            ),
        )),
    }
}

pub async fn get_arena_history(db: web::Data<MockDb>) -> HttpResponse {
    let events = db.get_arena_events();
    HttpResponse::Ok().json(success_response(
        &events,
        "Arena history retrieved successfully",
    ))
}

pub async fn get_arena_leaderboard(path: web::Path<String>, db: web::Data<MockDb>) -> HttpResponse {
    let event_id = path.into_inner();
    let events = db.get_arena_events();

    if !events.iter().any(|e| e.id == event_id) {
        return HttpResponse::NotFound().json(error_response(
            "event_not_found",
            error_type::NOT_FOUND,
            &format!("Arena event {} not found", event_id),
        ));
    }

    let leaderboard = serde_json::json!([
        {"rank": 1, "user_id": "user1", "username": "CodingMaster", "score": 950, "status": "completed"},
        {"rank": 2, "user_id": "user2", "username": "DesignGuru", "score": 820, "status": "completed"},
    ]);

    HttpResponse::Ok().json(success_response(
        &leaderboard,
        &format!("Leaderboard for event {} retrieved successfully", event_id),
    ))
}
