use flood_core::{Chat, CreateTask, Store, Task, TaskPatch, TaskSummary, default_data_dir};
use notify::{RecommendedWatcher, RecursiveMode, Watcher};
use std::sync::Mutex;
use tauri::{Emitter, Manager, State};

struct AppState {
    store: Store,
    _watcher: Mutex<RecommendedWatcher>,
}

fn result<T>(value: Result<T, flood_core::StoreError>) -> Result<T, String> {
    value.map_err(|error| error.to_string())
}

#[tauri::command]
fn list_chats(state: State<'_, AppState>) -> Result<Vec<Chat>, String> {
    result(state.store.list_chats())
}

#[tauri::command]
fn create_chat(title: String, state: State<'_, AppState>) -> Result<Chat, String> {
    result(state.store.create_chat(&title))
}

#[tauri::command]
fn update_chat(
    id: String,
    title: String,
    expected_version: String,
    state: State<'_, AppState>,
) -> Result<Chat, String> {
    result(state.store.update_chat(&id, &title, &expected_version))
}

#[tauri::command]
fn delete_chat(
    id: String,
    expected_version: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    result(state.store.delete_chat(&id, &expected_version))
}

#[tauri::command]
fn list_tasks(
    chat_id: Option<String>,
    include_completed: bool,
    state: State<'_, AppState>,
) -> Result<Vec<TaskSummary>, String> {
    result(
        state
            .store
            .list_tasks(chat_id.as_deref(), include_completed),
    )
}

#[tauri::command]
fn get_task(id: String, state: State<'_, AppState>) -> Result<Task, String> {
    result(state.store.get_task(&id))
}

#[tauri::command]
fn list_trashed_tasks(state: State<'_, AppState>) -> Result<Vec<TaskSummary>, String> {
    result(state.store.list_trashed_tasks())
}

#[tauri::command]
fn create_task(input: CreateTask, state: State<'_, AppState>) -> Result<Task, String> {
    result(state.store.create_task(input))
}

#[tauri::command]
fn update_task(
    id: String,
    patch: TaskPatch,
    expected_version: String,
    state: State<'_, AppState>,
) -> Result<Task, String> {
    result(state.store.update_task(&id, patch, &expected_version))
}

#[tauri::command]
fn complete_task(
    id: String,
    expected_version: String,
    state: State<'_, AppState>,
) -> Result<Task, String> {
    result(state.store.complete_task(&id, &expected_version))
}

#[tauri::command]
fn clear_task_source(
    id: String,
    expected_version: String,
    state: State<'_, AppState>,
) -> Result<Task, String> {
    result(state.store.clear_task_source(&id, &expected_version))
}

#[tauri::command]
fn move_task(
    id: String,
    chat_id: String,
    expected_version: String,
    state: State<'_, AppState>,
) -> Result<Task, String> {
    result(state.store.move_task(&id, &chat_id, &expected_version))
}

#[tauri::command]
fn trash_task(
    id: String,
    expected_version: String,
    state: State<'_, AppState>,
) -> Result<Task, String> {
    result(state.store.trash_task(&id, &expected_version))
}

#[tauri::command]
fn restore_task(
    id: String,
    expected_version: String,
    state: State<'_, AppState>,
) -> Result<Task, String> {
    result(state.store.restore_task(&id, &expected_version))
}

#[tauri::command]
fn delete_trashed_task(
    id: String,
    expected_version: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    result(state.store.delete_trashed_task(&id, &expected_version))
}

#[tauri::command]
fn empty_trash(state: State<'_, AppState>) -> Result<usize, String> {
    result(state.store.empty_trash())
}

#[tauri::command]
fn save_task_attachment(
    id: String,
    file_name: String,
    bytes: Vec<u8>,
    state: State<'_, AppState>,
) -> Result<String, String> {
    result(state.store.save_task_attachment(&id, &file_name, &bytes))
}

#[tauri::command]
fn resolve_task_attachment(
    id: String,
    relative_path: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    result(
        state
            .store
            .resolve_task_attachment(&id, &relative_path)
            .map(|path| path.to_string_lossy().into_owned()),
    )
}

#[tauri::command]
fn read_task_attachment(
    id: String,
    relative_path: String,
    state: State<'_, AppState>,
) -> Result<tauri::ipc::Response, String> {
    result(
        state
            .store
            .read_task_attachment(&id, &relative_path)
            .map(tauri::ipc::Response::new),
    )
}

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let root = default_data_dir();
            let store = Store::new(&root)?;
            let handle = app.handle().clone();
            let mut watcher =
                notify::recommended_watcher(move |event: notify::Result<notify::Event>| {
                    if event.is_ok() {
                        let _ = handle.emit("data-changed", ());
                    }
                })?;
            watcher.watch(store.root(), RecursiveMode::Recursive)?;
            app.manage(AppState {
                store,
                _watcher: Mutex::new(watcher),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_chats,
            create_chat,
            update_chat,
            delete_chat,
            list_tasks,
            get_task,
            list_trashed_tasks,
            create_task,
            update_task,
            complete_task,
            clear_task_source,
            move_task,
            trash_task,
            restore_task,
            delete_trashed_task,
            empty_trash,
            save_task_attachment,
            resolve_task_attachment,
            read_task_attachment
        ])
        .run(tauri::generate_context!())
        .expect("не удалось запустить flood.md");
}
