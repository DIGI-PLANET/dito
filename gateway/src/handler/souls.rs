use actix_web::{web, HttpRequest, HttpResponse};

use crate::database::MockDb;
use crate::middleware::get_claims;
use crate::model::*;

pub async fn get_souls(db: web::Data<MockDb>) -> HttpResponse {
    let souls = db.get_all_souls();
    HttpResponse::Ok().json(success_response(&souls, &format!("Retrieved {} souls", souls.len())))
}

pub async fn get_my_soul(req: HttpRequest, db: web::Data<MockDb>) -> HttpResponse {
    let claims = match get_claims(&req) {
        Some(c) => c,
        None => {
            return HttpResponse::Unauthorized()
                .json(error_response("authentication_error", error_type::AUTH, "Not authenticated"))
        }
    };

    match db.get_soul_by_user(&claims.user_id) {
        Some(soul) => HttpResponse::Ok().json(success_response(
            &soul,
            &format!("Your Soul ({}) retrieved successfully", soul.id),
        )),
        None => HttpResponse::NotFound().json(error_response(
            "soul_not_found",
            error_type::NOT_FOUND,
            "You don't have a Soul yet",
        )),
    }
}

pub async fn get_soul(path: web::Path<String>, db: web::Data<MockDb>) -> HttpResponse {
    let soul_id = path.into_inner();
    match db.get_soul(&soul_id) {
        Some(soul) => HttpResponse::Ok().json(success_response(&soul, "Soul retrieved")),
        None => HttpResponse::NotFound().json(error_response(
            "soul_not_found",
            error_type::NOT_FOUND,
            "Soul not found",
        )),
    }
}

pub async fn create_soul(body: web::Json<CreateSoulRequest>, db: web::Data<MockDb>) -> HttpResponse {
    if body.seeker_name.is_empty() {
        return HttpResponse::BadRequest().json(error_response(
            "validation_error",
            error_type::CLIENT,
            "seeker_name is required",
        ));
    }

    let soul = db.create_soul(&body);
    HttpResponse::Created().json(success_response(&soul, "Soul created successfully"))
}

pub async fn update_soul(
    path: web::Path<String>,
    _body: web::Json<UpdateSoulRequest>,
    db: web::Data<MockDb>,
) -> HttpResponse {
    let soul_id = path.into_inner();
    match db.get_soul(&soul_id) {
        Some(soul) => HttpResponse::Ok().json(success_response(&soul, "Soul updated")),
        None => HttpResponse::NotFound().json(error_response(
            "soul_not_found",
            error_type::NOT_FOUND,
            "Soul not found",
        )),
    }
}

pub async fn delete_soul(path: web::Path<String>, db: web::Data<MockDb>) -> HttpResponse {
    let soul_id = path.into_inner();
    match db.get_soul(&soul_id) {
        Some(_) => HttpResponse::Ok().json(success_response(
            serde_json::json!({"deleted": true}),
            &format!("Soul {} deleted", soul_id),
        )),
        None => HttpResponse::NotFound().json(error_response(
            "soul_not_found",
            error_type::NOT_FOUND,
            "Soul not found",
        )),
    }
}
