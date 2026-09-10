use chrono::{DateTime, Utc};
use flood_core::{
    AttachmentCleanupReport, CreateTask, InboxCandidateStatus, MessageSnapshot, Project,
    SelfCheckItem, SelfCheckResult, SourceMedia, SourceMediaKind, Store, StoreDiagnostics, Task,
    TaskPatch, TaskStatus, TaskSummary, TelegramInboxCandidate, TelegramSyncRequest,
    TelegramSyncStatus, Urgency, default_data_dir, run_self_check as run_core_self_check,
};
use rmcp::{
    Json, ServiceExt, handler::server::wrapper::Parameters, schemars, tool, tool_router,
    transport::stdio,
};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::time::Instant;

const TELEGRAM_SYNC_FRESH_SECONDS: u64 = 5 * 60;
const TELEGRAM_REQUEST_WAIT_SECONDS: u64 = 2 * 60;

#[derive(Clone)]
struct FloodServer {
    store: Store,
    allow_destructive: bool,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct IdArgs {
    id: String,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct ListTasksArgs {
    project_id: Option<String>,
    #[serde(default)]
    include_completed: bool,
    /// Идентификатор последней задачи из предыдущей порции.
    cursor: Option<String>,
    /// Размер порции от 1 до 50. По умолчанию 25.
    limit: Option<usize>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct SearchTasksArgs {
    /// Текст для поиска в названии, описании, проекте и локальном снимке Telegram-источника.
    query: String,
    project_id: Option<String>,
    #[serde(default)]
    include_completed: bool,
    /// Максимум результатов от 1 до 50. По умолчанию 15.
    limit: Option<usize>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct TaskDigestArgs {
    project_id: Option<String>,
    #[serde(default)]
    include_completed: bool,
    /// Необязательный фильтр: normal, important, urgent.
    #[serde(default)]
    urgencies: Vec<String>,
    /// Идентификатор последней задачи из предыдущей порции.
    cursor: Option<String>,
    /// Размер порции от 1 до 50. По умолчанию 20.
    limit: Option<usize>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct CreateProjectArgs {
    title: String,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct UpdateProjectArgs {
    id: String,
    title: String,
    expected_version: String,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct SnapshotArgs {
    text: String,
    author: Option<String>,
    sent_at: Option<String>,
    url: Option<String>,
    provider: Option<String>,
    chat_id: Option<i64>,
    chat_title: Option<String>,
    message_id: Option<i64>,
    #[serde(default)]
    message_ids: Vec<i64>,
    #[serde(default)]
    media: Vec<SourceMediaArgs>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct SourceMediaArgs {
    kind: String,
    file_name: String,
    provider_file_id: Option<i32>,
    mime_type: Option<String>,
    size: Option<u64>,
    relative_path: Option<String>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct CreateTaskArgs {
    project_id: String,
    description: String,
    urgency: Option<String>,
    source: Option<SnapshotArgs>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct UpdateTaskArgs {
    id: String,
    expected_version: String,
    description: Option<String>,
    urgency: Option<String>,
    status: Option<String>,
    source: Option<SnapshotArgs>,
    #[serde(default)]
    clear_source: bool,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct VersionedArgs {
    id: String,
    expected_version: String,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct MoveTaskArgs {
    id: String,
    project_id: String,
    expected_version: String,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct ListTelegramInboxArgs {
    project_id: Option<String>,
    #[serde(default)]
    include_processed: bool,
    /// Идентификатор последнего сообщения из предыдущей порции.
    cursor: Option<String>,
    /// Размер порции от 1 до 25. По умолчанию 20.
    limit: Option<usize>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct TelegramTriageBatchArgs {
    project_id: Option<String>,
    /// Идентификатор последнего кандидата из предыдущей порции.
    cursor: Option<String>,
    /// Размер порции от 1 до 25. По умолчанию 12.
    limit: Option<usize>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct CandidateIdArgs {
    candidate_id: String,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct CreateTaskFromCandidateArgs {
    candidate_id: String,
    /// Готовое Markdown-описание; оставлено для совместимости. Если не задано, используются title и notes.
    description: Option<String>,
    /// Короткое, ориентированное на результат название задачи.
    title: Option<String>,
    /// Необязательный контекст или ожидаемый результат под названием.
    notes: Option<String>,
    urgency: Option<String>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct SetCandidateStatusArgs {
    candidate_id: String,
    status: String,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct TelegramTriageDecisionArgs {
    candidate_id: String,
    /// create_task, dismiss или keep.
    action: String,
    title: Option<String>,
    notes: Option<String>,
    urgency: Option<String>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct ApplyTelegramTriageArgs {
    decisions: Vec<TelegramTriageDecisionArgs>,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
struct ProjectsOutput {
    projects: Vec<Project>,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
struct ProjectOutput {
    project: Project,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
struct TasksOutput {
    tasks: Vec<TaskSummary>,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
struct PagedTasksOutput {
    tasks: Vec<TaskSummary>,
    total: usize,
    next_cursor: Option<String>,
    remaining: usize,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
struct TaskSearchHit {
    id: String,
    project_id: String,
    project_title: String,
    title: String,
    snippet: String,
    urgency: Urgency,
    status: TaskStatus,
    updated_at: String,
    has_source: bool,
    matched_fields: Vec<String>,
    version: String,
    score: u32,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
struct SearchTasksOutput {
    query: String,
    matches: Vec<TaskSearchHit>,
    total_matches: usize,
    truncated: bool,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
struct CompactTaskOutput {
    id: String,
    project_id: String,
    project_title: String,
    title: String,
    snippet: String,
    urgency: Urgency,
    status: TaskStatus,
    updated_at: String,
    has_source: bool,
    version: String,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
struct TaskDigestCounts {
    total: usize,
    open: usize,
    completed: usize,
    normal: usize,
    important: usize,
    urgent: usize,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
struct TaskDigestOutput {
    tasks: Vec<CompactTaskOutput>,
    counts: TaskDigestCounts,
    next_cursor: Option<String>,
    remaining: usize,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
struct TaskOutput {
    task: Task,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
struct MutationOutput {
    success: bool,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
struct DeleteCountOutput {
    deleted: usize,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
struct TelegramInboxOutput {
    candidates: Vec<TelegramInboxCandidate>,
    total: usize,
    next_cursor: Option<String>,
    remaining: usize,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
struct TelegramSyncStatusOutput {
    status: Option<TelegramSyncStatus>,
    pending_request: Option<TelegramSyncRequest>,
    phase: &'static str,
    fresh: bool,
    request_completed: bool,
    pending_age_seconds: Option<u64>,
    status_age_seconds: Option<u64>,
    next_action: &'static str,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
struct TelegramSyncRequestOutput {
    request: TelegramSyncRequest,
    queued: bool,
    next_step: &'static str,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
struct TelegramCandidateOutput {
    candidate: TelegramInboxCandidate,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
struct TelegramTriageBatchOutput {
    candidates: Vec<TelegramInboxCandidate>,
    next_cursor: Option<String>,
    remaining: usize,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
struct TelegramTriageDecisionOutput {
    candidate_id: String,
    action: String,
    success: bool,
    task: Option<Task>,
    error: Option<String>,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
struct ApplyTelegramTriageOutput {
    created: usize,
    dismissed: usize,
    kept: usize,
    failed: usize,
    results: Vec<TelegramTriageDecisionOutput>,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
struct RuntimeInfoOutput {
    name: &'static str,
    version: &'static str,
    data_root: String,
    destructive_actions_enabled: bool,
    capabilities: Vec<&'static str>,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
struct WorkspaceBriefOutput {
    brief_version: u8,
    runtime: RuntimeInfoOutput,
    diagnostics: StoreDiagnostics,
    attachment_storage: AttachmentCleanupReport,
    priority_tasks: TaskDigestOutput,
    telegram: TelegramSyncStatusOutput,
    suggested_tools: Vec<&'static str>,
}

fn elapsed_seconds(timestamp: &DateTime<Utc>) -> u64 {
    Utc::now()
        .signed_duration_since(timestamp)
        .num_seconds()
        .max(0) as u64
}

fn telegram_sync_output(
    status: Option<TelegramSyncStatus>,
    pending_request: Option<TelegramSyncRequest>,
) -> TelegramSyncStatusOutput {
    let pending_age_seconds = pending_request
        .as_ref()
        .map(|request| elapsed_seconds(&request.requested_at));
    let status_age_seconds = status
        .as_ref()
        .map(|status| elapsed_seconds(&status.completed_at));
    let request_completed = pending_request.as_ref().is_some_and(|request| {
        status
            .as_ref()
            .and_then(|status| status.request_id.as_deref())
            == Some(request.id.as_str())
    });
    let fresh = status_age_seconds.is_some_and(|age| age <= TELEGRAM_SYNC_FRESH_SECONDS)
        && (pending_request.is_none() || request_completed);
    let phase = if pending_request.is_some() && request_completed {
        "completed_pending_ack"
    } else if pending_age_seconds.is_some_and(|age| age > TELEGRAM_REQUEST_WAIT_SECONDS) {
        "waiting_for_desktop"
    } else if pending_request.is_some() {
        "queued"
    } else if status.is_some() {
        "completed"
    } else {
        "never_synced"
    };
    let next_action = match phase {
        "completed_pending_ack" => {
            "Результат уже записан. Ориентируйтесь на status.health; desktop удалит служебный запрос при следующей синхронизации"
        }
        "waiting_for_desktop" => {
            "Откройте flood.md и проверьте подключение Telegram. Не опрашивайте статус непрерывно"
        }
        "queued" => "Подождите короткое время и один раз повторите get_telegram_sync_status",
        "completed" if fresh => "Данные свежие. Можно разбирать get_telegram_triage_batch",
        "completed" => "Запросите request_telegram_sync перед разбором входящих",
        _ => "Запросите request_telegram_sync; desktop выполнит синхронизацию через TDLib",
    };

    TelegramSyncStatusOutput {
        status,
        pending_request,
        phase,
        fresh,
        request_completed,
        pending_age_seconds,
        status_age_seconds,
        next_action,
    }
}

#[tool_router(server_handler)]
impl FloodServer {
    #[tool(
        description = "Получить версию MCP-сервера, активную папку данных, доступные группы возможностей и состояние необратимых операций",
        annotations(
            title = "Сведения о flood.md MCP",
            read_only_hint = true,
            destructive_hint = false,
            open_world_hint = false
        )
    )]
    fn get_runtime_info(&self) -> Json<RuntimeInfoOutput> {
        Json(RuntimeInfoOutput {
            name: "flood.md",
            version: env!("CARGO_PKG_VERSION"),
            data_root: self.store.root().to_string_lossy().into_owned(),
            destructive_actions_enabled: self.allow_destructive,
            capabilities: vec![
                "projects",
                "tasks",
                "bounded_task_lists",
                "bounded_task_search",
                "bounded_task_digest",
                "bounded_workspace_brief",
                "telegram_inbox",
                "bounded_telegram_lists",
                "bounded_telegram_triage",
                "telegram_sync_status",
                "telegram_sync_request",
                "store_diagnostics",
                "attachment_storage_audit",
                "isolated_self_check",
            ],
        })
    }

    #[tool(
        description = "Получить единую ограниченную стартовую сводку flood.md для агента: runtime, диагностику и аудит вложений, до 10 приоритетных открытых задач, состояние синхронизации Telegram и следующие подходящие MCP tools. Не возвращает полную базу или тексты Telegram-входящих. Используйте первым вызовом вместо серии широких списков",
        annotations(
            title = "Рабочая сводка flood.md",
            read_only_hint = true,
            destructive_hint = false,
            open_world_hint = false
        )
    )]
    fn get_workspace_brief(&self) -> Result<Json<WorkspaceBriefOutput>, String> {
        let runtime = self.get_runtime_info().0;
        let diagnostics = self.store.diagnostics();
        let attachment_storage = self
            .store
            .attachment_cleanup_report()
            .map_err(store_error)?;
        let priority_tasks = self
            .get_task_digest(Parameters(TaskDigestArgs {
                project_id: None,
                include_completed: false,
                urgencies: Vec::new(),
                cursor: None,
                limit: Some(10),
            }))?
            .0;
        let telegram = self.get_telegram_sync_status()?.0;
        let mut suggested_tools = Vec::new();
        if !diagnostics.healthy {
            suggested_tools.push("diagnose_store");
        }
        if attachment_storage.orphaned_files > 0 {
            suggested_tools.push("inspect_attachment_storage");
        }
        if telegram.phase == "queued" {
            suggested_tools.push("get_telegram_sync_status");
        } else if telegram.pending_request.is_none()
            && !telegram.fresh
            && diagnostics.linked_chat_count > 0
        {
            suggested_tools.push("request_telegram_sync");
        }
        if diagnostics.pending_inbox_count > 0 {
            suggested_tools.push("get_telegram_triage_batch");
        }
        if !priority_tasks.tasks.is_empty() {
            suggested_tools.push("get_task");
        } else if diagnostics.project_count == 0 {
            suggested_tools.push("create_project");
        } else {
            suggested_tools.push("create_task");
        }
        suggested_tools.push("run_self_check");

        Ok(Json(WorkspaceBriefOutput {
            brief_version: 2,
            runtime,
            diagnostics,
            attachment_storage,
            priority_tasks,
            telegram,
            suggested_tools,
        }))
    }

    #[tool(
        description = "Проверить доступность и целостность текущего локального Markdown-хранилища без изменения данных. Возвращает счётчики проектов, задач, корзины, Telegram-входящих и найденные проблемы",
        annotations(
            title = "Диагностика flood.md",
            read_only_hint = true,
            destructive_hint = false,
            open_world_hint = false
        )
    )]
    fn diagnose_store(&self) -> Json<StoreDiagnostics> {
        Json(self.store.diagnostics())
    }

    #[tool(
        description = "Проверить локальное хранилище вложений и посчитать файлы, на которые больше не ссылаются Markdown задач или Telegram-источники. Ничего не удаляет; очистка доступна только человеку в Настройки → Данные",
        annotations(
            title = "Аудит вложений flood.md",
            read_only_hint = true,
            destructive_hint = false,
            open_world_hint = false
        )
    )]
    fn inspect_attachment_storage(&self) -> Result<Json<AttachmentCleanupReport>, String> {
        self.store
            .attachment_cleanup_report()
            .map(Json)
            .map_err(store_error)
    }

    #[tool(
        description = "Получить результат последней фоновой синхронизации Telegram, возраст данных и состояние запроса: queued, waiting_for_desktop, completed_pending_ack, completed или never_synced. Следуйте next_action и не опрашивайте старый pending_request бесконечно. MCP не подключается к Telegram сам",
        annotations(
            title = "Свежесть Telegram-входящих",
            read_only_hint = true,
            destructive_hint = false,
            open_world_hint = false
        )
    )]
    fn get_telegram_sync_status(&self) -> Result<Json<TelegramSyncStatusOutput>, String> {
        let status = self.store.telegram_sync_status().map_err(store_error)?;
        let pending_request = self.store.telegram_sync_request().map_err(store_error)?;
        Ok(Json(telegram_sync_output(status, pending_request)))
    }

    #[tool(
        description = "Идемпотентно попросить desktop-приложение обновить локальные Telegram-входящие и медиа через TDLib. Если запрос уже ожидает, вернётся тот же request.id вместо создания дубля. Команда не читает чаты сама и не передаёт их содержимое через служебный файл. Затем один раз проверьте get_telegram_sync_status и следуйте next_action",
        annotations(
            title = "Запросить синхронизацию Telegram",
            read_only_hint = false,
            destructive_hint = false,
            open_world_hint = true
        )
    )]
    fn request_telegram_sync(&self) -> Result<Json<TelegramSyncRequestOutput>, String> {
        self.store
            .request_telegram_sync()
            .map(|request| {
                Json(TelegramSyncRequestOutput {
                    request,
                    queued: true,
                    next_step: "Проверьте get_telegram_sync_status и следуйте next_action; старый запрос не нужно опрашивать непрерывно",
                })
            })
            .map_err(store_error)
    }

    #[tool(
        description = "Запустить изолированную самопроверку flood.md: создать временный проект и задачу, проверить конфликт версий, вложение, завершение, корзину, восстановление и повторное чтение. Пользовательские данные не изменяются",
        annotations(
            title = "Самопроверка flood.md",
            read_only_hint = false,
            destructive_hint = false,
            open_world_hint = false
        )
    )]
    fn run_self_check(&self) -> Json<SelfCheckResult> {
        Json(run_core_self_check())
    }

    #[tool(
        description = "Получить список проектов",
        annotations(
            title = "Список проектов",
            read_only_hint = true,
            destructive_hint = false,
            open_world_hint = false
        )
    )]
    fn list_projects(&self) -> Result<Json<ProjectsOutput>, String> {
        self.store
            .list_projects()
            .map(|projects| Json(ProjectsOutput { projects }))
            .map_err(store_error)
    }

    #[tool(
        description = "Прочитать проект по стабильному идентификатору",
        annotations(
            title = "Прочитать проект",
            read_only_hint = true,
            destructive_hint = false,
            open_world_hint = false
        )
    )]
    fn get_project(
        &self,
        Parameters(args): Parameters<IdArgs>,
    ) -> Result<Json<ProjectOutput>, String> {
        self.store
            .get_project(&args.id)
            .map(|project| Json(ProjectOutput { project }))
            .map_err(store_error)
    }

    #[tool(
        description = "Создать проект для задач",
        annotations(
            title = "Создать проект",
            destructive_hint = false,
            open_world_hint = false
        )
    )]
    fn create_project(
        &self,
        Parameters(args): Parameters<CreateProjectArgs>,
    ) -> Result<Json<ProjectOutput>, String> {
        self.store
            .create_project(&args.title)
            .map(|project| Json(ProjectOutput { project }))
            .map_err(store_error)
    }

    #[tool(
        description = "Переименовать проект. expected_version возьмите из get_project или list_projects",
        annotations(title = "Переименовать проект", open_world_hint = false)
    )]
    fn update_project(
        &self,
        Parameters(args): Parameters<UpdateProjectArgs>,
    ) -> Result<Json<ProjectOutput>, String> {
        self.store
            .update_project(&args.id, &args.title, &args.expected_version)
            .map(|project| Json(ProjectOutput { project }))
            .map_err(store_error)
    }

    #[tool(
        description = "Окончательно удалить проект и все его задачи; требуется актуальный expected_version",
        annotations(
            title = "Удалить проект",
            destructive_hint = true,
            open_world_hint = false
        )
    )]
    fn delete_project(
        &self,
        Parameters(args): Parameters<VersionedArgs>,
    ) -> Result<Json<MutationOutput>, String> {
        self.ensure_destructive_allowed()?;
        self.store
            .delete_project(&args.id, &args.expected_version)
            .map(|_| Json(MutationOutput { success: true }))
            .map_err(store_error)
    }

    #[tool(
        description = "Получить ограниченную порцию задач одного проекта или всех проектов. Возвращает не более 50 карточек, total, next_cursor и remaining. Для краткого обзора нагрузки предпочтительнее get_task_digest",
        annotations(
            title = "Список задач",
            read_only_hint = true,
            destructive_hint = false,
            open_world_hint = false
        )
    )]
    fn list_tasks(
        &self,
        Parameters(args): Parameters<ListTasksArgs>,
    ) -> Result<Json<PagedTasksOutput>, String> {
        let tasks = self
            .store
            .list_tasks(args.project_id.as_deref(), args.include_completed)
            .map_err(store_error)?;
        let total = tasks.len();
        let start = match args.cursor.as_deref() {
            Some(cursor) => tasks
                .iter()
                .position(|task| task.id == cursor)
                .map(|index| index + 1)
                .ok_or_else(|| {
                    "cursor не найден в текущем списке задач; начните заново".to_string()
                })?,
            None => 0,
        };
        let limit = args.limit.unwrap_or(25).clamp(1, 50);
        let remaining_before_page = total.saturating_sub(start);
        let page = tasks
            .into_iter()
            .skip(start)
            .take(limit)
            .collect::<Vec<_>>();
        let remaining = remaining_before_page.saturating_sub(page.len());
        let next_cursor = (remaining > 0)
            .then(|| page.last().map(|task| task.id.clone()))
            .flatten();
        Ok(Json(PagedTasksOutput {
            tasks: page,
            total,
            next_cursor,
            remaining,
        }))
    }

    #[tool(
        description = "Найти задачи по фрагменту без загрузки всего хранилища в контекст. Ищет сразу по заголовку и описанию задачи, названию проекта, автору и локальному снимку Telegram-сообщения. Возвращает компактные ранжированные совпадения; полную карточку нужного результата прочитайте через get_task",
        annotations(
            title = "Поиск задач",
            read_only_hint = true,
            destructive_hint = false,
            open_world_hint = false
        )
    )]
    fn search_tasks(
        &self,
        Parameters(args): Parameters<SearchTasksArgs>,
    ) -> Result<Json<SearchTasksOutput>, String> {
        let query = args.query.trim();
        if query.is_empty() || query.chars().count() > 200 {
            return Err("query должен содержать от 1 до 200 символов".into());
        }
        if let Some(project_id) = args.project_id.as_deref() {
            self.store.get_project(project_id).map_err(store_error)?;
        }
        let project_titles = self
            .store
            .list_projects()
            .map_err(store_error)?
            .into_iter()
            .map(|project| (project.id, project.title))
            .collect::<std::collections::HashMap<_, _>>();
        let query_lower = query.to_lowercase();
        let terms = query_lower.split_whitespace().collect::<Vec<_>>();
        let summaries = self
            .store
            .list_tasks(args.project_id.as_deref(), args.include_completed)
            .map_err(store_error)?;
        let mut matches = summaries
            .into_iter()
            .filter_map(|summary| {
                let task = self.store.get_task(&summary.id).ok()?;
                let project_title = project_titles.get(&task.project_id)?.clone();
                task_search_hit(task, project_title, &query_lower, &terms)
            })
            .collect::<Vec<_>>();
        matches.sort_by(|left, right| {
            right
                .score
                .cmp(&left.score)
                .then_with(|| right.updated_at.cmp(&left.updated_at))
        });
        let total_matches = matches.len();
        let limit = args.limit.unwrap_or(15).clamp(1, 50);
        matches.truncate(limit);
        Ok(Json(SearchTasksOutput {
            query: query.to_owned(),
            truncated: total_matches > matches.len(),
            total_matches,
            matches,
        }))
    }

    #[tool(
        description = "Получить компактный приоритетный дайджест задач без полных Markdown-документов. Можно ограничить проект и срочность; открытые срочные задачи идут первыми. Возвращает счётчики, до 50 коротких карточек, next_cursor и число оставшихся. Используйте вместо list_tasks для обзора нагрузки",
        annotations(
            title = "Дайджест задач",
            read_only_hint = true,
            destructive_hint = false,
            open_world_hint = false
        )
    )]
    fn get_task_digest(
        &self,
        Parameters(args): Parameters<TaskDigestArgs>,
    ) -> Result<Json<TaskDigestOutput>, String> {
        if let Some(project_id) = args.project_id.as_deref() {
            self.store.get_project(project_id).map_err(store_error)?;
        }
        let urgency_filter = args
            .urgencies
            .iter()
            .map(|value| parse_urgency(value))
            .collect::<Result<Vec<_>, _>>()?;
        let project_titles = self
            .store
            .list_projects()
            .map_err(store_error)?
            .into_iter()
            .map(|project| (project.id, project.title))
            .collect::<std::collections::HashMap<_, _>>();
        let mut tasks = self
            .store
            .list_tasks(args.project_id.as_deref(), args.include_completed)
            .map_err(store_error)?
            .into_iter()
            .filter(|task| urgency_filter.is_empty() || urgency_filter.contains(&task.urgency))
            .collect::<Vec<_>>();
        tasks.sort_by(|left, right| {
            task_status_rank(&left.status)
                .cmp(&task_status_rank(&right.status))
                .then_with(|| {
                    task_urgency_rank(&left.urgency).cmp(&task_urgency_rank(&right.urgency))
                })
                .then_with(|| right.updated_at.cmp(&left.updated_at))
                .then_with(|| left.id.cmp(&right.id))
        });
        let counts = TaskDigestCounts {
            total: tasks.len(),
            open: tasks
                .iter()
                .filter(|task| task.status == TaskStatus::Open)
                .count(),
            completed: tasks
                .iter()
                .filter(|task| task.status == TaskStatus::Completed)
                .count(),
            normal: tasks
                .iter()
                .filter(|task| task.urgency == Urgency::Normal)
                .count(),
            important: tasks
                .iter()
                .filter(|task| task.urgency == Urgency::Important)
                .count(),
            urgent: tasks
                .iter()
                .filter(|task| task.urgency == Urgency::Urgent)
                .count(),
        };
        let start = match args.cursor.as_deref() {
            Some(cursor) => tasks
                .iter()
                .position(|task| task.id == cursor)
                .map(|index| index + 1)
                .ok_or_else(|| {
                    "cursor не найден в текущем дайджесте; начните заново".to_string()
                })?,
            None => 0,
        };
        let limit = args.limit.unwrap_or(20).clamp(1, 50);
        let remaining = tasks.len().saturating_sub(start);
        let page = tasks
            .into_iter()
            .skip(start)
            .take(limit)
            .map(|task| {
                let project_title = project_titles
                    .get(&task.project_id)
                    .cloned()
                    .unwrap_or_else(|| "Неизвестный проект".into());
                compact_task_output(task, project_title)
            })
            .collect::<Vec<_>>();
        let remaining = remaining.saturating_sub(page.len());
        let next_cursor = (remaining > 0)
            .then(|| page.last().map(|task| task.id.clone()))
            .flatten();
        Ok(Json(TaskDigestOutput {
            tasks: page,
            counts,
            next_cursor,
            remaining,
        }))
    }

    #[tool(
        description = "Прочитать задачу и локальный снимок исходного сообщения",
        annotations(
            title = "Прочитать задачу",
            read_only_hint = true,
            destructive_hint = false,
            open_world_hint = false
        )
    )]
    fn get_task(&self, Parameters(args): Parameters<IdArgs>) -> Result<Json<TaskOutput>, String> {
        self.store
            .get_task(&args.id)
            .map(|task| Json(TaskOutput { task }))
            .map_err(store_error)
    }

    #[tool(
        description = "Получить ограниченную порцию локальной очереди Telegram-кандидатов. По умолчанию возвращаются только необработанные сообщения; include_processed=true также включает обработанные сообщения со linked_task. Ответ содержит не более 25 кандидатов, total, next_cursor и remaining. Для последовательного разбора предпочтительнее get_telegram_triage_batch",
        annotations(
            title = "Входящие из Telegram",
            read_only_hint = true,
            destructive_hint = false,
            open_world_hint = false
        )
    )]
    fn list_telegram_inbox(
        &self,
        Parameters(args): Parameters<ListTelegramInboxArgs>,
    ) -> Result<Json<TelegramInboxOutput>, String> {
        let limit = args.limit.unwrap_or(20).clamp(1, 25);
        let page = self
            .store
            .list_telegram_inbox_page(
                args.project_id.as_deref(),
                true,
                args.include_processed,
                args.cursor.as_deref(),
                limit,
            )
            .map_err(store_error)?;
        Ok(Json(TelegramInboxOutput {
            candidates: page.candidates,
            total: page.total,
            next_cursor: page.next_cursor,
            remaining: page.remaining,
        }))
    }

    #[tool(
        description = "Получить следующую ограниченную порцию необработанных Telegram-сообщений для агентного разбора. Возвращает не более 25 кандидатов, медиа только как метаданные, next_cursor для продолжения и число оставшихся. Используйте этот инструмент вместо загрузки всей очереди",
        annotations(
            title = "Порция Telegram-входящих",
            read_only_hint = true,
            destructive_hint = false,
            open_world_hint = false
        )
    )]
    fn get_telegram_triage_batch(
        &self,
        Parameters(args): Parameters<TelegramTriageBatchArgs>,
    ) -> Result<Json<TelegramTriageBatchOutput>, String> {
        let limit = args.limit.unwrap_or(12).clamp(1, 25);
        let page = self
            .store
            .list_telegram_inbox_page(
                args.project_id.as_deref(),
                true,
                false,
                args.cursor.as_deref(),
                limit,
            )
            .map_err(store_error)?;
        Ok(Json(TelegramTriageBatchOutput {
            candidates: page.candidates,
            next_cursor: page.next_cursor,
            remaining: page.remaining,
        }))
    }

    #[tool(
        description = "Применить до 25 решений по Telegram-входящим одной порцией. Для каждого кандидата action: create_task (нужен короткий title, notes необязательны), dismiss или keep. Результат возвращается отдельно для каждого решения; повторное создание задачи идемпотентно",
        annotations(
            title = "Применить разбор Telegram",
            destructive_hint = false,
            open_world_hint = false
        )
    )]
    fn apply_telegram_triage(
        &self,
        Parameters(args): Parameters<ApplyTelegramTriageArgs>,
    ) -> Result<Json<ApplyTelegramTriageOutput>, String> {
        if args.decisions.is_empty() || args.decisions.len() > 25 {
            return Err("передайте от 1 до 25 решений".into());
        }
        let mut seen = HashSet::new();
        let mut output = ApplyTelegramTriageOutput {
            created: 0,
            dismissed: 0,
            kept: 0,
            failed: 0,
            results: Vec::with_capacity(args.decisions.len()),
        };
        for decision in args.decisions {
            let candidate_id = decision.candidate_id.clone();
            let action = decision.action.clone();
            let result = if !seen.insert(candidate_id.clone()) {
                Err("один кандидат нельзя обработать дважды в одной порции".to_string())
            } else {
                match action.as_str() {
                    "create_task" => match decision.title {
                        Some(title) => task_description(Some(title), decision.notes, None)
                            .and_then(|description| {
                                self.store
                                    .create_task_from_telegram_candidate(
                                        &candidate_id,
                                        description.as_deref(),
                                        parse_urgency(
                                            decision.urgency.as_deref().unwrap_or("normal"),
                                        )?,
                                    )
                                    .map_err(store_error)
                            })
                            .map(Some),
                        None => Err("title обязателен для action=create_task".into()),
                    },
                    "dismiss" => self
                        .store
                        .set_telegram_candidate_status(
                            &candidate_id,
                            InboxCandidateStatus::Dismissed,
                        )
                        .map(|_| None)
                        .map_err(store_error),
                    "keep" => self
                        .store
                        .get_telegram_candidate(&candidate_id)
                        .map(|_| None)
                        .map_err(store_error),
                    _ => Err("action должен быть create_task, dismiss или keep".into()),
                }
            };
            match result {
                Ok(task) => {
                    match action.as_str() {
                        "create_task" => output.created += 1,
                        "dismiss" => output.dismissed += 1,
                        "keep" => output.kept += 1,
                        _ => {}
                    }
                    output.results.push(TelegramTriageDecisionOutput {
                        candidate_id,
                        action,
                        success: true,
                        task,
                        error: None,
                    });
                }
                Err(error) => {
                    output.failed += 1;
                    output.results.push(TelegramTriageDecisionOutput {
                        candidate_id,
                        action,
                        success: false,
                        task: None,
                        error: Some(error),
                    });
                }
            }
        }
        Ok(Json(output))
    }

    #[tool(
        description = "Прочитать один Telegram-кандидат с локальным снимком текста, метаданными, списком медиа и linked_task. linked_task показывает, какая задача уже создана по сообщению, её срочность и состояние",
        annotations(
            title = "Прочитать Telegram-кандидат",
            read_only_hint = true,
            destructive_hint = false,
            open_world_hint = false
        )
    )]
    fn get_telegram_candidate(
        &self,
        Parameters(args): Parameters<CandidateIdArgs>,
    ) -> Result<Json<TelegramCandidateOutput>, String> {
        self.store
            .get_telegram_candidate(&args.candidate_id)
            .map(|candidate| Json(TelegramCandidateOutput { candidate }))
            .map_err(store_error)
    }

    #[tool(
        description = "Создать задачу из Telegram-кандидата и сохранить снимок источника. Передайте короткий title, отдельно notes и urgency; исходное сообщение не нужно копировать в описание. Повторный вызов или другой кандидат для того же Telegram-сообщения возвращает существующую задачу без дубля. Desktop-приложение автоматически скачает медиа сразу, если запущено, либо при следующем запуске",
        annotations(
            title = "Создать задачу из Telegram",
            destructive_hint = false,
            open_world_hint = false
        )
    )]
    fn create_task_from_telegram_candidate(
        &self,
        Parameters(args): Parameters<CreateTaskFromCandidateArgs>,
    ) -> Result<Json<TaskOutput>, String> {
        let description = task_description(args.title, args.notes, args.description)?;
        self.store
            .create_task_from_telegram_candidate(
                &args.candidate_id,
                description.as_deref(),
                parse_urgency(args.urgency.as_deref().unwrap_or("normal"))?,
            )
            .map(|task| Json(TaskOutput { task }))
            .map_err(store_error)
    }

    #[tool(
        description = "Изменить состояние Telegram-кандидата: pending возвращает во входящие, dismissed скрывает как нерелевантный",
        annotations(title = "Обработать Telegram-кандидат", open_world_hint = false)
    )]
    fn set_telegram_candidate_status(
        &self,
        Parameters(args): Parameters<SetCandidateStatusArgs>,
    ) -> Result<Json<TelegramCandidateOutput>, String> {
        let status = match args.status.as_str() {
            "pending" => InboxCandidateStatus::Pending,
            "dismissed" => InboxCandidateStatus::Dismissed,
            _ => return Err("status должен быть pending или dismissed".into()),
        };
        self.store
            .set_telegram_candidate_status(&args.candidate_id, status)
            .map(|candidate| Json(TelegramCandidateOutput { candidate }))
            .map_err(store_error)
    }

    #[tool(
        description = "Получить задачи из корзины",
        annotations(
            title = "Задачи в корзине",
            read_only_hint = true,
            destructive_hint = false,
            open_world_hint = false
        )
    )]
    fn list_trashed_tasks(&self) -> Result<Json<TasksOutput>, String> {
        self.store
            .list_trashed_tasks()
            .map(|tasks| Json(TasksOutput { tasks }))
            .map_err(store_error)
    }

    #[tool(
        description = "Создать открытую задачу. urgency: normal, important или urgent",
        annotations(
            title = "Создать задачу",
            destructive_hint = false,
            open_world_hint = false
        )
    )]
    fn create_task(
        &self,
        Parameters(args): Parameters<CreateTaskArgs>,
    ) -> Result<Json<TaskOutput>, String> {
        let input = CreateTask {
            project_id: args.project_id,
            description: args.description,
            urgency: parse_urgency(args.urgency.as_deref().unwrap_or("normal"))?,
            source: args.source.map(parse_snapshot).transpose()?,
        };
        self.store
            .create_task(input)
            .map(|task| Json(TaskOutput { task }))
            .map_err(store_error)
    }

    #[tool(
        description = "Изменить задачу. status: open или completed; требуется актуальный expected_version",
        annotations(title = "Изменить задачу", open_world_hint = false)
    )]
    fn update_task(
        &self,
        Parameters(args): Parameters<UpdateTaskArgs>,
    ) -> Result<Json<TaskOutput>, String> {
        let source = if args.clear_source {
            Some(None)
        } else {
            args.source.map(parse_snapshot).transpose()?.map(Some)
        };
        let patch = TaskPatch {
            description: args.description,
            urgency: args.urgency.as_deref().map(parse_urgency).transpose()?,
            status: args.status.as_deref().map(parse_status).transpose()?,
            source,
        };
        self.store
            .update_task(&args.id, patch, &args.expected_version)
            .map(|task| Json(TaskOutput { task }))
            .map_err(store_error)
    }

    #[tool(
        description = "Отметить задачу выполненной; требуется актуальный expected_version",
        annotations(title = "Завершить задачу", open_world_hint = false)
    )]
    fn complete_task(
        &self,
        Parameters(args): Parameters<VersionedArgs>,
    ) -> Result<Json<TaskOutput>, String> {
        self.store
            .complete_task(&args.id, &args.expected_version)
            .map(|task| Json(TaskOutput { task }))
            .map_err(store_error)
    }

    #[tool(
        description = "Переместить задачу в другой проект; требуется актуальный expected_version",
        annotations(title = "Переместить задачу", open_world_hint = false)
    )]
    fn move_task(
        &self,
        Parameters(args): Parameters<MoveTaskArgs>,
    ) -> Result<Json<TaskOutput>, String> {
        self.store
            .move_task(&args.id, &args.project_id, &args.expected_version)
            .map(|task| Json(TaskOutput { task }))
            .map_err(store_error)
    }

    #[tool(
        description = "Переместить задачу в восстанавливаемую корзину",
        annotations(
            title = "Переместить в корзину",
            destructive_hint = true,
            open_world_hint = false
        )
    )]
    fn trash_task(
        &self,
        Parameters(args): Parameters<VersionedArgs>,
    ) -> Result<Json<TaskOutput>, String> {
        self.store
            .trash_task(&args.id, &args.expected_version)
            .map(|task| Json(TaskOutput { task }))
            .map_err(store_error)
    }

    #[tool(
        description = "Восстановить задачу из корзины",
        annotations(
            title = "Восстановить задачу",
            destructive_hint = false,
            open_world_hint = false
        )
    )]
    fn restore_task(
        &self,
        Parameters(args): Parameters<VersionedArgs>,
    ) -> Result<Json<TaskOutput>, String> {
        self.store
            .restore_task(&args.id, &args.expected_version)
            .map(|task| Json(TaskOutput { task }))
            .map_err(store_error)
    }

    #[tool(
        description = "Окончательно удалить одну задачу из корзины",
        annotations(
            title = "Удалить задачу навсегда",
            destructive_hint = true,
            open_world_hint = false
        )
    )]
    fn delete_trashed_task(
        &self,
        Parameters(args): Parameters<VersionedArgs>,
    ) -> Result<Json<MutationOutput>, String> {
        self.ensure_destructive_allowed()?;
        self.store
            .delete_trashed_task(&args.id, &args.expected_version)
            .map(|_| Json(MutationOutput { success: true }))
            .map_err(store_error)
    }

    #[tool(
        description = "Окончательно удалить все задачи из корзины",
        annotations(
            title = "Очистить корзину",
            destructive_hint = true,
            open_world_hint = false
        )
    )]
    fn empty_trash(&self) -> Result<Json<DeleteCountOutput>, String> {
        self.ensure_destructive_allowed()?;
        self.store
            .empty_trash()
            .map(|deleted| Json(DeleteCountOutput { deleted }))
            .map_err(store_error)
    }
}

impl FloodServer {
    fn ensure_destructive_allowed(&self) -> Result<(), String> {
        if self.allow_destructive {
            Ok(())
        } else {
            Err("Необратимые MCP-действия отключены. Выполните удаление в приложении или явно запустите сервер с FLOOD_MCP_ALLOW_DESTRUCTIVE=1".into())
        }
    }
}

fn parse_urgency(value: &str) -> Result<Urgency, String> {
    match value {
        "normal" => Ok(Urgency::Normal),
        "important" => Ok(Urgency::Important),
        "urgent" => Ok(Urgency::Urgent),
        _ => Err("urgency должен быть normal, important или urgent".into()),
    }
}

fn parse_status(value: &str) -> Result<TaskStatus, String> {
    match value {
        "open" => Ok(TaskStatus::Open),
        "completed" => Ok(TaskStatus::Completed),
        _ => Err("status должен быть open или completed".into()),
    }
}

fn task_description(
    title: Option<String>,
    notes: Option<String>,
    description: Option<String>,
) -> Result<Option<String>, String> {
    match (description, title, notes) {
        (Some(description), _, _) => Ok(Some(description)),
        (None, Some(title), notes) => {
            let title = title.trim();
            if title.is_empty() {
                return Err("title не может быть пустым".into());
            }
            Ok(Some(
                match notes
                    .map(|notes| notes.trim().to_owned())
                    .filter(|notes| !notes.is_empty())
                {
                    Some(notes) => format!("{title}\n\n{notes}"),
                    None => title.to_owned(),
                },
            ))
        }
        (None, None, _) => Ok(None),
    }
}

fn task_search_hit(
    task: Task,
    project_title: String,
    query: &str,
    terms: &[&str],
) -> Option<TaskSearchHit> {
    let title = compact_search_text(
        task.description
            .lines()
            .find(|line| !line.trim().is_empty())
            .unwrap_or("Без названия"),
        120,
    )
    .trim_start_matches(['#', '-', '*', ' '])
    .to_owned();
    let source_text = task
        .source
        .as_ref()
        .map(|source| source.text.as_str())
        .unwrap_or("");
    let source_meta = task
        .source
        .as_ref()
        .map(|source| {
            format!(
                "{} {} {}",
                source.author.as_deref().unwrap_or(""),
                source.chat_title.as_deref().unwrap_or(""),
                source
                    .media
                    .iter()
                    .map(|media| media.file_name.as_str())
                    .collect::<Vec<_>>()
                    .join(" ")
            )
        })
        .unwrap_or_default();
    let title_lower = title.to_lowercase();
    let description_lower = task.description.to_lowercase();
    let project_lower = project_title.to_lowercase();
    let source_lower = source_text.to_lowercase();
    let source_meta_lower = source_meta.to_lowercase();
    if terms.iter().any(|term| {
        !title_lower.contains(term)
            && !description_lower.contains(term)
            && !project_lower.contains(term)
            && !source_lower.contains(term)
            && !source_meta_lower.contains(term)
    }) {
        return None;
    }

    let mut score = 0;
    let mut matched_fields = Vec::new();
    for (field, text, exact_score) in [
        ("title", title_lower.as_str(), 120),
        ("description", description_lower.as_str(), 80),
        ("source", source_lower.as_str(), 70),
        ("project", project_lower.as_str(), 50),
        ("source_metadata", source_meta_lower.as_str(), 40),
    ] {
        if text.contains(query) {
            score += exact_score;
            matched_fields.push(field.to_owned());
        } else if terms.iter().any(|term| text.contains(term)) {
            score += exact_score / 4;
            matched_fields.push(field.to_owned());
        }
    }
    if title_lower.starts_with(query) {
        score += 40;
    }
    let snippet_source = if source_lower.contains(query)
        || (matched_fields.iter().any(|field| field == "source")
            && !description_lower.contains(query))
    {
        source_text
    } else {
        &task.description
    };
    Some(TaskSearchHit {
        id: task.id,
        project_id: task.project_id,
        project_title,
        title,
        snippet: compact_search_text(snippet_source, 240),
        urgency: task.urgency,
        status: task.status,
        updated_at: task.updated_at.to_rfc3339(),
        has_source: task.source.is_some(),
        matched_fields,
        version: task.version,
        score,
    })
}

fn compact_task_output(task: TaskSummary, project_title: String) -> CompactTaskOutput {
    let title = compact_search_text(
        task.description
            .lines()
            .find(|line| !line.trim().is_empty())
            .unwrap_or("Без названия"),
        120,
    )
    .trim_start_matches(['#', '-', '*', ' '])
    .to_owned();
    CompactTaskOutput {
        id: task.id,
        project_id: task.project_id,
        project_title,
        title,
        snippet: compact_search_text(&task.description, 180),
        urgency: task.urgency,
        status: task.status,
        updated_at: task.updated_at.to_rfc3339(),
        has_source: task.has_source,
        version: task.version,
    }
}

fn task_status_rank(status: &TaskStatus) -> u8 {
    match status {
        TaskStatus::Open => 0,
        TaskStatus::Completed => 1,
    }
}

fn task_urgency_rank(urgency: &Urgency) -> u8 {
    match urgency {
        Urgency::Urgent => 0,
        Urgency::Important => 1,
        Urgency::Normal => 2,
    }
}

fn compact_search_text(value: &str, max_chars: usize) -> String {
    let normalized = value.split_whitespace().collect::<Vec<_>>().join(" ");
    if normalized.chars().count() <= max_chars {
        return normalized;
    }
    let mut compact = normalized.chars().take(max_chars).collect::<String>();
    compact = compact.trim_end().to_owned();
    compact.push('…');
    compact
}

fn parse_snapshot(value: SnapshotArgs) -> Result<MessageSnapshot, String> {
    let sent_at = value
        .sent_at
        .map(|value| {
            value
                .parse()
                .map_err(|_| "sent_at должен быть в формате RFC 3339".to_string())
        })
        .transpose()?;
    Ok(MessageSnapshot {
        text: value.text,
        author: value.author,
        sent_at,
        url: value.url,
        provider: value.provider,
        chat_id: value.chat_id,
        chat_title: value.chat_title,
        message_id: value.message_id,
        message_ids: value.message_ids,
        media: value
            .media
            .into_iter()
            .map(parse_source_media)
            .collect::<Result<_, _>>()?,
    })
}

fn parse_source_media(value: SourceMediaArgs) -> Result<SourceMedia, String> {
    let kind = match value.kind.as_str() {
        "photo" => SourceMediaKind::Photo,
        "video" => SourceMediaKind::Video,
        "document" => SourceMediaKind::Document,
        "audio" => SourceMediaKind::Audio,
        "voice" => SourceMediaKind::Voice,
        "animation" => SourceMediaKind::Animation,
        "other" => SourceMediaKind::Other,
        _ => {
            return Err(
                "media.kind должен быть photo, video, document, audio, voice, animation или other"
                    .into(),
            );
        }
    };
    Ok(SourceMedia {
        kind,
        file_name: value.file_name,
        provider_file_id: value.provider_file_id,
        mime_type: value.mime_type,
        size: value.size,
        relative_path: value.relative_path,
    })
}

fn store_error(error: impl std::fmt::Display) -> String {
    error.to_string()
}

fn run_binary_self_check() -> SelfCheckResult {
    let started = Instant::now();
    let mut result = run_core_self_check();
    let tools = FloodServer::tool_router().list_all();
    let required_tools = [
        "get_workspace_brief",
        "diagnose_store",
        "inspect_attachment_storage",
        "list_projects",
        "list_tasks",
        "search_tasks",
        "get_task_digest",
        "get_telegram_sync_status",
        "request_telegram_sync",
        "run_self_check",
    ];
    let missing_tools = required_tools
        .iter()
        .filter(|name| !tools.iter().any(|tool| tool.name == **name))
        .copied()
        .collect::<Vec<_>>();
    result.checks.push(SelfCheckItem {
        name: "Реестр MCP-инструментов".into(),
        passed: missing_tools.is_empty(),
        detail: (!missing_tools.is_empty())
            .then(|| format!("Не найдены: {}", missing_tools.join(", "))),
    });

    let missing_output_schemas = tools
        .iter()
        .filter(|tool| tool.output_schema.is_none())
        .map(|tool| tool.name.as_ref())
        .collect::<Vec<_>>();
    result.checks.push(SelfCheckItem {
        name: "Структурированные ответы MCP".into(),
        passed: missing_output_schemas.is_empty(),
        detail: (!missing_output_schemas.is_empty())
            .then(|| format!("Нет output schema: {}", missing_output_schemas.join(", "))),
    });

    let unsafe_destructive = tools.iter().filter(|tool| {
        matches!(
            tool.name.as_ref(),
            "delete_project" | "delete_trashed_task" | "empty_trash"
        ) && tool
            .annotations
            .as_ref()
            .and_then(|annotations| annotations.destructive_hint)
            != Some(true)
    });
    let safety_ok = unsafe_destructive.count() == 0;
    result.checks.push(SelfCheckItem {
        name: "Аннотации безопасности MCP".into(),
        passed: safety_ok,
        detail: (!safety_ok).then(|| "Необратимый инструмент не помечен как destructive".into()),
    });
    result.passed = result.passed && result.checks.iter().all(|check| check.passed);
    result.duration_ms = started.elapsed().as_millis();
    result
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    match std::env::args().nth(1).as_deref() {
        Some("--version" | "-V") => {
            println!("{}", env!("CARGO_PKG_VERSION"));
            return Ok(());
        }
        Some("--self-check") => {
            println!("{}", serde_json::to_string(&run_binary_self_check())?);
            return Ok(());
        }
        Some(argument) => anyhow::bail!("неизвестный аргумент: {argument}"),
        None => {}
    }
    let server = FloodServer {
        store: Store::new(default_data_dir())?,
        allow_destructive: matches!(
            std::env::var("FLOOD_MCP_ALLOW_DESTRUCTIVE").as_deref(),
            Ok("1" | "true" | "yes")
        ),
    };
    let service = server.serve(stdio()).await?;
    service.waiting().await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use rmcp::handler::server::tool::IntoCallToolResult;
    use ulid::Ulid;

    fn server() -> FloodServer {
        FloodServer {
            store: Store::new(std::env::temp_dir().join(format!("flood-mcp-test-{}", Ulid::new())))
                .unwrap(),
            allow_destructive: false,
        }
    }

    #[test]
    fn binary_self_check_covers_the_mcp_surface() {
        let result = run_binary_self_check();
        assert!(result.passed, "{:?}", result.checks);
        for name in [
            "Реестр MCP-инструментов",
            "Структурированные ответы MCP",
            "Аннотации безопасности MCP",
        ] {
            assert!(
                result
                    .checks
                    .iter()
                    .any(|check| check.name == name && check.passed),
                "нет проверки {name}"
            );
        }
    }

    #[test]
    fn tools_expose_structured_schemas_and_safety_annotations() {
        let _server = server();
        let tools = FloodServer::tool_router().list_all();
        assert!(tools.iter().all(|tool| tool.output_schema.is_some()));
        for name in [
            "diagnose_store",
            "inspect_attachment_storage",
            "get_runtime_info",
            "get_workspace_brief",
            "run_self_check",
            "search_tasks",
            "get_task_digest",
            "get_telegram_sync_status",
            "request_telegram_sync",
            "list_telegram_inbox",
            "get_telegram_triage_batch",
            "apply_telegram_triage",
            "get_telegram_candidate",
            "create_task_from_telegram_candidate",
            "set_telegram_candidate_status",
        ] {
            assert!(
                tools.iter().any(|tool| tool.name == name),
                "нет MCP tool {name}"
            );
        }

        let list = tools
            .iter()
            .find(|tool| tool.name == "list_projects")
            .unwrap();
        assert_eq!(
            list.annotations
                .as_ref()
                .and_then(|value| value.read_only_hint),
            Some(true)
        );
        assert_eq!(
            list.annotations
                .as_ref()
                .and_then(|value| value.open_world_hint),
            Some(false)
        );

        let delete = tools
            .iter()
            .find(|tool| tool.name == "delete_project")
            .unwrap();
        assert_eq!(
            delete
                .annotations
                .as_ref()
                .and_then(|value| value.destructive_hint),
            Some(true)
        );

        let diagnostics = _server.diagnose_store().0;
        assert!(diagnostics.healthy, "{:?}", diagnostics.issues);
        let self_check = _server.run_self_check().0;
        assert!(self_check.passed, "{:?}", self_check.checks);
        let runtime = _server.get_runtime_info().0;
        assert_eq!(runtime.version, env!("CARGO_PKG_VERSION"));
        assert!(!runtime.destructive_actions_enabled);
        let brief = _server.get_workspace_brief().unwrap().0;
        assert_eq!(brief.brief_version, 2);
        assert!(brief.diagnostics.healthy);
        assert_eq!(brief.attachment_storage.total_files, 0);
        assert_eq!(brief.attachment_storage.orphaned_files, 0);
        assert!(brief.priority_tasks.tasks.is_empty());
        assert!(brief.suggested_tools.contains(&"create_project"));
        assert!(brief.suggested_tools.contains(&"run_self_check"));
        assert_eq!(
            _server.inspect_attachment_storage().unwrap().0,
            brief.attachment_storage
        );
    }

    #[test]
    fn telegram_sync_freshness_is_visible_to_agents() {
        let server = server();
        let initial = server.get_telegram_sync_status().unwrap().0;
        assert!(initial.status.is_none());
        assert_eq!(initial.phase, "never_synced");
        assert!(!initial.fresh);
        let status = TelegramSyncStatus {
            completed_at: chrono::Utc::now(),
            request_id: None,
            health: flood_core::TelegramSyncHealth::Partial,
            scanned_projects: 2,
            added_candidates: 4,
            downloaded_media: 1,
            failures: 1,
            errors: vec!["Один проект временно недоступен".into()],
        };
        server.store.record_telegram_sync_status(&status).unwrap();

        assert_eq!(
            server.get_telegram_sync_status().unwrap().0.status,
            Some(status)
        );
        let requested = server.request_telegram_sync().unwrap().0;
        assert!(requested.queued);
        let repeated = server.request_telegram_sync().unwrap().0;
        assert_eq!(repeated.request, requested.request);
        let sync_state = server.get_telegram_sync_status().unwrap().0;
        assert_eq!(sync_state.pending_request, Some(requested.request.clone()));
        assert_eq!(sync_state.phase, "queued");
        assert!(!sync_state.fresh);
        assert_eq!(
            server.store.telegram_sync_request().unwrap().unwrap(),
            requested.request
        );

        let old_request = TelegramSyncRequest {
            id: ulid::Ulid::new().to_string(),
            requested_at: chrono::Utc::now() - chrono::Duration::minutes(3),
        };
        let waiting = telegram_sync_output(None, Some(old_request));
        assert_eq!(waiting.phase, "waiting_for_desktop");
        assert!(waiting.pending_age_seconds.unwrap() >= 180);
        assert!(waiting.next_action.contains("Откройте flood.md"));
    }

    #[test]
    fn irreversible_actions_are_disabled_by_default() {
        let server = server();
        let project = server
            .create_project(Parameters(CreateProjectArgs {
                title: "Защищённый проект".into(),
            }))
            .unwrap()
            .0
            .project;
        let error = match server.delete_project(Parameters(VersionedArgs {
            id: project.id,
            expected_version: project.version,
        })) {
            Ok(_) => panic!("необратимое действие не должно быть доступно по умолчанию"),
            Err(error) => error,
        };
        assert!(error.contains("Необратимые MCP-действия отключены"));
    }

    #[test]
    fn irreversible_actions_require_explicit_server_mode() {
        let mut server = server();
        server.allow_destructive = true;
        let project = server
            .create_project(Parameters(CreateProjectArgs {
                title: "Удаляемый проект".into(),
            }))
            .unwrap()
            .0
            .project;
        assert!(
            server
                .delete_project(Parameters(VersionedArgs {
                    id: project.id,
                    expected_version: project.version,
                }))
                .unwrap()
                .0
                .success
        );
    }

    #[test]
    fn project_and_task_flow_returns_structured_content() {
        let server = server();
        let project = server
            .create_project(Parameters(CreateProjectArgs {
                title: "Работа".into(),
            }))
            .unwrap()
            .0
            .project;
        let task = server
            .create_task(Parameters(CreateTaskArgs {
                project_id: project.id.clone(),
                description: "Проверить MCP".into(),
                urgency: Some("important".into()),
                source: None,
            }))
            .unwrap();
        let task_id = task.0.task.id.clone();
        let result = task.into_call_tool_result().unwrap();
        let rmcp::model::CallToolResponse::Complete(result) = result else {
            panic!("ожидался завершённый результат");
        };
        assert!(result.structured_content.is_some());
        assert_eq!(result.is_error, Some(false));
        let second_task_id = server
            .create_task(Parameters(CreateTaskArgs {
                project_id: project.id,
                description: "Проверить пагинацию".into(),
                urgency: None,
                source: None,
            }))
            .unwrap()
            .0
            .task
            .id;
        let listed = server
            .list_tasks(Parameters(ListTasksArgs {
                project_id: None,
                include_completed: false,
                cursor: None,
                limit: Some(1),
            }))
            .unwrap()
            .0;
        assert_eq!(listed.total, 2);
        assert_eq!(listed.tasks.len(), 1);
        assert_eq!(listed.remaining, 1);
        assert!(listed.next_cursor.is_some());
        let second_page = server
            .list_tasks(Parameters(ListTasksArgs {
                project_id: None,
                include_completed: false,
                cursor: listed.next_cursor,
                limit: Some(1),
            }))
            .unwrap()
            .0;
        assert_eq!(second_page.tasks.len(), 1);
        assert_eq!(second_page.remaining, 0);
        assert!(second_page.next_cursor.is_none());
        let returned_ids = [listed.tasks[0].id.clone(), second_page.tasks[0].id.clone()];
        assert!(returned_ids.contains(&task_id));
        assert!(returned_ids.contains(&second_task_id));
    }

    #[test]
    fn task_search_is_ranked_bounded_and_includes_telegram_source() {
        let server = server();
        let project = server
            .create_project(Parameters(CreateProjectArgs {
                title: "Финансы".into(),
            }))
            .unwrap()
            .0
            .project;
        let source_task = server
            .create_task(Parameters(CreateTaskArgs {
                project_id: project.id.clone(),
                description: "Подготовить материалы к встрече".into(),
                urgency: Some("important".into()),
                source: Some(SnapshotArgs {
                    text: "Нужно проверить маржинальность по итогам квартала".into(),
                    author: Some("Анна".into()),
                    sent_at: None,
                    url: None,
                    provider: Some("telegram".into()),
                    chat_id: Some(-100),
                    chat_title: Some("Рабочий чат".into()),
                    message_id: Some(42),
                    message_ids: vec![42],
                    media: Vec::new(),
                }),
            }))
            .unwrap()
            .0
            .task;
        server
            .create_task(Parameters(CreateTaskArgs {
                project_id: project.id.clone(),
                description: "Сверить квартальный отчёт".into(),
                urgency: None,
                source: None,
            }))
            .unwrap();

        let source_matches = server
            .search_tasks(Parameters(SearchTasksArgs {
                query: "маржинальность".into(),
                project_id: None,
                include_completed: false,
                limit: None,
            }))
            .unwrap()
            .0;
        assert_eq!(source_matches.total_matches, 1);
        assert_eq!(source_matches.matches[0].id, source_task.id);
        assert!(
            source_matches.matches[0]
                .matched_fields
                .contains(&"source".into())
        );
        assert!(source_matches.matches[0].snippet.contains("маржинальность"));

        let bounded = server
            .search_tasks(Parameters(SearchTasksArgs {
                query: "Финансы".into(),
                project_id: Some(project.id),
                include_completed: false,
                limit: Some(1),
            }))
            .unwrap()
            .0;
        assert_eq!(bounded.total_matches, 2);
        assert_eq!(bounded.matches.len(), 1);
        assert!(bounded.truncated);
        assert!(
            server
                .search_tasks(Parameters(SearchTasksArgs {
                    query: "  ".into(),
                    project_id: None,
                    include_completed: false,
                    limit: None,
                }))
                .is_err()
        );
    }

    #[test]
    fn task_digest_prioritizes_urgent_work_and_paginates() {
        let server = server();
        let project = server
            .create_project(Parameters(CreateProjectArgs {
                title: "Релиз".into(),
            }))
            .unwrap()
            .0
            .project;
        for (description, urgency) in [
            ("Обычная задача", "normal"),
            ("Важная задача", "important"),
            ("Срочная задача", "urgent"),
        ] {
            server
                .create_task(Parameters(CreateTaskArgs {
                    project_id: project.id.clone(),
                    description: description.into(),
                    urgency: Some(urgency.into()),
                    source: None,
                }))
                .unwrap();
        }

        let first = server
            .get_task_digest(Parameters(TaskDigestArgs {
                project_id: Some(project.id.clone()),
                include_completed: false,
                urgencies: Vec::new(),
                cursor: None,
                limit: Some(2),
            }))
            .unwrap()
            .0;
        assert_eq!(first.counts.total, 3);
        assert_eq!(first.counts.urgent, 1);
        assert_eq!(first.tasks[0].urgency, Urgency::Urgent);
        assert_eq!(first.tasks[1].urgency, Urgency::Important);
        assert_eq!(first.remaining, 1);
        assert!(first.next_cursor.is_some());

        let second = server
            .get_task_digest(Parameters(TaskDigestArgs {
                project_id: Some(project.id),
                include_completed: false,
                urgencies: Vec::new(),
                cursor: first.next_cursor,
                limit: Some(2),
            }))
            .unwrap()
            .0;
        assert_eq!(second.tasks.len(), 1);
        assert_eq!(second.tasks[0].urgency, Urgency::Normal);
        assert_eq!(second.remaining, 0);
        assert!(second.next_cursor.is_none());
    }

    #[test]
    fn telegram_candidate_tools_cover_the_full_inbox_flow() {
        let server = server();
        let project = server
            .create_project(Parameters(CreateProjectArgs {
                title: "Telegram проект".into(),
            }))
            .unwrap()
            .0
            .project;
        let candidate_id = format!("telegram:{}:-10042:77", project.id);
        let candidate: TelegramInboxCandidate = serde_json::from_value(serde_json::json!({
            "id": candidate_id,
            "project_id": project.id,
            "chat_id": -10042,
            "chat_title": "Рабочий чат",
            "message_id": 77,
            "text": "Подготовить итог встречи",
            "author": "Коллега",
            "sent_at": "2026-09-10T10:00:00Z",
            "url": "https://t.me/c/42/77",
            "reason": "mention",
            "status": "pending",
            "media": [{
                "kind": "photo",
                "file_name": "photo-77.jpg",
                "provider_file_id": 701,
                "mime_type": "image/jpeg",
                "size": 2048
            }],
            "discovered_at": "2026-09-10T10:01:00Z"
        }))
        .unwrap();
        let older_candidate_id = format!("telegram:{}:-10042:76", project.id);
        let older_candidate: TelegramInboxCandidate = serde_json::from_value(serde_json::json!({
            "id": older_candidate_id,
            "project_id": project.id,
            "chat_id": -10042,
            "chat_title": "Рабочий чат",
            "message_id": 76,
            "text": "Проверить предыдущий вопрос",
            "author": "Коллега",
            "sent_at": "2026-09-10T09:00:00Z",
            "reason": "reply",
            "status": "pending",
            "media": [],
            "discovered_at": "2026-09-10T09:01:00Z"
        }))
        .unwrap();
        server
            .store
            .upsert_telegram_candidates(vec![candidate, older_candidate])
            .unwrap();

        let listed = server
            .list_telegram_inbox(Parameters(ListTelegramInboxArgs {
                project_id: Some(project.id.clone()),
                include_processed: false,
                cursor: None,
                limit: Some(1),
            }))
            .unwrap()
            .0;
        assert_eq!(listed.candidates.len(), 1);
        assert_eq!(listed.total, 2);
        assert_eq!(listed.remaining, 1);
        assert_eq!(listed.next_cursor.as_deref(), Some(candidate_id.as_str()));
        let second_page = server
            .list_telegram_inbox(Parameters(ListTelegramInboxArgs {
                project_id: Some(project.id.clone()),
                include_processed: false,
                cursor: listed.next_cursor,
                limit: Some(1),
            }))
            .unwrap()
            .0;
        assert_eq!(second_page.candidates.len(), 1);
        assert_eq!(second_page.candidates[0].id, older_candidate_id);
        assert_eq!(second_page.remaining, 0);
        assert!(second_page.next_cursor.is_none());

        let batch = server
            .get_telegram_triage_batch(Parameters(TelegramTriageBatchArgs {
                project_id: Some(project.id.clone()),
                cursor: None,
                limit: Some(1),
            }))
            .unwrap()
            .0;
        assert_eq!(batch.candidates.len(), 1);
        assert_eq!(batch.candidates[0].id, candidate_id);
        assert_eq!(batch.remaining, 1);
        assert_eq!(batch.next_cursor.as_deref(), Some(candidate_id.as_str()));
        let kept = server
            .apply_telegram_triage(Parameters(ApplyTelegramTriageArgs {
                decisions: vec![TelegramTriageDecisionArgs {
                    candidate_id: candidate_id.clone(),
                    action: "keep".into(),
                    title: None,
                    notes: None,
                    urgency: None,
                }],
            }))
            .unwrap()
            .0;
        assert_eq!(kept.kept, 1);
        assert_eq!(kept.failed, 0);

        let read = server
            .get_telegram_candidate(Parameters(CandidateIdArgs {
                candidate_id: candidate_id.clone(),
            }))
            .unwrap()
            .0
            .candidate;
        assert_eq!(read.media.len(), 1);
        assert_eq!(read.media[0].provider_file_id, Some(701));

        let dismissed = server
            .set_telegram_candidate_status(Parameters(SetCandidateStatusArgs {
                candidate_id: candidate_id.clone(),
                status: "dismissed".into(),
            }))
            .unwrap()
            .0
            .candidate;
        assert_eq!(dismissed.status, InboxCandidateStatus::Dismissed);
        let continued = server
            .get_telegram_triage_batch(Parameters(TelegramTriageBatchArgs {
                project_id: Some(project.id.clone()),
                cursor: batch.next_cursor,
                limit: Some(1),
            }))
            .unwrap()
            .0;
        assert_eq!(continued.candidates.len(), 1);
        assert_eq!(continued.candidates[0].id, older_candidate_id);
        assert_eq!(continued.remaining, 0);
        let dismissed_batch = server
            .apply_telegram_triage(Parameters(ApplyTelegramTriageArgs {
                decisions: vec![TelegramTriageDecisionArgs {
                    candidate_id: older_candidate_id,
                    action: "dismiss".into(),
                    title: None,
                    notes: None,
                    urgency: None,
                }],
            }))
            .unwrap()
            .0;
        assert_eq!(dismissed_batch.dismissed, 1);
        assert_eq!(dismissed_batch.failed, 0);
        assert!(
            server
                .create_task_from_telegram_candidate(Parameters(CreateTaskFromCandidateArgs {
                    candidate_id: candidate_id.clone(),
                    description: None,
                    title: None,
                    notes: None,
                    urgency: None,
                }))
                .is_err()
        );

        server
            .set_telegram_candidate_status(Parameters(SetCandidateStatusArgs {
                candidate_id: candidate_id.clone(),
                status: "pending".into(),
            }))
            .unwrap();
        let missing_title = server
            .apply_telegram_triage(Parameters(ApplyTelegramTriageArgs {
                decisions: vec![TelegramTriageDecisionArgs {
                    candidate_id: candidate_id.clone(),
                    action: "create_task".into(),
                    title: None,
                    notes: None,
                    urgency: None,
                }],
            }))
            .unwrap()
            .0;
        assert_eq!(missing_title.created, 0);
        assert_eq!(missing_title.failed, 1);
        let applied = server
            .apply_telegram_triage(Parameters(ApplyTelegramTriageArgs {
                decisions: vec![TelegramTriageDecisionArgs {
                    candidate_id: candidate_id.clone(),
                    action: "create_task".into(),
                    title: Some("Подготовить итог встречи".into()),
                    notes: Some("Сверить решения и ответственных".into()),
                    urgency: Some("important".into()),
                }],
            }))
            .unwrap()
            .0;
        assert_eq!(applied.created, 1);
        assert_eq!(applied.failed, 0);
        let task = applied.results[0].task.clone().unwrap();
        assert_eq!(
            task.description,
            "Подготовить итог встречи\n\nСверить решения и ответственных"
        );
        assert_eq!(task.urgency, Urgency::Important);
        let source = task.source.as_ref().unwrap();
        assert_eq!(source.chat_id, Some(-10042));
        assert_eq!(source.media.len(), 1);
        let processed = server
            .list_telegram_inbox(Parameters(ListTelegramInboxArgs {
                project_id: Some(project.id.clone()),
                include_processed: true,
                cursor: None,
                limit: None,
            }))
            .unwrap()
            .0
            .candidates;
        assert_eq!(processed[0].linked_task.as_ref().unwrap().id, task.id);
        assert_eq!(
            processed[0].linked_task.as_ref().unwrap().urgency,
            Urgency::Important
        );

        let repeated = server
            .create_task_from_telegram_candidate(Parameters(CreateTaskFromCandidateArgs {
                candidate_id,
                description: Some("Не создавать дубль".into()),
                title: None,
                notes: None,
                urgency: Some("urgent".into()),
            }))
            .unwrap()
            .0
            .task;
        assert_eq!(repeated.id, task.id);
        assert!(
            server
                .list_telegram_inbox(Parameters(ListTelegramInboxArgs {
                    project_id: Some(project.id),
                    include_processed: false,
                    cursor: None,
                    limit: None,
                }))
                .unwrap()
                .0
                .candidates
                .is_empty()
        );
    }
}
