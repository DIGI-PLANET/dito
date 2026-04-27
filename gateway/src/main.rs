use actix_cors::Cors;
use actix_web::middleware::Logger;
use actix_web::{web, App, HttpMessage, HttpRequest, HttpResponse, HttpServer};
use std::time::Instant;

mod database;
mod handler;
mod llm;
mod middleware;
mod model;

use database::SupabaseClient;
use model::{error_response, error_type, success_response};

const API_VERSION: &str = "v1";

// ── Auth middleware extractor ────────────────────────────────────────────

async fn jwt_guard(
    req: actix_web::dev::ServiceRequest,
    next: actix_web::middleware::Next<impl actix_web::body::MessageBody + 'static>,
) -> Result<actix_web::dev::ServiceResponse<actix_web::body::EitherBody<impl actix_web::body::MessageBody>>, actix_web::Error> {
    match middleware::validate_jwt(&req) {
        Ok(claims) => {
            req.extensions_mut().insert(claims);
            next.call(req).await.map(|res| res.map_into_left_body())
        }
        Err(resp) => Ok(req.into_response(resp).map_into_right_body()),
    }
}

async fn portal_guard(
    req: actix_web::dev::ServiceRequest,
    next: actix_web::middleware::Next<impl actix_web::body::MessageBody + 'static>,
) -> Result<actix_web::dev::ServiceResponse<actix_web::body::EitherBody<impl actix_web::body::MessageBody>>, actix_web::Error> {
    match middleware::validate_portal_auth(&req) {
        Ok(()) => next.call(req).await.map(|res| res.map_into_left_body()),
        Err(resp) => Ok(req.into_response(resp).map_into_right_body()),
    }
}

// ── Route handlers ──────────────────────────────────────────────────────

async fn health(start_time: web::Data<Instant>) -> HttpResponse {
    let uptime = start_time.elapsed();
    HttpResponse::Ok().json(success_response(
        serde_json::json!({
            "version": API_VERSION,
            "status": "healthy",
            "uptime": format!("{:.2?}", uptime),
            "runtime": "Rust (Actix-web)",
        }),
        "DITO Agent Gateway V1 (Rust)",
    ))
}

async fn root_redirect() -> HttpResponse {
    HttpResponse::MovedPermanently()
        .insert_header(("Location", "https://dito.guru"))
        .finish()
}

async fn not_found(req: HttpRequest) -> HttpResponse {
    HttpResponse::NotFound().json(error_response(
        "endpoint_not_found",
        error_type::NOT_FOUND,
        &format!(
            "Endpoint '{} {}' not found",
            req.method(),
            req.uri()
        ),
    ))
}

// ── Main ────────────────────────────────────────────────────────────────

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::dotenv().ok();
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8080);

    let supabase = web::Data::new(SupabaseClient::from_env());
    let start_time = web::Data::new(Instant::now());
    let llm_provider = web::Data::new(llm::provider::LlmProvider::from_env());

    match supabase.get_ref() {
        Some(_) => log::info!("🗄  Supabase: connected (PostgREST)"),
        None => log::warn!("🗄  Supabase: NOT configured — /api/{{diary,memories,timecapsule,ember,soul}} will 503"),
    }
    match llm_provider.get_ref() {
        Some(p) => log::info!("🤖 LLM Provider: {}", p.name()),
        None => log::info!("🤖 LLM Provider: none (mock mode)"),
    }
    log::info!("🚀 DITO Gateway (Rust) starting on :{}", port);

    let cors_origins = std::env::var("CORS_ALLOWED_ORIGINS")
        .unwrap_or_else(|_| "http://localhost:3000".into());

    HttpServer::new(move || {
        let origins = cors_origins.clone();
        let cors = Cors::default()
            .allowed_origin_fn(move |origin, _req_head| {
                let origin_str = origin.to_str().unwrap_or("");
                origins.split(',').any(|o| o.trim() == origin_str)
                    || origin_str.starts_with("http://localhost")
            })
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
            .allowed_headers(vec!["Authorization", "Content-Type", "X-2FA-Code"])
            .supports_credentials()
            .max_age(3600);

        App::new()
            .app_data(supabase.clone())
            .app_data(start_time.clone())
            .app_data(llm_provider.clone())
            .wrap(cors)
            .wrap(Logger::new("%a [%t] \"%r\" %s %Dms"))
            // ── Public ─────────────────────────────────────────────────
            .route("/", web::get().to(root_redirect))
            .route("/health", web::get().to(health))
            .route("/health", web::head().to(health))
            .route(
                "/api/auth/signup-with-2fa",
                web::post().to(handler::twofa::mandatory_setup_2fa),
            )
            .route("/api/llm/status", web::get().to(handler::chat::llm_status))
            // ── Legacy command (kept for agent-api.ts compat) ──────────
            .service(
                web::resource("/command")
                    .wrap(actix_web::middleware::from_fn(jwt_guard))
                    .route(web::post().to(handler::command::handle_command)),
            )
            // ── Admin portal ───────────────────────────────────────────
            .service(
                web::resource("/portal")
                    .wrap(actix_web::middleware::from_fn(portal_guard))
                    .route(web::post().to(handler::portal::handle_portal)),
            )
            // ── Protected API (JWT) ────────────────────────────────────
            .service(
                web::scope("/api")
                    .wrap(actix_web::middleware::from_fn(jwt_guard))
                    // 2FA
                    .route("/auth/2fa/status", web::get().to(handler::twofa::check_2fa_status))
                    .route("/auth/2fa/setup", web::post().to(handler::twofa::setup_2fa))
                    .route("/auth/2fa/verify", web::post().to(handler::twofa::verify_2fa))
                    .route("/auth/2fa/disable", web::post().to(handler::twofa::disable_2fa))
                    .route("/auth/2fa/email-recovery", web::post().to(handler::twofa::email_recovery))
                    .route("/auth/2fa/email-verify", web::post().to(handler::twofa::verify_email_code))
                    // Ember (SBT record)
                    .route("/ember", web::get().to(handler::ember::get_ember))
                    .route("/ember", web::post().to(handler::ember::create_ember))
                    .route("/ember", web::put().to(handler::ember::update_ember))
                    // Diary (journal entries — permanence-gated)
                    .route("/diary", web::get().to(handler::diary::list_diary))
                    .route("/diary", web::post().to(handler::diary::create_diary))
                    // Memories (unified timeline, 6 tabs)
                    .route("/memories", web::get().to(handler::memories::list_memories))
                    // Timecapsule (forward schedule + backward surfacing)
                    .route("/timecapsule", web::get().to(handler::timecapsule::list_capsule))
                    .route("/timecapsule", web::post().to(handler::timecapsule::schedule_capsule))
                    // Soul (SBT draft records)
                    .route("/soul", web::get().to(handler::soul::list_souls))
                    .route("/soul", web::post().to(handler::soul::create_soul))
                    // Chat (LLM + SSE)
                    .route("/chat", web::post().to(handler::chat::chat))
                    .route("/chat/stream", web::post().to(handler::chat::chat_stream)),
            )
            .default_service(web::to(not_found))
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
