use flood_core::{
    CreateTask, MessageSnapshot, Store, TaskPatch, TaskStatus, Urgency, default_data_dir,
};
use rmcp::{
    ServiceExt, handler::server::wrapper::Parameters, schemars, tool, tool_router, transport::stdio,
};
use serde::Deserialize;

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
    chat_id: Option<String>,
    #[serde(default)]
    include_completed: bool,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct CreateChatArgs {
    title: String,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct UpdateChatArgs {
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
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct CreateTaskArgs {
    chat_id: String,
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
struct CompleteTaskArgs {
    id: String,
    expected_version: String,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct VersionedTaskArgs {
    id: String,
    expected_version: String,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
struct MoveTaskArgs {
    id: String,
    chat_id: String,
    expected_version: String,
}

#[tool_router(server_handler)]
impl FloodServer {
    #[tool(description = "Получить список проектов")]
    fn list_chats(&self) -> String {
        json(self.store.list_chats())
    }

    #[tool(description = "Прочитать проект по стабильному идентификатору")]
    fn get_chat(&self, Parameters(args): Parameters<IdArgs>) -> String {
        json(self.store.get_chat(&args.id))
    }

    #[tool(description = "Создать проект для задач")]
    fn create_chat(&self, Parameters(args): Parameters<CreateChatArgs>) -> String {
        json(self.store.create_chat(&args.title))
    }

    #[tool(description = "Переименовать проект. expected_version возьмите из get_chat или list_chats")]
    fn update_chat(&self, Parameters(args): Parameters<UpdateChatArgs>) -> String {
        json(
            self.store
                .update_chat(&args.id, &args.title, &args.expected_version),
        )
    }

    #[tool(
        description = "Окончательно удалить проект и все его задачи; передайте актуальный expected_version"
    )]
    fn delete_chat(&self, Parameters(args): Parameters<VersionedTaskArgs>) -> String {
        json(self.store.delete_chat(&args.id, &args.expected_version))
    }

    #[tool(description = "Получить задачи выбранного проекта или всех проектов")]
    fn list_tasks(&self, Parameters(args): Parameters<ListTasksArgs>) -> String {
        json(
            self.store
                .list_tasks(args.chat_id.as_deref(), args.include_completed),
        )
    }

    #[tool(description = "Прочитать задачу и её локальный снимок исходного сообщения")]
    fn get_task(&self, Parameters(args): Parameters<IdArgs>) -> String {
        json(self.store.get_task(&args.id))
    }

    #[tool(description = "Получить задачи из корзины")]
    fn list_trashed_tasks(&self) -> String {
        json(self.store.list_trashed_tasks())
    }

    #[tool(description = "Создать открытую задачу. urgency: normal, important или urgent")]
    fn create_task(&self, Parameters(args): Parameters<CreateTaskArgs>) -> String {
        let input: Result<CreateTask, String> = (|| {
            Ok(CreateTask {
                chat_id: args.chat_id,
                description: args.description,
                urgency: parse_urgency(args.urgency.as_deref().unwrap_or("normal"))?,
                source: args.source.map(parse_snapshot).transpose()?,
            })
        })();
        match input {
            Ok(input) => json(self.store.create_task(input)),
            Err(error) => error_json(error),
        }
    }

    #[tool(
        description = "Изменить задачу. status: open или completed; передайте актуальный expected_version"
    )]
    fn update_task(&self, Parameters(args): Parameters<UpdateTaskArgs>) -> String {
        let patch: Result<TaskPatch, String> = (|| {
            let source = if args.clear_source {
                Some(None)
            } else {
                args.source.map(parse_snapshot).transpose()?.map(Some)
            };
            Ok(TaskPatch {
                description: args.description,
                urgency: args.urgency.as_deref().map(parse_urgency).transpose()?,
                status: args.status.as_deref().map(parse_status).transpose()?,
                source,
            })
        })();
        match patch {
            Ok(patch) => json(
                self.store
                    .update_task(&args.id, patch, &args.expected_version),
            ),
            Err(error) => error_json(error),
        }
    }

    #[tool(description = "Отметить задачу выполненной; передайте актуальный expected_version")]
    fn complete_task(&self, Parameters(args): Parameters<CompleteTaskArgs>) -> String {
        json(self.store.complete_task(&args.id, &args.expected_version))
    }

    #[tool(description = "Переместить задачу в другой проект")]
    fn move_task(&self, Parameters(args): Parameters<MoveTaskArgs>) -> String {
        json(
            self.store
                .move_task(&args.id, &args.chat_id, &args.expected_version),
        )
    }

    #[tool(description = "Переместить задачу в восстанавливаемую корзину")]
    fn trash_task(&self, Parameters(args): Parameters<VersionedTaskArgs>) -> String {
        json(self.store.trash_task(&args.id, &args.expected_version))
    }

    #[tool(description = "Восстановить задачу из корзины")]
    fn restore_task(&self, Parameters(args): Parameters<VersionedTaskArgs>) -> String {
        json(self.store.restore_task(&args.id, &args.expected_version))
    }

    #[tool(description = "Окончательно удалить одну задачу из корзины")]
    fn delete_trashed_task(&self, Parameters(args): Parameters<VersionedTaskArgs>) -> String {
        json(
            self.store
                .delete_trashed_task(&args.id, &args.expected_version),
        )
    }

    #[tool(description = "Окончательно удалить все задачи из корзины")]
    fn empty_trash(&self) -> String {
        json(self.store.empty_trash())
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
    })
}

fn json<T: serde::Serialize, E: std::fmt::Display>(result: Result<T, E>) -> String {
    match result {
        Ok(value) => serde_json::to_string_pretty(&value)
            .unwrap_or_else(|error| error_json(error.to_string())),
        Err(error) => error_json(error.to_string()),
    }
}

fn error_json(error: impl std::fmt::Display) -> String {
    serde_json::json!({ "error": error.to_string() }).to_string()
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
