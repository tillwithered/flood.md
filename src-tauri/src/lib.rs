use flood_core::{
    CreateTask, InboxCandidateStatus, Project, SelfCheckResult, SourceMedia, SourceMediaKind,
    Store, StoreDiagnostics, Task, TaskPatch, TaskSummary, TelegramInboxCandidate,
    TelegramProjectLink, Urgency, default_data_dir,
};
use notify::{RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use std::{
    fs,
    path::PathBuf,
    process::Command,
    sync::{
        Mutex,
        atomic::{AtomicBool, Ordering},
    },
};
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_opener::OpenerExt;

mod telegram;
use telegram::{TelegramChat, TelegramManager, TelegramMessage, TelegramStatus};

struct AppState {
    store: Store,
    _watcher: Mutex<RecommendedWatcher>,
    telegram: TelegramManager,
    telegram_media_syncing: AtomicBool,
}

#[derive(Serialize)]
struct TelegramTaskCreationResult {
    task: Task,
    media_errors: Vec<String>,
}

#[derive(Serialize)]
struct TelegramMediaSyncResult {
    downloaded: usize,
    failed: usize,
}

#[derive(Serialize)]
struct McpRuntimeInfo {
    executable_path: String,
    available: bool,
    version: Option<String>,
    app_version: String,
    compatible: bool,
    source: &'static str,
}

struct MediaSyncGuard<'a>(&'a AtomicBool);

impl Drop for MediaSyncGuard<'_> {
    fn drop(&mut self) {
        self.0.store(false, Ordering::Release);
    }
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
fn set_project_telegram_chats(
    id: String,
    telegram_chats: Vec<TelegramProjectLink>,
    expected_version: String,
    state: State<'_, AppState>,
) -> Result<Project, String> {
    result(
        state
            .store
            .set_project_telegram_chats(&id, telegram_chats, &expected_version),
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
fn open_task_attachment(
    id: String,
    relative_path: String,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<(), String> {
    let path = result(state.store.resolve_task_attachment(&id, &relative_path))?;
    app.opener()
        .open_path(path.to_string_lossy().into_owned(), None::<String>)
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn open_data_directory(state: State<'_, AppState>, app: AppHandle) -> Result<(), String> {
    app.opener()
        .open_path(
            state.store.root().to_string_lossy().into_owned(),
            None::<String>,
        )
        .map_err(|error| error.to_string())
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
    Ok(resolve_mcp_executable(&app)?
        .0
        .to_string_lossy()
        .into_owned())
}

fn resolve_mcp_executable(app: &tauri::AppHandle) -> Result<(PathBuf, &'static str), String> {
    let bundled = app
        .path()
        .resource_dir()
        .map_err(|error| error.to_string())?
        .join("flood-mcp.exe");
    if bundled.is_file() {
        return Ok((bundled, "bundled"));
    }

    if cfg!(debug_assertions) {
        let development = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .unwrap_or_else(|| std::path::Path::new(env!("CARGO_MANIFEST_DIR")))
            .join("target")
            .join("debug")
            .join("flood-mcp.exe");
        return Ok((development, "development"));
    }

    Ok((bundled, "bundled"))
}

#[tauri::command]
fn mcp_runtime_info(app: tauri::AppHandle) -> Result<McpRuntimeInfo, String> {
    let (executable, source) = resolve_mcp_executable(&app)?;
    let available = executable.is_file();
    let version = available
        .then(|| {
            Command::new(&executable)
                .arg("--version")
                .output()
                .ok()
                .filter(|output| output.status.success())
                .and_then(|output| String::from_utf8(output.stdout).ok())
                .map(|value| value.trim().to_owned())
                .filter(|value| !value.is_empty())
        })
        .flatten();
    let app_version = app.package_info().version.to_string();
    let compatible = version.as_deref() == Some(app_version.as_str());
    Ok(McpRuntimeInfo {
        executable_path: executable
            .to_string_lossy()
            .trim_start_matches(r"\\?\")
            .to_owned(),
        available,
        version,
        app_version,
        compatible,
        source,
    })
}

#[tauri::command]
fn diagnose_store(state: State<'_, AppState>) -> StoreDiagnostics {
    state.store.diagnostics()
}

#[tauri::command]
fn run_mcp_self_check(app: tauri::AppHandle) -> Result<SelfCheckResult, String> {
    let (executable, _) = resolve_mcp_executable(&app)?;
    if !executable.is_file() {
        return Err("MCP-сервер не найден в установленной сборке".into());
    }
    let output = Command::new(&executable)
        .arg("--self-check")
        .output()
        .map_err(|error| format!("не удалось запустить MCP-сервер: {error}"))?;
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_owned());
    }
    serde_json::from_slice(&output.stdout)
        .map_err(|error| format!("MCP-сервер вернул некорректный результат: {error}"))
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
async fn telegram_search_chats(
    query: String,
    limit: i32,
    state: State<'_, AppState>,
) -> Result<Vec<TelegramChat>, String> {
    state.telegram.search_chats(query, limit).await
}

#[tauri::command]
async fn telegram_list_messages(
    chat_id: i64,
    limit: i32,
    project_id: Option<String>,
    state: State<'_, AppState>,
) -> Result<Vec<TelegramMessage>, String> {
    let mut messages = state.telegram.messages(chat_id, limit).await?;
    if let Some(project_id) = project_id {
        let message_groups = messages
            .iter()
            .map(|message| message.message_ids.clone())
            .collect::<Vec<_>>();
        let linked_tasks = result(state.store.telegram_tasks_for_messages(
            &project_id,
            chat_id,
            &message_groups,
        ))?;
        for (message, linked_task) in messages.iter_mut().zip(linked_tasks) {
            message.linked_task = linked_task;
        }
    }
    Ok(messages)
}

#[tauri::command]
fn telegram_list_inbox(
    project_id: Option<String>,
    include_processed: bool,
    state: State<'_, AppState>,
) -> Result<Vec<TelegramInboxCandidate>, String> {
    result(
        state
            .store
            .list_telegram_inbox(project_id.as_deref(), include_processed),
    )
}

#[tauri::command]
async fn telegram_refresh_inbox(
    project_id: String,
    limit_per_chat: i32,
    state: State<'_, AppState>,
) -> Result<Vec<TelegramInboxCandidate>, String> {
    let project = result(state.store.get_project(&project_id))?;
    let candidates = state
        .telegram
        .refresh_candidates(&project, limit_per_chat)
        .await?;
    result(state.store.upsert_telegram_candidates(candidates))?;
    result(state.store.list_telegram_inbox(Some(&project_id), false))
}

#[tauri::command]
async fn telegram_refresh_all_inboxes(state: State<'_, AppState>) -> Result<usize, String> {
    let projects = result(state.store.list_projects())?;
    let mut added = 0;
    let mut first_error = None;
    let mut scanned = 0;
    for project in projects
        .into_iter()
        .filter(|project| !project.telegram_chats.is_empty())
    {
        match state.telegram.refresh_candidates(&project, 40).await {
            Ok(candidates) => {
                scanned += 1;
                added += result(state.store.upsert_telegram_candidates(candidates))?;
            }
            Err(error) => {
                first_error.get_or_insert(error);
            }
        };
    }
    if scanned == 0
        && let Some(error) = first_error
    {
        return Err(error);
    }
    Ok(added)
}

#[tauri::command]
async fn telegram_add_inbox_message(
    project_id: String,
    chat_id: i64,
    message_id: Option<i64>,
    message_ids: Option<Vec<i64>>,
    state: State<'_, AppState>,
) -> Result<TelegramInboxCandidate, String> {
    let project = result(state.store.get_project(&project_id))?;
    let link = project
        .telegram_chats
        .iter()
        .find(|link| link.chat_id == chat_id)
        .ok_or_else(|| "Этот Telegram-чат не связан с проектом".to_string())?;
    let candidate = state
        .telegram
        .manual_candidate(
            &project_id,
            link,
            &message_ids
                .filter(|ids| !ids.is_empty())
                .or_else(|| message_id.map(|id| vec![id]))
                .ok_or_else(|| "Сообщение Telegram не выбрано".to_string())?,
        )
        .await?;
    result(
        state
            .store
            .upsert_telegram_candidates(vec![candidate.clone()]),
    )?;
    Ok(candidate)
}

#[tauri::command]
fn telegram_set_candidate_status(
    candidate_id: String,
    status: InboxCandidateStatus,
    state: State<'_, AppState>,
) -> Result<TelegramInboxCandidate, String> {
    result(
        state
            .store
            .set_telegram_candidate_status(&candidate_id, status),
    )
}

#[tauri::command]
async fn telegram_create_task_from_candidate(
    candidate_id: String,
    description: Option<String>,
    urgency: Urgency,
    state: State<'_, AppState>,
) -> Result<TelegramTaskCreationResult, String> {
    let task = result(state.store.create_task_from_telegram_candidate(
        &candidate_id,
        description.as_deref(),
        urgency,
    ))?;
    let (task, media_errors) = download_all_task_source_media(&state, task).await;
    Ok(TelegramTaskCreationResult { task, media_errors })
}

fn source_media_markdown(media: &SourceMedia) -> Option<String> {
    let path = media.relative_path.as_deref()?;
    let label = media
        .file_name
        .replace(['[', ']', '\r', '\n'], " ")
        .trim()
        .to_owned();
    Some(if media.kind == SourceMediaKind::Photo {
        format!("![{label}]({path})")
    } else {
        format!("[{label}]({path})")
    })
}

fn description_with_source_media(description: &str, media: &SourceMedia) -> Option<String> {
    let relative_path = media.relative_path.as_deref()?;
    if description.contains(&format!("]({relative_path})")) {
        return None;
    }
    source_media_markdown(media).map(|markdown| format!("{}\n\n{markdown}", description.trim_end()))
}

async fn download_task_source_media(
    state: &AppState,
    task_id: &str,
    media_index: usize,
) -> Result<Task, String> {
    let mut task = result(state.store.get_task(task_id))?;
    let media = task
        .source
        .as_ref()
        .and_then(|source| source.media.get(media_index))
        .cloned()
        .ok_or_else(|| "Медиафайл источника не найден".to_string())?;
    if let Some(relative_path) = media.relative_path.as_deref()
        && task.description.contains(&format!("]({relative_path})"))
    {
        return Ok(task);
    }
    let relative_path = if let Some(path) = media.relative_path.clone() {
        path
    } else {
        if media.size.is_some_and(|size| size > 25 * 1024 * 1024) {
            return Err("Медиафайл больше допустимых 25 МБ".into());
        }
        let file_id = media
            .provider_file_id
            .ok_or_else(|| "У медиафайла нет идентификатора Telegram".to_string())?;
        let downloaded = state.telegram.download_file(file_id).await?;
        let bytes = (|| {
            let actual_size = fs::metadata(&downloaded)
                .map_err(|error| error.to_string())?
                .len();
            if actual_size > 25 * 1024 * 1024 {
                return Err("Медиафайл больше допустимых 25 МБ".into());
            }
            fs::read(&downloaded).map_err(|error| error.to_string())
        })();
        state.telegram.release_downloaded_file(file_id).await;
        let bytes = bytes?;
        result(
            state
                .store
                .save_task_attachment(task_id, &media.file_name, &bytes),
        )?
    };
    let mut source = task
        .source
        .take()
        .ok_or_else(|| "Источник задачи не найден".to_string())?;
    source.media[media_index].relative_path = Some(relative_path.clone());
    let description = description_with_source_media(&task.description, &source.media[media_index]);
    result(state.store.update_task(
        task_id,
        TaskPatch {
            source: Some(Some(source)),
            description,
            ..TaskPatch::default()
        },
        &task.version,
    ))
}

async fn download_all_task_source_media(state: &AppState, mut task: Task) -> (Task, Vec<String>) {
    let media_count = task
        .source
        .as_ref()
        .map(|source| source.media.len())
        .unwrap_or_default();
    let mut media_errors = Vec::new();
    for index in 0..media_count {
        match download_task_source_media(state, &task.id, index).await {
            Ok(updated) => task = updated,
            Err(error) => media_errors.push(error),
        }
    }
    (task, media_errors)
}

#[tauri::command]
async fn telegram_download_source_media(
    task_id: String,
    media_index: usize,
    state: State<'_, AppState>,
) -> Result<Task, String> {
    download_task_source_media(&state, &task_id, media_index).await
}

#[tauri::command]
async fn telegram_sync_task_media(
    state: State<'_, AppState>,
) -> Result<TelegramMediaSyncResult, String> {
    if state
        .telegram_media_syncing
        .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
        .is_err()
    {
        return Ok(TelegramMediaSyncResult {
            downloaded: 0,
            failed: 0,
        });
    }
    let _guard = MediaSyncGuard(&state.telegram_media_syncing);
    let tasks = result(state.store.list_tasks(None, true))?;
    let mut downloaded = 0;
    let mut failed = 0;
    for summary in tasks {
        let task = result(state.store.get_task(&summary.id))?;
        let missing = task
            .source
            .as_ref()
            .filter(|source| source.provider.as_deref() == Some("telegram"))
            .map(|source| {
                source
                    .media
                    .iter()
                    .enumerate()
                    .filter_map(|(index, media)| media.relative_path.is_none().then_some(index))
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        for index in missing {
            match download_task_source_media(&state, &task.id, index).await {
                Ok(_) => downloaded += 1,
                Err(_) => failed += 1,
            }
        }
    }
    Ok(TelegramMediaSyncResult { downloaded, failed })
}

#[tauri::command]
async fn telegram_disconnect(state: State<'_, AppState>) -> Result<(), String> {
    state.telegram.disconnect().await
}

#[tauri::command]
async fn telegram_reset_database(state: State<'_, AppState>) -> Result<(), String> {
    state.telegram.reset_database().await
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
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
            let telegram_root = std::env::var_os("FLOOD_TELEGRAM_DIR")
                .map(PathBuf::from)
                .unwrap_or(app.path().app_local_data_dir()?.join("telegram"));
            let telegram = TelegramManager::new(app.handle().clone(), telegram_root);
            app.manage(AppState {
                store,
                _watcher: Mutex::new(watcher),
                telegram,
                telegram_media_syncing: AtomicBool::new(false),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_projects,
            create_project,
            update_project,
            set_project_telegram_chats,
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
            open_task_attachment,
            open_data_directory,
            data_directory,
            create_backup,
            restore_backup,
            mcp_executable_path,
            mcp_runtime_info,
            diagnose_store,
            run_mcp_self_check,
            telegram_status,
            telegram_configure,
            telegram_request_qr,
            telegram_submit_phone,
            telegram_submit_code,
            telegram_submit_password,
            telegram_list_chats,
            telegram_search_chats,
            telegram_list_messages,
            telegram_list_inbox,
            telegram_refresh_inbox,
            telegram_refresh_all_inboxes,
            telegram_add_inbox_message,
            telegram_set_candidate_status,
            telegram_create_task_from_candidate,
            telegram_download_source_media,
            telegram_sync_task_media,
            telegram_disconnect,
            telegram_reset_database
        ])
        .run(tauri::generate_context!())
        .expect("не удалось запустить flood.md");
}

#[cfg(test)]
mod tests {
    use super::description_with_source_media;
    use flood_core::{SourceMedia, SourceMediaKind};

    #[test]
    fn downloaded_telegram_media_is_inserted_once_into_task_markdown() {
        let photo = SourceMedia {
            kind: SourceMediaKind::Photo,
            file_name: "album-one.jpg".into(),
            provider_file_id: Some(10),
            mime_type: Some("image/jpeg".into()),
            size: Some(2048),
            relative_path: Some("attachments/album-one.jpg".into()),
        };
        let description = description_with_source_media("Подготовить отчёт", &photo).unwrap();
        assert_eq!(
            description,
            "Подготовить отчёт\n\n![album-one.jpg](attachments/album-one.jpg)"
        );
        assert!(description_with_source_media(&description, &photo).is_none());
    }
}
