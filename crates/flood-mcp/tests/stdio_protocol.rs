use flood_core::{ProjectWorkspaceItemKind, Store, TaskPatch, TelegramInboxCandidate};
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
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

    let manifest = Command::new(env!("CARGO_BIN_EXE_flood-mcp"))
        .arg("--manifest")
        .output()
        .unwrap();
    assert!(manifest.status.success());
    let manifest: Value = serde_json::from_slice(&manifest.stdout).unwrap();
    assert_eq!(manifest["name"], "flood.md");
    assert_eq!(manifest["version"], env!("CARGO_PKG_VERSION"));
    assert_eq!(manifest["protocol_version"], "2026-07-28");
    assert_eq!(
        manifest["supported_protocol_versions"],
        json!(["2025-06-18", "2025-11-25", "2026-07-28"])
    );
    assert!(
        manifest["tool_count"]
            .as_u64()
            .is_some_and(|count| count > 50)
    );
    assert_eq!(
        manifest["tool_catalog_revision"].as_str().map(str::len),
        Some(64)
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
        "Идентичность MCP-каталога",
        "Структурированные ответы MCP",
        "Аннотации безопасности MCP",
        "Идемпотентное создание через MCP",
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

fn modern_request_meta() -> Value {
    json!({
        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
        "io.modelcontextprotocol/clientInfo": {
            "name": "flood-modern-conformance",
            "version": "0.2.0"
        },
        "io.modelcontextprotocol/clientCapabilities": {}
    })
}

fn canonical_json(value: Value) -> Value {
    match value {
        Value::Array(values) => Value::Array(values.into_iter().map(canonical_json).collect()),
        Value::Object(values) => {
            let mut entries = values.into_iter().collect::<Vec<_>>();
            entries.sort_by(|left, right| left.0.cmp(&right.0));
            Value::Object(
                entries
                    .into_iter()
                    .map(|(key, value)| (key, canonical_json(value)))
                    .collect(),
            )
        }
        value => value,
    }
}

#[test]
fn stdio_server_supports_2026_07_28_discovery_and_tools_flow() {
    let data_dir = std::env::temp_dir().join(format!("flood-mcp-modern-{}", Ulid::new()));
    let mut child = Command::new(env!("CARGO_BIN_EXE_flood-mcp"))
        .env("FLOOD_DATA_DIR", &data_dir)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .unwrap();
    let mut stdin = child.stdin.take().unwrap();
    let mut stdout = BufReader::new(child.stdout.take().unwrap());

    let discover: Value =
        serde_json::from_str(include_str!("fixtures/mcp_2026_07_28_discover.json")).unwrap();
    send(&mut stdin, discover);
    let discovered = receive(&mut stdout, 1);
    assert_eq!(discovered["result"]["resultType"], "complete");
    assert_eq!(
        discovered["result"]["supportedVersions"],
        json!(["2025-06-18", "2025-11-25", "2026-07-28"])
    );
    assert!(discovered["result"]["capabilities"]["tools"].is_object());
    assert!(discovered["result"]["capabilities"]["prompts"].is_object());
    assert!(discovered["result"]["capabilities"].get("tasks").is_none());
    assert_eq!(discovered["result"]["ttlMs"], 0);
    assert_eq!(discovered["result"]["cacheScope"], "private");
    assert_eq!(
        discovered["result"]["_meta"]["io.modelcontextprotocol/serverInfo"]["name"],
        "flood.md"
    );
    assert_eq!(
        discovered["result"]["_meta"]["io.modelcontextprotocol/serverInfo"]["version"],
        env!("CARGO_PKG_VERSION")
    );

    let mut request_id = 2_i64;
    let mut next_cursor: Option<String> = None;
    let mut tools = Vec::new();
    loop {
        let mut params = json!({ "_meta": modern_request_meta() });
        if let Some(cursor) = next_cursor.as_ref() {
            params["cursor"] = json!(cursor);
        }
        send(
            &mut stdin,
            json!({
                "jsonrpc": "2.0",
                "id": request_id,
                "method": "tools/list",
                "params": params
            }),
        );
        let page = receive(&mut stdout, request_id);
        assert_eq!(page["result"]["resultType"], "complete");
        tools.extend(page["result"]["tools"].as_array().unwrap().iter().cloned());
        next_cursor = page["result"]["nextCursor"].as_str().map(str::to_owned);
        if next_cursor.is_none() {
            break;
        }
        request_id += 1;
    }

    request_id += 1;
    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "id": request_id,
            "method": "tools/call",
            "params": {
                "name": "get_runtime_info",
                "arguments": {},
                "_meta": modern_request_meta()
            }
        }),
    );
    let runtime = receive(&mut stdout, request_id);
    assert_eq!(runtime["result"]["resultType"], "complete");
    assert_eq!(runtime["result"]["isError"], false);
    assert_eq!(
        runtime["result"]["structuredContent"]["protocol_version"],
        "2026-07-28"
    );
    assert_eq!(
        runtime["result"]["structuredContent"]["supported_protocol_versions"],
        json!(["2025-06-18", "2025-11-25", "2026-07-28"])
    );

    let manifest = Command::new(env!("CARGO_BIN_EXE_flood-mcp"))
        .arg("--manifest")
        .output()
        .unwrap();
    assert!(manifest.status.success());
    let manifest: Value = serde_json::from_slice(&manifest.stdout).unwrap();
    assert_eq!(manifest["tool_count"].as_u64(), Some(tools.len() as u64));
    let mut canonical_tools = tools.clone();
    canonical_tools.sort_by(|left, right| left["name"].as_str().cmp(&right["name"].as_str()));
    let discovered_catalog_revision = hex::encode(Sha256::digest(
        serde_json::to_vec(&canonical_json(Value::Array(canonical_tools))).unwrap(),
    ));
    assert_eq!(
        manifest["tool_catalog_revision"],
        discovered_catalog_revision
    );

    drop(stdin);
    assert!(child.wait().unwrap().success());
    let _ = std::fs::remove_dir_all(data_dir);
}

#[test]
fn stdio_compact_context_reads_preserve_the_mutation_gate() {
    let data_dir = std::env::temp_dir().join(format!("flood-mcp-compact-{}", Ulid::new()));
    let store = Store::new(&data_dir).unwrap();
    let project = store.create_project("Проверка контекста").unwrap();
    let original = store
        .create_project_workspace_item_idempotent(
            &project.id,
            ProjectWorkspaceItemKind::Rule,
            "Правило",
            None,
            "Исходный текст",
            true,
            "compact-rule",
        )
        .unwrap()
        .value;
    let rule = store
        .update_project_workspace_item(
            &project.id,
            &original.id,
            &original.title,
            None,
            "Текущий текст",
            true,
            &original.version,
        )
        .unwrap();
    let hidden = store
        .create_project_workspace_item_idempotent(
            &project.id,
            ProjectWorkspaceItemKind::Skill,
            "PRIVATE_TITLE",
            None,
            "PRIVATE_BODY",
            false,
            "compact-private",
        )
        .unwrap()
        .value;

    struct ProcessGuard(std::process::Child);
    impl Drop for ProcessGuard {
        fn drop(&mut self) {
            let _ = self.0.kill();
            let _ = self.0.wait();
        }
    }
    let mut process = ProcessGuard(
        Command::new(env!("CARGO_BIN_EXE_flood-mcp"))
            .env("FLOOD_DATA_DIR", &data_dir)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
            .unwrap(),
    );
    let mut stdin = process.0.stdin.take().unwrap();
    let mut stdout = BufReader::new(process.0.stdout.take().unwrap());
    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0", "id": 1, "method": "initialize",
            "params": {"protocolVersion": "2025-11-25", "capabilities": {},
                "clientInfo": {"name": "compact-context-test", "version": "1.0"}}
        }),
    );
    assert!(receive(&mut stdout, 1).get("result").is_some());
    send(
        &mut stdin,
        json!({"jsonrpc": "2.0", "method": "notifications/initialized"}),
    );
    {
        let mut request_id = 1;
        let mut call = |name: &str, arguments: Value| -> Value {
            request_id += 1;
            send(
                &mut stdin,
                json!({"jsonrpc": "2.0", "id": request_id,
                "method": "tools/call", "params": {"name": name, "arguments": arguments}}),
            );
            let response = receive(&mut stdout, request_id);
            assert!(response.get("error").is_none(), "{response}");
            response["result"].clone()
        };
        let check_args = json!({"project_id": project.id});
        assert_eq!(
            call("check_project_context", check_args.clone())["structuredContent"]["status"],
            "missing"
        );
        let listed = call("list_project_workspace_items", check_args.clone());
        assert_eq!(listed["structuredContent"]["total"], 1);
        assert!(
            listed["structuredContent"]["items"][0]
                .get("content")
                .is_none()
        );
        assert!(!listed.to_string().contains("PRIVATE"));
        let item_args = json!({"project_id": project.id, "id": rule.id});
        let current = call("get_project_workspace_item", item_args.clone());
        assert_eq!(current["structuredContent"]["history_included"], false);
        assert_eq!(current["structuredContent"]["revision_count"], 1);
        assert!(
            current["structuredContent"]["item"]
                .get("revisions")
                .is_none()
        );
        let historical = call(
            "get_project_workspace_item",
            json!({
                "project_id": project.id, "id": rule.id, "include_history": true
            }),
        );
        assert_eq!(
            historical["structuredContent"]["item"]["revisions"][0]["content"],
            "Исходный текст"
        );
        let denied = call(
            "get_project_workspace_item",
            json!({"project_id": project.id, "id": hidden.id}),
        );
        assert_eq!(denied["isError"], true);
        assert!(!denied.to_string().contains("PRIVATE"));
        let brief_args = json!({"id": project.id, "task_limit": 1});
        assert_ne!(
            call("get_project_brief", brief_args.clone())["isError"],
            true
        );
        assert_eq!(
            call("check_project_context", check_args.clone())["structuredContent"]["status"],
            "current"
        );

        let preview_args = json!({
            "project_id": project.id,
            "id": rule.id,
            "title": rule.title,
            "content": "Локальная версия правила",
            "agent_access": true,
            "expected_version": rule.version,
        });
        let preview = call(
            "preview_project_workspace_item_update",
            preview_args.clone(),
        );
        let preview_token = preview["structuredContent"]["preview_token"]
            .as_str()
            .unwrap()
            .to_string();
        let mut stale_apply_args = preview_args.clone();
        stale_apply_args["preview_token"] = preview_token.into();

        // A second Store instance changes Markdown while the MCP process is alive.
        let externally_updated = store
            .update_project_workspace_item(
                &project.id,
                &rule.id,
                &rule.title,
                None,
                "Новое внешнее правило",
                true,
                &rule.version,
            )
            .unwrap();
        let stale = call("check_project_context", check_args.clone());
        assert_eq!(stale["structuredContent"]["status"], "stale");
        assert_eq!(
            stale["structuredContent"]["changes"][0]["current_version"],
            externally_updated.version
        );
        let create_args = json!({"project_id": project.id, "description": "# Проверенная задача",
            "request_id": "compact-create-task"});
        assert_eq!(call("create_task", create_args.clone())["isError"], true);
        let stale_apply = call("apply_project_workspace_item_update", stale_apply_args);
        assert_eq!(stale_apply["isError"], true);
        assert_eq!(stale_apply["structuredContent"]["code"], "conflict");
        assert!(
            stale_apply["structuredContent"]["message"]
                .as_str()
                .is_some_and(|message| message.contains("Project Work Context устарел"))
        );
        call("get_project_workspace_item", item_args.clone());
        assert_eq!(
            call("check_project_context", check_args.clone())["structuredContent"]["status"],
            "stale"
        );
        assert_ne!(
            call("get_project_brief", brief_args.clone())["isError"],
            true
        );

        let fresh_item = call("get_project_workspace_item", item_args.clone());
        let fresh_version = fresh_item["structuredContent"]["item"]["version"]
            .as_str()
            .unwrap()
            .to_string();
        let fresh_preview_args = json!({
            "project_id": project.id,
            "id": rule.id,
            "title": rule.title,
            "content": "Локальная версия правила",
            "agent_access": true,
            "expected_version": fresh_version,
        });
        let fresh_preview = call(
            "preview_project_workspace_item_update",
            fresh_preview_args.clone(),
        );
        let fresh_preview_token = fresh_preview["structuredContent"]["preview_token"]
            .as_str()
            .unwrap()
            .to_string();
        let mut fresh_apply_args = fresh_preview_args;
        fresh_apply_args["preview_token"] = fresh_preview_token.into();
        assert_ne!(
            call("apply_project_workspace_item_update", fresh_apply_args)["isError"],
            true
        );

        let batch_operations = json!([
            {
                "kind": "create",
                "operation_id": "parent",
                "project_id": project.id,
                "description": "# Пакет: родитель",
                "urgency": "important"
            },
            {
                "kind": "create",
                "operation_id": "child",
                "project_id": project.id,
                "description": "# Пакет: дочерняя задача"
            },
            {
                "kind": "link",
                "operation_id": "child-parent",
                "task": {"operation_id": "child"},
                "target": {"operation_id": "parent"},
                "relation": "subtask_of"
            }
        ]);
        let batch_preview_args = json!({
            "operations": batch_operations,
            "expected_versions": [],
            "request_id": "compact-task-batch"
        });
        let batch_preview = call("preview_task_batch", batch_preview_args.clone());
        assert_eq!(batch_preview["isError"], false);
        assert_eq!(batch_preview["structuredContent"]["repeated"], false);
        assert_eq!(
            batch_preview["structuredContent"]["tasks"]
                .as_array()
                .unwrap()
                .len(),
            2
        );
        assert!(
            store
                .list_tasks(Some(&project.id), false)
                .unwrap()
                .is_empty()
        );
        let batch_token = batch_preview["structuredContent"]["confirmation_token"]
            .as_str()
            .unwrap()
            .to_string();
        assert_eq!(
            batch_preview["structuredContent"]["mutation_plan"]["plan_id"]
                .as_str()
                .map(str::len),
            Some(26)
        );

        let mut swapped_batch_args = batch_preview_args.clone();
        swapped_batch_args["operations"][1]["description"] = "# Подменённый payload".into();
        swapped_batch_args["confirmation_token"] = batch_token.clone().into();
        let swapped_batch = call("apply_task_batch", swapped_batch_args);
        assert_eq!(swapped_batch["isError"], true);
        assert_eq!(
            swapped_batch["structuredContent"]["code"],
            "preview_mismatch"
        );
        assert!(
            store
                .list_tasks(Some(&project.id), false)
                .unwrap()
                .is_empty()
        );

        let mut batch_apply_args = batch_preview_args;
        batch_apply_args["confirmation_token"] = batch_token.into();
        let batch_applied = call("apply_task_batch", batch_apply_args.clone());
        assert_eq!(batch_applied["isError"], false);
        assert_eq!(batch_applied["structuredContent"]["repeated"], false);
        assert_eq!(
            batch_applied["structuredContent"]["tasks"]
                .as_array()
                .unwrap()
                .len(),
            2
        );
        let batch_repeated = call("apply_task_batch", batch_apply_args);
        assert_eq!(batch_repeated["isError"], false);
        assert_eq!(batch_repeated["structuredContent"]["repeated"], true);
        assert_eq!(store.list_tasks(Some(&project.id), false).unwrap().len(), 2);

        let stale_batch_task_id = batch_applied["structuredContent"]["tasks"][0]["id"]
            .as_str()
            .unwrap()
            .to_string();
        let stale_batch_task_version = batch_applied["structuredContent"]["tasks"][0]["version"]
            .as_str()
            .unwrap()
            .to_string();
        let stale_batch_preview_args = json!({
            "operations": [{
                "kind": "update",
                "operation_id": "update-parent",
                "task": {"task_id": stale_batch_task_id},
                "description": "# Локальная пакетная версия"
            }],
            "expected_versions": [{
                "task_id": stale_batch_task_id,
                "version": stale_batch_task_version
            }],
            "request_id": "compact-task-batch-stale"
        });
        let stale_batch_preview = call("preview_task_batch", stale_batch_preview_args.clone());
        assert_eq!(stale_batch_preview["isError"], false);
        let stale_batch_token = stale_batch_preview["structuredContent"]["confirmation_token"]
            .as_str()
            .unwrap()
            .to_string();
        store
            .update_task(
                &stale_batch_task_id,
                TaskPatch {
                    description: Some("# Внешняя пакетная версия".into()),
                    ..Default::default()
                },
                &stale_batch_task_version,
            )
            .unwrap();
        let mut stale_batch_apply_args = stale_batch_preview_args;
        stale_batch_apply_args["confirmation_token"] = stale_batch_token.into();
        let stale_batch_apply = call("apply_task_batch", stale_batch_apply_args);
        assert_eq!(stale_batch_apply["isError"], true);
        assert_eq!(stale_batch_apply["structuredContent"]["code"], "conflict");
        assert_eq!(
            store.get_task(&stale_batch_task_id).unwrap().description,
            "# Внешняя пакетная версия"
        );

        let created_task = call("create_task", create_args);
        assert_ne!(created_task["isError"], true);
        let task_id = created_task["structuredContent"]["task"]["id"]
            .as_str()
            .unwrap()
            .to_string();
        let task_version = created_task["structuredContent"]["task"]["version"]
            .as_str()
            .unwrap()
            .to_string();
        store
            .update_task(
                &task_id,
                TaskPatch {
                    description: Some("# Внешняя версия задачи".into()),
                    ..Default::default()
                },
                &task_version,
            )
            .unwrap();
        let stale_task = call(
            "update_task",
            json!({
                "id": task_id,
                "expected_version": task_version,
                "description": "# Локальная версия задачи",
            }),
        );
        assert_eq!(stale_task["isError"], true);
        assert_eq!(stale_task["structuredContent"]["code"], "conflict");
        let fresh_task = call("get_task", json!({"id": task_id}));
        let fresh_task_version = fresh_task["structuredContent"]["task"]["version"]
            .as_str()
            .unwrap()
            .to_string();
        assert_ne!(
            call(
                "update_task",
                json!({
                    "id": task_id,
                    "expected_version": fresh_task_version,
                    "description": "# Локальная версия задачи",
                }),
            )["isError"],
            true
        );
        assert_eq!(
            call("check_project_context", check_args)["structuredContent"]["status"],
            "current"
        );
    }
    drop(stdin);
    assert!(process.0.wait().unwrap().success());
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
                "protocolVersion": "2025-11-25",
                "capabilities": {},
                "clientInfo": { "name": "flood-test", "version": "0.1.0" }
            }
        }),
    );
    let initialized = receive(&mut stdout, 1);
    assert!(initialized.get("result").is_some(), "{initialized}");
    assert_eq!(initialized["result"]["serverInfo"]["name"], "flood.md");
    assert_eq!(initialized["result"]["protocolVersion"], "2025-11-25");
    assert_eq!(
        initialized["result"]["serverInfo"]["version"],
        env!("CARGO_PKG_VERSION")
    );
    assert!(initialized["result"]["capabilities"]["prompts"].is_object());
    assert!(initialized["result"]["capabilities"]["tools"].is_object());
    assert!(initialized["result"]["capabilities"]["tools"]["listChanged"].is_null());
    assert!(
        initialized["result"]["serverInfo"]["description"]
            .as_str()
            .is_some_and(|description| description.contains("catalog "))
    );
    assert!(
        initialized["result"]["instructions"]
            .as_str()
            .is_some_and(
                |text| text.contains("get_project_triage_context") && text.contains("sender_id")
            )
    );

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
            "id": 20,
            "method": "prompts/list",
            "params": {}
        }),
    );
    let prompts = receive(&mut stdout, 20);
    let prompts = prompts["result"]["prompts"].as_array().unwrap();
    assert!(
        prompts
            .iter()
            .any(|prompt| prompt["name"] == "review-telegram-project")
    );
    assert!(
        prompts
            .iter()
            .any(|prompt| prompt["name"] == "work-on-flood-task")
    );
    assert!(
        prompts
            .iter()
            .any(|prompt| prompt["name"] == "review-project-updates")
    );
    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 21,
            "method": "prompts/get",
            "params": {
                "name": "review-telegram-project",
                "arguments": { "project_id": "project-test" }
            }
        }),
    );
    let prompt = receive(&mut stdout, 21);
    assert!(
        prompt["result"]["messages"][0]["content"]["text"]
            .as_str()
            .is_some_and(|text| {
                text.contains("project-test")
                    && text.contains("is_outgoing")
                    && text.contains("set_telegram_participant_role")
            })
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
    assert!(listed["result"].get("resultType").is_none());
    let mut tools = listed["result"]["tools"].as_array().unwrap().clone();
    let mut next_cursor = listed["result"]["nextCursor"].as_str().map(str::to_owned);
    let mut page_id = 200;
    while let Some(cursor) = next_cursor {
        send(
            &mut stdin,
            json!({
                "jsonrpc": "2.0",
                "id": page_id,
                "method": "tools/list",
                "params": { "cursor": cursor }
            }),
        );
        let page = receive(&mut stdout, page_id);
        tools.extend(page["result"]["tools"].as_array().unwrap().iter().cloned());
        next_cursor = page["result"]["nextCursor"].as_str().map(str::to_owned);
        page_id += 1;
    }
    let list_projects = tools
        .iter()
        .find(|tool| tool["name"] == "list_projects")
        .unwrap();
    assert!(list_projects["outputSchema"].is_object());
    assert_eq!(list_projects["annotations"]["readOnlyHint"], true);
    for name in [
        "list_project_workspace_items",
        "get_project_workspace_item",
        "create_project_workspace_item",
        "preview_project_workspace_item_update",
        "apply_project_workspace_item_update",
    ] {
        assert!(
            tools.iter().any(|tool| tool["name"] == name),
            "missing {name}"
        );
    }
    for name in [
        "create_project",
        "create_task",
        "queue_task_for_agent",
        "answer_agent_run",
    ] {
        let tool = tools.iter().find(|tool| tool["name"] == name).unwrap();
        assert!(tool["inputSchema"]["properties"]["request_id"].is_object());
        assert!(
            tool["inputSchema"]["required"]
                .as_array()
                .is_some_and(|fields| fields.iter().any(|field| field == "request_id"))
        );
    }
    for name in ["create_task", "update_task"] {
        let tool = tools.iter().find(|tool| tool["name"] == name).unwrap();
        let tool_description = tool["description"].as_str().unwrap();
        assert!(
            tool_description.contains("кликабельными"),
            "{name} does not explain clickable Markdown links: {tool_description}"
        );
        assert!(
            tool["inputSchema"]["properties"]["description"]["description"]
                .as_str()
                .is_some_and(|description| description.contains("](https://...)"))
        );
    }
    let triage_batch = tools
        .iter()
        .find(|tool| tool["name"] == "get_telegram_triage_batch")
        .unwrap();
    assert_eq!(triage_batch["annotations"]["readOnlyHint"], true);
    let telegram_context = tools
        .iter()
        .find(|tool| tool["name"] == "get_telegram_candidate_context")
        .unwrap();
    assert_eq!(telegram_context["annotations"]["readOnlyHint"], true);
    assert_eq!(telegram_context["annotations"]["openWorldHint"], false);
    for name in [
        "list_connectors",
        "list_project_sources",
        "list_telegram_chats",
        "read_telegram_chat",
        "read_telegram_updates",
        "read_project_telegram_updates",
        "get_project_triage_context",
        "list_project_resource_files",
        "read_project_resource_file",
        "search_project_resource",
        "get_task_work_context",
        "get_agent_run",
    ] {
        let tool = tools.iter().find(|tool| tool["name"] == name).unwrap();
        assert_eq!(tool["annotations"]["readOnlyHint"], true);
        assert_eq!(tool["annotations"]["openWorldHint"], false);
    }
    let project_context_feed = tools
        .iter()
        .find(|tool| tool["name"] == "get_project_context_feed")
        .unwrap();
    assert_eq!(project_context_feed["annotations"]["readOnlyHint"], true);
    assert_eq!(project_context_feed["annotations"]["openWorldHint"], true);
    let acknowledge_updates = tools
        .iter()
        .find(|tool| tool["name"] == "acknowledge_telegram_updates")
        .unwrap();
    assert_eq!(acknowledge_updates["annotations"]["readOnlyHint"], false);
    assert_eq!(acknowledge_updates["annotations"]["destructiveHint"], false);
    let discussion_task = tools
        .iter()
        .find(|tool| tool["name"] == "create_task_from_telegram_discussion")
        .unwrap();
    assert_eq!(discussion_task["annotations"]["readOnlyHint"], false);
    assert_eq!(discussion_task["annotations"]["destructiveHint"], false);
    let message_context = tools
        .iter()
        .find(|tool| tool["name"] == "read_telegram_message_context")
        .unwrap();
    assert_eq!(message_context["annotations"]["readOnlyHint"], true);
    assert!(message_context["inputSchema"]["properties"]["message_id"].is_object());
    let project_resources = tools
        .iter()
        .find(|tool| tool["name"] == "set_project_resources")
        .unwrap();
    assert_eq!(project_resources["annotations"]["readOnlyHint"], false);
    assert!(project_resources["inputSchema"]["properties"]["resources"].is_object());
    assert!(
        !project_resources["inputSchema"]
            .to_string()
            .contains("agent_access")
    );
    let list_resource_files = tools
        .iter()
        .find(|tool| tool["name"] == "list_project_resource_files")
        .unwrap();
    assert_eq!(list_resource_files["annotations"]["readOnlyHint"], true);
    assert_eq!(list_resource_files["annotations"]["openWorldHint"], false);
    let read_resource_file = tools
        .iter()
        .find(|tool| tool["name"] == "read_project_resource_file")
        .unwrap();
    assert_eq!(read_resource_file["annotations"]["readOnlyHint"], true);
    assert!(read_resource_file["inputSchema"]["properties"]["path"].is_object());
    let search_resource = tools
        .iter()
        .find(|tool| tool["name"] == "search_project_resource")
        .unwrap();
    assert_eq!(search_resource["annotations"]["readOnlyHint"], true);
    assert_eq!(search_resource["annotations"]["openWorldHint"], false);
    assert!(search_resource["inputSchema"]["properties"]["query"].is_object());
    for name in [
        "list_github_repository_files",
        "read_github_repository_file",
        "search_github_repository",
        "get_github_repository_context",
    ] {
        let tool = tools.iter().find(|tool| tool["name"] == name).unwrap();
        assert_eq!(tool["annotations"]["readOnlyHint"], true);
        assert_eq!(tool["annotations"]["destructiveHint"], false);
        assert_eq!(tool["annotations"]["openWorldHint"], true);
        assert!(tool["outputSchema"].is_object());
        assert!(tool["inputSchema"]["properties"]["project_id"].is_object());
        assert!(tool["inputSchema"]["properties"]["resource_id"].is_object());
    }
    let read_github_file = tools
        .iter()
        .find(|tool| tool["name"] == "read_github_repository_file")
        .unwrap();
    assert!(read_github_file["inputSchema"]["properties"]["path"].is_object());
    let search_github = tools
        .iter()
        .find(|tool| tool["name"] == "search_github_repository")
        .unwrap();
    assert!(search_github["inputSchema"]["properties"]["query"].is_object());
    let task_work_context = tools
        .iter()
        .find(|tool| tool["name"] == "get_task_work_context")
        .unwrap();
    assert_eq!(task_work_context["annotations"]["readOnlyHint"], true);
    assert_eq!(task_work_context["annotations"]["openWorldHint"], false);
    assert!(task_work_context["inputSchema"]["properties"]["id"].is_object());
    let append_checkpoint = tools
        .iter()
        .find(|tool| tool["name"] == "append_task_checkpoint")
        .unwrap();
    assert_eq!(append_checkpoint["annotations"]["readOnlyHint"], false);
    assert_eq!(append_checkpoint["annotations"]["destructiveHint"], false);
    assert_eq!(append_checkpoint["annotations"]["openWorldHint"], false);
    assert!(append_checkpoint["inputSchema"]["properties"]["request_id"].is_object());
    assert!(append_checkpoint["inputSchema"]["properties"]["expected_version"].is_object());
    assert!(append_checkpoint["inputSchema"]["properties"]["remaining"].is_object());
    let project_triage_context = tools
        .iter()
        .find(|tool| tool["name"] == "get_project_triage_context")
        .unwrap();
    assert_eq!(project_triage_context["annotations"]["readOnlyHint"], true);
    assert_eq!(
        project_triage_context["annotations"]["openWorldHint"],
        false
    );
    let participant_role = tools
        .iter()
        .find(|tool| tool["name"] == "set_telegram_participant_role")
        .unwrap();
    assert_eq!(participant_role["annotations"]["readOnlyHint"], false);
    assert_eq!(participant_role["annotations"]["openWorldHint"], false);
    assert!(participant_role["inputSchema"]["properties"]["sender_id"].is_object());
    let project_task_preview = tools
        .iter()
        .find(|tool| tool["name"] == "preview_project_telegram_tasks")
        .unwrap();
    assert_eq!(project_task_preview["annotations"]["readOnlyHint"], true);
    let project_task_apply = tools
        .iter()
        .find(|tool| tool["name"] == "apply_project_telegram_tasks")
        .unwrap();
    assert_eq!(project_task_apply["annotations"]["readOnlyHint"], false);
    assert!(project_task_apply["inputSchema"]["properties"]["confirmation_token"].is_object());
    let request_image = tools
        .iter()
        .find(|tool| tool["name"] == "request_telegram_image")
        .unwrap();
    assert_eq!(request_image["annotations"]["readOnlyHint"], false);
    assert_eq!(request_image["annotations"]["openWorldHint"], true);
    let read_image = tools
        .iter()
        .find(|tool| tool["name"] == "read_telegram_image")
        .unwrap();
    assert_eq!(read_image["annotations"]["readOnlyHint"], true);
    assert!(read_image["outputSchema"].is_object());
    let triage_preview = tools
        .iter()
        .find(|tool| tool["name"] == "preview_telegram_triage")
        .unwrap();
    assert_eq!(triage_preview["annotations"]["readOnlyHint"], true);
    let triage_apply = tools
        .iter()
        .find(|tool| tool["name"] == "apply_telegram_triage")
        .unwrap();
    assert!(triage_apply["inputSchema"]["properties"]["confirmation_token"].is_object());
    assert!(
        triage_apply["inputSchema"]["required"]
            .as_array()
            .is_some_and(|fields| fields.iter().any(|field| field == "confirmation_token"))
    );
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
    let project_brief = tools
        .iter()
        .find(|tool| tool["name"] == "get_project_brief")
        .unwrap();
    assert_eq!(project_brief["annotations"]["readOnlyHint"], true);
    assert_eq!(project_brief["annotations"]["openWorldHint"], false);
    assert!(project_brief["inputSchema"]["properties"]["task_limit"].is_object());
    let recent_activity = tools
        .iter()
        .find(|tool| tool["name"] == "list_recent_activity")
        .unwrap();
    assert_eq!(recent_activity["annotations"]["readOnlyHint"], true);
    assert_eq!(recent_activity["annotations"]["openWorldHint"], false);
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
                "arguments": {
                    "title": "MCP проект",
                    "request_id": "stdio-create-project-1"
                }
            }
        }),
    );
    let created = receive(&mut stdout, 3);
    assert_eq!(created["result"]["isError"], false);
    assert_eq!(
        created["result"]["structuredContent"]["project"]["title"],
        "MCP проект"
    );
    assert_eq!(created["result"]["structuredContent"]["created"], true);
    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 101,
            "method": "tools/call",
            "params": {
                "name": "create_project",
                "arguments": {
                    "title": "MCP проект",
                    "request_id": "stdio-create-project-1"
                }
            }
        }),
    );
    let repeated_project = receive(&mut stdout, 101);
    assert_eq!(
        repeated_project["result"]["structuredContent"]["created"],
        false
    );
    assert_eq!(
        repeated_project["result"]["structuredContent"]["project"]["id"],
        created["result"]["structuredContent"]["project"]["id"]
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
    assert!(runtime["result"].get("resultType").is_none());
    assert_eq!(runtime["result"]["isError"], false);
    assert_eq!(
        runtime["result"]["structuredContent"]["version"],
        env!("CARGO_PKG_VERSION")
    );
    assert_eq!(
        runtime["result"]["structuredContent"]["protocol_version"],
        "2026-07-28"
    );
    assert_eq!(
        runtime["result"]["structuredContent"]["supported_protocol_versions"],
        json!(["2025-06-18", "2025-11-25", "2026-07-28"])
    );
    assert_eq!(
        runtime["result"]["structuredContent"]["tool_count"]
            .as_u64()
            .unwrap(),
        tools.len() as u64
    );
    assert_eq!(
        runtime["result"]["structuredContent"]["tool_catalog_revision"]
            .as_str()
            .map(str::len),
        Some(64)
    );
    let mut canonical_tools = tools.clone();
    canonical_tools.sort_by(|left, right| left["name"].as_str().cmp(&right["name"].as_str()));
    let discovered_catalog_revision = hex::encode(Sha256::digest(
        serde_json::to_vec(&canonical_json(Value::Array(canonical_tools))).unwrap(),
    ));
    assert_eq!(
        runtime["result"]["structuredContent"]["tool_catalog_revision"],
        discovered_catalog_revision
    );
    let manifest = Command::new(env!("CARGO_BIN_EXE_flood-mcp"))
        .arg("--manifest")
        .output()
        .unwrap();
    assert!(manifest.status.success());
    let manifest: Value = serde_json::from_slice(&manifest.stdout).unwrap();
    assert_eq!(manifest["tool_count"].as_u64(), Some(tools.len() as u64));
    assert_eq!(
        manifest["tool_catalog_revision"],
        discovered_catalog_revision
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
            "id": 98,
            "method": "tools/call",
            "params": {
                "name": "create_task",
                "arguments": {
                    "project_id": created["result"]["structuredContent"]["project"]["id"],
                    "description": "# Должно потребовать контекст",
                    "request_id": "stdio-context-route-missing"
                }
            }
        }),
    );
    let missing_context = receive(&mut stdout, 98);
    assert_eq!(missing_context["result"]["isError"], true);
    assert!(
        missing_context["result"]["content"][0]["text"]
            .as_str()
            .is_some_and(|text| text.contains("Сначала получите Project Work Context"))
    );

    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 99,
            "method": "tools/call",
            "params": {
                "name": "get_project_brief",
                "arguments": {
                    "id": created["result"]["structuredContent"]["project"]["id"]
                }
            }
        }),
    );
    let project_context = receive(&mut stdout, 99);
    assert_eq!(project_context["result"]["isError"], false);
    assert!(
        project_context["result"]["structuredContent"]["context_revision"]
            .as_str()
            .is_some_and(|value| value.len() == 64)
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
                    "urgency": "important",
                    "request_id": "stdio-create-task-1"
                }
            }
        }),
    );
    let created_task = receive(&mut stdout, 10);
    assert_eq!(created_task["result"]["isError"], false);
    assert_eq!(created_task["result"]["structuredContent"]["created"], true);
    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 102,
            "method": "tools/call",
            "params": {
                "name": "create_task",
                "arguments": {
                    "project_id": created["result"]["structuredContent"]["project"]["id"],
                    "description": "Проверить полнотекстовый поиск MCP",
                    "urgency": "important",
                    "request_id": "stdio-create-task-1"
                }
            }
        }),
    );
    let repeated_task = receive(&mut stdout, 102);
    assert_eq!(
        repeated_task["result"]["structuredContent"]["created"],
        false
    );
    assert_eq!(
        repeated_task["result"]["structuredContent"]["task"]["id"],
        created_task["result"]["structuredContent"]["task"]["id"]
    );

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
    assert_eq!(brief["result"]["structuredContent"]["brief_version"], 8);
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
        brief["result"]["structuredContent"]["recent_activity"]["total"],
        3
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

    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 17,
            "method": "tools/call",
            "params": {
                "name": "preview_telegram_triage",
                "arguments": {
                    "decisions": [{
                        "candidate_id": "missing-candidate",
                        "action": "keep"
                    }]
                }
            }
        }),
    );
    let triage_preview = receive(&mut stdout, 17);
    assert_eq!(triage_preview["result"]["isError"], false);
    assert_eq!(
        triage_preview["result"]["structuredContent"]["ready"],
        false
    );
    assert_eq!(triage_preview["result"]["structuredContent"]["invalid"], 1);
    assert_eq!(
        triage_preview["result"]["structuredContent"]["confirmation_token"],
        Value::Null
    );

    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 18,
            "method": "tools/call",
            "params": {
                "name": "apply_telegram_triage",
                "arguments": {
                    "decisions": [{
                        "candidate_id": "missing-candidate",
                        "action": "keep"
                    }]
                }
            }
        }),
    );
    let unconfirmed_triage = receive(&mut stdout, 18);
    assert_eq!(unconfirmed_triage["result"]["isError"], true);

    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 19,
            "method": "tools/call",
            "params": {
                "name": "list_recent_activity",
                "arguments": { "limit": 10 }
            }
        }),
    );
    let activity = receive(&mut stdout, 19);
    assert_eq!(activity["result"]["isError"], false);
    let events = activity["result"]["structuredContent"]["events"]
        .as_array()
        .unwrap();
    assert_eq!(events.len(), 3);
    assert_eq!(events[0]["action"], "telegram_sync_requested");
    assert_eq!(events[1]["action"], "task_created");
    assert_eq!(events[2]["action"], "project_created");
    assert!(
        !activity
            .to_string()
            .contains("Проверить полнотекстовый поиск MCP")
    );

    drop(stdin);
    assert!(child.wait().unwrap().success());
    let _ = std::fs::remove_dir_all(data_dir);
}

#[test]
fn stdio_telegram_triage_requires_and_applies_the_previewed_plan() {
    let data_dir = std::env::temp_dir().join(format!("flood-mcp-triage-{}", Ulid::new()));
    let store = Store::new(&data_dir).unwrap();
    let project = store.create_project("Telegram preview").unwrap();
    let candidate_id = format!("telegram:{}:-10099:501", project.id);
    let candidate: TelegramInboxCandidate = serde_json::from_value(json!({
        "id": candidate_id,
        "project_id": project.id,
        "chat_id": -10099,
        "chat_title": "Рабочий чат",
        "message_id": 501,
        "text": "Собрать итоги обсуждения и назначить ответственных",
        "author": "Анна",
        "sent_at": "2026-09-11T00:00:00Z",
        "reason": "mention",
        "status": "pending",
        "media": [],
        "discovered_at": "2026-09-11T00:00:01Z"
    }))
    .unwrap();
    store.upsert_telegram_candidates(vec![candidate]).unwrap();
    drop(store);

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
                "clientInfo": { "name": "flood-triage-test", "version": "0.1.0" }
            }
        }),
    );
    let initialized = receive(&mut stdout, 1);
    assert_eq!(initialized["result"]["protocolVersion"], "2025-06-18");
    send(
        &mut stdin,
        json!({ "jsonrpc": "2.0", "method": "notifications/initialized" }),
    );
    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 20,
            "method": "tools/call",
            "params": {
                "name": "get_project_brief",
                "arguments": { "id": project.id.clone() }
            }
        }),
    );
    let project_context = receive(&mut stdout, 20);
    assert!(project_context["result"].get("resultType").is_none());
    assert_eq!(project_context["result"]["isError"], false);
    let decisions = json!([{
        "candidate_id": candidate_id,
        "action": "create_task",
        "title": "Собрать итоги обсуждения",
        "notes": "Назначить ответственных",
        "urgency": "important"
    }]);
    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {
                "name": "preview_telegram_triage",
                "arguments": { "decisions": decisions.clone() }
            }
        }),
    );
    let preview = receive(&mut stdout, 2);
    assert_eq!(preview["result"]["isError"], false);
    assert_eq!(preview["result"]["structuredContent"]["ready"], true);
    assert_eq!(
        preview["result"]["structuredContent"]["requires_confirmation"],
        true
    );
    assert_eq!(
        preview["result"]["structuredContent"]["creation_policy"],
        "apply_in_same_turn_only_when_current_user_request_explicitly_asks_to_create"
    );
    assert_eq!(
        preview["result"]["structuredContent"]["items"][0]["author"],
        "Анна"
    );
    let token = preview["result"]["structuredContent"]["confirmation_token"]
        .as_str()
        .unwrap()
        .to_owned();
    assert_eq!(token.len(), 64);

    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
                "name": "apply_telegram_triage",
                "arguments": { "decisions": decisions, "confirmation_token": token }
            }
        }),
    );
    let applied = receive(&mut stdout, 3);
    assert_eq!(applied["result"]["isError"], false);
    assert_eq!(applied["result"]["structuredContent"]["created"], 1);
    assert_eq!(applied["result"]["structuredContent"]["failed"], 0);

    send(
        &mut stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 4,
            "method": "tools/call",
            "params": {
                "name": "list_tasks",
                "arguments": { "project_id": project.id, "limit": 5 }
            }
        }),
    );
    let tasks = receive(&mut stdout, 4);
    assert_eq!(tasks["result"]["structuredContent"]["total"], 1);

    drop(stdin);
    assert!(child.wait().unwrap().success());
    let _ = std::fs::remove_dir_all(data_dir);
}
