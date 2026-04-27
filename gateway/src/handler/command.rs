//! Legacy command dispatcher — kept alive for the pre-Supabase `agent-api.ts`
//! on the frontend. Most actions now live as REST endpoints under `/api/*`
//! and will return `not_implemented` here.
//!
//! Still-live: 2FA actions, which dispatch to the `twofa` handler.

use actix_web::{web, HttpRequest, HttpResponse};

use crate::handler::twofa;
use crate::model::*;

pub async fn handle_command(
    req: HttpRequest,
    body: web::Json<CommandRequest>,
) -> HttpResponse {
    if body.action.is_empty() {
        return HttpResponse::BadRequest().json(error_response(
            "missing_action",
            error_type::CLIENT,
            "Command action is required",
        ));
    }

    match body.action.as_str() {
        "2fa_status" => twofa::check_2fa_status(req).await,
        "2fa_setup" => twofa::setup_2fa(req).await,
        "help" | "docs" => HttpResponse::Ok().json(success_response(
            serde_json::json!({
                "message": "legacy command API. Use /api/{ember,diary,memories,timecapsule,soul} REST endpoints instead.",
            }),
            "help",
        )),
        _ => HttpResponse::NotImplemented().json(error_response(
            "not_implemented",
            error_type::CLIENT,
            &format!(
                "action '{}' has been moved to a REST endpoint or removed in the v3 refactor",
                body.action
            ),
        )),
    }
}
