use super::*;

fn setup() -> (FloodServer, Project) {
    let store =
        Store::new(std::env::temp_dir().join(format!("flood-context-test-{}", ulid::Ulid::new())))
            .unwrap();
    let project = store.create_project("Контекст для агента").unwrap();
    let server = FloodServer {
        github: GitHubConnector::new(store.root()).unwrap(),
        store,
        allow_destructive: false,
        enforce_context_route: true,
        project_context_receipts: Arc::new(Mutex::new(HashMap::new())),
        prompt_router: FloodServer::prompt_router(),
    };
    (server, project)
}

fn material(
    server: &FloodServer,
    project: &Project,
    kind: ProjectWorkspaceItemKind,
    content: &str,
    access: bool,
) -> ProjectWorkspaceItem {
    server
        .store
        .create_project_workspace_item_idempotent(
            &project.id,
            kind,
            "Материал",
            Some("Краткое описание"),
            content,
            access,
            &format!("material-{}", ulid::Ulid::new()),
        )
        .unwrap()
        .value
}

fn change(
    server: &FloodServer,
    item: &ProjectWorkspaceItem,
    content: &str,
    access: bool,
) -> ProjectWorkspaceItem {
    server
        .store
        .update_project_workspace_item(
            &item.project_id,
            &item.id,
            &item.title,
            item.summary.as_deref(),
            content,
            access,
            &item.version,
        )
        .unwrap()
}

fn brief(server: &FloodServer, project: &Project, budget: Option<usize>) {
    server
        .get_project_brief(Parameters(ProjectBriefArgs {
            id: project.id.clone(),
            task_limit: Some(1),
            context_budget_chars: budget,
            include_legacy_snapshot: false,
        }))
        .unwrap();
}

fn check(server: &FloodServer, project: &Project) -> ProjectContextCheckOutput {
    server
        .check_project_context(Parameters(CheckProjectContextArgs {
            project_id: project.id.clone(),
        }))
        .unwrap()
        .0
}

fn read(
    server: &FloodServer,
    item: &ProjectWorkspaceItem,
    history: bool,
) -> ProjectWorkspaceItemReadOutput {
    server
        .get_project_workspace_item(Parameters(GetProjectWorkspaceItemArgs {
            project_id: item.project_id.clone(),
            id: item.id.clone(),
            include_history: history,
        }))
        .unwrap()
        .0
}

fn list_args(project: &Project) -> ListProjectWorkspaceItemsArgs {
    ListProjectWorkspaceItemsArgs {
        project_id: project.id.clone(),
        kind: None,
        include_content: false,
        limit: None,
        cursor: None,
    }
}

#[test]
fn workspace_material_reads_omit_history_without_changing_storage() {
    let (server, project) = setup();
    let mut item = material(
        &server,
        &project,
        ProjectWorkspaceItemKind::Rule,
        &"Правило\n".repeat(1000),
        true,
    );
    for index in 0..8 {
        item = change(
            &server,
            &item,
            &format!("Версия {index}\n{}", "Обязательное правило\n".repeat(1000)),
            true,
        );
    }
    let current = read(&server, &item, false);
    let history = read(&server, &item, true);
    assert_eq!(current.item.content, item.content);
    assert_eq!(current.item.version, item.version);
    assert_eq!(current.revision_count, 8);
    assert!(current.item.revisions.is_empty());
    assert!(!current.history_included);
    assert_eq!(history.item.revisions, item.revisions);
    assert!(history.history_included);
    let current_json = serde_json::to_string(&current).unwrap();
    let history_json = serde_json::to_string(&history).unwrap();
    assert!(current_json.len() * 4 < history_json.len());
    eprintln!(
        "Material read payload: current={} bytes, with history={} bytes",
        current_json.len(),
        history_json.len()
    );
    assert_eq!(
        server
            .store
            .get_project_workspace_item(&project.id, &item.id)
            .unwrap(),
        item
    );
    assert_eq!(check(&server, &project).status, "missing");
}

#[test]
fn workspace_reads_enforce_access_for_current_and_historical_content() {
    let (server, project) = setup();
    let hidden = material(
        &server,
        &project,
        ProjectWorkspaceItemKind::Document,
        "PRIVATE_BODY",
        false,
    );
    for include_history in [false, true] {
        let error = server
            .get_project_workspace_item(Parameters(GetProjectWorkspaceItemArgs {
                project_id: project.id.clone(),
                id: hidden.id.clone(),
                include_history,
            }))
            .err()
            .expect("disabled material must not be readable");
        assert!(!error.contains("PRIVATE_BODY"));
        assert!(error.contains("не разрешён"));
    }
    let listed = server
        .list_project_workspace_items(Parameters(list_args(&project)))
        .unwrap()
        .0;
    assert_eq!(listed.total, 0);
    let visible = change(&server, &hidden, "Публичное правило", true);
    let history = read(&server, &visible, true);
    assert_eq!(history.revision_count, 0);
    assert!(
        !serde_json::to_string(&history)
            .unwrap()
            .contains("PRIVATE_BODY")
    );
    assert_eq!(
        server
            .store
            .get_project_workspace_item(&project.id, &hidden.id)
            .unwrap()
            .revisions
            .len(),
        1
    );
}

#[test]
fn workspace_list_is_compact_paged_and_rejects_stale_or_wrong_scope_cursors() {
    let (server, project) = setup();
    let items = (0..3)
        .map(|_| {
            material(
                &server,
                &project,
                ProjectWorkspaceItemKind::Skill,
                &"Полный текст\n".repeat(1000),
                true,
            )
        })
        .collect::<Vec<_>>();
    let mut args = list_args(&project);
    args.limit = Some(2);
    let first = server
        .list_project_workspace_items(Parameters(args))
        .unwrap()
        .0;
    assert_eq!((first.total, first.remaining, first.items.len()), (3, 1, 2));
    assert!(
        first
            .items
            .iter()
            .all(|item| item.content.is_none() && item.content_chars > 10000)
    );
    assert!(
        !serde_json::to_string(&first)
            .unwrap()
            .contains("Полный текст")
    );
    let cursor = first.next_cursor.unwrap();
    let mut args = list_args(&project);
    args.cursor = Some(cursor.clone());
    args.include_content = true;
    let second = server
        .list_project_workspace_items(Parameters(args))
        .unwrap()
        .0;
    assert_eq!((second.items.len(), second.remaining), (1, 0));
    assert!(second.next_cursor.is_none());
    assert!(second.items[0].content.is_some());
    assert!(first.items.iter().all(|item| item.id != second.items[0].id));
    let mut args = list_args(&project);
    args.cursor = Some(cursor.clone());
    args.kind = Some(ProjectWorkspaceItemKind::Skill);
    assert!(
        server
            .list_project_workspace_items(Parameters(args))
            .is_err()
    );
    change(&server, &items[0], "Изменение между страницами", true);
    let mut args = list_args(&project);
    args.cursor = Some(cursor);
    assert!(
        server
            .list_project_workspace_items(Parameters(args))
            .is_err()
    );
}

#[test]
fn context_check_is_read_only_and_session_scoped() {
    let (server, project) = setup();
    material(
        &server,
        &project,
        ProjectWorkspaceItemKind::Skill,
        "Body not needed to check freshness",
        true,
    );
    assert_eq!(check(&server, &project).status, "missing");
    assert!(server.project_context_receipts.lock().unwrap().is_empty());
    assert!(server.require_project_context(&project.id).is_err());
    brief(&server, &project, None);
    let result = check(&server, &project);
    assert_eq!(result.status, "current");
    assert!(result.context_ready);
    assert!(result.changes.is_empty());
    assert_eq!(result.project_changed, Some(false));
    let encoded = serde_json::to_string(&result).unwrap();
    assert!(encoded.len() < 1500);
    assert!(!encoded.contains("Body not needed"));
    assert_eq!(
        serde_json::to_string(&check(&server, &project)).unwrap(),
        encoded
    );
    let mut other_session = server.clone();
    other_session.project_context_receipts = Arc::new(Mutex::new(HashMap::new()));
    assert_eq!(check(&other_session, &project).status, "missing");
    assert_eq!(
        server.store.get_project(&project.id).unwrap().version,
        project.version
    );
}

#[test]
fn context_check_reports_material_versions_and_revoked_access_without_acknowledging() {
    let (server, project) = setup();
    let rule = material(
        &server,
        &project,
        ProjectWorkspaceItemKind::Rule,
        "Старое правило",
        true,
    );
    let document = material(
        &server,
        &project,
        ProjectWorkspaceItemKind::Document,
        "Документ",
        true,
    );
    let revoked = material(
        &server,
        &project,
        ProjectWorkspaceItemKind::Skill,
        "Больше недоступно",
        true,
    );
    let hidden = material(
        &server,
        &project,
        ProjectWorkspaceItemKind::Document,
        "HIDDEN",
        false,
    );
    brief(&server, &project, None);
    change(&server, &hidden, "HIDDEN CHANGE", false);
    assert_eq!(check(&server, &project).status, "current");
    let updated = change(&server, &rule, "Новое правило", true);
    server
        .store
        .delete_project_workspace_item(&project.id, &document.id, &document.version)
        .unwrap();
    change(&server, &revoked, "REVOKED NEW BODY", false);
    let added = material(
        &server,
        &project,
        ProjectWorkspaceItemKind::Skill,
        "Новый навык",
        true,
    );
    let result = check(&server, &project);
    assert_eq!(result.status, "stale");
    assert!(!result.context_ready);
    assert!(result.requires_context_reload);
    assert_eq!(result.project_changed, Some(false));
    assert_eq!(result.changes.len(), 4);
    let rule_change = result
        .changes
        .iter()
        .find(|change| change.id == rule.id)
        .unwrap();
    assert_eq!(rule_change.change, "updated");
    assert_eq!(
        rule_change.previous_version.as_deref(),
        Some(rule.version.as_str())
    );
    assert_eq!(
        rule_change.current_version.as_deref(),
        Some(updated.version.as_str())
    );
    assert!(
        result
            .changes
            .iter()
            .any(|change| change.id == added.id && change.change == "added")
    );
    for id in [&document.id, &revoked.id] {
        let removed = result
            .changes
            .iter()
            .find(|change| &change.id == id)
            .unwrap();
        assert_eq!(removed.change, "removed");
        assert!(removed.current_version.is_none());
    }
    assert_eq!(result.pending_rule_ids, vec![rule.id.clone()]);
    let encoded = serde_json::to_string(&result).unwrap();
    assert!(
        !encoded.contains("REVOKED")
            && !encoded.contains("HIDDEN")
            && !encoded.contains(&hidden.id)
    );
    read(&server, &updated, false);
    assert_eq!(check(&server, &project).status, "stale");
    assert!(
        server
            .require_project_context(&project.id)
            .unwrap_err()
            .contains("устарел")
    );
    assert_eq!(
        check(&server, &project).previous_context_revision,
        result.previous_context_revision
    );
    brief(&server, &project, None);
    assert_eq!(check(&server, &project).status, "current");
}

#[test]
fn context_check_reports_project_changes_without_repeating_memory() {
    let (server, project) = setup();
    brief(&server, &project, None);
    server
        .store
        .append_project_memory(
            &project.id,
            None,
            vec!["Решение, которое нужно перечитать".into()],
        )
        .unwrap();
    let result = check(&server, &project);
    assert_eq!(result.status, "stale");
    assert_eq!(result.project_changed, Some(true));
    assert!(result.changes.is_empty());
    assert!(
        !serde_json::to_string(&result)
            .unwrap()
            .contains("Решение, которое")
    );
    assert!(server.require_project_context(&project.id).is_err());
}

#[test]
fn context_check_and_lists_do_not_acknowledge_incomplete_rules() {
    let (server, project) = setup();
    let rule = material(
        &server,
        &project,
        ProjectWorkspaceItemKind::Rule,
        &"Нужно дочитать\n".repeat(1500),
        true,
    );
    brief(&server, &project, Some(8000));
    assert_eq!(check(&server, &project).status, "incomplete");
    for include_content in [false, true] {
        let mut args = list_args(&project);
        args.include_content = include_content;
        server
            .list_project_workspace_items(Parameters(args))
            .unwrap();
        assert_eq!(
            check(&server, &project).pending_rule_ids,
            vec![rule.id.clone()]
        );
        assert!(server.require_project_context(&project.id).is_err());
    }
    read(&server, &rule, false);
    assert_eq!(check(&server, &project).status, "current");
    let updated = change(&server, &rule, &"Изменённый текст\n".repeat(1500), true);
    brief(&server, &project, Some(8000));
    // A read of a previous version cannot satisfy a current pending rule.
    server.mark_project_rule_read(&project.id, &rule).unwrap();
    assert_eq!(check(&server, &project).status, "incomplete");
    read(&server, &updated, false);
    assert_eq!(check(&server, &project).status, "current");
}

#[test]
fn packet_receipt_keeps_the_versions_actually_delivered() {
    for replacement in ["BBBB", "B"] {
        let (server, project) = setup();
        let rule = material(
            &server,
            &project,
            ProjectWorkspaceItemKind::Rule,
            "AAAA",
            true,
        );
        let (packet, evidence) = ContextBuilder::new(&server.store)
            .for_project_with_evidence(&project.id, WorkPurpose::Plan, vec![], vec![])
            .unwrap();
        // Deterministic interleaving: another writer changes the rule after assembly.
        change(&server, &rule, replacement, true);
        server
            .remember_project_context_for_packet(&packet, &evidence)
            .unwrap();
        let result = check(&server, &project);
        assert_eq!(result.status, "stale");
        assert_eq!(result.pending_rule_ids, vec![rule.id]);
        assert!(server.require_project_context(&project.id).is_err());
    }
}

#[test]
fn known_mutation_keeps_unseen_parallel_changes_stale() {
    let (server, project) = setup();
    let own = material(
        &server,
        &project,
        ProjectWorkspaceItemKind::Document,
        "Before",
        true,
    );
    let rule = material(
        &server,
        &project,
        ProjectWorkspaceItemKind::Rule,
        "Before",
        true,
    );
    brief(&server, &project, None);
    let result = change(&server, &own, "Own result", true);
    change(&server, &rule, "Unseen change", true);
    server
        .acknowledge_material_mutation(&result, Some(&own.version))
        .unwrap();
    let checked = check(&server, &project);
    assert_eq!(checked.status, "stale");
    assert_eq!(checked.pending_rule_ids, vec![rule.id]);
    assert_eq!(checked.changes.len(), 1);
}

#[test]
fn known_project_mutation_keeps_unseen_parallel_changes_stale() {
    let (server, project) = setup();
    let rule = material(
        &server,
        &project,
        ProjectWorkspaceItemKind::Rule,
        "Before",
        true,
    );
    brief(&server, &project, None);

    let own = server
        .store
        .update_project_context(&project.id, "Own result", &project.version)
        .unwrap();
    change(&server, &rule, "Unseen rule change", true);
    let concurrent = server
        .store
        .update_project(&project.id, "Concurrent title", &own.version)
        .unwrap();

    server
        .acknowledge_project_mutation(&own, &project.version)
        .unwrap();

    let checked = check(&server, &project);
    assert_eq!(checked.status, "stale");
    assert_eq!(checked.project_changed, Some(true));
    assert_eq!(checked.project_version, concurrent.version);
    assert_eq!(checked.pending_rule_ids, vec![rule.id.clone()]);
    assert_eq!(checked.changes.len(), 1);
    assert_eq!(checked.changes[0].id, rule.id);
}

#[test]
fn workspace_create_cannot_self_grant_guidance_access() {
    let (server, project) = setup();
    brief(&server, &project, None);

    for (kind, request_id) in [
        (ProjectWorkspaceItemKind::Rule, "self-grant-rule"),
        (ProjectWorkspaceItemKind::Skill, "self-grant-skill"),
    ] {
        let error = server
            .create_project_workspace_item(Parameters(CreateProjectWorkspaceItemArgs {
                project_id: project.id.clone(),
                kind,
                title: "Предлагаемая инструкция".into(),
                summary: None,
                content: "Проверить человеком перед активацией".into(),
                agent_access: true,
                request_id: request_id.into(),
            }))
            .err()
            .expect("guidance must not self-grant Agent access");
        assert!(error.contains("agent_access=false"));

        let created = server
            .create_project_workspace_item(Parameters(CreateProjectWorkspaceItemArgs {
                project_id: project.id.clone(),
                kind,
                title: "Предлагаемая инструкция".into(),
                summary: None,
                content: "Проверить человеком перед активацией".into(),
                agent_access: false,
                request_id: request_id.into(),
            }))
            .unwrap()
            .0;
        assert!(created.created);
        assert!(!created.item.agent_access);
        assert!(created.item.content.is_none());
        assert_eq!(check(&server, &project).status, "current");
    }

    let document = server
        .create_project_workspace_item(Parameters(CreateProjectWorkspaceItemArgs {
            project_id: project.id.clone(),
            kind: ProjectWorkspaceItemKind::Document,
            title: "Рабочий документ".into(),
            summary: None,
            content: "Агент может добавить доступный рабочий документ".into(),
            agent_access: true,
            request_id: "agent-document".into(),
        }))
        .unwrap()
        .0;
    assert!(document.created);
    assert!(document.item.agent_access);
    assert_eq!(check(&server, &project).status, "current");
}

#[test]
fn no_op_material_mutation_does_not_acknowledge_an_unread_rule() {
    let (server, project) = setup();
    let rule = material(
        &server,
        &project,
        ProjectWorkspaceItemKind::Rule,
        &"Обязательное правило\n".repeat(500),
        true,
    );
    brief(&server, &project, None);
    let before = check(&server, &project);
    assert_eq!(before.status, "incomplete");
    assert_eq!(before.pending_rule_ids, vec![rule.id.clone()]);

    let result = change(&server, &rule, &rule.content, true);
    assert_eq!(result.version, rule.version);
    server
        .acknowledge_material_mutation(&result, Some(&rule.version))
        .unwrap();

    let after = check(&server, &project);
    assert_eq!(after.status, "incomplete");
    assert_eq!(after.pending_rule_ids, vec![rule.id]);
    assert!(server.require_project_context(&project.id).is_err());
}

fn preview_args(item: &ProjectWorkspaceItem) -> PreviewProjectWorkspaceItemUpdateArgs {
    PreviewProjectWorkspaceItemUpdateArgs {
        project_id: item.project_id.clone(),
        id: item.id.clone(),
        title: item.title.clone(),
        summary: item.summary.clone(),
        content: "Proposed body".into(),
        agent_access: true,
        expected_version: item.version.clone(),
    }
}

#[test]
fn workspace_preview_does_not_expose_private_material() {
    let (server, project) = setup();
    let hidden = material(
        &server,
        &project,
        ProjectWorkspaceItemKind::Document,
        "PRIVATE_CURRENT",
        false,
    );
    assert!(
        server
            .preview_project_workspace_item_update(Parameters(preview_args(&hidden)))
            .is_err()
    );
}

#[test]
fn workspace_preview_does_not_expose_historical_bodies() {
    let (server, project) = setup();
    let hidden = material(
        &server,
        &project,
        ProjectWorkspaceItemKind::Document,
        "PRIVATE_HISTORY",
        false,
    );
    let visible = change(&server, &hidden, "Visible", true);
    let preview = server
        .preview_project_workspace_item_update(Parameters(preview_args(&visible)))
        .unwrap()
        .0;
    assert!(preview.current.revisions.is_empty());
    assert!(
        !serde_json::to_string(&preview)
            .unwrap()
            .contains("PRIVATE_HISTORY")
    );
}
