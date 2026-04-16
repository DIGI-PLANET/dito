use futures::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;

/// Supported LLM providers
#[derive(Debug, Clone)]
pub enum LlmProvider {
    Gemini { api_key: String },
    Groq { api_key: String },
}

impl LlmProvider {
    /// Create provider from environment variables
    pub fn from_env() -> Option<Self> {
        // Priority: Gemini > Groq
        if let Ok(key) = std::env::var("GEMINI_API_KEY") {
            if !key.is_empty() {
                return Some(Self::Gemini { api_key: key });
            }
        }
        if let Ok(key) = std::env::var("GROQ_API_KEY") {
            if !key.is_empty() {
                return Some(Self::Groq { api_key: key });
            }
        }
        None
    }

    pub fn name(&self) -> &str {
        match self {
            Self::Gemini { .. } => "gemini",
            Self::Groq { .. } => "groq",
        }
    }
}

// ── Request/Response types ──────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Deserialize)]
pub struct ChatRequest {
    pub message: String,
    #[serde(default = "default_mode")]
    pub mode: String,
    #[serde(default)]
    pub history: Vec<ChatMessage>,
    #[serde(default = "default_lang")]
    pub lang: String,
    #[serde(default = "default_name")]
    pub name: String,
}

fn default_mode() -> String { "discovery".into() }
fn default_lang() -> String { "ko".into() }
fn default_name() -> String { "Seeker".into() }

// ── Gemini streaming ────────────────────────────────────────────────────

#[derive(Debug, Serialize)]
struct GeminiRequest {
    system_instruction: GeminiSystemInstruction,
    contents: Vec<GeminiContent>,
    #[serde(rename = "generationConfig")]
    generation_config: GeminiGenConfig,
}

#[derive(Debug, Serialize)]
struct GeminiSystemInstruction {
    parts: Vec<GeminiPart>,
}

#[derive(Debug, Serialize)]
struct GeminiContent {
    role: String,
    parts: Vec<GeminiPart>,
}

#[derive(Debug, Serialize)]
struct GeminiPart {
    text: String,
}

#[derive(Debug, Serialize)]
struct GeminiGenConfig {
    temperature: f32,
    #[serde(rename = "topP")]
    top_p: f32,
    #[serde(rename = "maxOutputTokens")]
    max_output_tokens: u32,
}

#[derive(Debug, Deserialize)]
struct GeminiStreamResponse {
    candidates: Option<Vec<GeminiCandidate>>,
}

#[derive(Debug, Deserialize)]
struct GeminiCandidate {
    content: Option<GeminiCandidateContent>,
}

#[derive(Debug, Deserialize)]
struct GeminiCandidateContent {
    parts: Option<Vec<GeminiResponsePart>>,
}

#[derive(Debug, Deserialize)]
struct GeminiResponsePart {
    text: Option<String>,
}

// ── Groq streaming (OpenAI-compatible) ──────────────────────────────────

#[derive(Debug, Serialize)]
struct GroqRequest {
    model: String,
    messages: Vec<GroqMessage>,
    temperature: f32,
    max_tokens: u32,
    stream: bool,
}

#[derive(Debug, Serialize)]
struct GroqMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct GroqStreamChunk {
    choices: Option<Vec<GroqChoice>>,
}

#[derive(Debug, Deserialize)]
struct GroqChoice {
    delta: Option<GroqDelta>,
}

#[derive(Debug, Deserialize)]
struct GroqDelta {
    content: Option<String>,
}

// ── Streaming implementation ────────────────────────────────────────────

/// Stream LLM response, sending chunks through channel
pub async fn stream_chat(
    provider: &LlmProvider,
    system_prompt: &str,
    history: &[ChatMessage],
    user_message: &str,
    tx: mpsc::Sender<String>,
) -> Result<(), String> {
    match provider {
        LlmProvider::Gemini { api_key } => {
            stream_gemini(api_key, system_prompt, history, user_message, tx).await
        }
        LlmProvider::Groq { api_key } => {
            stream_groq(api_key, system_prompt, history, user_message, tx).await
        }
    }
}

async fn stream_gemini(
    api_key: &str,
    system_prompt: &str,
    history: &[ChatMessage],
    user_message: &str,
    tx: mpsc::Sender<String>,
) -> Result<(), String> {
    let client = Client::new();

    let mut contents: Vec<GeminiContent> = history
        .iter()
        .map(|m| GeminiContent {
            role: if m.role == "ember" || m.role == "assistant" {
                "model".into()
            } else {
                "user".into()
            },
            parts: vec![GeminiPart {
                text: m.content.clone(),
            }],
        })
        .collect();

    contents.push(GeminiContent {
        role: "user".into(),
        parts: vec![GeminiPart {
            text: user_message.into(),
        }],
    });

    let body = GeminiRequest {
        system_instruction: GeminiSystemInstruction {
            parts: vec![GeminiPart {
                text: system_prompt.into(),
            }],
        },
        contents,
        generation_config: GeminiGenConfig {
            temperature: 0.9,
            top_p: 0.95,
            max_output_tokens: 1024,
        },
    };

    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key={}",
        api_key
    );

    let resp = client
        .post(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Gemini request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Gemini API error {}: {}", status, body));
    }

    let mut stream = resp.bytes_stream();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Stream error: {}", e))?;
        let text = String::from_utf8_lossy(&chunk);

        for line in text.lines() {
            if let Some(data) = line.strip_prefix("data: ") {
                if data.trim() == "[DONE]" {
                    break;
                }
                if let Ok(parsed) = serde_json::from_str::<GeminiStreamResponse>(data) {
                    if let Some(text_chunk) = parsed
                        .candidates
                        .and_then(|c| c.into_iter().next())
                        .and_then(|c| c.content)
                        .and_then(|c| c.parts)
                        .and_then(|p| p.into_iter().next())
                        .and_then(|p| p.text)
                    {
                        if tx.send(text_chunk).await.is_err() {
                            return Ok(()); // Client disconnected
                        }
                    }
                }
            }
        }
    }

    Ok(())
}

async fn stream_groq(
    api_key: &str,
    system_prompt: &str,
    history: &[ChatMessage],
    user_message: &str,
    tx: mpsc::Sender<String>,
) -> Result<(), String> {
    let client = Client::new();

    let mut messages = vec![GroqMessage {
        role: "system".into(),
        content: system_prompt.into(),
    }];

    for m in history {
        messages.push(GroqMessage {
            role: if m.role == "ember" { "assistant".into() } else { "user".into() },
            content: m.content.clone(),
        });
    }

    messages.push(GroqMessage {
        role: "user".into(),
        content: user_message.into(),
    });

    let body = GroqRequest {
        model: "llama-3.3-70b-versatile".into(),
        messages,
        temperature: 0.9,
        max_tokens: 1024,
        stream: true,
    };

    let resp = client
        .post("https://api.groq.com/openai/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Groq request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Groq API error {}: {}", status, body));
    }

    let mut stream = resp.bytes_stream();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Stream error: {}", e))?;
        let text = String::from_utf8_lossy(&chunk);

        for line in text.lines() {
            if let Some(data) = line.strip_prefix("data: ") {
                if data.trim() == "[DONE]" {
                    break;
                }
                if let Ok(parsed) = serde_json::from_str::<GroqStreamChunk>(data) {
                    if let Some(content) = parsed
                        .choices
                        .and_then(|c| c.into_iter().next())
                        .and_then(|c| c.delta)
                        .and_then(|d| d.content)
                    {
                        if tx.send(content).await.is_err() {
                            return Ok(());
                        }
                    }
                }
            }
        }
    }

    Ok(())
}

/// Non-streaming fallback (for when no API key is configured)
pub fn mock_response(lang: &str, name: &str) -> serde_json::Value {
    if lang == "ko" {
        serde_json::json!({
            "message": format!("안녕 {}! 나는 Ember야 🔥 네 안에서 방금 깨어났어... 뭔가 반짝이는 게 느껴져! 평소에 뭘 하는 걸 제일 좋아해?", name),
            "choices": [
                {"id": "creative", "text": "🎨 만들거나 그리는 거"},
                {"id": "analytical", "text": "🧩 문제 풀거나 분석하는 거"},
                {"id": "social", "text": "🤝 사람들과 소통하는 거"},
            ],
            "freeInput": true,
        })
    } else {
        serde_json::json!({
            "message": format!("Hey {}! I'm Ember 🔥 I just woke up inside you... I sense something shimmering! What do you enjoy doing most?", name),
            "choices": [
                {"id": "creative", "text": "🎨 Creating or designing things"},
                {"id": "analytical", "text": "🧩 Solving or analyzing problems"},
                {"id": "social", "text": "🤝 Connecting with people"},
            ],
            "freeInput": true,
        })
    }
}
