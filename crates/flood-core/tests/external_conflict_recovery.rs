use flood_core::{CreateTask, ProjectWorkspaceItemKind, Store, StoreError, TaskPatch, Urgency};
use std::{fs, path::PathBuf};
use ulid::Ulid;

fn temp_store() -> Store {
    Store::new(std::env::temp_dir().join(format!("flood-conflict-{}", Ulid::new()))).unwrap()
}

fn project_path(store: &Store, project_id: &str) -> PathBuf {
    store
        .root()
        .join("projects")
        .join(project_id)
        .join("project.md")
}

fn task_path(store: &Store, project_id: &str, task_id: &str) -> PathBuf {
    store
        .root()
        .join("projects")
        .join(project_id)
        .join("tasks")
        .join(format!("{task_id}.md"))
}

fn skill_path(store: &Store, project_id: &str, item_id: &str) -> PathBuf {
    store
        .root()
        .join("projects")
        .join(project_id)
        .join("workspace")
        .join("skills")
        .join(format!("{item_id}.md"))
}

#[test]
fn task_external_edit_conflicts_then_reread_retry_succeeds() {
    let store = temp_store();
    let project = store.create_project("Конфликты задач").unwrap();
    let task = store
        .create_task(CreateTask {
            project_id: project.id.clone(),
            description: "Исходная задача".into(),
            urgency: Urgency::Normal,
            source: None,
        })
        .unwrap();
    let path = task_path(&store, &project.id, &task.id);
    let external = fs::read_to_string(&path)
        .unwrap()
        .replace("Исходная задача", "Внешняя правка задачи");
    fs::write(&path, &external).unwrap();

    let stale = store.update_task(
        &task.id,
        TaskPatch {
            description: Some("Локальная правка задачи".into()),
            ..Default::default()
        },
        &task.version,
    );
    assert!(matches!(stale, Err(StoreError::Conflict)));
    assert_eq!(fs::read_to_string(&path).unwrap(), external);

    let fresh = store.get_task(&task.id).unwrap();
    assert_eq!(fresh.description, "Внешняя правка задачи");
    let retried = store
        .update_task(
            &task.id,
            TaskPatch {
                description: Some("Локальная правка задачи".into()),
                ..Default::default()
            },
            &fresh.version,
        )
        .unwrap();
    assert_eq!(retried.description, "Локальная правка задачи");
}

#[test]
fn project_external_edit_conflicts_then_reread_retry_succeeds() {
    let store = temp_store();
    let project = store.create_project("Конфликты проекта").unwrap();
    let base = store
        .update_project_context(&project.id, "Контекст до внешней правки", &project.version)
        .unwrap();
    let path = project_path(&store, &project.id);
    let external = fs::read_to_string(&path).unwrap().replace(
        "Контекст до внешней правки",
        "Контекст из внешнего редактора",
    );
    fs::write(&path, &external).unwrap();

    let stale = store.update_project_context(&project.id, "Локальный контекст", &base.version);
    assert!(matches!(stale, Err(StoreError::Conflict)));
    assert_eq!(fs::read_to_string(&path).unwrap(), external);

    let fresh = store.get_project(&project.id).unwrap();
    assert_eq!(fresh.context, "Контекст из внешнего редактора");
    let retried = store
        .update_project_context(&project.id, "Локальный контекст", &fresh.version)
        .unwrap();
    assert_eq!(retried.context, "Локальный контекст");
}

#[test]
fn workspace_external_edit_conflicts_then_reread_retry_succeeds() {
    let store = temp_store();
    let project = store.create_project("Конфликты материалов").unwrap();
    let item = store
        .create_project_workspace_item_idempotent(
            &project.id,
            ProjectWorkspaceItemKind::Skill,
            "Проверка конфликтов",
            None,
            "Исходный материал",
            true,
            "conflict-skill",
        )
        .unwrap()
        .value;
    let path = skill_path(&store, &project.id, &item.id);
    let external = fs::read_to_string(&path)
        .unwrap()
        .replace("Исходный материал", "Внешняя правка материала");
    fs::write(&path, &external).unwrap();

    let stale = store.update_project_workspace_item(
        &project.id,
        &item.id,
        &item.title,
        item.summary.as_deref(),
        "Локальная правка материала",
        true,
        &item.version,
    );
    assert!(matches!(stale, Err(StoreError::Conflict)));
    assert_eq!(fs::read_to_string(&path).unwrap(), external);

    let fresh = store
        .get_project_workspace_item(&project.id, &item.id)
        .unwrap();
    assert_eq!(fresh.content, "Внешняя правка материала");
    let retried = store
        .update_project_workspace_item(
            &project.id,
            &item.id,
            &fresh.title,
            fresh.summary.as_deref(),
            "Локальная правка материала",
            fresh.agent_access,
            &fresh.version,
        )
        .unwrap();
    assert_eq!(retried.content, "Локальная правка материала");
}
