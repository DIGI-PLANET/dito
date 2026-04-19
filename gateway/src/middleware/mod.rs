use actix_web::{dev::ServiceRequest, Error, HttpMessage, HttpResponse};
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::Instant;

use crate::model::{error_response, error_type};

// ── JWT Claims ───────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub user_id: String,
    pub user_name: String,
    pub exp: usize,
}

/// Extract and validate JWT from Authorization header
pub fn validate_jwt(req: &ServiceRequest) -> Result<Claims, HttpResponse> {
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    if !auth_header.starts_with("Bearer ") {
        return Err(HttpResponse::Unauthorized().json(error_response(
            "authentication_error",
            error_type::AUTH,
            "Bearer token required",
        )));
    }

    let token = &auth_header[7..];
    let secret = std::env::var("DITO_JWT_SECRET").unwrap_or_else(|_| "dev-secret".into());

    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )
    .map_err(|_| {
        HttpResponse::Unauthorized().json(error_response(
            "authentication_error",
            error_type::AUTH,
            "Invalid bearer token",
        ))
    })?;

    Ok(token_data.claims)
}

/// Validate Roy's admin portal auth
pub fn validate_portal_auth(req: &ServiceRequest) -> Result<(), HttpResponse> {
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    if !auth_header.starts_with("Bearer ") {
        return Err(HttpResponse::Unauthorized().json(error_response(
            "authentication_error",
            error_type::AUTH,
            "Bearer token required",
        )));
    }

    let token = &auth_header[7..];
    let admin_token = std::env::var("ROY_ADMIN_TOKEN").unwrap_or_else(|_| "roy-admin-dev".into());

    if token != admin_token {
        return Err(HttpResponse::Forbidden().json(error_response(
            "auth_permission_denied",
            error_type::AUTH,
            "Not authorized for portal access",
        )));
    }

    Ok(())
}

// ── Rate Limiter ─────────────────────────────────────────────────────────

pub struct RateLimiter {
    requests: Mutex<HashMap<String, Vec<Instant>>>,
    max_requests: usize,
    window_secs: u64,
}

impl RateLimiter {
    pub fn new(max_requests: usize, window_secs: u64) -> Self {
        Self {
            requests: Mutex::new(HashMap::new()),
            max_requests,
            window_secs,
        }
    }

    pub fn check(&self, key: &str) -> bool {
        let mut map = self.requests.lock().unwrap();
        let now = Instant::now();
        let window = std::time::Duration::from_secs(self.window_secs);

        let entries = map.entry(key.to_string()).or_default();
        entries.retain(|t| now.duration_since(*t) < window);

        if entries.len() >= self.max_requests {
            return false;
        }

        entries.push(now);
        true
    }
}

// ── Helper to extract claims from request extensions ─────────────────────

pub fn get_claims(req: &actix_web::HttpRequest) -> Option<Claims> {
    req.extensions().get::<Claims>().cloned()
}
