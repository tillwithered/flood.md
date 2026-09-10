use flood_core::{
    CreateTask, InboxCandidateStatus, MessageSnapshot, Project, SelfCheckResult, SourceMedia,
    SourceMediaKind, Store, StoreDiagnostics, Task, TaskPatch, TaskStatus, TaskSummary,
    TelegramInboxCandidate, Urgency, default_data_dir, run_self_check as run_core_self_check,
};
use rmcp::{
    Json, ServiceExt, handler::server::wrapper::Parameters, schemars, tool, tool_router,
    transport::stdio,
};
use serde::{Deserialize, Serialize};

#[derive(Clone)]
struct FloodServer {
    store: Store,
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
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
struct TelegramCandidateOutput {
    candidate: TelegramInboxCandidate,
}

#[tool_router(server_handler)]
impl FloodServer {
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
        self.store
            .delete_project(&args.id, &args.expected_version)
            .map(|_| Json(MutationOutput { success: true }))
            .map_err(store_error)
    }

    #[tool(
        description = "Получить задачи одного проекта или всех проектов",
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
    ) -> Result<Json<TasksOutput>, String> {
        self.store
            .list_tasks(args.project_id.as_deref(), args.include_completed)
            .map(|tasks| Json(TasksOutput { tasks }))
            .map_err(store_error)
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
        description = "Получить локальную очередь Telegram-кандидатов. По умолчанию возвращаются только необработанные сообщения; include_processed=true также возвращает обработанные сообщения со linked_task, где видны название, срочность и текущее состояние задачи",
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
        self.store
            .list_telegram_inbox(args.project_id.as_deref(), args.include_processed)
            .map(|candidates| Json(TelegramInboxOutput { candidates }))
            .map_err(store_error)
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
        let description = match (args.description, args.title, args.notes) {
            (Some(description), _, _) => Some(description),
            (None, Some(title), notes) => {
                let title = title.trim();
                if title.is_empty() {
                    return Err("title не может быть пустым".into());
                }
                Some(
                    match notes
                        .map(|notes| notes.trim().to_owned())
                        .filter(|notes| !notes.is_empty())
                    {
                        Some(notes) => format!("{title}\n\n{notes}"),
                        None => title.to_owned(),
                    },
                )
            }
            (None, None, _) => None,
        };
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
        self.store
            .empty_trash()
            .map(|deleted| Json(DeleteCountOutput { deleted }))
            .map_err(store_error)
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

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let server = FloodServer {
        store: Store::new(default_data_dir())?,
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
        }
    }

    #[test]
    fn tools_expose_structured_schemas_and_safety_annotations() {
        let _server = server();
        let tools = FloodServer::tool_router().list_all();
        assert!(tools.iter().all(|tool| tool.output_schema.is_some()));
        for name in [
            "diagnose_store",
            "run_self_check",
            "list_telegram_inbox",
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
                project_id: project.id,
                description: "Проверить MCP".into(),
                urgency: Some("important".into()),
                source: None,
            }))
            .unwrap();
        let result = task.into_call_tool_result().unwrap();
        let rmcp::model::CallToolResponse::Complete(result) = result else {
            panic!("ожидался завершённый результат");
        };
        assert!(result.structured_content.is_some());
        assert_eq!(result.is_error, Some(false));
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
        server
            .store
            .upsert_telegram_candidates(vec![candidate])
            .unwrap();

        let listed = server
            .list_telegram_inbox(Parameters(ListTelegramInboxArgs {
                project_id: Some(project.id.clone()),
                include_processed: false,
            }))
            .unwrap()
            .0;
        assert_eq!(listed.candidates.len(), 1);

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
        let task = server
            .create_task_from_telegram_candidate(Parameters(CreateTaskFromCandidateArgs {
                candidate_id: candidate_id.clone(),
                description: None,
                title: Some("Подготовить итог встречи".into()),
                notes: Some("Сверить решения и ответственных".into()),
                urgency: Some("important".into()),
            }))
            .unwrap()
            .0
            .task;
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
                }))
                .unwrap()
                .0
                .candidates
                .is_empty()
        );
    }
}
