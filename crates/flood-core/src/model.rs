use chrono::{DateTime, Utc};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct Project {
    pub id: String,
    pub title: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub telegram_chats: Vec<TelegramProjectLink>,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct TelegramProjectLink {
    pub chat_id: i64,
    pub title: String,
    #[serde(default)]
    pub inbox_mode: TelegramInboxMode,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TelegramInboxMode {
    Manual,
    #[default]
    MentionsAndReplies,
    All,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SourceMediaKind {
    Photo,
    Video,
    Document,
    Audio,
    Voice,
    Animation,
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct SourceMedia {
    pub kind: SourceMediaKind,
    pub file_name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub provider_file_id: Option<i32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub mime_type: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub size: Option<u64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub relative_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Urgency {
    Normal,
    Important,
    Urgent,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    Open,
    Completed,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct TelegramLinkedTask {
    pub id: String,
    pub title: String,
    pub urgency: Urgency,
    pub status: TaskStatus,
    pub trashed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct MessageSnapshot {
    pub text: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub author: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sent_at: Option<DateTime<Utc>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub provider: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub chat_id: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub chat_title: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub message_id: Option<i64>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub message_ids: Vec<i64>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub media: Vec<SourceMedia>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum InboxCandidateReason {
    Manual,
    Mention,
    Reply,
    LinkedChat,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum InboxCandidateStatus {
    Pending,
    Dismissed,
    Imported,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TelegramSyncHealth {
    Success,
    Partial,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct TelegramSyncStatus {
    pub completed_at: DateTime<Utc>,
    pub health: TelegramSyncHealth,
    pub scanned_projects: usize,
    pub added_candidates: usize,
    pub downloaded_media: usize,
    pub failures: usize,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct TelegramInboxCandidate {
    pub id: String,
    pub project_id: String,
    pub chat_id: i64,
    pub chat_title: String,
    pub message_id: i64,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub message_ids: Vec<i64>,
    pub text: String,
    pub author: String,
    pub sent_at: DateTime<Utc>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    pub reason: InboxCandidateReason,
    pub status: InboxCandidateStatus,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub media: Vec<SourceMedia>,
    pub discovered_at: DateTime<Utc>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub processed_at: Option<DateTime<Utc>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub task_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub linked_task: Option<TelegramLinkedTask>,
}

impl TelegramInboxCandidate {
    pub fn snapshot(&self) -> MessageSnapshot {
        MessageSnapshot {
            text: self.text.clone(),
            author: Some(self.author.clone()),
            sent_at: Some(self.sent_at),
            url: self.url.clone(),
            provider: Some("telegram".into()),
            chat_id: Some(self.chat_id),
            chat_title: Some(self.chat_title.clone()),
            message_id: Some(self.message_id),
            message_ids: if self.message_ids.is_empty() {
                vec![self.message_id]
            } else {
                self.message_ids.clone()
            },
            media: self.media.clone(),
        }
    }
}

impl From<&Task> for TelegramLinkedTask {
    fn from(task: &Task) -> Self {
        Self {
            id: task.id.clone(),
            title: task
                .description
                .lines()
                .find(|line| !line.trim().is_empty())
                .map(str::trim)
                .unwrap_or("Без названия")
                .to_owned(),
            urgency: task.urgency.clone(),
            status: task.status.clone(),
            trashed: task.trashed_at.is_some(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct Task {
    pub id: String,
    #[serde(alias = "chat_id")]
    pub project_id: String,
    pub description: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub urgency: Urgency,
    pub status: TaskStatus,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source: Option<MessageSnapshot>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub trashed_at: Option<DateTime<Utc>>,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct TaskSummary {
    pub id: String,
    pub project_id: String,
    pub description: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub urgency: Urgency,
    pub status: TaskStatus,
    pub has_source: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_author: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub trashed_at: Option<DateTime<Utc>>,
    pub version: String,
}

impl From<Task> for TaskSummary {
    fn from(task: Task) -> Self {
        Self {
            id: task.id,
            project_id: task.project_id,
            description: task.description,
            created_at: task.created_at,
            updated_at: task.updated_at,
            urgency: task.urgency,
            status: task.status,
            has_source: task.source.is_some(),
            source_author: task
                .source
                .as_ref()
                .and_then(|source| source.author.clone()),
            trashed_at: task.trashed_at,
            version: task.version,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct CreateTask {
    #[serde(alias = "chat_id")]
    pub project_id: String,
    pub description: String,
    #[serde(default = "default_urgency")]
    pub urgency: Urgency,
    #[serde(default)]
    pub source: Option<MessageSnapshot>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, Default)]
pub struct TaskPatch {
    pub description: Option<String>,
    pub urgency: Option<Urgency>,
    pub status: Option<TaskStatus>,
    pub source: Option<Option<MessageSnapshot>>,
}

fn default_urgency() -> Urgency {
    Urgency::Normal
}
