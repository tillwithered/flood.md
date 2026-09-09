use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Chat {
    pub id: String,
    pub title: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Urgency {
    Normal,
    Important,
    Urgent,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    Open,
    Completed,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct MessageSnapshot {
    pub text: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub author: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sent_at: Option<DateTime<Utc>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Task {
    pub id: String,
    pub chat_id: String,
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

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct TaskSummary {
    pub id: String,
    pub chat_id: String,
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
            chat_id: task.chat_id,
            description: task.description,
            created_at: task.created_at,
            updated_at: task.updated_at,
            urgency: task.urgency,
            status: task.status,
            has_source: task.source.is_some(),
            source_author: task.source.as_ref().and_then(|source| source.author.clone()),
            trashed_at: task.trashed_at,
            version: task.version,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTask {
    pub chat_id: String,
    pub description: String,
    #[serde(default = "default_urgency")]
    pub urgency: Urgency,
    #[serde(default)]
    pub source: Option<MessageSnapshot>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TaskPatch {
    pub description: Option<String>,
    pub urgency: Option<Urgency>,
    pub status: Option<TaskStatus>,
    pub source: Option<Option<MessageSnapshot>>,
}

fn default_urgency() -> Urgency {
    Urgency::Normal
}
