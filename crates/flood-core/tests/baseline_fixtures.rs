use std::{
    fs,
    path::{Path, PathBuf},
};

use flood_core::{AgentRunState, ProjectWorkspaceItemKind, Store, TaskStatus};
use ulid::Ulid;

const PROJECT_ID: &str = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
const TASK_ID: &str = "01ARZ3NDEKTSV4RRFFQ69G5FAW";
const RULE_ID: &str = "01ARZ3NDEKTSV4RRFFQ69G5FAX";
const SKILL_ID: &str = "01ARZ3NDEKTSV4RRFFQ69G5FAY";
const AGENT_RUN_ID: &str = "01ARZ3NDEKTSV4RRFFQ69G5FB0";

#[test]
fn baseline_v1_fixtures_load_through_store() {
    let fixture_root = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests")
        .join("fixtures")
        .join("baseline-v1");
    let temp_root = std::env::temp_dir().join(format!("flood-baseline-fixture-{}", Ulid::new()));
    copy_tree(&fixture_root, &temp_root);

    let result = verify_fixture(&temp_root);
    let _ = fs::remove_dir_all(&temp_root);
    result.unwrap();
}

#[test]
fn baseline_crlf_files_keep_raw_bytes_and_conflict_versions() {
    let fixture_root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/baseline-v1");
    let temp_root = std::env::temp_dir().join(format!("flood-crlf-fixture-{}", Ulid::new()));
    copy_tree(&fixture_root, &temp_root);
    let paths = [
        format!("projects/{PROJECT_ID}/project.md"),
        format!("projects/{PROJECT_ID}/tasks/{TASK_ID}.md"),
        format!("projects/{PROJECT_ID}/workspace/rules/{RULE_ID}.md"),
        format!("projects/{PROJECT_ID}/workspace/skills/{SKILL_ID}.md"),
    ];
    for path in &paths {
        let path = temp_root.join(path);
        let text = fs::read_to_string(&path).unwrap().replace("\r\n", "\n");
        fs::write(path, text).unwrap();
    }
    let store = Store::new(&temp_root).unwrap();
    let lf_version = store.get_task(TASK_ID).unwrap().version;
    let expected: Vec<_> = paths
        .iter()
        .map(|path| {
            let path = temp_root.join(path);
            let text = fs::read_to_string(&path).unwrap().replace("\n", "\r\n");
            fs::write(&path, &text).unwrap();
            (path, text.into_bytes())
        })
        .collect();
    verify_fixture(&temp_root).unwrap();
    assert_ne!(store.get_task(TASK_ID).unwrap().version, lf_version);
    for (path, bytes) in expected {
        assert_eq!(
            fs::read(path).unwrap(),
            bytes,
            "reads must not rewrite CRLF files"
        );
    }
    drop(store);
    fs::remove_dir_all(temp_root).unwrap();
}

fn verify_fixture(root: &Path) -> Result<(), Box<dyn std::error::Error>> {
    let store = Store::new(root)?;

    let project = store.get_project(PROJECT_ID)?;
    assert_eq!(project.title, "Baseline Fixture Project");
    assert_eq!(project.resources.len(), 2);
    assert!(project.resources.iter().all(|resource| {
        resource.location.starts_with("https://example.invalid/")
            && !resource.location.contains('@')
    }));

    let task = store.get_task(TASK_ID)?;
    assert_eq!(task.status, TaskStatus::Open);
    assert_eq!(task.checkpoints.len(), 1);
    let source = task
        .source
        .expect("fixture task must contain a source snapshot");
    assert_eq!(source.provider.as_deref(), Some("fixture"));
    assert_eq!(source.author.as_deref(), Some("Fixture User"));
    assert_eq!(
        source.url.as_deref(),
        Some("https://example.invalid/messages/1")
    );

    let rules =
        store.list_project_workspace_items(PROJECT_ID, Some(ProjectWorkspaceItemKind::Rule))?;
    assert_eq!(rules.len(), 1);
    assert_eq!(rules[0].id, RULE_ID);
    assert!(rules[0].agent_access);

    let skills =
        store.list_project_workspace_items(PROJECT_ID, Some(ProjectWorkspaceItemKind::Skill))?;
    assert_eq!(skills.len(), 1);
    assert_eq!(skills[0].id, SKILL_ID);
    assert!(skills[0].agent_access);

    let runs = store.list_agent_runs(false)?;
    assert_eq!(runs.len(), 1);
    assert_eq!(runs[0].id, AGENT_RUN_ID);
    assert_eq!(runs[0].task_id, TASK_ID);
    assert_eq!(runs[0].state, AgentRunState::ReadyForReview);
    assert_eq!(runs[0].provider, "fixture");

    Ok(())
}

fn copy_tree(source: &Path, destination: &Path) {
    fs::create_dir_all(destination).unwrap();
    for entry in fs::read_dir(source).unwrap() {
        let entry = entry.unwrap();
        let source_path = entry.path();
        let destination_path = destination.join(entry.file_name());
        if entry.file_type().unwrap().is_dir() {
            copy_tree(&source_path, &destination_path);
        } else {
            fs::copy(source_path, destination_path).unwrap();
        }
    }
}
