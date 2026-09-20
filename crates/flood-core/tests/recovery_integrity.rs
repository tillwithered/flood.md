use atomic_write_file::AtomicWriteFile;
use flood_core::{CreateTask, Store, StoreError, TaskPatch, Urgency};
use std::{
    fs,
    io::Write,
    path::PathBuf,
    sync::{Arc, Barrier},
    thread,
};
use ulid::Ulid;
use zip::ZipArchive;

fn temp_root(label: &str) -> PathBuf {
    std::env::temp_dir().join(format!("flood-{label}-{}", Ulid::new()))
}

fn task_path(store: &Store, project_id: &str, task_id: &str) -> PathBuf {
    store
        .root()
        .join("projects")
        .join(project_id)
        .join("tasks")
        .join(format!("{task_id}.md"))
}

#[test]
fn interrupted_atomic_write_leaves_canonical_markdown_complete() {
    let root = temp_root("atomic-recovery");
    let store = Store::new(&root).unwrap();
    let project = store.create_project("Atomic recovery").unwrap();
    let task = store
        .create_task(CreateTask {
            project_id: project.id.clone(),
            description: "Полное содержимое задачи".into(),
            urgency: Urgency::Important,
            source: None,
        })
        .unwrap();
    let path = task_path(&store, &project.id, &task.id);
    let original = fs::read_to_string(&path).unwrap();

    let mut interrupted = AtomicWriteFile::options().open(&path).unwrap();
    interrupted.write_all(b"---\nid: partial").unwrap();
    drop(interrupted);

    assert_eq!(fs::read_to_string(&path).unwrap(), original);
    let reopened = Store::new(&root).unwrap();
    assert_eq!(
        reopened.get_task(&task.id).unwrap().description,
        task.description
    );
}

#[test]
fn restart_recovers_canonical_markdown_with_corrupt_or_missing_runtime_state() {
    let root = temp_root("restart-recovery");
    let store = Store::new(&root).unwrap();
    let project = store.create_project("Restart recovery").unwrap();
    let task = store
        .create_task(CreateTask {
            project_id: project.id.clone(),
            description: "Канонический Markdown переживает runtime state".into(),
            urgency: Urgency::Normal,
            source: None,
        })
        .unwrap();
    let task_markdown = fs::read_to_string(task_path(&store, &project.id, &task.id)).unwrap();
    let integrations = root.join("integrations");
    fs::create_dir_all(&integrations).unwrap();
    let runtime_state = integrations.join("telegram-sync.json");
    fs::write(&runtime_state, b"{ definitely not valid json").unwrap();

    let reopened = Store::new(&root).unwrap();
    assert_eq!(reopened.get_project(&project.id).unwrap().id, project.id);
    assert_eq!(reopened.get_task(&task.id).unwrap().id, task.id);
    assert_eq!(
        fs::read_to_string(task_path(&reopened, &project.id, &task.id)).unwrap(),
        task_markdown
    );

    fs::remove_file(runtime_state).unwrap();
    let reopened_without_runtime = Store::new(&root).unwrap();
    assert_eq!(
        reopened_without_runtime
            .get_task(&task.id)
            .unwrap()
            .description,
        task.description
    );
}

#[test]
fn backup_restore_round_trip_preserves_ids_and_canonical_markdown() {
    let root = temp_root("backup-roundtrip");
    let store = Store::new(&root).unwrap();
    let project = store.create_project("Backup round-trip").unwrap();
    let task = store
        .create_task(CreateTask {
            project_id: project.id.clone(),
            description: "Исходное содержимое backup".into(),
            urgency: Urgency::Urgent,
            source: None,
        })
        .unwrap();
    let project_path = root.join("projects").join(&project.id).join("project.md");
    let task_path = task_path(&store, &project.id, &task.id);
    let project_markdown = fs::read_to_string(&project_path).unwrap();
    let task_markdown = fs::read_to_string(&task_path).unwrap();
    let archive = temp_root("backup-archive").with_extension("zip");

    store.create_backup(&archive).unwrap();
    fs::write(
        &task_path,
        task_markdown.replace("Исходное", "Повреждённое"),
    )
    .unwrap();
    store.restore_backup(&archive).unwrap();

    let restored_project = store.get_project(&project.id).unwrap();
    let restored_task = store.get_task(&task.id).unwrap();
    assert_eq!(restored_project.id, project.id);
    assert_eq!(restored_task.id, task.id);
    assert_eq!(fs::read_to_string(project_path).unwrap(), project_markdown);
    assert_eq!(fs::read_to_string(task_path).unwrap(), task_markdown);
    let _ = fs::remove_file(archive);
}

#[test]
fn backup_excludes_runtime_and_sensitive_integration_files() {
    let root = temp_root("backup-portability");
    let store = Store::new(&root).unwrap();
    let project = store.create_project("Portable backup").unwrap();
    store
        .create_task(CreateTask {
            project_id: project.id,
            description: "Данные пользователя".into(),
            urgency: Urgency::Normal,
            source: None,
        })
        .unwrap();
    let integrations = root.join("integrations");
    fs::create_dir_all(integrations.join("github")).unwrap();
    fs::write(integrations.join("telegram-sync.json"), b"runtime").unwrap();
    fs::write(integrations.join("credentials.json"), b"credential").unwrap();
    fs::write(
        integrations.join("github").join("access-token.txt"),
        b"token",
    )
    .unwrap();
    fs::write(integrations.join("github").join("client.pem"), b"key").unwrap();
    fs::write(integrations.join("portable-state.json"), b"portable").unwrap();
    let archive_path = temp_root("portable-archive").with_extension("zip");

    store.create_backup(&archive_path).unwrap();
    let file = fs::File::open(&archive_path).unwrap();
    let mut archive = ZipArchive::new(file).unwrap();
    let mut names = Vec::new();
    for index in 0..archive.len() {
        names.push(archive.by_index(index).unwrap().name().to_owned());
    }

    assert!(
        names
            .iter()
            .any(|name| name == "integrations/portable-state.json")
    );
    assert!(
        !names
            .iter()
            .any(|name| name == "integrations/telegram-sync.json")
    );
    assert!(!names.iter().any(|name| name.contains("credentials")));
    assert!(!names.iter().any(|name| name.contains("access-token")));
    assert!(!names.iter().any(|name| name.ends_with(".pem")));
    let _ = fs::remove_file(archive_path);
}

#[test]
fn invalid_utf8_and_corrupt_metadata_fail_without_rewriting_canonical_file() {
    let root = temp_root("invalid-markdown");
    let store = Store::new(&root).unwrap();
    let project = store.create_project("Invalid Markdown").unwrap();
    let task = store
        .create_task(CreateTask {
            project_id: project.id.clone(),
            description: "Исходная задача".into(),
            urgency: Urgency::Normal,
            source: None,
        })
        .unwrap();
    let path = task_path(&store, &project.id, &task.id);

    let invalid_utf8 = b"---\nid: invalid\n---\n\xff\xfe";
    fs::write(&path, invalid_utf8).unwrap();
    assert!(matches!(
        store.get_task(&task.id),
        Err(StoreError::InvalidFile { .. })
    ));
    assert_eq!(fs::read(&path).unwrap(), invalid_utf8);

    let corrupt_yaml = b"---\nid: [unterminated\n---\nbody";
    fs::write(&path, corrupt_yaml).unwrap();
    assert!(matches!(
        store.get_task(&task.id),
        Err(StoreError::InvalidFile { .. }) | Err(StoreError::Yaml(_))
    ));
    assert_eq!(fs::read(&path).unwrap(), corrupt_yaml);
}

#[test]
fn concurrent_store_edits_serialize_and_one_stale_writer_conflicts() {
    let root = temp_root("concurrent-edit");
    let store = Store::new(&root).unwrap();
    let project = store.create_project("Concurrent edits").unwrap();
    let task = store
        .create_task(CreateTask {
            project_id: project.id.clone(),
            description: "Базовая версия".into(),
            urgency: Urgency::Normal,
            source: None,
        })
        .unwrap();
    let barrier = Arc::new(Barrier::new(3));
    let mut workers = Vec::new();
    for description in ["Из GUI", "Из MCP"] {
        let root = root.clone();
        let task_id = task.id.clone();
        let version = task.version.clone();
        let barrier = Arc::clone(&barrier);
        workers.push(thread::spawn(move || {
            let store = Store::new(root).unwrap();
            barrier.wait();
            store.update_task(
                &task_id,
                TaskPatch {
                    description: Some(description.into()),
                    ..TaskPatch::default()
                },
                &version,
            )
        }));
    }
    barrier.wait();
    let outcomes = workers
        .into_iter()
        .map(|worker| worker.join().unwrap())
        .collect::<Vec<_>>();

    assert_eq!(outcomes.iter().filter(|result| result.is_ok()).count(), 1);
    assert_eq!(
        outcomes
            .iter()
            .filter(|result| matches!(result, Err(StoreError::Conflict)))
            .count(),
        1
    );
    let winner = outcomes.into_iter().find_map(Result::ok).unwrap();
    let reopened = Store::new(&root).unwrap();
    assert_eq!(reopened.get_task(&task.id).unwrap(), winner);
}

#[test]
fn restart_finishes_migration_interrupted_after_root_rename() {
    let root = temp_root("interrupted-migration");
    let store = Store::new(&root).unwrap();
    let project = store.create_project("Interrupted migration").unwrap();
    let task = store
        .create_task(CreateTask {
            project_id: project.id.clone(),
            description: "Сохранить данные".into(),
            urgency: Urgency::Important,
            source: None,
        })
        .unwrap();
    drop(store);

    let projects = root.join("projects");
    let project_dir = projects.join(&project.id);
    fs::rename(project_dir.join("project.md"), project_dir.join("chat.md")).unwrap();
    let task_path = project_dir.join("tasks").join(format!("{}.md", task.id));
    let legacy = fs::read_to_string(&task_path)
        .unwrap()
        .replace("project_id:", "chat_id:");
    fs::write(&task_path, legacy).unwrap();

    // This is the durable state left by a crash after `chats -> projects`,
    // before per-project documents were rewritten.
    let reopened = Store::new(&root).unwrap();
    assert_eq!(reopened.get_project(&project.id).unwrap().id, project.id);
    assert_eq!(reopened.get_task(&task.id).unwrap().project_id, project.id);
    assert!(project_dir.join("project.md").is_file());
    assert!(!project_dir.join("chat.md").exists());
    assert!(
        fs::read_to_string(task_path)
            .unwrap()
            .contains("project_id:")
    );
}
