use actix_web::{web, HttpRequest, HttpResponse};

use crate::database::MockDb;
use crate::handler::{arena, souls, talents, twofa};
use crate::middleware::get_claims;
use crate::model::*;

pub async fn handle_command(
    req: HttpRequest,
    body: web::Json<CommandRequest>,
    db: web::Data<MockDb>,
) -> HttpResponse {
    if body.action.is_empty() {
        return HttpResponse::BadRequest().json(error_response(
            "missing_action",
            error_type::CLIENT,
            "Command action is required",
        ));
    }

    match body.action.as_str() {
        // 2FA
        "2fa_status" => twofa::check_2fa_status(req).await,
        "2fa_setup" => twofa::setup_2fa(req).await,

        // Soul
        "get_soul" => souls::get_my_soul(req, db).await,
        "list_souls" => souls::get_souls(db).await,

        // Arena
        "list_arena_events" => arena::get_live_arena_events(db).await,

        // Talent
        "get_talent_recommendations" => talents::discover_talents(db).await,
        "list_talents" => talents::get_trending_talents(db).await,

        // Ember
        "get_ember_balance" => {
            HttpResponse::Ok().json(success_response(
                serde_json::json!({"ember_balance": 1250, "soul_id": "roy-soul"}),
                "Current Ember balance retrieved",
            ))
        }

        // Analytics
        "get_analytics" => talents::get_talent_analytics(req, db).await,

        // Help
        "help" => {
            let help = serde_json::json!({
                "version": "1.0.0",
                "description": "DITO Agent API - Agent-First command system (Rust)",
                "endpoint": "POST /command",
                "categories": {
                    "Security": ["2fa_status", "2fa_setup", "2fa_verify", "2fa_disable"],
                    "Soul": ["get_soul", "list_souls", "update_soul", "delete_soul"],
                    "Ember": ["get_ember_balance"],
                    "Talent": ["get_talent_recommendations", "list_talents"],
                    "Arena": ["list_arena_events", "join_arena"],
                    "Analytics": ["get_analytics"],
                    "Help": ["help", "docs"],
                },
            });
            HttpResponse::Ok().json(success_response(&help, "DITO Command Help"))
        }

        "docs" => {
            let docs = serde_json::json!({
                "api_version": "1.0.0",
                "base_url": "POST /command",
                "authentication": "Bearer token required",
                "runtime": "Rust (Actix-web)",
            });
            HttpResponse::Ok().json(success_response(&docs, "DITO API Documentation"))
        }

        _ => HttpResponse::NotFound().json(error_response(
            "unknown_command",
            error_type::NOT_FOUND,
            &format!("Unknown command: {}", body.action),
        )),
    }
}
