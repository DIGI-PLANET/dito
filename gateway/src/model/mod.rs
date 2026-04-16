use chrono::{DateTime, Utc};
use rand::Rng;
use serde::{Deserialize, Serialize};

// ── API Response ─────────────────────────────────────────────────────────

#[derive(Debug, Serialize)]
pub struct ApiResponse<T: Serialize> {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<ErrorDetails>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub meta: Option<ResponseMeta>,
}

#[derive(Debug, Serialize)]
pub struct ErrorDetails {
    pub code: String,
    #[serde(rename = "type")]
    pub error_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct ResponseMeta {
    pub timestamp: String,
    pub request_id: String,
    pub version: String,
}

impl ResponseMeta {
    pub fn new() -> Self {
        Self {
            timestamp: Utc::now().to_rfc3339(),
            request_id: generate_request_id(),
            version: "1.0.0".into(),
        }
    }
}

pub fn success_response<T: Serialize>(data: T, message: &str) -> ApiResponse<T> {
    ApiResponse {
        success: true,
        data: Some(data),
        message: Some(message.into()),
        error: None,
        meta: Some(ResponseMeta::new()),
    }
}

pub fn error_response(code: &str, error_type: &str, message: &str) -> ApiResponse<()> {
    ApiResponse {
        success: false,
        data: None,
        message: Some(message.into()),
        error: Some(ErrorDetails {
            code: code.into(),
            error_type: error_type.into(),
            details: None,
        }),
        meta: Some(ResponseMeta::new()),
    }
}

fn generate_request_id() -> String {
    let mut rng = rand::thread_rng();
    let bytes: [u8; 8] = rng.gen();
    let hex: String = bytes.iter().map(|b| format!("{:02x}", b)).collect();
    format!("req_{}_{}", hex, Utc::now().timestamp_millis())
}

// ── Error Types ──────────────────────────────────────────────────────────

pub mod error_type {
    pub const CLIENT: &str = "client_error";
    pub const SERVER: &str = "server_error";
    pub const NOT_FOUND: &str = "not_found_error";
    pub const AUTH: &str = "auth_error";
    pub const RATE_LIMIT: &str = "rate_limit_error";
}

// ── Domain Models ────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub name: String,
    pub email: String,
    pub two_factor_enabled: bool,
    #[serde(skip_serializing)]
    pub totp_secret: Option<String>,
    #[serde(skip_serializing)]
    pub backup_codes: Vec<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Soul {
    pub id: String,
    pub seeker_name: String,
    pub current_level: String,
    pub ember_points: i64,
    pub total_talents: i32,
    pub active_talents: i32,
    pub conviction_level: i32,
    pub next_milestone: String,
    pub arena_eligible: bool,
    pub last_activity: DateTime<Utc>,
    pub talents: Vec<Talent>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Talent {
    pub id: String,
    pub name: String,
    pub category: String,
    pub progress_percentage: i32,
    pub ember_earned: i64,
    pub days_active: i32,
    pub mastery_level: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArenaEvent {
    pub id: String,
    pub title: String,
    pub description: String,
    pub talent_type: String,
    pub difficulty: String,
    pub participants: i32,
    pub prize: String,
    pub status: String,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TalentSuggestion {
    pub id: String,
    pub name: String,
    pub category: String,
    pub description: String,
    pub difficulty: String,
    pub trending: bool,
}

#[derive(Debug, Deserialize)]
pub struct CommandRequest {
    pub action: String,
    #[serde(default)]
    pub params: serde_json::Value,
}

// ── 2FA Models ───────────────────────────────────────────────────────────

#[derive(Debug, Serialize)]
pub struct TwoFactorSetupResponse {
    pub secret: String,
    pub qr_code_url: String,
    pub backup_codes: Vec<String>,
    pub instructions: String,
}

#[derive(Debug, Deserialize)]
pub struct TwoFactorVerifyRequest {
    pub code: Option<String>,
    pub email_code: Option<String>,
    pub backup_code: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct TwoFactorStatusResponse {
    pub user_id: String,
    pub user_name: String,
    pub enabled: bool,
    pub setup_date: Option<String>,
    pub backup_codes_remaining: usize,
    pub high_risk_operations: serde_json::Value,
}

// ── Request Models ───────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
pub struct CreateSoulRequest {
    pub seeker_name: String,
    #[serde(default)]
    pub talent_label: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSoulRequest {
    #[serde(default)]
    pub seeker_name: Option<String>,
    #[serde(default)]
    pub current_level: Option<String>,
}
