use serde_json::{Value, json};
use std::{
    io::{BufRead, BufReader, Write},
    process::{Command, Stdio},
};
use ulid::Ulid;

#[test]
fn command_line_reports_version_and_runs_isolated_self_check() {
    let version = Command::new(env!("CARGO_BIN_EXE_flood-mcp"))
        .arg("--version")
        .output()
        .unwrap();
    assert!(version.status.success());
    assert_eq!(
        String::from_utf8(version.stdout).unwrap().trim(),
        env!("CARGO_PKG_VERSION")
    );

    let self_check = Command::new(env!("CARGO_BIN_EXE_flood-mcp"))
        .arg("--self-check")
        .output()
        .unwrap();
    assert!(self_check.status.success());
    let result: Value = serde_json::from_slice(&self_check.stdout).unwrap();
    assert_eq!(result["passed"], true);
    let checks = result["checks"].as_array().unwrap();
    assert!(checks.len() >= 12);
    assert!(checks.iter().all(|check| check["passed"] == true));
    assert!(
        checks
            .iter()
            .any(|check| check["name"] == "Входящие Telegram, источник и защита от дублей")
    );
    for name in [
        "Очистка временных данных",
        "Реестр MCP-инструментов",
        "Структурированные ответы MCP",
        "Аннотации безопасности MCP",
    ] {
        assert!(checks.iter().any(|check| check["name"] == name));
    }
}

fn send(stdin: &mut impl Write, message: Value) {
    writeln!(stdin, "{message}").unwrap();
    stdin.flush().unwrap();
}

fn receive(reader: &mut impl BufRead, expected_id: i64) -> Value {
    loop {
        let mut line = String::new();
        assert!(
            reader.read_line(&mut line).unwrap() > 0,
            "MCP-сервер закрыл stdout"
        );
        let message: Value = serde_json::from_str(&line).unwrap();
        if message.get("id").and_then(Value::as_i64) == Some(expected_id) {
            return message;
        }
    }
}

#[test]
fn stdio_server_negotiates_and_returns_structured_tools() {
    let data_dir = std::env::temp_dir().join(format!("flood-mcp-protocol-{}", Ulid::new()));
    let mut child = Command::new(env!("CARGO_BIN_EXE_flood-mcp"))
        .env("FLOOD_DATA_DIR", &data_dir)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .unwrap();
    let mut stdin = child.stdin.take().unwrap();
    let mut stdout = BufReader::new(child.stdout.take().unwrap());

    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2025-06-18",
                "capabilities": {},
                "clientInfo": { "name": "flood-test", "version": "0.1.0" }
            }
        }),
    );
    let initialized = receive(&mut stdout, 1);
    assert!(initialized.get("result").is_some(), "{initialized}");

    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "method": "notifications/initialized"
        }),
    );
    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list",
            "params": {}
        }),
    );
    let listed = receive(&mut stdout, 2);
    let tools = listed["result"]["tools"].as_array().unwrap();
    let list_projects = tools
        .iter()
        .find(|tool| tool["name"] == "list_projects")
        .unwrap();
    assert!(list_projects["outputSchema"].is_object());
    assert_eq!(list_projects["annotations"]["readOnlyHint"], true);
    let triage_batch = tools
        .iter()
        .find(|tool| tool["name"] == "get_telegram_triage_batch")
        .unwrap();
    assert_eq!(triage_batch["annotations"]["readOnlyHint"], true);
    let sync_status = tools
        .iter()
        .find(|tool| tool["name"] == "get_telegram_sync_status")
        .unwrap();
    assert_eq!(sync_status["annotations"]["readOnlyHint"], true);
    let request_sync = tools
        .iter()
        .find(|tool| tool["name"] == "request_telegram_sync")
        .unwrap();
    assert_eq!(request_sync["annotations"]["destructiveHint"], false);
    assert_eq!(request_sync["annotations"]["openWorldHint"], true);
    let search_tasks = tools
        .iter()
        .find(|tool| tool["name"] == "search_tasks")
        .unwrap();
    assert_eq!(search_tasks["annotations"]["readOnlyHint"], true);
    let task_digest = tools
        .iter()
        .find(|tool| tool["name"] == "get_task_digest")
        .unwrap();
    assert_eq!(task_digest["annotations"]["readOnlyHint"], true);
    let workspace_brief = tools
        .iter()
        .find(|tool| tool["name"] == "get_workspace_brief")
        .unwrap();
    assert_eq!(workspace_brief["annotations"]["readOnlyHint"], true);
    assert_eq!(workspace_brief["annotations"]["openWorldHint"], false);
    let attachment_audit = tools
        .iter()
        .find(|tool| tool["name"] == "inspect_attachment_storage")
        .unwrap();
    assert_eq!(attachment_audit["annotations"]["readOnlyHint"], true);
    assert_eq!(attachment_audit["annotations"]["destructiveHint"], false);
    let list_tasks = tools
        .iter()
        .find(|tool| tool["name"] == "list_tasks")
        .unwrap();
    assert!(list_tasks["inputSchema"]["properties"]["limit"].is_object());
    let list_inbox = tools
        .iter()
        .find(|tool| tool["name"] == "list_telegram_inbox")
        .unwrap();
    assert!(list_inbox["inputSchema"]["properties"]["cursor"].is_object());

    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
                "name": "create_project",
                "arguments": { "title": "MCP проект" }
            }
        }),
    );
    let created = receive(&mut stdout, 3);
    assert_eq!(created["result"]["isError"], false);
    assert_eq!(
        created["result"]["structuredContent"]["project"]["title"],
        "MCP проект"
    );

    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 4,
            "method": "tools/call",
            "params": {
                "name": "diagnose_store",
                "arguments": {}
            }
        }),
    );
    let diagnostics = receive(&mut stdout, 4);
    assert_eq!(diagnostics["result"]["isError"], false);
    assert_eq!(
        diagnostics["result"]["structuredContent"]["project_count"],
        1
    );
    assert_eq!(diagnostics["result"]["structuredContent"]["healthy"], true);

    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 5,
            "method": "tools/call",
            "params": {
                "name": "run_self_check",
                "arguments": {}
            }
        }),
    );
    let self_check = receive(&mut stdout, 5);
    assert_eq!(self_check["result"]["isError"], false);
    assert_eq!(self_check["result"]["structuredContent"]["passed"], true);

    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 6,
            "method": "tools/call",
            "params": {
                "name": "get_runtime_info",
                "arguments": {}
            }
        }),
    );
    let runtime = receive(&mut stdout, 6);
    assert_eq!(runtime["result"]["isError"], false);
    assert_eq!(
        runtime["result"]["structuredContent"]["version"],
        env!("CARGO_PKG_VERSION")
    );
    assert_eq!(
        runtime["result"]["structuredContent"]["destructive_actions_enabled"],
        false
    );

    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 7,
            "method": "tools/call",
            "params": {
                "name": "delete_project",
                "arguments": {
                    "id": created["result"]["structuredContent"]["project"]["id"],
                    "expected_version": created["result"]["structuredContent"]["project"]["version"]
                }
            }
        }),
    );
    let protected = receive(&mut stdout, 7);
    assert_eq!(protected["result"]["isError"], true);
    assert!(
        protected["result"]["content"][0]["text"]
            .as_str()
            .is_some_and(|text| text.contains("Необратимые MCP-действия отключены"))
    );

    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 8,
            "method": "tools/call",
            "params": {
                "name": "get_telegram_triage_batch",
                "arguments": {
                    "project_id": created["result"]["structuredContent"]["project"]["id"],
                    "limit": 12
                }
            }
        }),
    );
    let triage = receive(&mut stdout, 8);
    assert_eq!(triage["result"]["isError"], false);
    assert_eq!(
        triage["result"]["structuredContent"]["candidates"],
        json!([])
    );
    assert_eq!(triage["result"]["structuredContent"]["remaining"], 0);

    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 9,
            "method": "tools/call",
            "params": {
                "name": "get_telegram_sync_status",
                "arguments": {}
            }
        }),
    );
    let sync_status = receive(&mut stdout, 9);
    assert_eq!(sync_status["result"]["isError"], false);
    assert_eq!(
        sync_status["result"]["structuredContent"]["status"],
        Value::Null
    );

    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 10,
            "method": "tools/call",
            "params": {
                "name": "create_task",
                "arguments": {
                    "project_id": created["result"]["structuredContent"]["project"]["id"],
                    "description": "Проверить полнотекстовый поиск MCP",
                    "urgency": "important"
                }
            }
        }),
    );
    let created_task = receive(&mut stdout, 10);
    assert_eq!(created_task["result"]["isError"], false);

    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 11,
            "method": "tools/call",
            "params": {
                "name": "search_tasks",
                "arguments": { "query": "полнотекстовый поиск", "limit": 5 }
            }
        }),
    );
    let search = receive(&mut stdout, 11);
    assert_eq!(search["result"]["isError"], false);
    assert_eq!(search["result"]["structuredContent"]["total_matches"], 1);
    assert_eq!(
        search["result"]["structuredContent"]["matches"][0]["id"],
        created_task["result"]["structuredContent"]["task"]["id"]
    );

    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 12,
            "method": "tools/call",
            "params": {
                "name": "get_task_digest",
                "arguments": { "urgencies": ["important"], "limit": 5 }
            }
        }),
    );
    let digest = receive(&mut stdout, 12);
    assert_eq!(digest["result"]["isError"], false);
    assert_eq!(digest["result"]["structuredContent"]["counts"]["total"], 1);
    assert_eq!(
        digest["result"]["structuredContent"]["tasks"][0]["id"],
        created_task["result"]["structuredContent"]["task"]["id"]
    );

    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 13,
            "method": "tools/call",
            "params": {
                "name": "request_telegram_sync",
                "arguments": {}
            }
        }),
    );
    let requested_sync = receive(&mut stdout, 13);
    assert_eq!(requested_sync["result"]["isError"], false);
    assert_eq!(
        requested_sync["result"]["structuredContent"]["queued"],
        true
    );
    assert!(
        requested_sync["result"]["structuredContent"]["request"]["id"]
            .as_str()
            .is_some_and(|id| !id.is_empty())
    );
    let requested_id = requested_sync["result"]["structuredContent"]["request"]["id"]
        .as_str()
        .unwrap();
    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 14,
            "method": "tools/call",
            "params": {
                "name": "get_telegram_sync_status",
                "arguments": {}
            }
        }),
    );
    let queued_sync = receive(&mut stdout, 14);
    assert_eq!(
        queued_sync["result"]["structuredContent"]["pending_request"]["id"],
        requested_id
    );
    assert_eq!(
        queued_sync["result"]["structuredContent"]["phase"],
        "queued"
    );
    assert_eq!(queued_sync["result"]["structuredContent"]["fresh"], false);

    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 15,
            "method": "tools/call",
            "params": {
                "name": "get_workspace_brief",
                "arguments": {}
            }
        }),
    );
    let brief = receive(&mut stdout, 15);
    assert_eq!(brief["result"]["isError"], false);
    assert_eq!(brief["result"]["structuredContent"]["brief_version"], 3);
    assert_eq!(
        brief["result"]["structuredContent"]["readiness"]["level"],
        "ready"
    );
    assert_eq!(
        brief["result"]["structuredContent"]["readiness"]["agent_ready"],
        true
    );
    assert_eq!(
        brief["result"]["structuredContent"]["self_check"]["passed"],
        true
    );
    assert!(
        brief["result"]["structuredContent"]["self_check"]["total_checks"]
            .as_u64()
            .is_some_and(|count| count >= 12)
    );
    assert_eq!(
        brief["result"]["structuredContent"]["attachment_storage"]["orphaned_files"],
        0
    );
    assert_eq!(
        brief["result"]["structuredContent"]["priority_tasks"]["tasks"]
            .as_array()
            .unwrap()
            .len(),
        1
    );
    assert_eq!(
        brief["result"]["structuredContent"]["telegram"]["pending_request"]["id"],
        requested_id
    );
    assert_eq!(
        brief["result"]["structuredContent"]["telegram"]["phase"],
        "queued"
    );

    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 16,
            "method": "tools/call",
            "params": {
                "name": "list_tasks",
                "arguments": { "limit": 1 }
            }
        }),
    );
    let listed_tasks = receive(&mut stdout, 16);
    assert_eq!(listed_tasks["result"]["isError"], false);
    assert_eq!(listed_tasks["result"]["structuredContent"]["total"], 1);
    assert_eq!(
        listed_tasks["result"]["structuredContent"]["tasks"][0]["id"],
        created_task["result"]["structuredContent"]["task"]["id"]
    );
    assert_eq!(listed_tasks["result"]["structuredContent"]["remaining"], 0);

    drop(stdin);
    assert!(child.wait().unwrap().success());
    let _ = std::fs::remove_dir_all(data_dir);
}
