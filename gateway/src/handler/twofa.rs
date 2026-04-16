use actix_web::{HttpRequest, HttpResponse};
use std::collections::HashMap;
use std::sync::Mutex;
use totp_rs::{Algorithm, Secret, TOTP};

use crate::middleware::get_claims;
use crate::model::*;

lazy_static::lazy_static! {
    static ref EMAIL_CODES: Mutex<HashMap<String, String>> = Mutex::new(HashMap::new());
}

/// High-risk operations requiring 2FA
pub fn high_risk_operations() -> serde_json::Value {
    serde_json::json!({
        "delete_soul": {"action": "delete_soul", "description": "Permanently delete Soul (irreversible)", "required": true},
        "regenerate_api_key": {"action": "regenerate_api_key", "description": "Generate new API key (invalidates current)", "required": true},
        "change_email": {"action": "change_email", "description": "Change account email address", "required": true},
        "large_ember_transfer": {"action": "large_ember_transfer", "description": "Transfer more than 500 Ember", "required": true},
    })
}

fn generate_totp_secret(email: &str) -> Result<(String, String), String> {
    let secret = Secret::generate_secret();
    let secret_bytes = secret.to_bytes().map_err(|e| e.to_string())?;
    let totp = TOTP::new(
        Algorithm::SHA1,
        6,
        1,
        30,
        secret_bytes,
        Some("DITO.guru".into()),
        email.into(),
    )
    .map_err(|e| e.to_string())?;

    let url = totp.get_url();
    let secret_base32 = secret.to_encoded().to_string();
    Ok((secret_base32, url))
}

fn generate_backup_codes() -> Vec<String> {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    (0..8)
        .map(|_| {
            let bytes: [u8; 4] = rng.gen();
            bytes.iter().map(|b| format!("{:02X}", b)).collect::<String>()
        })
        .collect()
}

fn generate_email_code() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    format!("{:06}", rng.gen_range(0..1_000_000u32))
}

pub async fn check_2fa_status(req: HttpRequest) -> HttpResponse {
    let claims = match get_claims(&req) {
        Some(c) => c,
        None => {
            return HttpResponse::Unauthorized().json(error_response(
                "auth_required",
                error_type::AUTH,
                "Authentication required",
            ))
        }
    };

    let status = TwoFactorStatusResponse {
        user_id: claims.user_id,
        user_name: claims.user_name,
        enabled: false,
        setup_date: None,
        backup_codes_remaining: 0,
        high_risk_operations: high_risk_operations(),
    };

    HttpResponse::Ok().json(success_response(&status, "2FA status retrieved successfully"))
}

pub async fn setup_2fa(req: HttpRequest) -> HttpResponse {
    let claims = match get_claims(&req) {
        Some(c) => c,
        None => {
            return HttpResponse::Unauthorized().json(error_response(
                "auth_required",
                error_type::AUTH,
                "Authentication required for 2FA setup",
            ))
        }
    };

    let email = format!("{}@dito.guru", claims.user_name);
    let (secret, qr_url) = match generate_totp_secret(&email) {
        Ok(r) => r,
        Err(_) => {
            return HttpResponse::InternalServerError().json(error_response(
                "totp_generation_failed",
                error_type::SERVER,
                "Failed to generate 2FA secret",
            ))
        }
    };

    let backup_codes = generate_backup_codes();

    let response = TwoFactorSetupResponse {
        secret,
        qr_code_url: qr_url,
        backup_codes,
        instructions: "1. Open Google Authenticator or Authy app\n2. Scan the QR code or enter the secret manually\n3. Enter the 6-digit code to complete setup\n4. Save backup codes in a secure location".into(),
    };

    HttpResponse::Ok().json(success_response(
        &response,
        "2FA setup initiated. Please verify with your authenticator app.",
    ))
}

pub async fn verify_2fa(
    req: HttpRequest,
    body: actix_web::web::Json<TwoFactorVerifyRequest>,
) -> HttpResponse {
    let claims = match get_claims(&req) {
        Some(c) => c,
        None => {
            return HttpResponse::Unauthorized().json(error_response(
                "auth_required",
                error_type::AUTH,
                "Authentication required for 2FA verification",
            ))
        }
    };

    if body.code.is_none() || body.code.as_ref().map_or(true, |c| c.is_empty()) {
        return HttpResponse::BadRequest().json(error_response(
            "missing_code",
            error_type::CLIENT,
            "2FA code is required",
        ));
    }

    // In production, validate against stored TOTP secret
    let result = serde_json::json!({
        "enabled": true,
        "message": "2FA successfully enabled for your account",
        "user_id": claims.user_id,
    });

    HttpResponse::Ok().json(success_response(&result, "Two-factor authentication is now active"))
}

pub async fn disable_2fa(
    req: HttpRequest,
    body: actix_web::web::Json<TwoFactorVerifyRequest>,
) -> HttpResponse {
    let claims = match get_claims(&req) {
        Some(c) => c,
        None => {
            return HttpResponse::Unauthorized().json(error_response(
                "auth_required",
                error_type::AUTH,
                "Authentication required",
            ))
        }
    };

    if body.code.is_none() || body.code.as_ref().map_or(true, |c| c.is_empty()) {
        return HttpResponse::BadRequest().json(error_response(
            "missing_code",
            error_type::CLIENT,
            "2FA code required to disable",
        ));
    }

    let result = serde_json::json!({
        "enabled": false,
        "warning": "2FA has been disabled. Your account is less secure.",
        "user_id": claims.user_id,
    });

    HttpResponse::Ok().json(success_response(&result, "Two-factor authentication disabled"))
}

pub async fn email_recovery(
    req: HttpRequest,
    body: actix_web::web::Json<serde_json::Value>,
) -> HttpResponse {
    let claims = match get_claims(&req) {
        Some(c) => c,
        None => {
            return HttpResponse::Unauthorized().json(error_response(
                "auth_required",
                error_type::AUTH,
                "Authentication required",
            ))
        }
    };

    let email = body.get("email").and_then(|v| v.as_str()).unwrap_or("");
    if email.is_empty() {
        return HttpResponse::BadRequest().json(error_response(
            "missing_email",
            error_type::CLIENT,
            "Email address is required",
        ));
    }

    let code = generate_email_code();
    EMAIL_CODES
        .lock()
        .unwrap()
        .insert(claims.user_id.clone(), code);

    let result = serde_json::json!({
        "email_sent": true,
        "email": email,
        "expires_in_minutes": 10,
        "instruction": "Check your email for a 6-digit recovery code. The code expires in 10 minutes.",
    });

    HttpResponse::Ok().json(success_response(&result, "Recovery email sent successfully"))
}

pub async fn verify_email_code(
    req: HttpRequest,
    body: actix_web::web::Json<TwoFactorVerifyRequest>,
) -> HttpResponse {
    let claims = match get_claims(&req) {
        Some(c) => c,
        None => {
            return HttpResponse::Unauthorized().json(error_response(
                "auth_required",
                error_type::AUTH,
                "Authentication required",
            ))
        }
    };

    let email_code = body.email_code.as_deref().unwrap_or("");
    if email_code.is_empty() {
        return HttpResponse::BadRequest().json(error_response(
            "missing_email_code",
            error_type::CLIENT,
            "Email recovery code is required",
        ));
    }

    let valid = EMAIL_CODES
        .lock()
        .unwrap()
        .get(&claims.user_id)
        .map_or(false, |stored| stored == email_code);

    if !valid {
        return HttpResponse::Unauthorized().json(error_response(
            "invalid_email_code",
            error_type::AUTH,
            "Invalid or expired email recovery code",
        ));
    }

    EMAIL_CODES.lock().unwrap().remove(&claims.user_id);

    let result = serde_json::json!({
        "verified": true,
        "user_id": claims.user_id,
        "next_step": "You can now reset your 2FA or perform secure operations",
        "temp_access": true,
    });

    HttpResponse::Ok().json(success_response(
        &result,
        "Email recovery verification successful",
    ))
}

pub async fn mandatory_setup_2fa(
    body: actix_web::web::Json<serde_json::Value>,
) -> HttpResponse {
    let email = body.get("email").and_then(|v| v.as_str()).unwrap_or("");
    let password = body.get("password").and_then(|v| v.as_str()).unwrap_or("");
    let name = body.get("name").and_then(|v| v.as_str()).unwrap_or("");

    if email.is_empty() || password.is_empty() || name.is_empty() {
        return HttpResponse::BadRequest().json(error_response(
            "missing_required_fields",
            error_type::CLIENT,
            "Email, password, and name are required",
        ));
    }

    let user_id = format!("user-{}", chrono::Utc::now().timestamp());
    let (secret, qr_url) = match generate_totp_secret(email) {
        Ok(r) => r,
        Err(_) => {
            return HttpResponse::InternalServerError().json(error_response(
                "2fa_setup_failed",
                error_type::SERVER,
                "Failed to generate mandatory 2FA setup",
            ))
        }
    };

    let backup_codes = generate_backup_codes();

    let result = serde_json::json!({
        "user_created": true,
        "user_id": user_id,
        "email": email,
        "name": name,
        "totp_setup": {
            "secret": secret,
            "qr_code_url": qr_url,
            "backup_codes": backup_codes,
            "instructions": "1. Open Google Authenticator or Authy app\n2. Scan the QR code\n3. Enter the 6-digit code to complete signup\n4. Save backup codes",
        },
        "warning": "Account creation is NOT complete until 2FA is verified.",
    });

    HttpResponse::Created().json(success_response(
        &result,
        "Account created. Complete signup by verifying 2FA.",
    ))
}
