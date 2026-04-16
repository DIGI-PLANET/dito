use actix_web::{web, HttpRequest, HttpResponse};
use futures::StreamExt;
use tokio::sync::mpsc;
use tokio_stream::wrappers::ReceiverStream;

use crate::llm::prompt;
use crate::llm::provider::{self, ChatRequest, LlmProvider};
use crate::middleware::get_claims;
use crate::model::{error_response, error_type, success_response};

/// SSE streaming chat endpoint
/// GET /api/chat/stream or POST /api/chat with Accept: text/event-stream
pub async fn chat_stream(
    req: HttpRequest,
    body: web::Json<ChatRequest>,
    llm: web::Data<Option<LlmProvider>>,
) -> HttpResponse {
    let _claims = match get_claims(&req) {
        Some(c) => c,
        None => {
            return HttpResponse::Unauthorized().json(error_response(
                "auth_required",
                error_type::AUTH,
                "Authentication required",
            ))
        }
    };

    // Check harmful content
    if prompt::is_harmful(&body.message) {
        let msg = if body.lang == "ko" {
            "🔥 잠깐, 힘든 이야기인 것 같아요. 전문 상담이 도움이 될 수 있어요. 자살예방상담전화 1393으로 연락해주세요."
        } else {
            "🔥 It sounds like you might be going through a tough time. Please reach out to a crisis helpline for support."
        };
        return HttpResponse::Ok().json(serde_json::json!({
            "violated": true,
            "message": msg,
        }));
    }

    let provider = match llm.get_ref() {
        Some(p) => p.clone(),
        None => {
            // No LLM key configured — return mock response
            let mock = provider::mock_response(&body.lang, &body.name);
            return HttpResponse::Ok().json(mock);
        }
    };

    let system_prompt = prompt::get_system_prompt(&body.lang);

    // Prepare user message
    let user_message = if body.message == "[USER_STARTED_DISCOVERY]" {
        if body.lang == "ko" {
            format!("안녕! 나는 {}이야. 내 숨겨진 재능을 찾아줘!", body.name)
        } else {
            format!("Hi! I'm {}. Help me discover my hidden talent!", body.name)
        }
    } else {
        body.message.clone()
    };

    // Check if client wants SSE streaming
    let accept = req
        .headers()
        .get("Accept")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    if accept.contains("text/event-stream") {
        // SSE streaming response
        let (tx, rx) = mpsc::channel::<String>(32);
        let history = body.history.clone();
        let sys = system_prompt.to_string();
        let msg = user_message.clone();

        tokio::spawn(async move {
            if let Err(e) = provider::stream_chat(&provider, &sys, &history, &msg, tx).await {
                log::error!("LLM stream error: {}", e);
            }
        });

        let stream = ReceiverStream::new(rx).map(|chunk| {
            Ok::<_, actix_web::Error>(
                actix_web::web::Bytes::from(format!("data: {}\n\n", serde_json::json!({"text": chunk}))),
            )
        });

        HttpResponse::Ok()
            .content_type("text/event-stream")
            .insert_header(("Cache-Control", "no-cache"))
            .insert_header(("Connection", "keep-alive"))
            .streaming(stream)
    } else {
        // Non-streaming: collect full response
        let (tx, mut rx) = mpsc::channel::<String>(32);
        let history = body.history.clone();
        let sys = system_prompt.to_string();
        let msg = user_message.clone();

        tokio::spawn(async move {
            if let Err(e) = provider::stream_chat(&provider, &sys, &history, &msg, tx).await {
                log::error!("LLM error: {}", e);
            }
        });

        let mut full_response = String::new();
        while let Some(chunk) = rx.recv().await {
            full_response.push_str(&chunk);
        }

        if full_response.is_empty() {
            return HttpResponse::ServiceUnavailable().json(error_response(
                "llm_error",
                error_type::SERVER,
                "AI service unavailable",
            ));
        }

        // Try parsing as JSON (Ember format)
        match serde_json::from_str::<serde_json::Value>(&full_response) {
            Ok(parsed) => HttpResponse::Ok().json(parsed),
            Err(_) => {
                // Wrap raw text
                HttpResponse::Ok().json(serde_json::json!({
                    "message": full_response,
                    "choices": [],
                    "freeInput": true,
                }))
            }
        }
    }
}

/// Non-streaming chat endpoint (backward compatible)
pub async fn chat(
    req: HttpRequest,
    body: web::Json<ChatRequest>,
    llm: web::Data<Option<LlmProvider>>,
) -> HttpResponse {
    chat_stream(req, body, llm).await
}

/// Health check for LLM provider
pub async fn llm_status(llm: web::Data<Option<LlmProvider>>) -> HttpResponse {
    match llm.get_ref() {
        Some(p) => HttpResponse::Ok().json(success_response(
            serde_json::json!({
                "provider": p.name(),
                "status": "configured",
            }),
            "LLM provider status",
        )),
        None => HttpResponse::Ok().json(success_response(
            serde_json::json!({
                "provider": "none",
                "status": "mock_mode",
            }),
            "No LLM provider configured — using mock responses",
        )),
    }
}
