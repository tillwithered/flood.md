use flood_core::{CreateTask, Project, Store, Task, TaskPatch, TaskSummary, default_data_dir};
use notify::{RecommendedWatcher, RecursiveMode, Watcher};
use std::{path::PathBuf, sync::Mutex};
use tauri::{Emitter, Manager, State};

mod telegram;
use telegram::{TelegramChat, TelegramManager, TelegramMessage, TelegramStatus};

struct AppState {
    store: Store,
    _watcher: Mutex<RecommendedWatcher>,
    telegram: TelegramManager,
}

fn result<T>(value: Result<T, flood_core::StoreError>) -> Result<T, String> {
    value.map_err(|error| error.to_string())
}

#[tauri::command]
fn list_projects(state: State<'_, AppState>) -> Result<Vec<Project>, String> {
    result(state.store.list_projects())
}

#[tauri::command]
fn create_project(title: String, state: State<'_, AppState>) -> Result<Project, String> {
    result(state.store.create_project(&title))
}

#[tauri::command]
fn update_project(
    id: String,
    title: String,
    expected_version: String,
    state: State<'_, AppState>,
) -> Result<Project, String> {
    result(state.store.update_project(&id, &title, &expected_version))
}

#[tauri::command]
fn set_project_telegram(
    id: String,
    telegram: Option<flood_core::TelegramProjectLink>,
    expected_version: String,
    state: State<'_, AppState>,
) -> Result<Project, String> {
    result(
        state
            .store
            .set_project_telegram(&id, telegram, &expected_version),
    )
}

#[tauri::command]
fn delete_project(
    id: String,
    expected_version: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    result(state.store.delete_project(&id, &expected_version))
}

#[tauri::command]
fn list_tasks(
    project_id: Option<String>,
    include_completed: bool,
    state: State<'_, AppState>,
) -> Result<Vec<TaskSummary>, String> {
    result(
        state
            .store
            .list_tasks(project_id.as_deref(), include_completed),
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
    project_id: String,
    expected_version: String,
    state: State<'_, AppState>,
) -> Result<Task, String> {
    result(state.store.move_task(&id, &project_id, &expected_version))
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

#[tauri::command]
fn data_directory() -> String {
    default_data_dir().to_string_lossy().into_owned()
}

#[tauri::command]
fn create_backup(destination: String, state: State<'_, AppState>) -> Result<(), String> {
    result(state.store.create_backup(&PathBuf::from(destination)))
}

#[tauri::command]
fn restore_backup(source: String, state: State<'_, AppState>) -> Result<(), String> {
    result(state.store.restore_backup(&PathBuf::from(source)))
}

#[tauri::command]
fn mcp_executable_path(app: tauri::AppHandle) -> Result<String, String> {
    let executable = app
        .path()
        .resource_dir()
        .map_err(|error| error.to_string())?
        .join("flood-mcp.exe");
    Ok(executable
        .to_string_lossy()
        .trim_start_matches(r"\\?\")
        .to_owned())
}

#[tauri::command]
fn telegram_status(state: State<'_, AppState>) -> TelegramStatus {
    state.telegram.status()
}

#[tauri::command]
fn telegram_configure(
    api_id: i32,
    api_hash: String,
    state: State<'_, AppState>,
) -> Result<TelegramStatus, String> {
    state.telegram.configure(api_id, api_hash)
}

#[tauri::command]
async fn telegram_request_qr(state: State<'_, AppState>) -> Result<(), String> {
    state.telegram.request_qr().await
}

#[tauri::command]
async fn telegram_submit_phone(phone: String, state: State<'_, AppState>) -> Result<(), String> {
    state.telegram.submit_phone(phone).await
}

#[tauri::command]
async fn telegram_submit_code(code: String, state: State<'_, AppState>) -> Result<(), String> {
    state.telegram.submit_code(code).await
}

#[tauri::command]
async fn telegram_submit_password(
    password: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state.telegram.submit_password(password).await
}

#[tauri::command]
async fn telegram_list_chats(state: State<'_, AppState>) -> Result<Vec<TelegramChat>, String> {
    state.telegram.chats().await
}

#[tauri::command]
async fn telegram_list_messages(
    chat_id: i64,
    limit: i32,
    state: State<'_, AppState>,
) -> Result<Vec<TelegramMessage>, String> {
    state.telegram.messages(chat_id, limit).await
}

#[tauri::command]
async fn telegram_disconnect(state: State<'_, AppState>) -> Result<(), String> {
    state.telegram.disconnect().await
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
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
            let telegram = TelegramManager::new(
                app.handle().clone(),
                app.path().app_local_data_dir()?.join("telegram"),
            );
            app.manage(AppState {
                store,
                _watcher: Mutex::new(watcher),
                telegram,
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_projects,
            create_project,
            update_project,
            set_project_telegram,
            delete_project,
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
            read_task_attachment,
            data_directory,
            create_backup,
            restore_backup,
            mcp_executable_path,
            telegram_status,
            telegram_configure,
            telegram_request_qr,
            telegram_submit_phone,
            telegram_submit_code,
            telegram_submit_password,
            telegram_list_chats,
            telegram_list_messages,
            telegram_disconnect
        ])
        .run(tauri::generate_context!())
        .expect("не удалось запустить flood.md");
}
