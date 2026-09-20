use std::{env, fs, time::Instant};

use flood_core::{
    AgentRunPatch, AgentRunState, ContextBuilder, CreateTask, Store, TaskPatch, Urgency,
    WorkAction, WorkPurpose,
};
use serde_json::json;
use ulid::Ulid;

fn elapsed_ms(started: Instant) -> u128 {
    started.elapsed().as_millis()
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let root = env::temp_dir().join(format!("flood-performance-{}", Ulid::new()));

    let store = Store::new(&root)?;
    let project = store.create_project("Performance fixture")?;

    for index in 0..1_100 {
        store.create_task(CreateTask {
            project_id: project.id.clone(),
            description: format!("# Задача {index}\n\nКонтрольный текст fixture-{index}"),
            urgency: Urgency::Normal,
            source: None,
        })?;
    }

    let started = Instant::now();
    let tasks = store.list_tasks(Some(&project.id), true)?;
    let task_list_1100_ms = elapsed_ms(started);

    let started = Instant::now();
    let query = "fixture-1099";
    let search_hits = tasks
        .iter()
        .filter(|task| task.description.contains(query))
        .count();
    let search_1100_ms = elapsed_ms(started);

    let target = store.get_task(&tasks[0].id)?;
    let started = Instant::now();
    let saved = store.update_task(
        &target.id,
        TaskPatch {
            description: Some(format!("{}\n\nСохранено", target.description)),
            ..TaskPatch::default()
        },
        &target.version,
    )?;
    let save_with_conflict_check_ms = elapsed_ms(started);
    let conflict_detected = store
        .update_task(
            &target.id,
            TaskPatch {
                description: Some("# Устаревшая запись".into()),
                ..TaskPatch::default()
            },
            &target.version,
        )
        .is_err();

    let started = Instant::now();
    let _packet = ContextBuilder::new(&store).for_task(
        &saved.id,
        WorkPurpose::Execute,
        vec![
            WorkAction::ReadProjectContext,
            WorkAction::ModifyProjectFiles,
        ],
    )?;
    let context_compile_ms = elapsed_ms(started);

    for index in 0..100 {
        let run = store.create_agent_run(&tasks[index + 1].id, &root)?;
        if index % 2 == 0 {
            store.update_agent_run(
                &run.id,
                AgentRunPatch {
                    state: Some(AgentRunState::Cancelled),
                    ..AgentRunPatch::default()
                },
            )?;
        }
    }
    let started = Instant::now();
    let runs = store.list_agent_runs(false)?;
    let agent_queue_100_ms = elapsed_ms(started);

    drop(store);
    let started = Instant::now();
    let store = Store::new(&root)?;
    let startup_ms = elapsed_ms(started);
    let started = Instant::now();
    let reopened_project = store.get_project(&project.id)?;
    let reopened_tasks = store.list_tasks(Some(&reopened_project.id), true)?;
    let open_project_1100_ms = elapsed_ms(started);

    let result = json!({
        "schema_version": 1,
        "fixture": { "tasks": tasks.len(), "agent_runs": runs.len() },
        "measurements_ms": {
            "startup": startup_ms,
            "open_project_1100": open_project_1100_ms,
            "task_list_1100": task_list_1100_ms,
            "search_1100": search_1100_ms,
            "save_with_conflict_check": save_with_conflict_check_ms,
            "context_compile": context_compile_ms,
            "agent_queue_100": agent_queue_100_ms
        },
        "facts": {
            "search_hits": search_hits,
            "conflict_detected": conflict_detected,
            "reopened_tasks": reopened_tasks.len()
        }
    });
    println!("{}", serde_json::to_string(&result)?);
    fs::remove_dir_all(root)?;
    Ok(())
}
