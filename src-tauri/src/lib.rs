use chrono::Utc;
use flood_core::{
    ActivityPage, AttachmentCleanupReport, AttachmentCleanupResult, CreateTask,
    InboxCandidateStatus, Project, SelfCheckResult, SourceMedia, SourceMediaKind, Store,
    StoreDiagnostics, Task, TaskPatch, TaskSummary, TelegramInboxCandidate, TelegramInboxPage,
    TelegramProjectLink, TelegramSyncHealth, TelegramSyncRequest, TelegramSyncStatus, Urgency,
    default_data_dir,
};
use notify::{RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use std::{
    fs,
    future::Future,
    path::{Path, PathBuf},
    process::{Command, Output, Stdio},
    sync::{
        Mutex,
        atomic::{AtomicBool, Ordering},
    },
    thread,
    time::{Duration, Instant},
};
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_opener::OpenerExt;

mod telegram;
use telegram::{TelegramChat, TelegramManager, TelegramMessage, TelegramStatus};

struct AppState {
    store: Store,
    _watcher: Mutex<RecommendedWatcher>,
    telegram: TelegramManager,
    telegram_inbox_syncing: AtomicBool,
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
    errors: Vec<String>,
    busy: bool,
}

#[derive(Serialize)]
struct TelegramInboxSyncResult {
    scanned_projects: usize,
    added: usize,
    failed_projects: usize,
    errors: Vec<String>,
    busy: bool,
}

#[derive(Serialize)]
struct TelegramSyncResult {
    inbox: TelegramInboxSyncResult,
    media: TelegramMediaSyncResult,
    status: Option<TelegramSyncStatus>,
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

#[derive(Serialize)]
struct InstallationRuntimeInfo {
    executable_path: String,
    directory_path: String,
    kind: &'static str,
    parallel_installed_copy: Option<String>,
}

struct SyncGuard<'a>(&'a AtomicBool);

const TELEGRAM_PROJECT_SYNC_TIMEOUT: Duration = Duration::from_secs(20);
const TELEGRAM_MEDIA_SYNC_TIMEOUT: Duration = Duration::from_secs(60);
const MCP_VERSION_TIMEOUT: Duration = Duration::from_secs(2);
const MCP_SELF_CHECK_TIMEOUT: Duration = Duration::from_secs(20);
const MCP_VERSION_OUTPUT_LIMIT: usize = 256;
const MCP_SELF_CHECK_OUTPUT_LIMIT: usize = 256 * 1024;

fn run_mcp_command(
    executable: &Path,
    argument: &str,
    timeout: Duration,
    output_limit: usize,
) -> Result<Output, String> {
    let mut command = Command::new(executable);
    command
        .arg(argument)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x0800_0000);
    }
    let mut child = command
        .spawn()
        .map_err(|error| format!("не удалось запустить MCP-сервер: {error}"))?;
    let started = Instant::now();
    loop {
        match child
            .try_wait()
            .map_err(|error| format!("не удалось проверить MCP-сервер: {error}"))?
        {
            Some(_) => {
                let output = child
                    .wait_with_output()
                    .map_err(|error| format!("не удалось прочитать ответ MCP-сервера: {error}"))?;
                if output.stdout.len() > output_limit || output.stderr.len() > output_limit {
                    return Err("MCP-сервер вернул слишком большой ответ".into());
                }
                return Ok(output);
            }
            None if started.elapsed() >= timeout => {
                let _ = child.kill();
                let _ = child.wait();
                return Err(format!(
                    "MCP-сервер не ответил за {} с и был остановлен",
                    timeout.as_secs()
                ));
            }
            None => thread::sleep(Duration::from_millis(20)),
        }
    }
}

async fn with_telegram_timeout<T>(
    future: impl Future<Output = Result<T, String>>,
) -> Result<T, String> {
    tokio::time::timeout(TELEGRAM_PROJECT_SYNC_TIMEOUT, future)
        .await
        .map_err(|_| "Telegram не ответил за 20 секунд".to_string())?
}

impl Drop for SyncGuard<'_> {
    fn drop(&mut self) {
        self.0.store(false, Ordering::Release);
    }
}

fn result<T>(value: Result<T, flood_core::StoreError>) -> Result<T, String> {
    value.map_err(|error| error.to_string())
}

fn paths_match(left: &std::path::Path, right: &std::path::Path) -> bool {
    match (left.canonicalize(), right.canonicalize()) {
        (Ok(left), Ok(right)) => left == right,
        _ => left == right,
    }
}

fn expected_windows_install_executable() -> Option<PathBuf> {
    #[cfg(windows)]
    {
        Some(
            PathBuf::from(std::env::var_os("LOCALAPPDATA")?)
                .join("flood.md")
                .join("flood-desktop.exe"),
        )
    }
    #[cfg(not(windows))]
    {
        None
    }
}

fn classify_installation(
    executable: &std::path::Path,
    expected_install: Option<&std::path::Path>,
    development: bool,
) -> (&'static str, Option<PathBuf>) {
    let is_installed = expected_install.is_some_and(|expected| paths_match(executable, expected));
    let parallel_installed_copy = expected_install
        .filter(|expected| expected.is_file() && !paths_match(executable, expected))
        .map(std::path::Path::to_path_buf);
    let kind = if development {
        "development"
    } else if is_installed {
        "installed"
    } else {
        "portable"
    };
    (kind, parallel_installed_copy)
}

#[tauri::command]
fn installation_runtime_info() -> Result<InstallationRuntimeInfo, String> {
    let executable = std::env::current_exe()
        .map_err(|error| format!("Не удалось определить путь приложения: {error}"))?;
    let directory = executable
        .parent()
        .ok_or_else(|| "Не удалось определить папку приложения".to_string())?
        .to_path_buf();
    let expected_install = expected_windows_install_executable();
    let (kind, parallel_installed_copy) = classify_installation(
        &executable,
        expected_install.as_deref(),
        cfg!(debug_assertions),
    );
    let parallel_installed_copy =
        parallel_installed_copy.map(|path| path.to_string_lossy().into_owned());

    Ok(InstallationRuntimeInfo {
        executable_path: executable.to_string_lossy().into_owned(),
        directory_path: directory.to_string_lossy().into_owned(),
        kind,
        parallel_installed_copy,
    })
}

#[tauri::command]
fn open_application_directory(path: String, app: AppHandle) -> Result<(), String> {
    let executable = std::env::current_exe()
        .map_err(|error| format!("Не удалось определить путь приложения: {error}"))?;
    let current_directory = executable
        .parent()
        .ok_or_else(|| "Не удалось определить папку приложения".to_string())?;
    let requested = PathBuf::from(path);
    let expected_install = expected_windows_install_executable();
    let allowed = paths_match(&requested, current_directory)
        || expected_install
            .as_deref()
            .filter(|expected| expected.is_file())
            .and_then(std::path::Path::parent)
            .is_some_and(|directory| paths_match(&requested, directory));
    if !allowed {
        return Err("Можно открыть только папку текущей или установленной копии".to_string());
    }
    app.opener()
        .open_path(requested.to_string_lossy().into_owned(), None::<&str>)
        .map_err(|error| error.to_string())
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
fn attachment_cleanup_report(
    state: State<'_, AppState>,
) -> Result<AttachmentCleanupReport, String> {
    result(state.store.attachment_cleanup_report())
}

#[tauri::command]
fn cleanup_orphaned_attachments(
    state: State<'_, AppState>,
) -> Result<AttachmentCleanupResult, String> {
    result(state.store.cleanup_orphaned_attachments())
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
            run_mcp_command(
                &executable,
                "--version",
                MCP_VERSION_TIMEOUT,
                MCP_VERSION_OUTPUT_LIMIT,
            )
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
fn list_activity(
    cursor: Option<String>,
    limit: usize,
    state: State<'_, AppState>,
) -> Result<ActivityPage, String> {
    result(state.store.list_activity(cursor.as_deref(), limit))
}

#[tauri::command]
fn run_mcp_self_check(app: tauri::AppHandle) -> Result<SelfCheckResult, String> {
    let (executable, _) = resolve_mcp_executable(&app)?;
    if !executable.is_file() {
        return Err("MCP-сервер не найден в установленной сборке".into());
    }
    let output = run_mcp_command(
        &executable,
        "--self-check",
        MCP_SELF_CHECK_TIMEOUT,
        MCP_SELF_CHECK_OUTPUT_LIMIT,
    )?;
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
    with_telegram_timeout(state.telegram.request_qr()).await
}

#[tauri::command]
async fn telegram_submit_phone(phone: String, state: State<'_, AppState>) -> Result<(), String> {
    with_telegram_timeout(state.telegram.submit_phone(phone)).await
}

#[tauri::command]
async fn telegram_submit_code(code: String, state: State<'_, AppState>) -> Result<(), String> {
    with_telegram_timeout(state.telegram.submit_code(code)).await
}

#[tauri::command]
async fn telegram_submit_password(
    password: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_telegram_timeout(state.telegram.submit_password(password)).await
}

#[tauri::command]
async fn telegram_list_chats(state: State<'_, AppState>) -> Result<Vec<TelegramChat>, String> {
    with_telegram_timeout(state.telegram.chats()).await
}

#[tauri::command]
async fn telegram_search_chats(
    query: String,
    limit: i32,
    state: State<'_, AppState>,
) -> Result<Vec<TelegramChat>, String> {
    with_telegram_timeout(state.telegram.search_chats(query, limit)).await
}

#[tauri::command]
async fn telegram_list_messages(
    chat_id: i64,
    limit: i32,
    project_id: Option<String>,
    state: State<'_, AppState>,
) -> Result<Vec<TelegramMessage>, String> {
    let mut messages = with_telegram_timeout(state.telegram.messages(chat_id, limit)).await?;
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
fn telegram_list_inbox_page(
    project_id: Option<String>,
    include_pending: bool,
    include_processed: bool,
    cursor: Option<String>,
    limit: usize,
    state: State<'_, AppState>,
) -> Result<TelegramInboxPage, String> {
    result(state.store.list_telegram_inbox_page(
        project_id.as_deref(),
        include_pending,
        include_processed,
        cursor.as_deref(),
        limit,
    ))
}

#[tauri::command]
async fn telegram_refresh_inbox(
    project_id: String,
    limit_per_chat: i32,
    state: State<'_, AppState>,
) -> Result<TelegramInboxPage, String> {
    let project = result(state.store.get_project(&project_id))?;
    let candidates =
        with_telegram_timeout(state.telegram.refresh_candidates(&project, limit_per_chat)).await?;
    result(state.store.upsert_telegram_candidates(candidates))?;
    result(
        state
            .store
            .list_telegram_inbox_page(Some(&project_id), true, false, None, 30),
    )
}

#[tauri::command]
async fn telegram_refresh_all_inboxes(
    state: State<'_, AppState>,
) -> Result<TelegramInboxSyncResult, String> {
    refresh_all_inboxes(&state).await
}

#[tauri::command]
fn telegram_sync_status(state: State<'_, AppState>) -> Result<Option<TelegramSyncStatus>, String> {
    result(state.store.telegram_sync_status())
}

#[tauri::command]
fn telegram_pending_sync_request(
    state: State<'_, AppState>,
) -> Result<Option<TelegramSyncRequest>, String> {
    result(state.store.telegram_sync_request())
}

#[tauri::command]
async fn telegram_sync(
    include_inbox: bool,
    state: State<'_, AppState>,
) -> Result<TelegramSyncResult, String> {
    let pending_request = result(state.store.telegram_sync_request())?;
    let inbox_future = async {
        if include_inbox {
            refresh_all_inboxes(&state).await
        } else {
            Ok(TelegramInboxSyncResult {
                scanned_projects: 0,
                added: 0,
                failed_projects: 0,
                errors: Vec::new(),
                busy: false,
            })
        }
    };
    let (inbox, media) = tokio::join!(inbox_future, sync_task_media(&state));
    let inbox = inbox.unwrap_or_else(|error| TelegramInboxSyncResult {
        scanned_projects: 0,
        added: 0,
        failed_projects: 1,
        errors: vec![format!("Входящие: {error}")],
        busy: false,
    });
    let media = media.unwrap_or_else(|error| TelegramMediaSyncResult {
        downloaded: 0,
        failed: 1,
        errors: vec![format!("Медиа: {error}")],
        busy: false,
    });

    if inbox.busy || media.busy {
        return Ok(TelegramSyncResult {
            inbox,
            media,
            status: result(state.store.telegram_sync_status())?,
        });
    }

    let failures = inbox.failed_projects + media.failed;
    let successful_work = inbox.scanned_projects + media.downloaded;
    let health = if failures == 0 {
        TelegramSyncHealth::Success
    } else if successful_work > 0 {
        TelegramSyncHealth::Partial
    } else {
        TelegramSyncHealth::Error
    };
    let mut errors = Vec::new();
    for error in inbox.errors.iter().chain(&media.errors) {
        push_sync_error(&mut errors, error.clone());
    }
    let status = TelegramSyncStatus {
        completed_at: Utc::now(),
        request_id: pending_request.as_ref().map(|request| request.id.clone()),
        health,
        scanned_projects: inbox.scanned_projects,
        added_candidates: inbox.added,
        downloaded_media: media.downloaded,
        failures,
        errors,
    };
    result(state.store.record_telegram_sync_status(&status))?;
    if let Some(request) = pending_request {
        result(state.store.acknowledge_telegram_sync_request(&request.id))?;
    }

    Ok(TelegramSyncResult {
        inbox,
        media,
        status: Some(status),
    })
}

async fn refresh_all_inboxes(state: &AppState) -> Result<TelegramInboxSyncResult, String> {
    if state
        .telegram_inbox_syncing
        .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
        .is_err()
    {
        return Ok(TelegramInboxSyncResult {
            scanned_projects: 0,
            added: 0,
            failed_projects: 0,
            errors: Vec::new(),
            busy: true,
        });
    }
    let _guard = SyncGuard(&state.telegram_inbox_syncing);
    let projects = result(state.store.list_projects())?;
    let mut added = 0;
    let mut scanned = 0;
    let mut failed = 0;
    let mut errors = Vec::new();
    for project in projects
        .into_iter()
        .filter(|project| !project.telegram_chats.is_empty())
    {
        match tokio::time::timeout(
            TELEGRAM_PROJECT_SYNC_TIMEOUT,
            state.telegram.refresh_candidates(&project, 40),
        )
        .await
        {
            Ok(Ok(candidates)) => {
                scanned += 1;
                added += result(state.store.upsert_telegram_candidates(candidates))?;
            }
            Ok(Err(error)) => {
                failed += 1;
                push_sync_error(&mut errors, format!("{}: {error}", project.title));
            }
            Err(_) => {
                failed += 1;
                push_sync_error(
                    &mut errors,
                    format!("{}: Telegram не ответил за 20 секунд", project.title),
                );
            }
        };
    }
    Ok(TelegramInboxSyncResult {
        scanned_projects: scanned,
        added,
        failed_projects: failed,
        errors,
        busy: false,
    })
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
    let candidate = with_telegram_timeout(
        state.telegram.manual_candidate(
            &project_id,
            link,
            &message_ids
                .filter(|ids| !ids.is_empty())
                .or_else(|| message_id.map(|id| vec![id]))
                .ok_or_else(|| "Сообщение Telegram не выбрано".to_string())?,
        ),
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
        match download_task_source_media_with_timeout(state, &task.id, index).await {
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
    download_task_source_media_with_timeout(&state, &task_id, media_index).await
}

async fn download_task_source_media_with_timeout(
    state: &AppState,
    task_id: &str,
    media_index: usize,
) -> Result<Task, String> {
    let provider_file_id = state
        .store
        .get_task(task_id)
        .ok()
        .and_then(|task| task.source)
        .and_then(|source| {
            source
                .media
                .get(media_index)
                .and_then(|media| media.provider_file_id)
        });
    match tokio::time::timeout(
        TELEGRAM_MEDIA_SYNC_TIMEOUT,
        download_task_source_media(state, task_id, media_index),
    )
    .await
    {
        Ok(result) => result,
        Err(_) => {
            if let Some(file_id) = provider_file_id {
                let _ = tokio::time::timeout(
                    Duration::from_secs(5),
                    state.telegram.release_downloaded_file(file_id),
                )
                .await;
            }
            Err("Telegram не завершил загрузку медиафайла за 60 секунд".into())
        }
    }
}

#[tauri::command]
async fn telegram_sync_task_media(
    state: State<'_, AppState>,
) -> Result<TelegramMediaSyncResult, String> {
    sync_task_media(&state).await
}

async fn sync_task_media(state: &AppState) -> Result<TelegramMediaSyncResult, String> {
    if state
        .telegram_media_syncing
        .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
        .is_err()
    {
        return Ok(TelegramMediaSyncResult {
            downloaded: 0,
            failed: 0,
            errors: Vec::new(),
            busy: true,
        });
    }
    let _guard = SyncGuard(&state.telegram_media_syncing);
    let tasks = result(state.store.list_tasks(None, true))?;
    let mut downloaded = 0;
    let mut failed = 0;
    let mut errors = Vec::new();
    for summary in tasks {
        let task = match state.store.get_task(&summary.id) {
            Ok(task) => task,
            Err(error) => {
                failed += 1;
                push_sync_error(
                    &mut errors,
                    format!("{}: не удалось перечитать задачу: {error}", summary.id),
                );
                continue;
            }
        };
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
            match download_task_source_media_with_timeout(state, &task.id, index).await {
                Ok(_) => downloaded += 1,
                Err(error) => {
                    failed += 1;
                    push_sync_error(
                        &mut errors,
                        format!("{} · файл {}: {error}", task.id, index + 1),
                    );
                }
            }
        }
    }
    Ok(TelegramMediaSyncResult {
        downloaded,
        failed,
        errors,
        busy: false,
    })
}

fn push_sync_error(errors: &mut Vec<String>, error: String) {
    const MAX_SYNC_ERRORS: usize = 8;
    if errors.len() < MAX_SYNC_ERRORS {
        errors.push(error);
    }
}

#[tauri::command]
async fn telegram_disconnect(state: State<'_, AppState>) -> Result<(), String> {
    with_telegram_timeout(state.telegram.disconnect()).await
}

#[tauri::command]
async fn telegram_reset_database(state: State<'_, AppState>) -> Result<(), String> {
    with_telegram_timeout(state.telegram.reset_database()).await
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
                    if let Ok(event) = event {
                        let paths = event
                            .paths
                            .iter()
                            .map(|path| path.to_string_lossy().into_owned())
                            .collect::<Vec<_>>();
                        let _ = handle.emit("data-changed", paths);
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
                telegram_inbox_syncing: AtomicBool::new(false),
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
            attachment_cleanup_report,
            cleanup_orphaned_attachments,
            mcp_executable_path,
            mcp_runtime_info,
            installation_runtime_info,
            open_application_directory,
            diagnose_store,
            list_activity,
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
            telegram_list_inbox_page,
            telegram_refresh_inbox,
            telegram_refresh_all_inboxes,
            telegram_sync_status,
            telegram_pending_sync_request,
            telegram_sync,
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
    use super::{classify_installation, description_with_source_media, push_sync_error};
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

    #[test]
    fn background_sync_error_details_are_bounded() {
        let mut errors = Vec::new();
        for index in 0..20 {
            push_sync_error(&mut errors, format!("ошибка {index}"));
        }
        assert_eq!(errors.len(), 8);
        assert_eq!(errors.first().map(String::as_str), Some("ошибка 0"));
        assert_eq!(errors.last().map(String::as_str), Some("ошибка 7"));
    }

    #[test]
    fn installation_classification_distinguishes_dev_installed_and_portable() {
        let root = std::env::temp_dir().join(format!("flood-install-test-{}", ulid::Ulid::new()));
        std::fs::create_dir_all(&root).unwrap();
        let current = root.join("development").join("flood-desktop.exe");
        let installed = root.join("installed").join("flood-desktop.exe");
        std::fs::create_dir_all(current.parent().unwrap()).unwrap();
        std::fs::create_dir_all(installed.parent().unwrap()).unwrap();
        std::fs::write(&current, b"dev").unwrap();
        std::fs::write(&installed, b"installed").unwrap();

        let (kind, parallel) = classify_installation(&current, Some(&installed), true);
        assert_eq!(kind, "development");
        assert_eq!(parallel.as_deref(), Some(installed.as_path()));
        let (kind, parallel) = classify_installation(&installed, Some(&installed), false);
        assert_eq!(kind, "installed");
        assert!(parallel.is_none());
        let (kind, parallel) = classify_installation(&current, None, false);
        assert_eq!(kind, "portable");
        assert!(parallel.is_none());

        std::fs::remove_dir_all(root).unwrap();
    }
}
