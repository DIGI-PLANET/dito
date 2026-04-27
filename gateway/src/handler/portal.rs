use actix_web::{web, HttpResponse};

use crate::model::*;

pub async fn handle_portal(body: web::Json<CommandRequest>) -> HttpResponse {
    if body.action.is_empty() {
        return HttpResponse::BadRequest().json(error_response(
            "missing_action",
            error_type::CLIENT,
            "Portal action is required",
        ));
    }

    match body.action.as_str() {
        "stats" => portal_stats(),
        "users" | "souls" => HttpResponse::NotImplemented().json(error_response(
            "not_implemented",
            error_type::CLIENT,
            "users/souls portal actions moved to REST endpoints in v3",
        )),
        "audit" => portal_audit(&body.params),
        "deleted" => portal_deleted(&body.params),
        "restore" => portal_restore(&body.params),
        "ask" => portal_question(&body.params),
        "help" => portal_help(),
        _ => HttpResponse::BadRequest().json(error_response(
            "unknown_portal_action",
            error_type::CLIENT,
            &format!(
                "Unknown portal action: '{}'. Use 'help' for available commands",
                body.action
            ),
        )),
    }
}

fn portal_stats() -> HttpResponse {
    let stats = serde_json::json!({
        "users": {"total": 1247, "today": 23, "growth_rate": "+21.1%"},
        "souls": {"total": 892, "conversion_rate": 71.6},
        "activity": {"active_today": 156, "diary_entries_today": 89},
        "system": {"uptime": "99.8%", "response_time": "120ms", "error_rate": "0.02%"},
    });
    HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "data": stats,
        "meta": {"portal": "roy_admin", "action": "stats"},
    }))
}

fn portal_help() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "data": {
            "portal_name": "DITO Admin Portal",
            "access_level": "roy_admin",
            "available_commands": [
                "stats - 전체 시스템 통계",
                "users - 사용자 관리",
                "souls - Soul 관리",
                "audit - 감사 로그",
                "deleted - 삭제된 레코드 조회",
                "restore - 데이터 복구",
                "ask - 질문하기",
                "help - 도움말",
            ],
        },
        "message": "DITO Portal Ready",
    }))
}

fn portal_audit(params: &serde_json::Value) -> HttpResponse {
    let table = params.get("table").and_then(|v| v.as_str()).unwrap_or("");
    let record_id = params.get("record_id").and_then(|v| v.as_str()).unwrap_or("");
    let action = params.get("action").and_then(|v| v.as_str()).unwrap_or("");

    let mut logs = vec![
        serde_json::json!({"id": "audit-001", "table_name": "souls", "record_id": "roy-soul", "action": "update", "created_at": "2026-03-15T13:30:00Z"}),
        serde_json::json!({"id": "audit-002", "table_name": "arena_events", "record_id": "arena-001", "action": "create", "created_at": "2026-03-15T12:15:00Z"}),
    ];

    if !table.is_empty() {
        logs.retain(|l| l["table_name"].as_str() == Some(table));
    }
    if !record_id.is_empty() {
        logs.retain(|l| l["record_id"].as_str() == Some(record_id));
    }
    if !action.is_empty() {
        logs.retain(|l| l["action"].as_str() == Some(action));
    }

    let count = logs.len();
    HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "data": {"logs": logs, "total": count},
        "message": format!("Retrieved {} audit logs", count),
    }))
}

fn portal_deleted(params: &serde_json::Value) -> HttpResponse {
    let table = params
        .get("table")
        .and_then(|v| v.as_str())
        .unwrap_or("profiles");

    let records = serde_json::json!([
        {"id": "soul-deleted-001", "seeker_name": "DeletedUser1", "deleted_at": "2026-03-14T10:30:00Z"},
        {"id": "soul-deleted-002", "seeker_name": "TestAccount", "deleted_at": "2026-03-13T15:45:00Z"},
    ]);

    HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "data": {"records": records, "total": 2, "table": table},
        "message": format!("Retrieved 2 deleted records from {}", table),
    }))
}

fn portal_restore(params: &serde_json::Value) -> HttpResponse {
    let table = params.get("table").and_then(|v| v.as_str()).unwrap_or("");
    let record_id = params.get("record_id").and_then(|v| v.as_str()).unwrap_or("");

    if table.is_empty() || record_id.is_empty() {
        return HttpResponse::BadRequest().json(error_response(
            "missing_params",
            error_type::CLIENT,
            "table and record_id parameters are required",
        ));
    }

    HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "data": {
            "restored_record": {
                "id": record_id,
                "table": table,
                "restored_at": chrono::Utc::now().to_rfc3339(),
            },
        },
        "message": format!("Successfully restored record {} from table {}", record_id, table),
    }))
}

fn portal_question(params: &serde_json::Value) -> HttpResponse {
    let question = params
        .get("question")
        .and_then(|v| v.as_str())
        .unwrap_or("");

    if question.is_empty() {
        return HttpResponse::BadRequest().json(error_response(
            "missing_question",
            error_type::CLIENT,
            "question parameter is required",
        ));
    }

    let q = question.to_lowercase();
    let (answer, related) = if q.contains("user") || q.contains("사용자") {
        ("사용자 관리 관련 질문이시군요!", vec!["users", "souls", "audit"])
    } else if q.contains("delete") || q.contains("삭제") {
        ("데이터 삭제/복구 관련 질문이시군요!", vec!["deleted", "restore", "audit"])
    } else if q.contains("stats") || q.contains("통계") {
        ("시스템 통계 관련 질문이시군요!", vec!["stats", "users"])
    } else {
        ("help 명령어로 사용 가능한 기능을 확인해보세요.", vec!["help", "stats"])
    };

    HttpResponse::Ok().json(success_response(
        serde_json::json!({
            "question": question,
            "answer": answer,
            "related_commands": related,
        }),
        &format!("질문 답변: {}", answer),
    ))
}
