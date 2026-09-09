use serde_json::{Value, json};
use std::{
    io::{BufRead, BufReader, Write},
    process::{Command, Stdio},
};
use ulid::Ulid;

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

    drop(stdin);
    assert!(child.wait().unwrap().success());
    let _ = std::fs::remove_dir_all(data_dir);
}
