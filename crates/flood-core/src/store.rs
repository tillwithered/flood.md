use crate::{
    ActivityAction, ActivityEntityKind, ActivityEvent, ActivityProvenance, ActivitySource,
    AgentRun, AgentRunPatch, AgentRunState, AutomationEvent, AutomationEventOutcome,
    AutomationEventState, AutomationProvider, AutomationSettings, CreateTask, InboxCandidateReason,
    InboxCandidateStatus, MessageSnapshot, Project, ProjectAutomationPolicy,
    ProjectKnowledgeProposal, ProjectKnowledgeProposalPayload, ProjectKnowledgeProposalState,
    ProjectKnowledgeProposalTarget, ProjectResource, ProjectResourceKind, ProjectWorkspaceItem,
    ProjectWorkspaceItemKind, ProjectWorkspaceRevision, SourceMedia, SourceMediaKind, Task,
    TaskBatchAction, TaskBatchOperation, TaskBatchOperationResult, TaskBatchOutcome,
    TaskBatchReference, TaskPatch, TaskStatus, TaskSummary, TelegramAgentCheckpoint,
    TelegramChatSnapshot, TelegramContextMessage, TelegramInboxCandidate, TelegramLinkedTask,
    TelegramMediaRequest, TelegramMediaRequestState, TelegramProjectLink, TelegramSyncRequest,
    TelegramSyncStatus, Urgency,
};
use atomic_write_file::AtomicWriteFile;
use chrono::Utc;
use fs2::FileExt;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize, de::DeserializeOwned};
use sha2::{Digest, Sha256};
use std::{
    cmp::Reverse,
    collections::{HashMap, HashSet},
    env,
    fs::{self, File, OpenOptions},
    io::{Read, Write},
    path::{Path, PathBuf},
    time::Instant,
};
use thiserror::Error;
use ulid::Ulid;
use zip::{ZipArchive, ZipWriter, write::SimpleFileOptions};

const FORMAT_VERSION: u8 = 1;
const MAX_ATTACHMENT_BYTES: u64 = 25 * 1024 * 1024;
const MAX_MARKDOWN_FILE_BYTES: u64 = 1024 * 1024;
const MAX_TELEGRAM_INBOX_BYTES: u64 = 64 * 1024 * 1024;
const MAX_INTEGRATION_STATE_BYTES: u64 = 64 * 1024;
const MAX_ACTIVITY_BYTES: u64 = 2 * 1024 * 1024;
const MAX_ACTIVITY_EVENTS: usize = 500;
const MAX_KNOWLEDGE_PROPOSAL_BYTES: u64 = 1024 * 1024;
const MAX_TELEGRAM_CHAT_MESSAGES: usize = 100;
const MAX_TELEGRAM_MEDIA_REQUESTS: usize = 20;
const MAX_AGENT_IMAGE_BYTES: u64 = 8 * 1024 * 1024;
const MAX_AGENT_RUNS_BYTES: u64 = 2 * 1024 * 1024;
const MAX_AGENT_RUNS: usize = 500;
const MAX_AUTOMATION_EVENTS_BYTES: u64 = 2 * 1024 * 1024;
const MAX_AUTOMATION_EVENTS: usize = 1_000;
const MAX_AUTOMATION_SETTINGS_BYTES: u64 = 16 * 1024;
const MAX_AUTOMATION_EVENT_ATTEMPTS: u8 = 3;
const AUTOMATION_EVENT_LEASE_MINUTES: i64 = 15;
const AUTOMATION_EVENT_GROUP_WINDOW_SECONDS: i64 = 120;
const MAX_TASK_BATCH_OPERATIONS: usize = 25;
const MAX_TASK_BATCH_RECEIPT_BYTES: u64 = 4 * 1024 * 1024;
const PROJECT_MEMORY_COMPACT_TARGET: usize = 100;
const MAX_PROJECT_MEMORY_ENTRIES: usize = 200;
const MAX_PROJECT_WORKSPACE_ITEMS: usize = 100;
const MAX_PROJECT_WORKSPACE_REVISIONS: usize = 8;
const MAX_PROJECT_WORKSPACE_CONTENT_CHARS: usize = 80_000;

#[derive(Debug, Error)]
pub enum StoreError {
    #[error("объект не найден: {0}")]
    NotFound(String),
    #[error("данные изменились в другом процессе; обновите список и повторите")]
    Conflict,
    #[error("некорректные данные: {0}")]
    Validation(String),
    #[error("повреждён Markdown-файл {path}: {message}")]
    InvalidFile { path: String, message: String },
    #[error("ошибка файловой системы: {0}")]
    Io(#[from] std::io::Error),
    #[error("ошибка YAML: {0}")]
    Yaml(#[from] serde_yaml::Error),
    #[error("ошибка JSON: {0}")]
    Json(#[from] serde_json::Error),
    #[error("ошибка резервной копии: {0}")]
    Backup(String),
}

impl StoreError {
    pub const fn code(&self) -> &'static str {
        match self {
            Self::Conflict => "conflict",
            Self::NotFound(_) => "not_found",
            Self::Validation(_) => "validation",
            Self::InvalidFile { .. } => "invalid_file",
            Self::Io(_) => "io",
            Self::Yaml(_) => "yaml",
            Self::Json(_) => "json",
            Self::Backup(_) => "backup",
        }
    }
}

#[derive(Clone, Debug)]
pub struct Store {
    root: PathBuf,
}

#[derive(Clone, Debug, Serialize, JsonSchema)]
pub struct StoreDiagnostics {
    pub healthy: bool,
    pub root: String,
    pub format_version: u8,
    pub project_count: usize,
    pub linked_chat_count: usize,
    pub open_task_count: usize,
    pub completed_task_count: usize,
    pub trashed_task_count: usize,
    pub pending_inbox_count: usize,
    pub pending_automation_event_count: usize,
    pub failed_automation_event_count: usize,
    pub issues: Vec<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct AttachmentCleanupReport {
    pub total_files: usize,
    pub total_bytes: u64,
    pub orphaned_files: usize,
    pub orphaned_bytes: u64,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct AttachmentCleanupResult {
    pub removed_files: usize,
    pub removed_bytes: u64,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct TelegramInboxPage {
    pub candidates: Vec<TelegramInboxCandidate>,
    pub total: usize,
    pub next_cursor: Option<String>,
    pub remaining: usize,
}

#[derive(Clone, Debug)]
pub struct RecordActivity {
    pub source: ActivitySource,
    pub action: ActivityAction,
    pub entity_kind: ActivityEntityKind,
    pub entity_id: Option<String>,
    pub project_id: Option<String>,
    pub reversible: bool,
}

#[derive(Clone, Debug)]
pub struct CreateTelegramDiscussionTask {
    pub project_id: String,
    pub chat_id: i64,
    pub target_message_id: i64,
    pub context_message_ids: Vec<i64>,
    pub description: String,
    pub urgency: Urgency,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct ActivityPage {
    pub events: Vec<ActivityEvent>,
    pub total: usize,
    pub next_cursor: Option<String>,
    pub remaining: usize,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct AutomationEventPage {
    pub events: Vec<AutomationEvent>,
    pub total: usize,
    pub next_cursor: Option<String>,
    pub remaining: usize,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct AutomationEventClaim {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub claim_token: Option<String>,
    pub events: Vec<AutomationEvent>,
    pub remaining: usize,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct CreateOutcome<T> {
    pub value: T,
    pub created: bool,
}

struct AttachmentScan {
    report: AttachmentCleanupReport,
    orphaned: Vec<(PathBuf, u64)>,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct SelfCheckItem {
    pub name: String,
    pub passed: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct SelfCheckResult {
    pub passed: bool,
    pub duration_ms: u128,
    pub checks: Vec<SelfCheckItem>,
}

#[derive(Serialize, Deserialize)]
struct ProjectDocument {
    format_version: u8,
    id: String,
    title: String,
    created_at: chrono::DateTime<Utc>,
    updated_at: chrono::DateTime<Utc>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    telegram: Option<TelegramProjectLink>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    telegram_chats: Vec<TelegramProjectLink>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    telegram_participants: Vec<crate::TelegramParticipantRole>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    resources: Vec<ProjectResource>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    memory: Vec<crate::ProjectMemoryEntry>,
}

#[derive(Serialize, Deserialize)]
struct ProjectWorkspaceItemDocument {
    format_version: u8,
    id: String,
    project_id: String,
    kind: ProjectWorkspaceItemKind,
    title: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    summary: Option<String>,
    #[serde(default)]
    agent_access: bool,
    created_at: chrono::DateTime<Utc>,
    updated_at: chrono::DateTime<Utc>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    revisions: Vec<ProjectWorkspaceRevision>,
}

#[derive(Default, Serialize, Deserialize)]
struct TelegramInboxDocument {
    #[serde(default = "inbox_format_version")]
    format_version: u8,
    #[serde(default)]
    candidates: Vec<TelegramInboxCandidate>,
}

#[derive(Default, Serialize, Deserialize)]
struct TelegramChatsDocument {
    #[serde(default = "telegram_chats_format_version")]
    format_version: u8,
    #[serde(default)]
    chats: Vec<TelegramChatSnapshot>,
}

#[derive(Default, Serialize, Deserialize)]
struct TelegramAgentCheckpointsDocument {
    #[serde(default = "telegram_agent_checkpoints_format_version")]
    format_version: u8,
    #[serde(default)]
    checkpoints: Vec<TelegramAgentCheckpoint>,
}

#[derive(Default, Serialize, Deserialize)]
struct TelegramMediaRequestsDocument {
    #[serde(default = "telegram_media_requests_format_version")]
    format_version: u8,
    #[serde(default)]
    requests: Vec<TelegramMediaRequest>,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct TelegramChatPage {
    pub chat_id: i64,
    pub title: String,
    pub synced_at: chrono::DateTime<Utc>,
    pub messages: Vec<crate::TelegramContextMessage>,
    pub oldest_message_id: Option<i64>,
    pub newest_message_id: Option<i64>,
    pub has_older: bool,
    pub has_newer: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct TelegramMessageContextPage {
    pub chat_id: i64,
    pub title: String,
    pub synced_at: chrono::DateTime<Utc>,
    pub requested_message_id: i64,
    pub target_message_id: i64,
    pub target_index: usize,
    pub messages: Vec<crate::TelegramContextMessage>,
    pub returned_before: usize,
    pub returned_after: usize,
    pub reply_parent_added: bool,
    pub media_count: usize,
    pub has_older: bool,
    pub has_newer: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct TelegramUpdatesPage {
    pub chat_id: i64,
    pub title: String,
    pub synced_at: chrono::DateTime<Utc>,
    pub checkpoint_message_id: Option<i64>,
    pub messages: Vec<crate::TelegramContextMessage>,
    pub latest_available_message_id: Option<i64>,
    pub remaining: usize,
    pub initial_window: bool,
    pub initial_window_truncated: bool,
    pub checkpoint_before_cache: bool,
}

#[derive(Default, Serialize, Deserialize)]
struct ActivityDocument {
    #[serde(default = "activity_format_version")]
    format_version: u8,
    #[serde(default)]
    events: Vec<ActivityEvent>,
}

#[derive(Default, Serialize, Deserialize)]
struct AgentRunsDocument {
    #[serde(default = "agent_runs_format_version")]
    format_version: u8,
    #[serde(default)]
    runs: Vec<AgentRun>,
}

#[derive(Default, Serialize, Deserialize)]
struct AutomationEventsDocument {
    #[serde(default = "automation_events_format_version")]
    format_version: u8,
    #[serde(default)]
    events: Vec<AutomationEvent>,
}

fn inbox_format_version() -> u8 {
    1
}

fn telegram_chats_format_version() -> u8 {
    1
}

fn telegram_agent_checkpoints_format_version() -> u8 {
    1
}

fn telegram_media_requests_format_version() -> u8 {
    1
}

fn activity_format_version() -> u8 {
    1
}

fn agent_runs_format_version() -> u8 {
    1
}

fn automation_events_format_version() -> u8 {
    1
}

#[derive(Serialize, Deserialize)]
struct TaskDocument {
    format_version: u8,
    id: String,
    #[serde(alias = "chat_id")]
    project_id: String,
    created_at: chrono::DateTime<Utc>,
    updated_at: chrono::DateTime<Utc>,
    urgency: crate::Urgency,
    status: TaskStatus,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    relations: Vec<crate::TaskRelation>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    checkpoints: Vec<crate::TaskCheckpoint>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    source: Option<crate::MessageSnapshot>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    trashed_at: Option<chrono::DateTime<Utc>>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct TaskBatchReceipt {
    format_version: u8,
    request_id: String,
    payload_digest: String,
    applied: bool,
    operations: Vec<TaskBatchOperationResult>,
    #[serde(default)]
    task_ids: Vec<String>,
    #[serde(default)]
    tasks: Vec<Task>,
}

struct StoreLock(File);

impl Drop for StoreLock {
    fn drop(&mut self) {
        let _ = self.0.unlock();
    }
}

pub fn default_data_dir() -> PathBuf {
    if let Some(path) = env::var_os("FLOOD_DATA_DIR").filter(|value| !value.is_empty()) {
        return PathBuf::from(path);
    }
    if cfg!(target_os = "windows")
        && let Some(path) = env::var_os("APPDATA")
    {
        return PathBuf::from(path).join("io.flood.desktop");
    }
    if let Some(path) = env::var_os("XDG_DATA_HOME") {
        return PathBuf::from(path).join("flood.md");
    }
    env::current_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("flood-data")
}

impl Store {
    pub fn new(root: impl Into<PathBuf>) -> Result<Self, StoreError> {
        let store = Self { root: root.into() };
        fs::create_dir_all(&store.root)?;
        let lock_path = store.root.join(".flood.lock");
        OpenOptions::new()
            .create(true)
            .truncate(false)
            .read(true)
            .write(true)
            .open(lock_path)?;
        let migration_lock = store.lock_exclusive()?;
        store.migrate_legacy_layout()?;
        store.recover_task_batches_locked()?;
        drop(migration_lock);
        Ok(store)
    }

    pub fn root(&self) -> &Path {
        &self.root
    }

    pub fn record_activity(&self, input: RecordActivity) -> Result<ActivityEvent, StoreError> {
        self.record_activity_inner(input, None)
    }

    pub fn record_activity_with_provenance(
        &self,
        input: RecordActivity,
        provenance: ActivityProvenance,
    ) -> Result<ActivityEvent, StoreError> {
        self.record_activity_inner(input, Some(provenance))
    }

    fn record_activity_inner(
        &self,
        input: RecordActivity,
        provenance: Option<ActivityProvenance>,
    ) -> Result<ActivityEvent, StoreError> {
        validate_activity_reference(
            &input.entity_kind,
            input.entity_id.as_deref(),
            input.project_id.as_deref(),
        )?;
        let _lock = self.lock_exclusive()?;
        let mut document = self.read_activity()?;
        let event = ActivityEvent {
            id: Ulid::new().to_string(),
            occurred_at: Utc::now(),
            source: input.source,
            action: input.action,
            entity_kind: input.entity_kind,
            entity_id: input.entity_id,
            project_id: input.project_id,
            reversible: input.reversible,
            provenance,
        };
        document.events.push(event.clone());
        compact_activity(&mut document);
        self.write_activity(&document)?;
        Ok(event)
    }

    pub fn list_activity(
        &self,
        cursor: Option<&str>,
        limit: usize,
    ) -> Result<ActivityPage, StoreError> {
        if !(1..=100).contains(&limit) {
            return Err(StoreError::Validation(
                "размер порции журнала должен быть от 1 до 100".into(),
            ));
        }
        if let Some(cursor) = cursor {
            validate_id(cursor)?;
        }
        let _lock = self.lock_shared()?;
        let mut events = self.read_activity()?.events;
        events.sort_by(|left, right| {
            right
                .occurred_at
                .cmp(&left.occurred_at)
                .then_with(|| right.id.cmp(&left.id))
        });
        let total = events.len();
        let start = match cursor {
            Some(cursor) => events
                .iter()
                .position(|event| event.id == cursor)
                .map(|index| index + 1)
                .ok_or_else(|| {
                    StoreError::Validation(
                        "курсор не найден в текущем журнале; начните заново".into(),
                    )
                })?,
            None => 0,
        };
        let mut page = events
            .into_iter()
            .skip(start)
            .take(limit)
            .collect::<Vec<_>>();
        let remaining = total.saturating_sub(start + page.len());
        let next_cursor = (remaining > 0)
            .then(|| page.last().map(|event| event.id.clone()))
            .flatten();
        page.shrink_to_fit();
        Ok(ActivityPage {
            events: page,
            total,
            next_cursor,
            remaining,
        })
    }

    pub fn list_automation_events(
        &self,
        project_id: Option<&str>,
        state: Option<AutomationEventState>,
        cursor: Option<&str>,
        limit: usize,
    ) -> Result<AutomationEventPage, StoreError> {
        if !(1..=100).contains(&limit) {
            return Err(StoreError::Validation(
                "размер порции событий должен быть от 1 до 100".into(),
            ));
        }
        if let Some(project_id) = project_id {
            validate_id(project_id)?;
        }
        if let Some(cursor) = cursor {
            validate_id(cursor)?;
        }
        let _lock = self.lock_shared()?;
        let mut events = self
            .read_automation_events()?
            .events
            .into_iter()
            .filter(|event| project_id.is_none_or(|id| event.project_id == id))
            .filter(|event| state.as_ref().is_none_or(|state| &event.state == state))
            .collect::<Vec<_>>();
        events.sort_by(|left, right| {
            left.occurred_at
                .cmp(&right.occurred_at)
                .then_with(|| left.id.cmp(&right.id))
        });
        let total = events.len();
        let start = match cursor {
            Some(cursor) => events
                .iter()
                .position(|event| event.id == cursor)
                .map(|index| index + 1)
                .ok_or_else(|| {
                    StoreError::Validation(
                        "курсор не найден в текущей очереди событий; начните заново".into(),
                    )
                })?,
            None => 0,
        };
        let page = events
            .into_iter()
            .skip(start)
            .take(limit)
            .collect::<Vec<_>>();
        let remaining = total.saturating_sub(start + page.len());
        let next_cursor = (remaining > 0)
            .then(|| page.last().map(|event| event.id.clone()))
            .flatten();
        Ok(AutomationEventPage {
            events: page,
            total,
            next_cursor,
            remaining,
        })
    }

    pub fn get_automation_event(&self, id: &str) -> Result<AutomationEvent, StoreError> {
        validate_id(id)?;
        let _lock = self.lock_shared()?;
        self.read_automation_events()?
            .events
            .into_iter()
            .find(|event| event.id == id)
            .ok_or_else(|| StoreError::NotFound(id.to_owned()))
    }

    pub fn automation_settings(&self) -> Result<AutomationSettings, StoreError> {
        let _lock = self.lock_shared()?;
        self.read_automation_settings()
    }

    pub fn set_background_ai_triage(
        &self,
        enabled: bool,
    ) -> Result<AutomationSettings, StoreError> {
        let _lock = self.lock_exclusive()?;
        let mut settings = self.read_automation_settings()?;
        settings.background_ai_triage = enabled;
        settings.updated_at = Some(Utc::now());
        self.write_automation_settings(&settings)?;
        Ok(settings)
    }

    pub fn set_automation_provider(
        &self,
        provider: AutomationProvider,
    ) -> Result<AutomationSettings, StoreError> {
        let _lock = self.lock_exclusive()?;
        let mut settings = self.read_automation_settings()?;
        settings.provider = provider;
        settings.updated_at = Some(Utc::now());
        self.write_automation_settings(&settings)?;
        Ok(settings)
    }

    /// Establishes a clean opt-in boundary for background AI. Messages that
    /// accumulated while automation was disabled stay in the visible inbox,
    /// but are not silently submitted to a model after the user turns it on.
    pub fn baseline_pending_automation_events(&self) -> Result<usize, StoreError> {
        let _lock = self.lock_exclusive()?;
        let mut document = self.read_automation_events()?;
        let now = Utc::now();
        let mut skipped = 0;
        for event in &mut document.events {
            if event.state != AutomationEventState::Pending {
                continue;
            }
            event.state = AutomationEventState::Processed;
            event.attempts = 0;
            event.processing_started_at = None;
            event.claim_token = None;
            event.retry_at = None;
            event.processed_at = Some(now);
            event.outcome = Some(AutomationEventOutcome::SkippedWhileOff);
            event.related_task_id = None;
            event.error = None;
            skipped += 1;
        }
        if skipped > 0 {
            compact_automation_events(&mut document)?;
            self.write_automation_events(&document)?;
        }
        Ok(skipped)
    }

    pub fn project_automation_policy(
        &self,
        project_id: &str,
    ) -> Result<ProjectAutomationPolicy, StoreError> {
        validate_id(project_id)?;
        let _lock = self.lock_shared()?;
        if !self.project_path(project_id).exists() {
            return Err(StoreError::NotFound(project_id.to_owned()));
        }
        Ok(self
            .read_automation_settings()?
            .projects
            .into_iter()
            .find(|policy| policy.project_id == project_id)
            .unwrap_or_else(|| ProjectAutomationPolicy::disabled(project_id)))
    }

    pub fn set_project_auto_run(
        &self,
        project_id: &str,
        enabled: bool,
    ) -> Result<ProjectAutomationPolicy, StoreError> {
        validate_id(project_id)?;
        let _lock = self.lock_exclusive()?;
        let project = read_project(&self.project_path(project_id))
            .map_err(|error| map_missing(error, project_id))?;
        if enabled
            && !project.resources.iter().any(|resource| {
                resource.agent_access
                    && matches!(
                        resource.kind,
                        ProjectResourceKind::Repository | ProjectResourceKind::Directory
                    )
                    && Path::new(resource.location.trim()).is_dir()
            })
        {
            return Err(StoreError::Validation(
                "для автоматического выполнения добавьте доступную локальную папку или репозиторий и включите доступ для агента".into(),
            ));
        }
        let now = Utc::now();
        let mut settings = self.read_automation_settings()?;
        settings
            .projects
            .retain(|policy| policy.project_id != project_id);
        let policy = ProjectAutomationPolicy {
            project_id: project_id.to_owned(),
            auto_run_created_tasks: enabled,
            updated_at: Some(now),
        };
        if enabled {
            settings.projects.push(policy.clone());
        }
        settings.updated_at = Some(now);
        self.write_automation_settings(&settings)?;
        Ok(policy)
    }

    /// Atomically claims one short burst of related events. A batch always
    /// belongs to one project and connector so one agent run receives a
    /// coherent, bounded context instead of one process per message.
    pub fn claim_automation_event_batch(
        &self,
        project_id: Option<&str>,
        limit: usize,
    ) -> Result<AutomationEventClaim, StoreError> {
        if !(1..=25).contains(&limit) {
            return Err(StoreError::Validation(
                "размер пакета автоматизации должен быть от 1 до 25".into(),
            ));
        }
        if let Some(project_id) = project_id {
            validate_id(project_id)?;
        }
        let _lock = self.lock_exclusive()?;
        let now = Utc::now();
        let mut document = self.read_automation_events()?;
        let mut changed = recover_stale_automation_event_claims(&mut document, now);
        let seed = document
            .events
            .iter()
            .filter(|event| {
                event.state == AutomationEventState::Pending
                    && event.retry_at.is_none_or(|retry_at| retry_at <= now)
                    && project_id.is_none_or(|id| event.project_id == id)
            })
            .min_by(|left, right| {
                left.occurred_at
                    .cmp(&right.occurred_at)
                    .then_with(|| left.id.cmp(&right.id))
            })
            .cloned();
        let Some(seed) = seed else {
            if changed {
                compact_automation_events(&mut document)?;
                self.write_automation_events(&document)?;
            }
            return Ok(AutomationEventClaim {
                claim_token: None,
                events: Vec::new(),
                remaining: document
                    .events
                    .iter()
                    .filter(|event| event.state == AutomationEventState::Pending)
                    .count(),
            });
        };
        let group_end =
            seed.occurred_at + chrono::Duration::seconds(AUTOMATION_EVENT_GROUP_WINDOW_SECONDS);
        let mut selected_ids = document
            .events
            .iter()
            .filter(|event| {
                event.state == AutomationEventState::Pending
                    && event.retry_at.is_none_or(|retry_at| retry_at <= now)
                    && event.project_id == seed.project_id
                    && event.connector_id == seed.connector_id
                    && event.occurred_at <= group_end
            })
            .map(|event| (event.occurred_at, event.id.clone()))
            .collect::<Vec<_>>();
        selected_ids.sort();
        selected_ids.truncate(limit);
        let claim_token = Ulid::new().to_string();
        let mut claimed = Vec::with_capacity(selected_ids.len());
        for (_, id) in selected_ids {
            let event = document
                .events
                .iter_mut()
                .find(|event| event.id == id)
                .expect("selected automation event still exists");
            event.state = AutomationEventState::Processing;
            event.attempts = event.attempts.saturating_add(1);
            event.processing_started_at = Some(now);
            event.claim_token = Some(claim_token.clone());
            event.retry_at = None;
            event.error = None;
            claimed.push(event.clone());
        }
        changed = true;
        if changed {
            compact_automation_events(&mut document)?;
            self.write_automation_events(&document)?;
        }
        let remaining = document
            .events
            .iter()
            .filter(|event| event.state == AutomationEventState::Pending)
            .count();
        Ok(AutomationEventClaim {
            claim_token: Some(claim_token),
            events: claimed,
            remaining,
        })
    }

    pub fn resolve_automation_event(
        &self,
        id: &str,
        claim_token: &str,
        outcome: AutomationEventOutcome,
        related_task_id: Option<&str>,
    ) -> Result<AutomationEvent, StoreError> {
        self.resolve_automation_event_with_detail(id, claim_token, outcome, related_task_id, None)
    }

    pub fn resolve_automation_event_with_detail(
        &self,
        id: &str,
        claim_token: &str,
        outcome: AutomationEventOutcome,
        related_task_id: Option<&str>,
        detail: Option<&str>,
    ) -> Result<AutomationEvent, StoreError> {
        validate_id(id)?;
        validate_id(claim_token)?;
        if let Some(task_id) = related_task_id {
            validate_id(task_id)?;
        }
        let detail = detail
            .map(|value| clean_required(value, "итог обработки события", 1_000))
            .transpose()?;
        if outcome != AutomationEventOutcome::NeedsData && detail.is_some() {
            return Err(StoreError::Validation(
                "уточнение допустимо только для результата needs_data".into(),
            ));
        }
        let _lock = self.lock_exclusive()?;
        let mut document = self.read_automation_events()?;
        let event_index = document
            .events
            .iter()
            .position(|event| event.id == id)
            .ok_or_else(|| StoreError::NotFound(id.to_owned()))?;
        let event_project_id = document.events[event_index].project_id.clone();
        let outcome_requires_task = matches!(
            outcome,
            AutomationEventOutcome::TaskCreatedOrLinked
                | AutomationEventOutcome::TaskUpdated
                | AutomationEventOutcome::Duplicate
                | AutomationEventOutcome::AgentQueued
        );
        if outcome_requires_task && related_task_id.is_none() {
            return Err(StoreError::Validation(
                "для этого результата нужен идентификатор связанной задачи".into(),
            ));
        }
        if let Some(task_id) = related_task_id {
            let task = self.find_task(task_id)?;
            if task.project_id != event_project_id {
                return Err(StoreError::Validation(
                    "связанная задача принадлежит другому проекту".into(),
                ));
            }
        }
        let event = &mut document.events[event_index];
        if event.state == AutomationEventState::Processed
            && event.outcome == Some(outcome)
            && event.related_task_id.as_deref() == related_task_id
            && event.detail == detail
        {
            return Ok(event.clone());
        }
        ensure_automation_claim(event, claim_token)?;
        event.state = AutomationEventState::Processed;
        event.processing_started_at = None;
        event.claim_token = None;
        event.retry_at = None;
        event.processed_at = Some(Utc::now());
        event.outcome = Some(outcome);
        event.related_task_id = related_task_id.map(str::to_owned);
        event.detail = detail;
        event.error = None;
        let resolved = event.clone();
        compact_automation_events(&mut document)?;
        self.write_automation_events(&document)?;
        Ok(resolved)
    }

    pub fn fail_automation_event(
        &self,
        id: &str,
        claim_token: &str,
        error: &str,
        retryable: bool,
    ) -> Result<AutomationEvent, StoreError> {
        validate_id(id)?;
        validate_id(claim_token)?;
        let error = clean_required(error, "ошибка обработки события", 2_000)?.to_owned();
        let _lock = self.lock_exclusive()?;
        let mut document = self.read_automation_events()?;
        let event = document
            .events
            .iter_mut()
            .find(|event| event.id == id)
            .ok_or_else(|| StoreError::NotFound(id.to_owned()))?;
        ensure_automation_claim(event, claim_token)?;
        event.processing_started_at = None;
        event.claim_token = None;
        event.processed_at = None;
        event.outcome = None;
        event.related_task_id = None;
        event.error = Some(error);
        if retryable && event.attempts < MAX_AUTOMATION_EVENT_ATTEMPTS {
            event.state = AutomationEventState::Pending;
            let backoff_minutes = i64::from(event.attempts).pow(2).max(1);
            event.retry_at = Some(Utc::now() + chrono::Duration::minutes(backoff_minutes));
        } else {
            event.state = AutomationEventState::Failed;
            event.retry_at = None;
        }
        let failed = event.clone();
        compact_automation_events(&mut document)?;
        self.write_automation_events(&document)?;
        Ok(failed)
    }

    pub fn answer_automation_event(
        &self,
        id: &str,
        answer: &str,
    ) -> Result<AutomationEvent, StoreError> {
        validate_id(id)?;
        let answer = clean_required(answer, "ответ на уточнение", 1_000)?;
        let _lock = self.lock_exclusive()?;
        let mut document = self.read_automation_events()?;
        let event = document
            .events
            .iter_mut()
            .find(|event| event.id == id)
            .ok_or_else(|| StoreError::NotFound(id.to_owned()))?;
        if event.state != AutomationEventState::Processed
            || event.outcome != Some(AutomationEventOutcome::NeedsData)
        {
            return Err(StoreError::Validation(
                "это событие не ожидает уточнения".into(),
            ));
        }
        event.state = AutomationEventState::Pending;
        event.attempts = 0;
        event.processing_started_at = None;
        event.claim_token = None;
        event.retry_at = None;
        event.processed_at = None;
        event.outcome = None;
        event.related_task_id = None;
        event.detail = Some(answer);
        event.error = None;
        let answered = event.clone();
        self.write_automation_events(&document)?;
        Ok(answered)
    }

    /// Returns exhausted automation events to the queue after the user has
    /// fixed the underlying problem. Processed events remain untouched, so
    /// retrying cannot recreate work that already completed successfully.
    pub fn retry_failed_automation_events(&self) -> Result<usize, StoreError> {
        let _lock = self.lock_exclusive()?;
        let mut document = self.read_automation_events()?;
        let mut retried = 0;
        for event in &mut document.events {
            if event.state != AutomationEventState::Failed {
                continue;
            }
            event.state = AutomationEventState::Pending;
            event.attempts = 0;
            event.processing_started_at = None;
            event.claim_token = None;
            event.retry_at = None;
            event.processed_at = None;
            event.outcome = None;
            event.related_task_id = None;
            event.error = None;
            retried += 1;
        }
        if retried > 0 {
            compact_automation_events(&mut document)?;
            self.write_automation_events(&document)?;
        }
        Ok(retried)
    }

    pub fn diagnostics(&self) -> StoreDiagnostics {
        let mut diagnostics = StoreDiagnostics {
            healthy: true,
            root: self.root.to_string_lossy().into_owned(),
            format_version: FORMAT_VERSION,
            project_count: 0,
            linked_chat_count: 0,
            open_task_count: 0,
            completed_task_count: 0,
            trashed_task_count: 0,
            pending_inbox_count: 0,
            pending_automation_event_count: 0,
            failed_automation_event_count: 0,
            issues: Vec::new(),
        };

        match self.list_projects() {
            Ok(projects) => {
                diagnostics.project_count = projects.len();
                diagnostics.linked_chat_count = projects
                    .iter()
                    .map(|project| project.telegram_chats.len())
                    .sum();
            }
            Err(error) => diagnostics
                .issues
                .push(format!("Не удалось прочитать проекты: {error}")),
        }
        match self.list_tasks(None, true) {
            Ok(tasks) => {
                diagnostics.open_task_count = tasks
                    .iter()
                    .filter(|task| task.status == TaskStatus::Open)
                    .count();
                diagnostics.completed_task_count = tasks
                    .iter()
                    .filter(|task| task.status == TaskStatus::Completed)
                    .count();
            }
            Err(error) => diagnostics
                .issues
                .push(format!("Не удалось прочитать задачи: {error}")),
        }
        match self.list_trashed_tasks() {
            Ok(tasks) => diagnostics.trashed_task_count = tasks.len(),
            Err(error) => diagnostics
                .issues
                .push(format!("Не удалось прочитать корзину: {error}")),
        }
        match self.list_telegram_inbox(None, false) {
            Ok(candidates) => diagnostics.pending_inbox_count = candidates.len(),
            Err(error) => diagnostics
                .issues
                .push(format!("Не удалось прочитать входящие Telegram: {error}")),
        }
        match (
            self.list_automation_events(None, Some(AutomationEventState::Pending), None, 1),
            self.list_automation_events(None, Some(AutomationEventState::Failed), None, 1),
        ) {
            (Ok(pending), Ok(failed)) => {
                diagnostics.pending_automation_event_count = pending.total;
                diagnostics.failed_automation_event_count = failed.total;
            }
            (Err(error), _) | (_, Err(error)) => diagnostics.issues.push(format!(
                "Не удалось прочитать очередь автоматизации: {error}"
            )),
        }
        if let Err(error) = self.list_activity(None, 1) {
            diagnostics
                .issues
                .push(format!("Не удалось прочитать журнал действий: {error}"));
        }
        diagnostics.healthy = diagnostics.issues.is_empty();
        diagnostics
    }

    fn migrate_legacy_layout(&self) -> Result<(), StoreError> {
        let legacy_root = self.root.join("chats");
        let projects_root = self.projects_dir();
        if legacy_root.is_dir() && !projects_root.exists() {
            fs::rename(&legacy_root, &projects_root)?;
        } else if legacy_root.is_dir() {
            for entry in fs::read_dir(&legacy_root)? {
                let entry = entry?;
                let destination = projects_root.join(entry.file_name());
                if destination.exists() {
                    return Err(StoreError::Validation(format!(
                        "найдены одновременно старые и новые данные проекта {}",
                        entry.file_name().to_string_lossy()
                    )));
                }
                fs::rename(entry.path(), destination)?;
            }
            fs::remove_dir(&legacy_root)?;
        }
        fs::create_dir_all(&projects_root)?;

        for entry in fs::read_dir(&projects_root)? {
            let project_dir = entry?.path();
            if !project_dir.is_dir() {
                continue;
            }
            let old_document = project_dir.join("chat.md");
            let new_document = project_dir.join("project.md");
            if old_document.is_file() && !new_document.exists() {
                fs::rename(old_document, new_document)?;
            }
            let tasks_dir = project_dir.join("tasks");
            if !tasks_dir.is_dir() {
                continue;
            }
            for task_entry in fs::read_dir(tasks_dir)? {
                let task_path = task_entry?.path();
                if task_path.extension().and_then(|value| value.to_str()) != Some("md") {
                    continue;
                }
                let content = read_limited_utf8(&task_path, MAX_MARKDOWN_FILE_BYTES)?;
                if !content.contains("\nproject_id:") && content.contains("\nchat_id:") {
                    atomic_write(
                        &task_path,
                        &content.replacen("\nchat_id:", "\nproject_id:", 1),
                    )?;
                }
            }
        }
        Ok(())
    }

    pub fn list_projects(&self) -> Result<Vec<Project>, StoreError> {
        let _lock = self.lock_shared()?;
        let mut projects = Vec::new();
        for entry in fs::read_dir(self.projects_dir())? {
            let entry = entry?;
            if entry.file_type()?.is_dir() {
                let path = entry.path().join("project.md");
                if path.exists() {
                    projects.push(read_project(&path)?);
                }
            }
        }
        projects.sort_by_key(|project| project.title.to_lowercase());
        Ok(projects)
    }

    pub fn get_project(&self, id: &str) -> Result<Project, StoreError> {
        validate_id(id)?;
        let _lock = self.lock_shared()?;
        let path = self.project_path(id);
        if !path.exists() {
            return Err(StoreError::NotFound(id.to_owned()));
        }
        read_project(&path)
    }

    pub fn create_project(&self, title: &str) -> Result<Project, StoreError> {
        let title = clean_required(title, "название проекта", 120)?;
        let _lock = self.lock_exclusive()?;
        self.create_project_locked(Ulid::new().to_string(), title)
    }

    pub fn create_project_idempotent(
        &self,
        title: &str,
        request_id: &str,
    ) -> Result<CreateOutcome<Project>, StoreError> {
        let title = clean_required(title, "название проекта", 120)?;
        let request_id = clean_required(request_id, "request_id", 200)?;
        let id = deterministic_id("project", &request_id);
        let _lock = self.lock_exclusive()?;
        let path = self.project_path(&id);
        if path.is_file() {
            let value = read_project(&path)?;
            if value.title != title {
                return Err(StoreError::Validation(
                    "request_id уже использован для другого проекта".into(),
                ));
            }
            return Ok(CreateOutcome {
                value,
                created: false,
            });
        }
        self.create_project_locked(id, title)
            .map(|value| CreateOutcome {
                value,
                created: true,
            })
    }

    fn create_project_locked(&self, id: String, title: String) -> Result<Project, StoreError> {
        let now = Utc::now();
        let project = Project {
            id,
            title,
            context: String::new(),
            resources: Vec::new(),
            memory: Vec::new(),
            created_at: now,
            updated_at: now,
            telegram_chats: Vec::new(),
            telegram_participants: Vec::new(),
            version: String::new(),
        };
        fs::create_dir_all(self.task_dir(&project.id))?;
        self.write_project(&project)?;
        read_project(&self.project_path(&project.id))
    }

    pub fn update_project(
        &self,
        id: &str,
        title: &str,
        expected_version: &str,
    ) -> Result<Project, StoreError> {
        validate_id(id)?;
        let title = clean_required(title, "название проекта", 120)?;
        let _lock = self.lock_exclusive()?;
        let mut project =
            read_project(&self.project_path(id)).map_err(|error| map_missing(error, id))?;
        ensure_version(&project.version, expected_version)?;
        project.title = title;
        project.updated_at = Utc::now();
        self.write_project(&project)?;
        read_project(&self.project_path(id))
    }

    pub fn update_project_context(
        &self,
        id: &str,
        context: &str,
        expected_version: &str,
    ) -> Result<Project, StoreError> {
        validate_id(id)?;
        if context.len() > 200_000 {
            return Err(StoreError::Validation(
                "контекст проекта превышает допустимые 200 КБ".into(),
            ));
        }
        let _lock = self.lock_exclusive()?;
        let mut project =
            read_project(&self.project_path(id)).map_err(|error| map_missing(error, id))?;
        ensure_version(&project.version, expected_version)?;
        project.context = context.trim().to_owned();
        project.updated_at = Utc::now();
        self.write_project(&project)?;
        read_project(&self.project_path(id))
    }

    pub fn set_project_resources(
        &self,
        id: &str,
        mut resources: Vec<ProjectResource>,
        expected_version: &str,
    ) -> Result<Project, StoreError> {
        validate_id(id)?;
        normalize_project_resources(&mut resources);
        validate_project_resources(&resources)?;
        let _lock = self.lock_exclusive()?;
        let mut project =
            read_project(&self.project_path(id)).map_err(|error| map_missing(error, id))?;
        ensure_version(&project.version, expected_version)?;
        project.resources = resources;
        project.updated_at = Utc::now();
        self.write_project(&project)?;
        read_project(&self.project_path(id))
    }

    pub fn update_project_details(
        &self,
        id: &str,
        context: &str,
        mut resources: Vec<ProjectResource>,
        expected_version: &str,
    ) -> Result<Project, StoreError> {
        validate_id(id)?;
        if context.len() > 200_000 {
            return Err(StoreError::Validation(
                "контекст проекта превышает допустимые 200 КБ".into(),
            ));
        }
        normalize_project_resources(&mut resources);
        validate_project_resources(&resources)?;
        let _lock = self.lock_exclusive()?;
        let mut project =
            read_project(&self.project_path(id)).map_err(|error| map_missing(error, id))?;
        ensure_version(&project.version, expected_version)?;
        project.context = context.trim().to_owned();
        project.resources = resources;
        project.updated_at = Utc::now();
        self.write_project(&project)?;
        read_project(&self.project_path(id))
    }

    pub fn list_project_workspace_items(
        &self,
        project_id: &str,
        kind: Option<ProjectWorkspaceItemKind>,
    ) -> Result<Vec<ProjectWorkspaceItem>, StoreError> {
        validate_id(project_id)?;
        self.get_project(project_id)?;
        self.list_project_workspace_items_unchecked(project_id, kind)
    }

    fn list_project_workspace_items_unchecked(
        &self,
        project_id: &str,
        kind: Option<ProjectWorkspaceItemKind>,
    ) -> Result<Vec<ProjectWorkspaceItem>, StoreError> {
        let kinds = kind.map_or_else(
            || {
                vec![
                    ProjectWorkspaceItemKind::Document,
                    ProjectWorkspaceItemKind::Rule,
                    ProjectWorkspaceItemKind::Skill,
                ]
            },
            |kind| vec![kind],
        );
        let mut items = Vec::new();
        for kind in kinds {
            let directory = self.project_workspace_kind_dir(project_id, kind);
            if !directory.is_dir() {
                continue;
            }
            for entry in fs::read_dir(directory)? {
                let path = entry?.path();
                if path.extension().and_then(|value| value.to_str()) == Some("md") {
                    items.push(read_project_workspace_item(&path)?);
                }
            }
        }
        items.sort_by_key(|item| Reverse(item.updated_at));
        Ok(items)
    }

    pub fn get_project_workspace_item(
        &self,
        project_id: &str,
        id: &str,
    ) -> Result<ProjectWorkspaceItem, StoreError> {
        validate_id(project_id)?;
        validate_id(id)?;
        for kind in [
            ProjectWorkspaceItemKind::Document,
            ProjectWorkspaceItemKind::Rule,
            ProjectWorkspaceItemKind::Skill,
        ] {
            let path = self.project_workspace_item_path(project_id, kind, id);
            if path.exists() {
                return read_project_workspace_item(&path);
            }
        }
        Err(StoreError::NotFound(id.to_owned()))
    }

    #[allow(clippy::too_many_arguments)]
    pub fn create_project_workspace_item_idempotent(
        &self,
        project_id: &str,
        kind: ProjectWorkspaceItemKind,
        title: &str,
        summary: Option<&str>,
        content: &str,
        agent_access: bool,
        request_id: &str,
    ) -> Result<CreateOutcome<ProjectWorkspaceItem>, StoreError> {
        validate_id(project_id)?;
        let request_id = clean_required(request_id, "request_id", 200)?;
        let id = deterministic_id("project-workspace-item", &request_id);
        let title = clean_required(title, "название", 120)?;
        let summary = clean_optional(summary, "описание", 500)?;
        let content = clean_workspace_content(content)?;
        let _lock = self.lock_exclusive()?;
        read_project(&self.project_path(project_id))
            .map_err(|error| map_missing(error, project_id))?;
        if let Ok(existing) = self.get_project_workspace_item(project_id, &id) {
            if existing.kind != kind
                || existing.title != title
                || existing.summary != summary
                || existing.content != content
                || existing.agent_access != agent_access
            {
                return Err(StoreError::Validation(
                    "request_id уже использован для другого элемента проекта".into(),
                ));
            }
            return Ok(CreateOutcome {
                value: existing,
                created: false,
            });
        }
        if self
            .list_project_workspace_items_unchecked(project_id, None)?
            .len()
            >= MAX_PROJECT_WORKSPACE_ITEMS
        {
            return Err(StoreError::Validation(format!(
                "в проекте может быть не более {MAX_PROJECT_WORKSPACE_ITEMS} элементов контекста"
            )));
        }
        let now = Utc::now();
        let item = ProjectWorkspaceItem {
            id,
            project_id: project_id.to_owned(),
            kind,
            title,
            summary,
            content,
            agent_access,
            created_at: now,
            updated_at: now,
            revisions: Vec::new(),
            version: String::new(),
        };
        self.write_project_workspace_item(&item)?;
        let value = self.get_project_workspace_item(project_id, &item.id)?;
        Ok(CreateOutcome {
            value,
            created: true,
        })
    }

    #[allow(clippy::too_many_arguments)]
    pub fn update_project_workspace_item(
        &self,
        project_id: &str,
        id: &str,
        title: &str,
        summary: Option<&str>,
        content: &str,
        agent_access: bool,
        expected_version: &str,
    ) -> Result<ProjectWorkspaceItem, StoreError> {
        validate_id(project_id)?;
        validate_id(id)?;
        let title = clean_required(title, "название", 120)?;
        let summary = clean_optional(summary, "описание", 500)?;
        let content = clean_workspace_content(content)?;
        let _lock = self.lock_exclusive()?;
        let mut item = self.get_project_workspace_item(project_id, id)?;
        ensure_version(&item.version, expected_version)?;
        if item.title == title
            && item.summary == summary
            && item.content == content
            && item.agent_access == agent_access
        {
            return Ok(item);
        }
        item.revisions.push(ProjectWorkspaceRevision {
            title: item.title.clone(),
            summary: item.summary.clone(),
            content: item.content.clone(),
            agent_access: item.agent_access,
            changed_at: Utc::now(),
        });
        if item.revisions.len() > MAX_PROJECT_WORKSPACE_REVISIONS {
            item.revisions.drain(
                0..item
                    .revisions
                    .len()
                    .saturating_sub(MAX_PROJECT_WORKSPACE_REVISIONS),
            );
        }
        item.title = title;
        item.summary = summary;
        item.content = content;
        item.agent_access = agent_access;
        item.updated_at = Utc::now();
        self.write_project_workspace_item(&item)?;
        self.get_project_workspace_item(project_id, id)
    }

    pub fn rollback_project_workspace_item(
        &self,
        project_id: &str,
        id: &str,
        revision_index: usize,
        expected_version: &str,
    ) -> Result<ProjectWorkspaceItem, StoreError> {
        validate_id(project_id)?;
        validate_id(id)?;
        let _lock = self.lock_exclusive()?;
        let mut item = self.get_project_workspace_item(project_id, id)?;
        ensure_version(&item.version, expected_version)?;
        if revision_index >= item.revisions.len() {
            return Err(StoreError::Validation(
                "указанная ревизия элемента проекта не существует".into(),
            ));
        }
        let revision = item.revisions[revision_index].clone();
        let now = Utc::now();
        item.revisions.push(ProjectWorkspaceRevision {
            title: item.title.clone(),
            summary: item.summary.clone(),
            content: item.content.clone(),
            agent_access: item.agent_access,
            changed_at: now,
        });
        if item.revisions.len() > MAX_PROJECT_WORKSPACE_REVISIONS {
            item.revisions.drain(
                0..item
                    .revisions
                    .len()
                    .saturating_sub(MAX_PROJECT_WORKSPACE_REVISIONS),
            );
        }
        item.title = revision.title;
        item.summary = revision.summary;
        item.content = revision.content;
        item.agent_access = revision.agent_access;
        item.updated_at = now;
        self.write_project_workspace_item(&item)?;
        self.get_project_workspace_item(project_id, id)
    }

    pub fn delete_project_workspace_item(
        &self,
        project_id: &str,
        id: &str,
        expected_version: &str,
    ) -> Result<(), StoreError> {
        validate_id(project_id)?;
        validate_id(id)?;
        let _lock = self.lock_exclusive()?;
        let item = self.get_project_workspace_item(project_id, id)?;
        ensure_version(&item.version, expected_version)?;
        fs::remove_file(self.project_workspace_item_path(project_id, item.kind, id))?;
        Ok(())
    }

    pub fn append_project_memory(
        &self,
        project_id: &str,
        source_task_id: Option<&str>,
        entries: Vec<String>,
    ) -> Result<Vec<crate::ProjectMemoryEntry>, StoreError> {
        validate_id(project_id)?;
        if let Some(task_id) = source_task_id {
            validate_id(task_id)?;
        }
        if entries.len() > 5 {
            return Err(StoreError::Validation(
                "за один запуск можно добавить не более 5 записей памяти".into(),
            ));
        }
        let mut cleaned = entries
            .into_iter()
            .map(|entry| clean_required(&entry, "запись памяти", 600))
            .collect::<Result<Vec<_>, _>>()?;
        cleaned.sort();
        cleaned.dedup();
        if cleaned.is_empty() {
            return Ok(Vec::new());
        }

        let _lock = self.lock_exclusive()?;
        let mut project = read_project(&self.project_path(project_id))
            .map_err(|error| map_missing(error, project_id))?;
        if let Some(task_id) = source_task_id {
            let task = self.find_task(task_id)?;
            if task.project_id != project_id {
                return Err(StoreError::Validation(
                    "исходная задача памяти принадлежит другому проекту".into(),
                ));
            }
        }
        let mut added = Vec::new();
        for text in cleaned {
            let comparable = text.to_lowercase();
            if project
                .memory
                .iter()
                .any(|entry| entry.state.is_active() && entry.text.to_lowercase() == comparable)
            {
                continue;
            }
            let entry = crate::ProjectMemoryEntry {
                id: Ulid::new().to_string(),
                text,
                created_at: Utc::now(),
                updated_at: None,
                source_task_id: source_task_id.map(str::to_owned),
                pinned: false,
                state: crate::ProjectMemoryState::Active,
                superseded_by: None,
                revisions: Vec::new(),
            };
            project.memory.push(entry.clone());
            added.push(entry);
        }
        if !added.is_empty() {
            compact_project_memory(&mut project.memory)?;
            project.updated_at = Utc::now();
            self.write_project(&project)?;
        }
        Ok(added)
    }

    pub fn add_project_memory_idempotent(
        &self,
        project_id: &str,
        text: &str,
        source_task_id: Option<&str>,
        pinned: bool,
        expected_version: &str,
        request_id: &str,
    ) -> Result<CreateOutcome<Project>, StoreError> {
        validate_id(project_id)?;
        if let Some(task_id) = source_task_id {
            validate_id(task_id)?;
        }
        let text = clean_required(text, "запись памяти", 600)?;
        let request_id = clean_required(request_id, "request_id", 200)?;
        let memory_id = deterministic_id(&format!("project-memory:{project_id}"), &request_id);
        let _lock = self.lock_exclusive()?;
        let mut project = read_project(&self.project_path(project_id))
            .map_err(|error| map_missing(error, project_id))?;
        if let Some(task_id) = source_task_id {
            let task = self.find_task(task_id)?;
            if task.project_id != project_id {
                return Err(StoreError::Validation(
                    "исходная задача памяти принадлежит другому проекту".into(),
                ));
            }
        }
        if let Some(existing) = project.memory.iter().find(|entry| entry.id == memory_id) {
            if existing.text != text
                || existing.source_task_id.as_deref() != source_task_id
                || existing.pinned != pinned
            {
                return Err(StoreError::Validation(
                    "request_id уже использован для другой записи памяти".into(),
                ));
            }
            return Ok(CreateOutcome {
                value: project,
                created: false,
            });
        }
        ensure_version(&project.version, expected_version)?;
        ensure_unique_active_memory_text(&project.memory, &text, None)?;
        let now = Utc::now();
        project.memory.push(crate::ProjectMemoryEntry {
            id: memory_id,
            text,
            created_at: now,
            updated_at: None,
            source_task_id: source_task_id.map(str::to_owned),
            pinned,
            state: crate::ProjectMemoryState::Active,
            superseded_by: None,
            revisions: Vec::new(),
        });
        compact_project_memory(&mut project.memory)?;
        project.updated_at = now;
        self.write_project(&project)?;
        Ok(CreateOutcome {
            value: read_project(&self.project_path(project_id))?,
            created: true,
        })
    }

    pub fn update_project_memory(
        &self,
        project_id: &str,
        memory_id: &str,
        text: &str,
        pinned: bool,
        expected_version: &str,
    ) -> Result<Project, StoreError> {
        validate_id(project_id)?;
        validate_id(memory_id)?;
        let text = clean_required(text, "запись памяти", 600)?;
        let _lock = self.lock_exclusive()?;
        let mut project = read_project(&self.project_path(project_id))
            .map_err(|error| map_missing(error, project_id))?;
        ensure_version(&project.version, expected_version)?;
        ensure_unique_active_memory_text(&project.memory, &text, Some(memory_id))?;
        let entry = project
            .memory
            .iter_mut()
            .find(|entry| entry.id == memory_id)
            .ok_or_else(|| StoreError::NotFound(memory_id.to_owned()))?;
        if entry.state != crate::ProjectMemoryState::Active {
            return Err(StoreError::Validation(
                "Заменённую запись нельзя редактировать; создайте новую актуальную запись".into(),
            ));
        }
        let now = Utc::now();
        if entry.text != text {
            entry.revisions.push(crate::ProjectMemoryRevision {
                text: entry.text.clone(),
                changed_at: now,
            });
            if entry.revisions.len() > 10 {
                entry.revisions.remove(0);
            }
            entry.text = text;
        }
        entry.pinned = pinned;
        entry.updated_at = Some(now);
        project.updated_at = now;
        self.write_project(&project)?;
        read_project(&self.project_path(project_id))
    }

    pub fn rollback_project_memory(
        &self,
        project_id: &str,
        memory_id: &str,
        revision_index: usize,
        expected_version: &str,
    ) -> Result<Project, StoreError> {
        validate_id(project_id)?;
        validate_id(memory_id)?;
        let _lock = self.lock_exclusive()?;
        let mut project = read_project(&self.project_path(project_id))
            .map_err(|error| map_missing(error, project_id))?;
        ensure_version(&project.version, expected_version)?;
        let revision_text = project
            .memory
            .iter()
            .find(|entry| entry.id == memory_id)
            .ok_or_else(|| StoreError::NotFound(memory_id.to_owned()))?
            .revisions
            .get(revision_index)
            .ok_or_else(|| {
                StoreError::Validation("указанная ревизия памяти проекта не существует".into())
            })?
            .text
            .clone();
        ensure_unique_active_memory_text(&project.memory, &revision_text, Some(memory_id))?;
        let entry = project
            .memory
            .iter_mut()
            .find(|entry| entry.id == memory_id)
            .ok_or_else(|| StoreError::NotFound(memory_id.to_owned()))?;
        if entry.state != crate::ProjectMemoryState::Active {
            return Err(StoreError::Validation(
                "Заменённую запись нельзя откатить".into(),
            ));
        }
        let now = Utc::now();
        entry.revisions.push(crate::ProjectMemoryRevision {
            text: entry.text.clone(),
            changed_at: now,
        });
        if entry.revisions.len() > 10 {
            entry.revisions.remove(0);
        }
        entry.text = revision_text;
        entry.updated_at = Some(now);
        project.updated_at = now;
        self.write_project(&project)?;
        read_project(&self.project_path(project_id))
    }

    pub fn list_project_knowledge_proposals(
        &self,
        project_id: &str,
    ) -> Result<Vec<ProjectKnowledgeProposal>, StoreError> {
        validate_id(project_id)?;
        let directory = self.project_knowledge_proposals_dir(project_id);
        if !directory.exists() {
            return Ok(Vec::new());
        }
        let mut proposals = Vec::new();
        for entry in fs::read_dir(directory)? {
            let path = entry?.path();
            if path.extension().and_then(|value| value.to_str()) != Some("json") {
                continue;
            }
            proposals.push(self.read_project_knowledge_proposal(&path)?);
        }
        proposals.sort_by_key(|proposal| Reverse(proposal.created_at));
        Ok(proposals)
    }

    pub fn get_project_knowledge_proposal(
        &self,
        project_id: &str,
        proposal_id: &str,
    ) -> Result<ProjectKnowledgeProposal, StoreError> {
        validate_id(project_id)?;
        validate_id(proposal_id)?;
        let path = self.project_knowledge_proposal_path(project_id, proposal_id);
        if !path.exists() {
            return Err(StoreError::NotFound(proposal_id.to_owned()));
        }
        self.read_project_knowledge_proposal(&path)
    }

    pub fn create_project_knowledge_proposal(
        &self,
        project_id: &str,
        target: ProjectKnowledgeProposalTarget,
        base_version: &str,
        payload: ProjectKnowledgeProposalPayload,
        summary: &str,
        reason: &str,
        evidence: Vec<String>,
        provenance: Option<ActivityProvenance>,
    ) -> Result<ProjectKnowledgeProposal, StoreError> {
        validate_id(project_id)?;
        validate_project_knowledge_proposal_parts(&target, &payload, summary, reason)?;
        ensure_project_knowledge_base(self, project_id, &target, base_version)?;
        let now = Utc::now();
        let proposal = ProjectKnowledgeProposal {
            id: Ulid::new().to_string(),
            project_id: project_id.to_owned(),
            target,
            base_version: base_version.to_owned(),
            payload,
            summary: summary.trim().to_owned(),
            reason: reason.trim().to_owned(),
            evidence: evidence
                .into_iter()
                .map(|value| value.trim().to_owned())
                .filter(|value| !value.is_empty())
                .collect(),
            provenance,
            state: ProjectKnowledgeProposalState::Pending,
            decision_reason: None,
            decision_provenance: None,
            created_at: now,
            updated_at: now,
        };
        self.write_project_knowledge_proposal(&proposal)?;
        Ok(proposal)
    }

    pub fn apply_project_knowledge_proposal(
        &self,
        project_id: &str,
        proposal_id: &str,
    ) -> Result<ProjectKnowledgeProposal, StoreError> {
        let mut proposal = self.get_project_knowledge_proposal(project_id, proposal_id)?;
        if proposal.state == ProjectKnowledgeProposalState::Applied {
            return Ok(proposal);
        }
        if proposal.state == ProjectKnowledgeProposalState::Rejected {
            return Err(StoreError::Validation(
                "Отклонённое предложение нельзя применить".into(),
            ));
        }

        let result = match (&proposal.target, &proposal.payload) {
            (
                ProjectKnowledgeProposalTarget::WorkspaceItem { item_id, .. },
                ProjectKnowledgeProposalPayload::WorkspaceItem {
                    title,
                    summary,
                    content,
                    agent_access,
                },
            ) => self
                .update_project_workspace_item(
                    project_id,
                    item_id,
                    title,
                    summary.as_deref(),
                    content,
                    *agent_access,
                    &proposal.base_version,
                )
                .map(|_| ()),
            (
                ProjectKnowledgeProposalTarget::ProjectMemory { memory_id },
                ProjectKnowledgeProposalPayload::ProjectMemory { text, pinned },
            ) => self
                .update_project_memory(project_id, memory_id, text, *pinned, &proposal.base_version)
                .map(|_| ()),
            _ => Err(StoreError::Validation(
                "Тип цели и payload предложения не совпадают".into(),
            )),
        };

        if let Err(error) = result {
            if !matches!(error, StoreError::Conflict)
                || !project_knowledge_payload_matches_current(self, &proposal)?
            {
                return Err(error);
            }
        }

        proposal.state = ProjectKnowledgeProposalState::Applied;
        proposal.updated_at = Utc::now();
        self.write_project_knowledge_proposal(&proposal)?;
        Ok(proposal)
    }

    pub fn reject_project_knowledge_proposal(
        &self,
        project_id: &str,
        proposal_id: &str,
        decision_reason: Option<&str>,
        decision_provenance: Option<ActivityProvenance>,
    ) -> Result<ProjectKnowledgeProposal, StoreError> {
        let mut proposal = self.get_project_knowledge_proposal(project_id, proposal_id)?;
        if proposal.state == ProjectKnowledgeProposalState::Rejected {
            return Ok(proposal);
        }
        if proposal.state == ProjectKnowledgeProposalState::Applied {
            return Err(StoreError::Validation(
                "Применённое предложение нельзя отклонить".into(),
            ));
        }
        proposal.state = ProjectKnowledgeProposalState::Rejected;
        proposal.decision_reason = decision_reason
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(str::to_owned);
        proposal.decision_provenance = decision_provenance;
        proposal.updated_at = Utc::now();
        self.write_project_knowledge_proposal(&proposal)?;
        Ok(proposal)
    }

    pub fn supersede_project_memory_idempotent(
        &self,
        project_id: &str,
        memory_id: &str,
        replacement_text: &str,
        pinned: bool,
        expected_version: &str,
        request_id: &str,
    ) -> Result<CreateOutcome<Project>, StoreError> {
        validate_id(project_id)?;
        validate_id(memory_id)?;
        let replacement_text = clean_required(replacement_text, "новая запись памяти", 600)?;
        let request_id = clean_required(request_id, "request_id", 200)?;
        let replacement_id = deterministic_id(
            &format!("project-memory-replacement:{project_id}:{memory_id}"),
            &request_id,
        );
        let _lock = self.lock_exclusive()?;
        let mut project = read_project(&self.project_path(project_id))
            .map_err(|error| map_missing(error, project_id))?;
        if let Some(existing) = project
            .memory
            .iter()
            .find(|entry| entry.id == replacement_id)
        {
            if existing.text != replacement_text || existing.pinned != pinned {
                return Err(StoreError::Validation(
                    "request_id уже использован для другой замены памяти".into(),
                ));
            }
            return Ok(CreateOutcome {
                value: project,
                created: false,
            });
        }
        ensure_version(&project.version, expected_version)?;
        ensure_unique_active_memory_text(&project.memory, &replacement_text, Some(memory_id))?;
        let position = project
            .memory
            .iter()
            .position(|entry| entry.id == memory_id)
            .ok_or_else(|| StoreError::NotFound(memory_id.to_owned()))?;
        if project.memory[position].state != crate::ProjectMemoryState::Active {
            return Err(StoreError::Validation("Запись уже была заменена".into()));
        }
        let now = Utc::now();
        let source_task_id = project.memory[position].source_task_id.clone();
        project.memory[position].state = crate::ProjectMemoryState::Superseded;
        project.memory[position].superseded_by = Some(replacement_id.clone());
        project.memory[position].pinned = false;
        project.memory[position].updated_at = Some(now);
        project.memory.push(crate::ProjectMemoryEntry {
            id: replacement_id,
            text: replacement_text,
            created_at: now,
            updated_at: None,
            source_task_id,
            pinned,
            state: crate::ProjectMemoryState::Active,
            superseded_by: None,
            revisions: Vec::new(),
        });
        compact_project_memory(&mut project.memory)?;
        project.updated_at = now;
        self.write_project(&project)?;
        Ok(CreateOutcome {
            value: read_project(&self.project_path(project_id))?,
            created: true,
        })
    }

    pub fn delete_project_memory(
        &self,
        project_id: &str,
        memory_id: &str,
        expected_version: &str,
    ) -> Result<Project, StoreError> {
        validate_id(project_id)?;
        validate_id(memory_id)?;
        let _lock = self.lock_exclusive()?;
        let mut project = read_project(&self.project_path(project_id))
            .map_err(|error| map_missing(error, project_id))?;
        ensure_version(&project.version, expected_version)?;
        let before = project.memory.len();
        project.memory.retain(|entry| entry.id != memory_id);
        if project.memory.len() == before {
            return Err(StoreError::NotFound(memory_id.to_owned()));
        }
        for entry in &mut project.memory {
            if entry.superseded_by.as_deref() == Some(memory_id) {
                entry.superseded_by = None;
            }
        }
        project.updated_at = Utc::now();
        self.write_project(&project)?;
        read_project(&self.project_path(project_id))
    }

    pub fn set_project_telegram_chats(
        &self,
        id: &str,
        telegram_chats: Vec<TelegramProjectLink>,
        expected_version: &str,
    ) -> Result<Project, StoreError> {
        validate_id(id)?;
        if telegram_chats.len() > 20 {
            return Err(StoreError::Validation(
                "к одному проекту можно привязать не более 20 Telegram-чатов".into(),
            ));
        }
        let mut seen = std::collections::HashSet::new();
        for link in &telegram_chats {
            clean_required(&link.title, "название Telegram-чата", 240)?;
            if !seen.insert(link.chat_id) {
                return Err(StoreError::Validation(
                    "Telegram-чат нельзя привязать к проекту дважды".into(),
                ));
            }
        }
        let _lock = self.lock_exclusive()?;
        let mut project =
            read_project(&self.project_path(id)).map_err(|error| map_missing(error, id))?;
        ensure_version(&project.version, expected_version)?;
        project.telegram_chats = telegram_chats;
        project.updated_at = Utc::now();
        self.write_project(&project)?;
        read_project(&self.project_path(id))
    }

    pub fn set_project_telegram_participants(
        &self,
        id: &str,
        mut participants: Vec<crate::TelegramParticipantRole>,
        expected_version: &str,
    ) -> Result<Project, StoreError> {
        validate_id(id)?;
        if participants.len() > 200 {
            return Err(StoreError::Validation(
                "в одном проекте можно сохранить не более 200 ролей Telegram".into(),
            ));
        }
        for participant in &mut participants {
            participant.sender_id =
                clean_required(&participant.sender_id, "Telegram ID участника", 80)?;
            participant.display_name =
                clean_required(&participant.display_name, "имя участника Telegram", 240)?;
            participant.username = participant
                .username
                .take()
                .map(|value| value.trim().trim_start_matches('@').to_owned())
                .filter(|value| !value.is_empty());
            participant.role = clean_required(&participant.role, "роль участника", 80)?;
        }
        participants.sort_by(|left, right| left.sender_id.cmp(&right.sender_id));
        participants.dedup_by(|left, right| left.sender_id == right.sender_id);

        let _lock = self.lock_exclusive()?;
        let mut project =
            read_project(&self.project_path(id)).map_err(|error| map_missing(error, id))?;
        ensure_version(&project.version, expected_version)?;
        project.telegram_participants = participants;
        project.updated_at = Utc::now();
        self.write_project(&project)?;
        read_project(&self.project_path(id))
    }

    pub fn list_project_telegram_participants(
        &self,
        project_id: &str,
    ) -> Result<Vec<crate::TelegramParticipant>, StoreError> {
        validate_id(project_id)?;
        let _lock = self.lock_shared()?;
        let project = read_project(&self.project_path(project_id))
            .map_err(|error| map_missing(error, project_id))?;
        let chat_ids = project
            .telegram_chats
            .iter()
            .map(|link| link.chat_id)
            .collect::<std::collections::HashSet<_>>();
        let roles = project
            .telegram_participants
            .iter()
            .map(|profile| (profile.sender_id.as_str(), profile))
            .collect::<std::collections::HashMap<_, _>>();
        let mut people = std::collections::HashMap::<String, crate::TelegramParticipant>::new();
        for chat in self.read_telegram_chats()?.chats {
            if !chat_ids.contains(&chat.chat_id) {
                continue;
            }
            for message in chat.messages {
                let Some(sender_id) = message.sender_id else {
                    continue;
                };
                let entry = people.entry(sender_id.clone()).or_insert_with(|| {
                    let profile = roles.get(sender_id.as_str()).copied();
                    crate::TelegramParticipant {
                        sender_id,
                        display_name: message.author.clone(),
                        username: message.sender_username.clone(),
                        is_current_user: message.is_outgoing,
                        message_count: 0,
                        role: profile.map(|profile| profile.role.clone()),
                        role_source: profile.map(|profile| profile.source),
                    }
                });
                entry.message_count += 1;
                entry.is_current_user |= message.is_outgoing;
                if entry.username.is_none() {
                    entry.username = message.sender_username;
                }
                if entry.display_name == "Telegram" && message.author != "Telegram" {
                    entry.display_name = message.author;
                }
            }
        }
        for profile in &project.telegram_participants {
            people
                .entry(profile.sender_id.clone())
                .or_insert_with(|| crate::TelegramParticipant {
                    sender_id: profile.sender_id.clone(),
                    display_name: profile.display_name.clone(),
                    username: profile.username.clone(),
                    is_current_user: false,
                    message_count: 0,
                    role: Some(profile.role.clone()),
                    role_source: Some(profile.source),
                });
        }
        let mut people = people.into_values().collect::<Vec<_>>();
        people.sort_by(|left, right| {
            right
                .is_current_user
                .cmp(&left.is_current_user)
                .then_with(|| right.message_count.cmp(&left.message_count))
                .then_with(|| left.display_name.cmp(&right.display_name))
        });
        Ok(people)
    }

    pub fn list_telegram_inbox(
        &self,
        project_id: Option<&str>,
        include_processed: bool,
    ) -> Result<Vec<TelegramInboxCandidate>, StoreError> {
        if let Some(project_id) = project_id {
            validate_id(project_id)?;
        }
        let _lock = self.lock_shared()?;
        let mut candidates = self.read_telegram_inbox()?.candidates;
        candidates.retain(|candidate| {
            project_id.is_none_or(|project_id| candidate.project_id == project_id)
                && (include_processed || candidate.status == InboxCandidateStatus::Pending)
        });
        for candidate in &mut candidates {
            candidate.linked_task = self
                .find_task_by_telegram_source(candidate.chat_id, &candidate_message_ids(candidate))?
                .as_ref()
                .map(TelegramLinkedTask::from);
        }
        candidates.sort_by_key(|candidate| Reverse(candidate.sent_at));
        Ok(candidates)
    }

    pub fn list_telegram_inbox_page(
        &self,
        project_id: Option<&str>,
        include_pending: bool,
        include_processed: bool,
        cursor: Option<&str>,
        limit: usize,
    ) -> Result<TelegramInboxPage, StoreError> {
        if let Some(project_id) = project_id {
            validate_id(project_id)?;
        }
        if !include_pending && !include_processed {
            return Err(StoreError::Validation(
                "нужно выбрать входящие или обработанные сообщения".into(),
            ));
        }
        if !(1..=100).contains(&limit) {
            return Err(StoreError::Validation(
                "размер порции Telegram должен быть от 1 до 100".into(),
            ));
        }
        let _lock = self.lock_shared()?;
        let mut candidates = self.read_telegram_inbox()?.candidates;
        candidates.retain(|candidate| {
            project_id.is_none_or(|project_id| candidate.project_id == project_id)
        });
        candidates.sort_by_key(|candidate| Reverse(candidate.sent_at));
        let matches_view = |candidate: &TelegramInboxCandidate| {
            if candidate.status == InboxCandidateStatus::Pending {
                include_pending
            } else {
                include_processed
            }
        };
        let total = candidates
            .iter()
            .filter(|candidate| matches_view(candidate))
            .count();
        let start = match cursor {
            Some(cursor) => candidates
                .iter()
                .position(|candidate| candidate.id == cursor)
                .map(|index| index + 1)
                .ok_or_else(|| {
                    StoreError::Validation(
                        "курсор не найден в текущей Telegram-очереди; начните заново".into(),
                    )
                })?,
            None => 0,
        };
        let candidates_after_cursor = candidates
            .into_iter()
            .skip(start)
            .filter(matches_view)
            .collect::<Vec<_>>();
        let remaining_before_page = candidates_after_cursor.len();
        let mut page = candidates_after_cursor
            .into_iter()
            .take(limit)
            .collect::<Vec<_>>();
        for candidate in &mut page {
            candidate.linked_task = self
                .find_task_by_telegram_source(candidate.chat_id, &candidate_message_ids(candidate))?
                .as_ref()
                .map(TelegramLinkedTask::from);
        }
        let remaining = remaining_before_page.saturating_sub(page.len());
        let next_cursor = (remaining > 0)
            .then(|| page.last().map(|candidate| candidate.id.clone()))
            .flatten();
        Ok(TelegramInboxPage {
            candidates: page,
            total,
            next_cursor,
            remaining,
        })
    }

    pub fn telegram_sync_status(&self) -> Result<Option<TelegramSyncStatus>, StoreError> {
        let _lock = self.lock_shared()?;
        let path = self.telegram_sync_status_path();
        if !path.exists() {
            return Ok(None);
        }
        Ok(Some(serde_json::from_slice(&read_limited_bytes(
            &path,
            MAX_INTEGRATION_STATE_BYTES,
        )?)?))
    }

    pub fn record_telegram_sync_status(
        &self,
        status: &TelegramSyncStatus,
    ) -> Result<(), StoreError> {
        if let Some(request_id) = &status.request_id {
            validate_id(request_id)?;
        }
        if status.errors.len() > 8 || status.errors.iter().any(|error| error.len() > 1_000) {
            return Err(StoreError::Validation(
                "некорректный отчёт синхронизации Telegram".into(),
            ));
        }
        let _lock = self.lock_exclusive()?;
        let mut bytes = serde_json::to_vec_pretty(status)?;
        bytes.push(b'\n');
        atomic_write_bytes(&self.telegram_sync_status_path(), &bytes)
    }

    pub fn telegram_connector_status(
        &self,
    ) -> Result<Option<crate::TelegramConnectorStatus>, StoreError> {
        let _lock = self.lock_shared()?;
        let path = self.telegram_connector_status_path();
        if !path.exists() {
            return Ok(None);
        }
        Ok(Some(serde_json::from_slice(&read_limited_bytes(
            &path,
            MAX_INTEGRATION_STATE_BYTES,
        )?)?))
    }

    pub fn record_telegram_connector_status(
        &self,
        status: &crate::TelegramConnectorStatus,
    ) -> Result<(), StoreError> {
        if status.step.trim().is_empty()
            || status.step.chars().count() > 64
            || status
                .account_name
                .as_ref()
                .is_some_and(|value| value.chars().count() > 200)
            || status
                .account_username
                .as_ref()
                .is_some_and(|value| value.chars().count() > 64)
            || status
                .error
                .as_ref()
                .is_some_and(|value| value.chars().count() > 1_000)
        {
            return Err(StoreError::Validation(
                "некорректное состояние подключения Telegram".into(),
            ));
        }
        let _lock = self.lock_exclusive()?;
        let mut bytes = serde_json::to_vec_pretty(status)?;
        bytes.push(b'\n');
        atomic_write_bytes(&self.telegram_connector_status_path(), &bytes)
    }

    pub fn request_telegram_sync(&self) -> Result<TelegramSyncRequest, StoreError> {
        let _lock = self.lock_exclusive()?;
        let path = self.telegram_sync_request_path();
        if path.exists() {
            let request: TelegramSyncRequest =
                serde_json::from_slice(&read_limited_bytes(&path, MAX_INTEGRATION_STATE_BYTES)?)?;
            validate_id(&request.id)?;
            return Ok(request);
        }
        let request = TelegramSyncRequest {
            id: Ulid::new().to_string(),
            requested_at: Utc::now(),
        };
        let mut bytes = serde_json::to_vec_pretty(&request)?;
        bytes.push(b'\n');
        atomic_write_bytes(&path, &bytes)?;
        Ok(request)
    }

    pub fn telegram_sync_request(&self) -> Result<Option<TelegramSyncRequest>, StoreError> {
        let _lock = self.lock_shared()?;
        let path = self.telegram_sync_request_path();
        if !path.exists() {
            return Ok(None);
        }
        Ok(Some(serde_json::from_slice(&read_limited_bytes(
            &path,
            MAX_INTEGRATION_STATE_BYTES,
        )?)?))
    }

    pub fn acknowledge_telegram_sync_request(&self, id: &str) -> Result<bool, StoreError> {
        validate_id(id)?;
        let _lock = self.lock_exclusive()?;
        let path = self.telegram_sync_request_path();
        if !path.exists() {
            return Ok(false);
        }
        let request: TelegramSyncRequest =
            serde_json::from_slice(&read_limited_bytes(&path, MAX_INTEGRATION_STATE_BYTES)?)?;
        if request.id != id {
            return Ok(false);
        }
        fs::remove_file(path)?;
        Ok(true)
    }

    pub fn upsert_telegram_chat_snapshot(
        &self,
        mut incoming: TelegramChatSnapshot,
    ) -> Result<(), StoreError> {
        validate_telegram_chat_snapshot(&incoming)?;
        let _lock = self.lock_exclusive()?;
        let mut document = self.read_telegram_chats()?;
        if let Some(existing) = document
            .chats
            .iter_mut()
            .find(|chat| chat.chat_id == incoming.chat_id)
        {
            let mut by_id = existing
                .messages
                .drain(..)
                .map(|message| (message.message_id, message))
                .collect::<HashMap<_, _>>();
            for message in incoming.messages.drain(..) {
                by_id.insert(message.message_id, message);
            }
            let mut messages = by_id.into_values().collect::<Vec<_>>();
            messages.sort_by_key(|message| message.sent_at);
            if messages.len() > MAX_TELEGRAM_CHAT_MESSAGES {
                messages.drain(..messages.len() - MAX_TELEGRAM_CHAT_MESSAGES);
            }
            existing.title = incoming.title;
            existing.synced_at = incoming.synced_at;
            existing.messages = messages;
        } else {
            incoming.messages.sort_by_key(|message| message.sent_at);
            if incoming.messages.len() > MAX_TELEGRAM_CHAT_MESSAGES {
                incoming
                    .messages
                    .drain(..incoming.messages.len() - MAX_TELEGRAM_CHAT_MESSAGES);
            }
            document.chats.push(incoming);
        }
        document.chats.sort_by_key(|chat| chat.title.to_lowercase());
        self.write_telegram_chats(&document)
    }

    pub fn list_telegram_chat_snapshots(&self) -> Result<Vec<TelegramChatSnapshot>, StoreError> {
        let _lock = self.lock_shared()?;
        Ok(self.read_telegram_chats()?.chats)
    }

    pub fn read_telegram_chat(
        &self,
        chat_id: i64,
        before_message_id: Option<i64>,
        after_message_id: Option<i64>,
        limit: usize,
    ) -> Result<TelegramChatPage, StoreError> {
        if before_message_id.is_some() && after_message_id.is_some() {
            return Err(StoreError::Validation(
                "укажите только before_message_id или after_message_id".into(),
            ));
        }
        let limit = limit.clamp(1, 50);
        let _lock = self.lock_shared()?;
        let chat = self
            .read_telegram_chats()?
            .chats
            .into_iter()
            .find(|chat| chat.chat_id == chat_id)
            .ok_or_else(|| StoreError::NotFound(format!("Telegram-чат {chat_id}")))?;
        let all = chat.messages;
        let selected = if let Some(after) = after_message_id {
            all.iter()
                .filter(|message| message.message_id > after)
                .take(limit)
                .cloned()
                .collect::<Vec<_>>()
        } else {
            let eligible = all
                .iter()
                .filter(|message| {
                    before_message_id.is_none_or(|before| message.message_id < before)
                })
                .cloned()
                .collect::<Vec<_>>();
            eligible
                .into_iter()
                .rev()
                .take(limit)
                .collect::<Vec<_>>()
                .into_iter()
                .rev()
                .collect()
        };
        let oldest_message_id = selected.first().map(|message| message.message_id);
        let newest_message_id = selected.last().map(|message| message.message_id);
        Ok(TelegramChatPage {
            chat_id,
            title: chat.title,
            synced_at: chat.synced_at,
            has_older: oldest_message_id
                .is_some_and(|oldest| all.iter().any(|message| message.message_id < oldest)),
            has_newer: newest_message_id
                .is_some_and(|newest| all.iter().any(|message| message.message_id > newest)),
            messages: selected,
            oldest_message_id,
            newest_message_id,
        })
    }

    pub fn read_telegram_message_context(
        &self,
        chat_id: i64,
        message_id: i64,
        before: usize,
        after: usize,
    ) -> Result<TelegramMessageContextPage, StoreError> {
        let before = before.min(10);
        let after = after.min(10);
        let _lock = self.lock_shared()?;
        let chat = self
            .read_telegram_chats()?
            .chats
            .into_iter()
            .find(|chat| chat.chat_id == chat_id)
            .ok_or_else(|| StoreError::NotFound(format!("Telegram-чат {chat_id}")))?;
        let target_index = chat
            .messages
            .iter()
            .position(|message| telegram_message_contains_id(message, message_id))
            .ok_or_else(|| {
                StoreError::NotFound(format!("сообщение Telegram {message_id} в локальной ленте"))
            })?;
        let start = target_index.saturating_sub(before);
        let end = (target_index + after + 1).min(chat.messages.len());
        let target = chat.messages[target_index].clone();
        let mut messages = chat.messages[start..end].to_vec();
        let mut reply_parent_added = false;
        if let Some(reply_to_message_id) = target.reply_to_message_id {
            let parent_is_selected = messages
                .iter()
                .any(|message| telegram_message_contains_id(message, reply_to_message_id));
            if !parent_is_selected
                && let Some(parent) = chat
                    .messages
                    .iter()
                    .find(|message| telegram_message_contains_id(message, reply_to_message_id))
            {
                messages.push(parent.clone());
                reply_parent_added = true;
            }
        }
        for message in &mut messages {
            message.is_target = telegram_message_contains_id(message, message_id);
        }
        messages.sort_by_key(|message| (message.sent_at, message.message_id));
        let resolved_target_index = messages
            .iter()
            .position(|message| message.is_target)
            .ok_or_else(|| StoreError::NotFound(format!("сообщение Telegram {message_id}")))?;
        let media_count = messages.iter().map(|message| message.media.len()).sum();
        Ok(TelegramMessageContextPage {
            chat_id,
            title: chat.title,
            synced_at: chat.synced_at,
            requested_message_id: message_id,
            target_message_id: target.message_id,
            target_index: resolved_target_index,
            returned_before: target_index - start,
            returned_after: end - target_index - 1,
            reply_parent_added,
            media_count,
            has_older: start > 0,
            has_newer: end < chat.messages.len(),
            messages,
        })
    }

    pub fn read_telegram_updates(
        &self,
        chat_id: i64,
        limit: usize,
    ) -> Result<TelegramUpdatesPage, StoreError> {
        let limit = limit.clamp(1, 50);
        let _lock = self.lock_shared()?;
        let chat = self
            .read_telegram_chats()?
            .chats
            .into_iter()
            .find(|chat| chat.chat_id == chat_id)
            .ok_or_else(|| StoreError::NotFound(format!("Telegram-чат {chat_id}")))?;
        let checkpoint = self
            .read_telegram_agent_checkpoints()?
            .checkpoints
            .into_iter()
            .find(|checkpoint| checkpoint.chat_id == chat_id);
        let checkpoint_message_id = checkpoint
            .as_ref()
            .map(|checkpoint| checkpoint.last_read_message_id);
        let initial_window = checkpoint_message_id.is_none();
        let latest_available_message_id = chat.messages.last().map(|message| message.message_id);
        let checkpoint_before_cache = checkpoint_message_id.is_some_and(|checkpoint| {
            chat.messages
                .first()
                .is_some_and(|message| checkpoint < message.message_id)
        });
        let eligible = if let Some(checkpoint) = checkpoint_message_id {
            chat.messages
                .iter()
                .filter(|message| message.message_id > checkpoint)
                .cloned()
                .collect::<Vec<_>>()
        } else {
            chat.messages.clone()
        };
        let initial_window_truncated = initial_window && eligible.len() > limit;
        let (messages, remaining) = if initial_window {
            let skip = eligible.len().saturating_sub(limit);
            (eligible.into_iter().skip(skip).collect(), 0)
        } else {
            let remaining = eligible.len().saturating_sub(limit);
            (eligible.into_iter().take(limit).collect(), remaining)
        };
        Ok(TelegramUpdatesPage {
            chat_id,
            title: chat.title,
            synced_at: chat.synced_at,
            checkpoint_message_id,
            messages,
            latest_available_message_id,
            remaining,
            initial_window,
            initial_window_truncated,
            checkpoint_before_cache,
        })
    }

    pub fn list_telegram_agent_checkpoints(
        &self,
    ) -> Result<Vec<TelegramAgentCheckpoint>, StoreError> {
        let _lock = self.lock_shared()?;
        Ok(self.read_telegram_agent_checkpoints()?.checkpoints)
    }

    pub fn acknowledge_telegram_updates(
        &self,
        chat_id: i64,
        through_message_id: i64,
    ) -> Result<TelegramAgentCheckpoint, StoreError> {
        let _lock = self.lock_exclusive()?;
        let chat = self
            .read_telegram_chats()?
            .chats
            .into_iter()
            .find(|chat| chat.chat_id == chat_id)
            .ok_or_else(|| StoreError::NotFound(format!("Telegram-чат {chat_id}")))?;
        let canonical_message_id = chat
            .messages
            .iter()
            .find(|message| {
                message.message_id == through_message_id
                    || message.message_ids.contains(&through_message_id)
            })
            .map(|message| message.message_id)
            .ok_or_else(|| {
                StoreError::NotFound(format!(
                    "сообщение Telegram {through_message_id} в локальной ленте"
                ))
            })?;
        let mut document = self.read_telegram_agent_checkpoints()?;
        if let Some(existing) = document
            .checkpoints
            .iter_mut()
            .find(|checkpoint| checkpoint.chat_id == chat_id)
        {
            if canonical_message_id < existing.last_read_message_id {
                return Err(StoreError::Validation(
                    "закладку агента нельзя переместить назад".into(),
                ));
            }
            existing.last_read_message_id = canonical_message_id;
            existing.updated_at = Utc::now();
            let checkpoint = existing.clone();
            self.write_telegram_agent_checkpoints(&document)?;
            return Ok(checkpoint);
        }
        let checkpoint = TelegramAgentCheckpoint {
            chat_id,
            last_read_message_id: canonical_message_id,
            updated_at: Utc::now(),
        };
        document.checkpoints.push(checkpoint.clone());
        document.checkpoints.sort_by_key(|item| item.chat_id);
        self.write_telegram_agent_checkpoints(&document)?;
        Ok(checkpoint)
    }

    pub fn request_telegram_media(
        &self,
        chat_id: i64,
        message_id: i64,
        media_index: usize,
        candidate_id: Option<&str>,
    ) -> Result<TelegramMediaRequest, StoreError> {
        let candidate_id = candidate_id
            .map(|id| clean_required(id, "идентификатор Telegram-кандидата", 160))
            .transpose()?;
        let _lock = self.lock_exclusive()?;
        let media = if let Some(candidate_id) = candidate_id.as_deref() {
            let candidate = self
                .read_telegram_inbox()?
                .candidates
                .into_iter()
                .find(|candidate| candidate.id == candidate_id)
                .ok_or_else(|| StoreError::NotFound(candidate_id.to_owned()))?;
            if candidate.chat_id != chat_id {
                return Err(StoreError::Validation(
                    "Telegram-кандидат относится к другому чату".into(),
                ));
            }
            candidate_context_media(&candidate, message_id, media_index)?
        } else {
            let chat = self
                .read_telegram_chats()?
                .chats
                .into_iter()
                .find(|chat| chat.chat_id == chat_id)
                .ok_or_else(|| StoreError::NotFound(format!("Telegram-чат {chat_id}")))?;
            chat_snapshot_media(&chat, message_id, media_index)?
        };
        if media.kind != SourceMediaKind::Photo {
            return Err(StoreError::Validation(
                "сейчас агенту можно передавать только изображения Telegram".into(),
            ));
        }
        if media.size.is_some_and(|size| size > MAX_AGENT_IMAGE_BYTES) {
            return Err(StoreError::Validation(
                "изображение превышает допустимые для агента 8 МБ".into(),
            ));
        }
        let mut document = self.read_telegram_media_requests()?;
        if let Some(index) = document.requests.iter().position(|request| {
            request.candidate_id == candidate_id
                && request.chat_id == chat_id
                && request.message_id == message_id
                && request.media_index == media_index
        }) {
            if document.requests[index].state == TelegramMediaRequestState::Failed {
                document.requests[index].state = TelegramMediaRequestState::Queued;
                document.requests[index].completed_at = None;
                document.requests[index].error = None;
                let retried = document.requests[index].clone();
                self.write_telegram_media_requests(&document)?;
                return Ok(retried);
            }
            return Ok(document.requests[index].clone());
        }
        while document.requests.len() >= MAX_TELEGRAM_MEDIA_REQUESTS {
            let Some(index) = document
                .requests
                .iter()
                .position(|request| request.state != TelegramMediaRequestState::Queued)
            else {
                return Err(StoreError::Validation(
                    "слишком много ожидающих запросов Telegram-медиа".into(),
                ));
            };
            let removed = document.requests.remove(index);
            self.remove_telegram_media_cache(&removed);
        }
        let request = TelegramMediaRequest {
            id: Ulid::new().to_string(),
            candidate_id,
            chat_id,
            message_id,
            media_index,
            file_name: media.file_name,
            mime_type: media.mime_type.unwrap_or_else(|| "image/jpeg".into()),
            requested_at: Utc::now(),
            state: TelegramMediaRequestState::Queued,
            completed_at: None,
            relative_path: None,
            error: None,
        };
        document.requests.push(request.clone());
        self.write_telegram_media_requests(&document)?;
        Ok(request)
    }

    pub fn pending_telegram_media_requests(
        &self,
        limit: usize,
    ) -> Result<Vec<TelegramMediaRequest>, StoreError> {
        let _lock = self.lock_shared()?;
        Ok(self
            .read_telegram_media_requests()?
            .requests
            .into_iter()
            .filter(|request| request.state == TelegramMediaRequestState::Queued)
            .take(limit.clamp(1, 10))
            .collect())
    }

    pub fn get_telegram_media_request(&self, id: &str) -> Result<TelegramMediaRequest, StoreError> {
        validate_id(id)?;
        let _lock = self.lock_shared()?;
        self.read_telegram_media_requests()?
            .requests
            .into_iter()
            .find(|request| request.id == id)
            .ok_or_else(|| StoreError::NotFound(id.to_owned()))
    }

    pub fn telegram_media_request_source(&self, id: &str) -> Result<SourceMedia, StoreError> {
        validate_id(id)?;
        let _lock = self.lock_shared()?;
        let request = self
            .read_telegram_media_requests()?
            .requests
            .into_iter()
            .find(|request| request.id == id)
            .ok_or_else(|| StoreError::NotFound(id.to_owned()))?;
        if let Some(candidate_id) = request.candidate_id.as_deref() {
            let candidate = self
                .read_telegram_inbox()?
                .candidates
                .into_iter()
                .find(|candidate| candidate.id == candidate_id)
                .ok_or_else(|| StoreError::NotFound(candidate_id.to_owned()))?;
            candidate_context_media(&candidate, request.message_id, request.media_index)
        } else {
            let chat = self
                .read_telegram_chats()?
                .chats
                .into_iter()
                .find(|chat| chat.chat_id == request.chat_id)
                .ok_or_else(|| StoreError::NotFound(format!("Telegram-чат {}", request.chat_id)))?;
            chat_snapshot_media(&chat, request.message_id, request.media_index)
        }
    }

    pub fn complete_telegram_media_request(
        &self,
        id: &str,
        bytes: &[u8],
    ) -> Result<TelegramMediaRequest, StoreError> {
        validate_id(id)?;
        if bytes.is_empty() || bytes.len() as u64 > MAX_AGENT_IMAGE_BYTES {
            return Err(StoreError::Validation(
                "изображение должно иметь размер от 1 байта до 8 МБ".into(),
            ));
        }
        let _lock = self.lock_exclusive()?;
        let mut document = self.read_telegram_media_requests()?;
        let request = document
            .requests
            .iter_mut()
            .find(|request| request.id == id)
            .ok_or_else(|| StoreError::NotFound(id.to_owned()))?;
        let file_name = clean_file_name(&request.file_name)?;
        let relative_path = PathBuf::from("integrations")
            .join("telegram-media")
            .join(id)
            .join(file_name);
        atomic_write_bytes(&self.root.join(&relative_path), bytes)?;
        request.state = TelegramMediaRequestState::Ready;
        request.completed_at = Some(Utc::now());
        request.relative_path = Some(relative_path.to_string_lossy().replace('\\', "/"));
        request.error = None;
        let result = request.clone();
        self.write_telegram_media_requests(&document)?;
        Ok(result)
    }

    pub fn fail_telegram_media_request(
        &self,
        id: &str,
        error: &str,
    ) -> Result<TelegramMediaRequest, StoreError> {
        validate_id(id)?;
        let error = clean_required(error, "ошибка Telegram-медиа", 1_000)?;
        let _lock = self.lock_exclusive()?;
        let mut document = self.read_telegram_media_requests()?;
        let request = document
            .requests
            .iter_mut()
            .find(|request| request.id == id)
            .ok_or_else(|| StoreError::NotFound(id.to_owned()))?;
        request.state = TelegramMediaRequestState::Failed;
        request.completed_at = Some(Utc::now());
        request.relative_path = None;
        request.error = Some(error);
        let result = request.clone();
        self.write_telegram_media_requests(&document)?;
        Ok(result)
    }

    pub fn read_telegram_media_request(&self, id: &str) -> Result<Vec<u8>, StoreError> {
        let request = self.get_telegram_media_request(id)?;
        if request.state != TelegramMediaRequestState::Ready {
            return Err(StoreError::Validation(
                "изображение Telegram ещё не подготовлено".into(),
            ));
        }
        let relative_path = request
            .relative_path
            .ok_or_else(|| StoreError::Validation("путь изображения не сохранён".into()))?;
        let path = Path::new(&relative_path);
        if path.is_absolute() || path.components().any(|part| part.as_os_str() == "..") {
            return Err(StoreError::Validation(
                "сохранён некорректный путь изображения".into(),
            ));
        }
        read_limited_bytes(&self.root.join(path), MAX_AGENT_IMAGE_BYTES)
    }

    pub fn get_telegram_candidate(
        &self,
        candidate_id: &str,
    ) -> Result<TelegramInboxCandidate, StoreError> {
        let _lock = self.lock_shared()?;
        let mut candidate = self
            .read_telegram_inbox()?
            .candidates
            .into_iter()
            .find(|candidate| candidate.id == candidate_id)
            .ok_or_else(|| StoreError::NotFound(candidate_id.to_owned()))?;
        candidate.linked_task = self
            .find_task_by_telegram_source(candidate.chat_id, &candidate_message_ids(&candidate))?
            .as_ref()
            .map(TelegramLinkedTask::from);
        Ok(candidate)
    }

    pub fn upsert_telegram_candidates(
        &self,
        incoming: Vec<TelegramInboxCandidate>,
    ) -> Result<usize, StoreError> {
        let _lock = self.lock_exclusive()?;
        let mut document = self.read_telegram_inbox()?;
        let mut added = 0;
        let mut changed = false;
        for mut candidate in incoming {
            candidate.linked_task = None;
            if let Some(task) = self.find_task_by_telegram_source(
                candidate.chat_id,
                &candidate_message_ids(&candidate),
            )? {
                candidate.status = InboxCandidateStatus::Imported;
                candidate.processed_at = Some(Utc::now());
                candidate.task_id = Some(task.id);
            }
            validate_candidate(&candidate)?;
            if let Some(existing) = document
                .candidates
                .iter_mut()
                .find(|existing| existing.id == candidate.id)
            {
                if existing.status == InboxCandidateStatus::Pending {
                    let discovered_at = existing.discovered_at;
                    let mut updated = candidate;
                    updated.discovered_at = discovered_at;
                    if *existing != updated {
                        *existing = updated;
                        changed = true;
                    }
                }
            } else {
                document.candidates.push(candidate);
                added += 1;
                changed = true;
            }
        }
        let before_compaction = document.candidates.len();
        compact_telegram_inbox(&mut document);
        changed |= document.candidates.len() != before_compaction;
        if changed {
            self.write_telegram_inbox(&document)?;
        }
        Ok(added)
    }

    pub fn set_telegram_candidate_status(
        &self,
        candidate_id: &str,
        status: InboxCandidateStatus,
    ) -> Result<TelegramInboxCandidate, StoreError> {
        let _lock = self.lock_exclusive()?;
        let mut document = self.read_telegram_inbox()?;
        let candidate = document
            .candidates
            .iter_mut()
            .find(|candidate| candidate.id == candidate_id)
            .ok_or_else(|| StoreError::NotFound(candidate_id.to_owned()))?;
        if candidate.status == InboxCandidateStatus::Imported
            && status != InboxCandidateStatus::Imported
        {
            return Err(StoreError::Validation(
                "импортированный Telegram-кандидат нельзя вернуть или отклонить; связанная задача уже существует".into(),
            ));
        }
        if candidate.status == status {
            return Ok(candidate.clone());
        }
        candidate.status = status;
        candidate.processed_at = (candidate.status != InboxCandidateStatus::Pending).then(Utc::now);
        if candidate.status != InboxCandidateStatus::Imported {
            candidate.task_id = None;
        }
        let result = candidate.clone();
        self.write_telegram_inbox(&document)?;
        Ok(result)
    }

    pub fn create_task_from_telegram_candidate(
        &self,
        candidate_id: &str,
        description: Option<&str>,
        urgency: Urgency,
    ) -> Result<Task, StoreError> {
        let _lock = self.lock_exclusive()?;
        let mut document = self.read_telegram_inbox()?;
        let candidate_index = document
            .candidates
            .iter()
            .position(|candidate| candidate.id == candidate_id)
            .ok_or_else(|| StoreError::NotFound(candidate_id.to_owned()))?;
        let candidate = document.candidates[candidate_index].clone();
        if candidate.status == InboxCandidateStatus::Imported
            && let Some(task_id) = candidate.task_id.as_deref()
        {
            return self.find_task(task_id);
        }
        if candidate.status != InboxCandidateStatus::Pending {
            return Err(StoreError::Validation(
                "кандидат уже обработан; верните его во входящие перед созданием задачи".into(),
            ));
        }
        if !self.project_path(&candidate.project_id).exists() {
            return Err(StoreError::NotFound(candidate.project_id.clone()));
        }
        if let Some(existing) = self
            .find_task_by_telegram_source(candidate.chat_id, &candidate_message_ids(&candidate))?
        {
            let stored = &mut document.candidates[candidate_index];
            stored.status = InboxCandidateStatus::Imported;
            stored.processed_at = Some(Utc::now());
            stored.task_id = Some(existing.id.clone());
            stored.linked_task = None;
            self.write_telegram_inbox(&document)?;
            return Ok(existing);
        }
        let fallback_description = default_telegram_task_title(&candidate);
        let description = clean_required(
            description.unwrap_or(&fallback_description),
            "описание задачи",
            20_000,
        )?;
        let now = Utc::now();
        let task = Task {
            id: Ulid::new().to_string(),
            project_id: candidate.project_id.clone(),
            description,
            created_at: now,
            updated_at: now,
            urgency,
            status: TaskStatus::Open,
            relations: Vec::new(),
            checkpoints: Vec::new(),
            source: Some(candidate.snapshot()),
            trashed_at: None,
            version: String::new(),
        };
        self.write_task(&task)?;
        let candidate = &mut document.candidates[candidate_index];
        candidate.status = InboxCandidateStatus::Imported;
        candidate.processed_at = Some(now);
        candidate.task_id = Some(task.id.clone());
        candidate.linked_task = None;
        if let Err(error) = self.write_telegram_inbox(&document) {
            let _ = fs::remove_file(self.task_path(&task.project_id, &task.id));
            return Err(error);
        }
        read_task(&self.task_path(&task.project_id, &task.id))
    }

    pub fn update_task_from_telegram_candidate(
        &self,
        candidate_id: &str,
        task_id: &str,
        notes: &str,
        urgency: Urgency,
    ) -> Result<Task, StoreError> {
        validate_id(task_id)?;
        let notes = clean_required(notes, "новый контекст задачи", 6_000)?;
        let _lock = self.lock_exclusive()?;
        let mut document = self.read_telegram_inbox()?;
        let candidate_index = document
            .candidates
            .iter()
            .position(|candidate| candidate.id == candidate_id)
            .ok_or_else(|| StoreError::NotFound(candidate_id.to_owned()))?;
        let candidate = document.candidates[candidate_index].clone();
        if candidate.status == InboxCandidateStatus::Imported
            && candidate.task_id.as_deref() == Some(task_id)
        {
            return self.find_task(task_id);
        }
        if candidate.status != InboxCandidateStatus::Pending {
            return Err(StoreError::Validation(
                "Telegram-сигнал уже обработан".into(),
            ));
        }
        let mut task = self.find_task(task_id)?;
        let original_task = task.clone();
        if task.project_id != candidate.project_id {
            return Err(StoreError::Validation(
                "задача и Telegram-сигнал принадлежат разным проектам".into(),
            ));
        }
        if task.status != TaskStatus::Open || task.trashed_at.is_some() {
            return Err(StoreError::Validation(
                "обновлять можно только открытую задачу".into(),
            ));
        }
        if !task.description.contains(&notes) {
            let next = format!(
                "{}\n\n## Обновление из Telegram\n\n{}",
                task.description.trim_end(),
                notes
            );
            task.description = clean_required(&next, "описание задачи", 20_000)?;
        }
        task.urgency = greater_urgency(task.urgency, urgency);
        let incoming = candidate.snapshot();
        task.source = Some(match task.source.take() {
            Some(existing)
                if existing.provider.as_deref() == Some("telegram")
                    && existing.chat_id == Some(candidate.chat_id) =>
            {
                merge_telegram_sources(existing, incoming)
            }
            Some(existing) => existing,
            None => incoming,
        });
        validate_source(&task.source)?;
        task.updated_at = Utc::now();
        self.write_task(&task)?;
        let stored = &mut document.candidates[candidate_index];
        stored.status = InboxCandidateStatus::Imported;
        stored.processed_at = Some(task.updated_at);
        stored.task_id = Some(task.id.clone());
        stored.linked_task = None;
        if let Err(error) = self.write_telegram_inbox(&document) {
            let _ = self.write_task(&original_task);
            return Err(error);
        }
        read_task(&self.task_path(&task.project_id, task_id))
    }

    pub fn telegram_discussion_snapshot(
        &self,
        project_id: &str,
        chat_id: i64,
        target_message_id: i64,
        context_message_ids: &[i64],
    ) -> Result<MessageSnapshot, StoreError> {
        validate_id(project_id)?;
        if context_message_ids.len() > 20 {
            return Err(StoreError::Validation(
                "контекст задачи может содержать не более 20 сообщений".into(),
            ));
        }
        let _lock = self.lock_shared()?;
        self.telegram_discussion_snapshot_locked(
            project_id,
            chat_id,
            target_message_id,
            context_message_ids,
        )
    }

    fn telegram_discussion_snapshot_locked(
        &self,
        project_id: &str,
        chat_id: i64,
        target_message_id: i64,
        context_message_ids: &[i64],
    ) -> Result<MessageSnapshot, StoreError> {
        let project = read_project(&self.project_path(project_id))
            .map_err(|error| map_missing(error, project_id))?;
        if !project
            .telegram_chats
            .iter()
            .any(|link| link.chat_id == chat_id)
        {
            return Err(StoreError::Validation(
                "Telegram-чат не связан с выбранным проектом".into(),
            ));
        }
        let chat = self
            .read_telegram_chats()?
            .chats
            .into_iter()
            .find(|chat| chat.chat_id == chat_id)
            .ok_or_else(|| StoreError::NotFound(format!("Telegram-чат {chat_id}")))?;
        let target = chat
            .messages
            .iter()
            .find(|message| telegram_message_contains_id(message, target_message_id))
            .cloned()
            .ok_or_else(|| {
                StoreError::NotFound(format!(
                    "исходное сообщение Telegram {target_message_id} в локальной ленте"
                ))
            })?;
        let mut requested_ids = context_message_ids.iter().copied().collect::<HashSet<_>>();
        requested_ids.insert(target_message_id);
        for message_id in &requested_ids {
            if !chat
                .messages
                .iter()
                .any(|message| telegram_message_contains_id(message, *message_id))
            {
                return Err(StoreError::NotFound(format!(
                    "сообщение Telegram {message_id} в локальной ленте"
                )));
            }
        }
        let mut context = chat
            .messages
            .iter()
            .filter(|message| {
                requested_ids
                    .iter()
                    .any(|id| telegram_message_contains_id(message, *id))
            })
            .cloned()
            .collect::<Vec<_>>();
        context.sort_by_key(|message| message.sent_at);
        if context.len() > 20 {
            return Err(StoreError::Validation(
                "выбранные ID относятся более чем к 20 сообщениям".into(),
            ));
        }
        for message in &mut context {
            message.is_target = telegram_message_contains_id(message, target_message_id);
        }
        let mut media = Vec::new();
        for item in &context {
            for attachment in &item.media {
                let duplicate = media.iter().any(|existing: &SourceMedia| {
                    match (existing.provider_file_id, attachment.provider_file_id) {
                        (Some(existing_id), Some(attachment_id)) => existing_id == attachment_id,
                        _ => existing == attachment,
                    }
                });
                if !duplicate {
                    media.push(attachment.clone());
                }
            }
        }
        if media.len() > 20 {
            return Err(StoreError::Validation(
                "в выбранном обсуждении более 20 медиафайлов".into(),
            ));
        }
        let mut episode_message_ids = context
            .iter()
            .flat_map(telegram_context_message_ids)
            .collect::<Vec<_>>();
        episode_message_ids.sort_unstable();
        episode_message_ids.dedup();
        let source = MessageSnapshot {
            text: target.text,
            author: Some(target.author),
            sent_at: Some(target.sent_at),
            url: target.url,
            provider: Some("telegram".into()),
            chat_id: Some(chat_id),
            chat_title: Some(chat.title),
            message_id: Some(target.message_id),
            message_ids: episode_message_ids,
            media,
            context,
        };
        validate_source(&Some(source.clone()))?;
        Ok(source)
    }

    pub fn create_task_from_telegram_messages_idempotent(
        &self,
        input: CreateTelegramDiscussionTask,
        request_id: &str,
    ) -> Result<CreateOutcome<Task>, StoreError> {
        validate_id(&input.project_id)?;
        let description = clean_required(&input.description, "описание задачи", 20_000)?;
        let request_id = clean_required(request_id, "request_id", 200)?;
        if input.context_message_ids.len() > 20 {
            return Err(StoreError::Validation(
                "контекст задачи может содержать не более 20 сообщений".into(),
            ));
        }
        let _lock = self.lock_exclusive()?;
        let source = self.telegram_discussion_snapshot_locked(
            &input.project_id,
            input.chat_id,
            input.target_message_id,
            &input.context_message_ids,
        )?;
        let id = deterministic_id("task", &request_id);
        match self.find_task(&id) {
            Ok(task) => {
                let same_source = task.source.as_ref().is_some_and(|existing| {
                    existing.provider.as_deref() == Some("telegram")
                        && existing.chat_id == Some(input.chat_id)
                        && source_message_ids(existing) == source.message_ids
                });
                if task.project_id != input.project_id || !same_source {
                    return Err(StoreError::Validation(
                        "request_id уже использован для другой задачи".into(),
                    ));
                }
                self.link_pending_telegram_candidates_to_task(
                    input.chat_id,
                    &source.message_ids,
                    &task.id,
                )?;
                return Ok(CreateOutcome {
                    value: task,
                    created: false,
                });
            }
            Err(StoreError::NotFound(_)) => {}
            Err(error) => return Err(error),
        }
        if let Some(task) = self.find_task_by_telegram_source(input.chat_id, &source.message_ids)? {
            self.link_pending_telegram_candidates_to_task(
                input.chat_id,
                &source.message_ids,
                &task.id,
            )?;
            return Ok(CreateOutcome {
                value: task,
                created: false,
            });
        }
        let source_message_ids = source.message_ids.clone();
        let task = self.create_task_locked(
            CreateTask {
                project_id: input.project_id,
                description: description.clone(),
                urgency: input.urgency,
                source: Some(source),
            },
            description,
            id,
        )?;
        if let Err(error) = self.link_pending_telegram_candidates_to_task(
            input.chat_id,
            &source_message_ids,
            &task.id,
        ) {
            let _ = fs::remove_file(self.task_path(&task.project_id, &task.id));
            return Err(error);
        }
        Ok(CreateOutcome {
            value: task,
            created: true,
        })
    }

    pub fn telegram_tasks_for_messages(
        &self,
        project_id: &str,
        chat_id: i64,
        message_groups: &[Vec<i64>],
    ) -> Result<Vec<Option<TelegramLinkedTask>>, StoreError> {
        validate_id(project_id)?;
        let _lock = self.lock_shared()?;
        let mut sources = Vec::<(Vec<i64>, TelegramLinkedTask)>::new();
        for project in fs::read_dir(self.projects_dir())? {
            let directory = project?.path().join("tasks");
            if directory.exists() {
                for entry in fs::read_dir(directory)? {
                    let path = entry?.path();
                    if path.extension().and_then(|value| value.to_str()) != Some("md") {
                        continue;
                    }
                    let task = read_task(&path)?;
                    let Some(source) = task.source.as_ref().filter(|source| {
                        source.provider.as_deref() == Some("telegram")
                            && source.chat_id == Some(chat_id)
                    }) else {
                        continue;
                    };
                    sources.push((source_message_ids(source), TelegramLinkedTask::from(&task)));
                }
            }
        }
        Ok(message_groups
            .iter()
            .map(|message_ids| {
                sources
                    .iter()
                    .find(|(source_ids, _)| source_ids.iter().any(|id| message_ids.contains(id)))
                    .map(|(_, task)| task.clone())
            })
            .collect())
    }

    pub fn delete_project(&self, id: &str, expected_version: &str) -> Result<(), StoreError> {
        validate_id(id)?;
        let _lock = self.lock_exclusive()?;
        let project =
            read_project(&self.project_path(id)).map_err(|error| map_missing(error, id))?;
        ensure_version(&project.version, expected_version)?;
        fs::remove_dir_all(self.projects_dir().join(id))?;
        if let Ok(mut inbox) = self.read_telegram_inbox() {
            inbox
                .candidates
                .retain(|candidate| candidate.project_id != id);
            let _ = self.write_telegram_inbox(&inbox);
        }
        if let Ok(mut events) = self.read_automation_events() {
            let previous_len = events.events.len();
            events.events.retain(|event| event.project_id != id);
            if events.events.len() != previous_len {
                let _ = self.write_automation_events(&events);
            }
        }
        if let Ok(mut settings) = self.read_automation_settings() {
            let previous_len = settings.projects.len();
            settings.projects.retain(|policy| policy.project_id != id);
            if settings.projects.len() != previous_len {
                settings.updated_at = Some(Utc::now());
                let _ = self.write_automation_settings(&settings);
            }
        }
        Ok(())
    }

    pub fn list_tasks(
        &self,
        project_id: Option<&str>,
        include_completed: bool,
    ) -> Result<Vec<TaskSummary>, StoreError> {
        let _lock = self.lock_shared()?;
        let mut tasks = Vec::new();
        let projects = if let Some(id) = project_id {
            validate_id(id)?;
            vec![self.root.join("projects").join(id)]
        } else {
            fs::read_dir(self.projects_dir())?
                .filter_map(Result::ok)
                .filter_map(|entry| {
                    entry
                        .file_type()
                        .ok()
                        .filter(|kind| kind.is_dir())
                        .map(|_| entry.path())
                })
                .collect()
        };
        for project in projects {
            let dir = project.join("tasks");
            if !dir.exists() {
                continue;
            }
            for entry in fs::read_dir(dir)? {
                let path = entry?.path();
                if path.extension().and_then(|value| value.to_str()) == Some("md") {
                    let task = read_task(&path)?;
                    if task.trashed_at.is_none()
                        && (include_completed || task.status == TaskStatus::Open)
                    {
                        tasks.push(task);
                    }
                }
            }
        }
        tasks.sort_by(|a, b| {
            let status = status_rank(&a.status).cmp(&status_rank(&b.status));
            let urgency = urgency_rank(&b.urgency).cmp(&urgency_rank(&a.urgency));
            status
                .then(urgency)
                .then_with(|| b.created_at.cmp(&a.created_at))
        });
        Ok(tasks.into_iter().map(TaskSummary::from).collect())
    }

    pub fn get_task(&self, id: &str) -> Result<Task, StoreError> {
        validate_id(id)?;
        let _lock = self.lock_shared()?;
        self.find_task(id)
    }

    pub fn list_task_agent_runs(&self, task_id: &str) -> Result<Vec<AgentRun>, StoreError> {
        validate_id(task_id)?;
        let _lock = self.lock_shared()?;
        let mut runs = self
            .read_agent_runs()?
            .runs
            .into_iter()
            .filter(|run| run.task_id == task_id)
            .collect::<Vec<_>>();
        runs.sort_by_key(|run| Reverse(run.created_at));
        Ok(runs)
    }

    pub fn list_agent_runs(&self, active_only: bool) -> Result<Vec<AgentRun>, StoreError> {
        let _lock = self.lock_shared()?;
        let mut runs = self
            .read_agent_runs()?
            .runs
            .into_iter()
            .filter(|run| !active_only || run.state.is_active())
            .collect::<Vec<_>>();
        runs.sort_by_key(|run| Reverse(run.created_at));
        Ok(runs)
    }

    pub fn get_agent_run(&self, id: &str) -> Result<AgentRun, StoreError> {
        validate_id(id)?;
        let _lock = self.lock_shared()?;
        self.read_agent_runs()?
            .runs
            .into_iter()
            .find(|run| run.id == id)
            .ok_or_else(|| StoreError::NotFound(id.to_owned()))
    }

    pub fn create_agent_run(
        &self,
        task_id: &str,
        working_directory: &Path,
    ) -> Result<AgentRun, StoreError> {
        self.create_agent_run_with_request_id(task_id, working_directory, None)
            .map(|outcome| outcome.value)
    }

    pub fn create_agent_run_idempotent(
        &self,
        task_id: &str,
        working_directory: &Path,
        request_id: &str,
    ) -> Result<CreateOutcome<AgentRun>, StoreError> {
        let request_id = clean_required(request_id, "request_id", 200)?;
        self.create_agent_run_with_request_id(task_id, working_directory, Some(request_id))
    }

    fn create_agent_run_with_request_id(
        &self,
        task_id: &str,
        working_directory: &Path,
        request_id: Option<String>,
    ) -> Result<CreateOutcome<AgentRun>, StoreError> {
        validate_id(task_id)?;
        let directory = fs::canonicalize(working_directory)
            .map_err(|_| StoreError::Validation("локальная папка проекта недоступна".into()))?;
        if !directory.is_dir() {
            return Err(StoreError::Validation(
                "для запуска агента нужна локальная папка проекта".into(),
            ));
        }
        let _lock = self.lock_exclusive()?;
        let task = self.find_task(task_id)?;
        let mut document = self.read_agent_runs()?;
        if let Some(request_id) = request_id.as_deref()
            && let Some(existing) = document
                .runs
                .iter()
                .find(|run| run.request_id.as_deref() == Some(request_id))
        {
            if existing.task_id != task_id {
                return Err(StoreError::Validation(
                    "request_id уже использован для другой задачи".into(),
                ));
            }
            return Ok(CreateOutcome {
                value: existing.clone(),
                created: false,
            });
        }
        if document.runs.iter().any(|run| {
            run.task_id == task_id
                && (run.state.is_active() || run.state == AgentRunState::NeedsInput)
        }) {
            return Err(StoreError::Validation(
                "агент уже работает над этой задачей".into(),
            ));
        }
        let now = Utc::now();
        let run = AgentRun {
            id: Ulid::new().to_string(),
            task_id: task.id,
            project_id: task.project_id,
            request_id,
            provider: "codex".into(),
            state: AgentRunState::Queued,
            created_at: now,
            updated_at: now,
            started_at: None,
            finished_at: None,
            thread_id: None,
            working_directory: directory.to_string_lossy().into_owned(),
            progress: Some("Готовлю контекст задачи".into()),
            result: None,
            memory: Vec::new(),
            guidance: Vec::new(),
            blocker: None,
            last_response: None,
            last_response_request_id: None,
            error: None,
        };
        document.runs.push(run.clone());
        if document.runs.len() > MAX_AGENT_RUNS {
            document.runs.sort_by_key(|item| item.created_at);
            document.runs.drain(0..document.runs.len() - MAX_AGENT_RUNS);
        }
        self.write_agent_runs(&document)?;
        Ok(CreateOutcome {
            value: run,
            created: true,
        })
    }

    pub fn update_agent_run(&self, id: &str, patch: AgentRunPatch) -> Result<AgentRun, StoreError> {
        validate_id(id)?;
        let _lock = self.lock_exclusive()?;
        let mut document = self.read_agent_runs()?;
        let run = document
            .runs
            .iter_mut()
            .find(|run| run.id == id)
            .ok_or_else(|| StoreError::NotFound(id.to_owned()))?;
        if let Some(state) = patch.state {
            run.state = state;
        }
        if let Some(value) = patch.started_at {
            run.started_at = value;
        }
        if let Some(value) = patch.finished_at {
            run.finished_at = value;
        }
        if let Some(value) = patch.thread_id {
            run.thread_id = value;
        }
        if let Some(value) = patch.progress {
            run.progress = value.map(|value| truncate_text(value, 2_000));
        }
        if let Some(value) = patch.result {
            run.result = value.map(|value| truncate_text(value, 20_000));
        }
        if let Some(value) = patch.memory {
            run.memory = value
                .into_iter()
                .take(5)
                .map(|value| truncate_text(value, 600))
                .filter(|value| !value.trim().is_empty())
                .collect();
        }
        if let Some(value) = patch.guidance {
            run.guidance = value.into_iter().take(32).collect();
        }
        if let Some(value) = patch.blocker {
            run.blocker = value.map(|value| truncate_text(value, 2_000));
        }
        if let Some(value) = patch.last_response {
            run.last_response = value.map(|value| truncate_text(value, 4_000));
        }
        if let Some(value) = patch.last_response_request_id {
            run.last_response_request_id = value.map(|value| truncate_text(value, 200));
        }
        if let Some(value) = patch.error {
            run.error = value.map(|value| truncate_text(value, 2_000));
        }
        run.updated_at = Utc::now();
        let updated = run.clone();
        self.write_agent_runs(&document)?;
        Ok(updated)
    }

    pub fn accept_agent_run(
        &self,
        id: &str,
        expected_task_version: &str,
    ) -> Result<(AgentRun, Task), StoreError> {
        let run = self.get_agent_run(id)?;
        let task = self.get_task(&run.task_id)?;
        if run.state == AgentRunState::Accepted {
            if task.status != TaskStatus::Completed {
                return Err(StoreError::Validation(
                    "принятый запуск связан с незавершённой задачей".into(),
                ));
            }
            return Ok((run, task));
        }
        if run.state != AgentRunState::ReadyForReview {
            return Err(StoreError::Validation(
                "результат агента ещё не готов к принятию".into(),
            ));
        }
        let task = if task.status == TaskStatus::Completed {
            task
        } else {
            self.complete_task(&run.task_id, expected_task_version)?
        };
        let run = self.update_agent_run(
            id,
            AgentRunPatch {
                state: Some(AgentRunState::Accepted),
                ..AgentRunPatch::default()
            },
        )?;
        Ok((run, task))
    }

    pub fn answer_agent_run_idempotent(
        &self,
        id: &str,
        response: &str,
        request_id: &str,
    ) -> Result<CreateOutcome<AgentRun>, StoreError> {
        validate_id(id)?;
        let response = clean_required(response, "ответ агенту", 4_000)?;
        let request_id = clean_required(request_id, "request_id", 200)?;
        let _lock = self.lock_exclusive()?;
        let mut document = self.read_agent_runs()?;
        if let Some(existing) = document
            .runs
            .iter()
            .find(|run| run.last_response_request_id.as_deref() == Some(request_id.as_str()))
        {
            if existing.id != id || existing.last_response.as_deref() != Some(response.as_str()) {
                return Err(StoreError::Validation(
                    "request_id уже использован для другого ответа агенту".into(),
                ));
            }
            return Ok(CreateOutcome {
                value: existing.clone(),
                created: false,
            });
        }
        let run = document
            .runs
            .iter_mut()
            .find(|run| run.id == id)
            .ok_or_else(|| StoreError::NotFound(id.to_owned()))?;
        if run.state != AgentRunState::NeedsInput {
            return Err(StoreError::Validation(
                "этот запуск не ожидает ответа".into(),
            ));
        }
        if run.thread_id.is_none() {
            return Err(StoreError::Validation(
                "Codex не сохранил идентификатор сессии; запустите задачу снова".into(),
            ));
        }
        run.state = AgentRunState::Queued;
        run.updated_at = Utc::now();
        run.finished_at = None;
        run.progress = Some("Передаю ответ в ту же сессию Codex".into());
        run.blocker = None;
        run.last_response = Some(response);
        run.last_response_request_id = Some(request_id);
        run.error = None;
        let updated = run.clone();
        self.write_agent_runs(&document)?;
        Ok(CreateOutcome {
            value: updated,
            created: true,
        })
    }

    pub fn interrupt_nonrecoverable_agent_runs(&self) -> Result<usize, StoreError> {
        let _lock = self.lock_exclusive()?;
        let mut document = self.read_agent_runs()?;
        let now = Utc::now();
        let mut interrupted = 0;
        for run in &mut document.runs {
            if run.state == AgentRunState::Running {
                run.state = AgentRunState::Interrupted;
                run.updated_at = now;
                run.finished_at = Some(now);
                run.error = Some("Приложение было закрыто во время работы агента".into());
                interrupted += 1;
            }
        }
        if interrupted > 0 {
            self.write_agent_runs(&document)?;
        }
        Ok(interrupted)
    }

    pub fn list_trashed_tasks(&self) -> Result<Vec<TaskSummary>, StoreError> {
        let _lock = self.lock_shared()?;
        let mut tasks = Vec::new();
        for entry in fs::read_dir(self.projects_dir())? {
            let dir = entry?.path().join("tasks");
            if !dir.exists() {
                continue;
            }
            for entry in fs::read_dir(dir)? {
                let path = entry?.path();
                if path.extension().and_then(|value| value.to_str()) == Some("md") {
                    let task = read_task(&path)?;
                    if task.trashed_at.is_some() {
                        tasks.push(task);
                    }
                }
            }
        }
        tasks.sort_by_key(|task| Reverse(task.trashed_at));
        Ok(tasks.into_iter().map(TaskSummary::from).collect())
    }

    pub fn create_task(&self, input: CreateTask) -> Result<Task, StoreError> {
        validate_id(&input.project_id)?;
        let description = clean_required(&input.description, "описание задачи", 20_000)?;
        validate_source(&input.source)?;
        let _lock = self.lock_exclusive()?;
        self.create_task_locked(input, description, Ulid::new().to_string())
    }

    pub fn create_task_idempotent(
        &self,
        input: CreateTask,
        request_id: &str,
    ) -> Result<CreateOutcome<Task>, StoreError> {
        validate_id(&input.project_id)?;
        let description = clean_required(&input.description, "описание задачи", 20_000)?;
        validate_source(&input.source)?;
        let request_id = clean_required(request_id, "request_id", 200)?;
        let id = deterministic_id("task", &request_id);
        let _lock = self.lock_exclusive()?;
        match self.find_task(&id) {
            Ok(value) => {
                if value.project_id != input.project_id
                    || value.description != description
                    || value.urgency != input.urgency
                    || value.source != input.source
                {
                    return Err(StoreError::Validation(
                        "request_id уже использован для другой задачи".into(),
                    ));
                }
                return Ok(CreateOutcome {
                    value,
                    created: false,
                });
            }
            Err(StoreError::NotFound(_)) => {}
            Err(error) => return Err(error),
        }
        self.create_task_locked(input, description, id)
            .map(|value| CreateOutcome {
                value,
                created: true,
            })
    }

    fn create_task_locked(
        &self,
        input: CreateTask,
        description: String,
        id: String,
    ) -> Result<Task, StoreError> {
        if !self.project_path(&input.project_id).exists() {
            return Err(StoreError::NotFound(input.project_id));
        }
        let now = Utc::now();
        let task = Task {
            id,
            project_id: input.project_id,
            description,
            created_at: now,
            updated_at: now,
            urgency: input.urgency,
            status: TaskStatus::Open,
            relations: Vec::new(),
            checkpoints: Vec::new(),
            source: input.source,
            trashed_at: None,
            version: String::new(),
        };
        self.write_task(&task)?;
        read_task(&self.task_path(&task.project_id, &task.id))
    }

    pub fn preview_task_batch(
        &self,
        operations: Vec<TaskBatchOperation>,
        expected_versions: Vec<crate::ExpectedTaskVersion>,
        request_id: &str,
    ) -> Result<TaskBatchOutcome, StoreError> {
        if operations.is_empty() || operations.len() > MAX_TASK_BATCH_OPERATIONS {
            return Err(StoreError::Validation(format!(
                "пакет должен содержать от 1 до {MAX_TASK_BATCH_OPERATIONS} действий"
            )));
        }
        let request_id = clean_required(request_id, "request_id", 200)?;
        let payload = serde_json::to_vec(&(&operations, &expected_versions))?;
        let payload_digest = hex::encode(Sha256::digest(payload));
        let receipt_path = self.task_batch_receipt_path(&request_id);
        let _lock = self.lock_exclusive()?;

        if receipt_path.exists() {
            let receipt = self.read_task_batch_receipt(&receipt_path)?;
            if receipt.request_id != request_id || receipt.payload_digest != payload_digest {
                return Err(StoreError::Validation(
                    "request_id уже использован для другого пакетного изменения".into(),
                ));
            }
            let tasks = if receipt.applied {
                self.read_applied_task_batch_tasks(&receipt)?
            } else {
                receipt.tasks.clone()
            };
            return Ok(TaskBatchOutcome {
                request_id,
                repeated: true,
                operations: receipt.operations,
                tasks,
            });
        }

        let (operation_results, tasks) =
            self.prepare_task_batch_locked(&operations, &expected_versions, &request_id)?;
        Ok(TaskBatchOutcome {
            request_id,
            repeated: false,
            operations: operation_results,
            tasks,
        })
    }

    pub fn apply_task_batch(
        &self,
        operations: Vec<TaskBatchOperation>,
        expected_versions: Vec<crate::ExpectedTaskVersion>,
        request_id: &str,
    ) -> Result<TaskBatchOutcome, StoreError> {
        if operations.is_empty() || operations.len() > MAX_TASK_BATCH_OPERATIONS {
            return Err(StoreError::Validation(format!(
                "пакет должен содержать от 1 до {MAX_TASK_BATCH_OPERATIONS} действий"
            )));
        }
        let request_id = clean_required(request_id, "request_id", 200)?;
        let payload = serde_json::to_vec(&(&operations, &expected_versions))?;
        let payload_digest = hex::encode(Sha256::digest(payload));
        let receipt_path = self.task_batch_receipt_path(&request_id);
        let _lock = self.lock_exclusive()?;

        if receipt_path.exists() {
            let receipt = self.read_task_batch_receipt(&receipt_path)?;
            if receipt.request_id != request_id || receipt.payload_digest != payload_digest {
                return Err(StoreError::Validation(
                    "request_id уже использован для другого пакетного изменения".into(),
                ));
            }
            let (receipt, tasks) = if receipt.applied {
                let tasks = self.read_applied_task_batch_tasks(&receipt)?;
                (receipt, tasks)
            } else {
                self.finish_task_batch_receipt(receipt, &receipt_path)?
            };
            return Ok(TaskBatchOutcome {
                request_id,
                repeated: true,
                operations: receipt.operations,
                tasks,
            });
        }

        let (operation_results, tasks) =
            self.prepare_task_batch_locked(&operations, &expected_versions, &request_id)?;
        let mut receipt = TaskBatchReceipt {
            format_version: 1,
            request_id: request_id.clone(),
            payload_digest,
            applied: false,
            operations: operation_results,
            task_ids: Vec::new(),
            tasks,
        };
        let originals = receipt
            .tasks
            .iter()
            .map(|task| {
                let path = self.task_path(&task.project_id, &task.id);
                let bytes = path.exists().then(|| fs::read(&path)).transpose()?;
                Ok((path, bytes))
            })
            .collect::<Result<Vec<_>, StoreError>>()?;
        self.write_task_batch_receipt(&receipt_path, &receipt)?;
        if let Err(error) = self.apply_task_batch_tasks(&receipt.tasks) {
            let rollback = originals
                .iter()
                .rev()
                .try_for_each(|(path, bytes)| match bytes {
                    Some(bytes) => atomic_write_bytes(path, bytes),
                    None if path.exists() => fs::remove_file(path).map_err(StoreError::from),
                    None => Ok(()),
                });
            if rollback.is_ok() {
                let _ = fs::remove_file(&receipt_path);
                return Err(error);
            }
            return Err(StoreError::Io(std::io::Error::other(format!(
                "пакет не удалось записать и полностью откатить; восстановление продолжится при следующем запуске: {error}"
            ))));
        }
        let tasks = receipt
            .tasks
            .iter()
            .map(|task| read_task(&self.task_path(&task.project_id, &task.id)))
            .collect::<Result<Vec<_>, _>>()?;
        receipt.task_ids = tasks.iter().map(|task| task.id.clone()).collect();
        receipt.tasks.clear();
        receipt.applied = true;
        self.write_task_batch_receipt(&receipt_path, &receipt)?;
        Ok(TaskBatchOutcome {
            request_id,
            repeated: false,
            operations: receipt.operations,
            tasks,
        })
    }

    fn prepare_task_batch_locked(
        &self,
        operations: &[TaskBatchOperation],
        expected_versions: &[crate::ExpectedTaskVersion],
        request_id: &str,
    ) -> Result<(Vec<TaskBatchOperationResult>, Vec<Task>), StoreError> {
        let mut operation_ids = HashSet::new();
        let mut created_ids = HashMap::new();
        for operation in operations {
            let operation_id = batch_operation_id(operation);
            let cleaned_operation_id = clean_required(operation_id, "operation_id", 100)?;
            if cleaned_operation_id != operation_id {
                return Err(StoreError::Validation(
                    "operation_id не должен начинаться или заканчиваться пробелами".into(),
                ));
            }
            if !operation_ids.insert(operation_id.to_owned()) {
                return Err(StoreError::Validation(
                    "operation_id внутри пакета не должны повторяться".into(),
                ));
            }
            if matches!(operation, TaskBatchOperation::Create { .. }) {
                created_ids.insert(
                    operation_id.to_owned(),
                    deterministic_id(&format!("task-batch:{request_id}"), operation_id),
                );
            }
        }

        let mut expected = HashMap::new();
        for item in expected_versions {
            validate_id(&item.task_id)?;
            if item.version.trim().is_empty() {
                return Err(StoreError::Validation(
                    "expected version задачи не может быть пустой".into(),
                ));
            }
            if expected
                .insert(item.task_id.clone(), item.version.clone())
                .is_some()
            {
                return Err(StoreError::Validation(
                    "версия одной задачи указана в пакете несколько раз".into(),
                ));
            }
        }

        let mut working = HashMap::<String, Task>::new();
        let mut created = HashSet::new();
        let mut checked_versions = HashSet::new();
        let mut changed_ids = Vec::new();
        let mut changed_set = HashSet::new();
        let mut results = Vec::with_capacity(operations.len());
        let now = Utc::now();

        for operation in operations {
            let (operation_id, action, task_id, changed) = match operation {
                TaskBatchOperation::Create {
                    operation_id,
                    project_id,
                    description,
                    urgency,
                    source,
                } => {
                    validate_id(project_id)?;
                    if !self.project_path(project_id).exists() {
                        return Err(StoreError::NotFound(project_id.clone()));
                    }
                    let description = clean_required(description, "описание задачи", 20_000)?;
                    validate_source(source)?;
                    let id = created_ids[operation_id].clone();
                    match self.find_task(&id) {
                        Ok(_) => {
                            return Err(StoreError::Validation(
                                "идентификатор новой задачи уже существует без журнала пакета"
                                    .into(),
                            ));
                        }
                        Err(StoreError::NotFound(_)) => {}
                        Err(error) => return Err(error),
                    }
                    working.insert(
                        id.clone(),
                        Task {
                            id: id.clone(),
                            project_id: project_id.clone(),
                            description,
                            created_at: now,
                            updated_at: now,
                            urgency: urgency.clone(),
                            status: TaskStatus::Open,
                            relations: Vec::new(),
                            checkpoints: Vec::new(),
                            source: source.clone(),
                            trashed_at: None,
                            version: String::new(),
                        },
                    );
                    created.insert(id.clone());
                    (operation_id, TaskBatchAction::Create, id, true)
                }
                TaskBatchOperation::Update {
                    operation_id,
                    task,
                    patch,
                } => {
                    if patch.description.is_none()
                        && patch.urgency.is_none()
                        && patch.status.is_none()
                        && patch.source.is_none()
                    {
                        return Err(StoreError::Validation(
                            "update в пакетном изменении не содержит изменений".into(),
                        ));
                    }
                    let id = resolve_batch_reference(task, &created_ids)?;
                    self.load_batch_task_locked(&id, &mut working)?;
                    ensure_batch_expected_version(
                        &id,
                        &working,
                        &created,
                        &expected,
                        &mut checked_versions,
                    )?;
                    let value = working.get_mut(&id).expect("batch task loaded");
                    let before = value.clone();
                    if let Some(description) = &patch.description {
                        value.description = clean_required(description, "описание задачи", 20_000)?;
                    }
                    if let Some(urgency) = &patch.urgency {
                        value.urgency = urgency.clone();
                    }
                    if let Some(status) = &patch.status {
                        value.status = status.clone();
                    }
                    if let Some(source) = &patch.source {
                        validate_source(source)?;
                        value.source = source.clone();
                    }
                    let changed = *value != before;
                    if changed {
                        value.updated_at = now;
                    }
                    (operation_id, TaskBatchAction::Update, id, changed)
                }
                TaskBatchOperation::Link {
                    operation_id,
                    task,
                    target,
                    relation,
                } => {
                    let id = resolve_batch_reference(task, &created_ids)?;
                    let target_id = resolve_batch_reference(target, &created_ids)?;
                    if id == target_id {
                        return Err(StoreError::Validation(
                            "задачу нельзя связать саму с собой".into(),
                        ));
                    }
                    self.load_batch_task_locked(&id, &mut working)?;
                    self.load_batch_task_locked(&target_id, &mut working)?;
                    ensure_batch_expected_version(
                        &id,
                        &working,
                        &created,
                        &expected,
                        &mut checked_versions,
                    )?;
                    if working[&id].project_id != working[&target_id].project_id {
                        return Err(StoreError::Validation(
                            "связывать задачи пока можно только внутри одного проекта".into(),
                        ));
                    }
                    let value = working.get_mut(&id).expect("batch task loaded");
                    let exists = value
                        .relations
                        .iter()
                        .any(|item| item.task_id == target_id && item.kind == *relation);
                    if !exists {
                        if value.relations.len() >= 50 {
                            return Err(StoreError::Validation(
                                "у задачи может быть не более 50 связей".into(),
                            ));
                        }
                        value.relations.push(crate::TaskRelation {
                            task_id: target_id,
                            kind: *relation,
                        });
                        value.updated_at = now;
                    }
                    (operation_id, TaskBatchAction::Link, id, !exists)
                }
                TaskBatchOperation::Unlink {
                    operation_id,
                    task,
                    target,
                    relation,
                } => {
                    let id = resolve_batch_reference(task, &created_ids)?;
                    let target_id = resolve_batch_reference(target, &created_ids)?;
                    self.load_batch_task_locked(&id, &mut working)?;
                    self.load_batch_task_locked(&target_id, &mut working)?;
                    ensure_batch_expected_version(
                        &id,
                        &working,
                        &created,
                        &expected,
                        &mut checked_versions,
                    )?;
                    let value = working.get_mut(&id).expect("batch task loaded");
                    let before = value.relations.len();
                    value
                        .relations
                        .retain(|item| item.task_id != target_id || item.kind != *relation);
                    let changed = value.relations.len() != before;
                    if changed {
                        value.updated_at = now;
                    }
                    (operation_id, TaskBatchAction::Unlink, id, changed)
                }
            };
            if changed && changed_set.insert(task_id.clone()) {
                changed_ids.push(task_id.clone());
            }
            results.push(TaskBatchOperationResult {
                operation_id: operation_id.clone(),
                action,
                task_id,
                changed,
            });
        }

        let projects = working
            .values()
            .filter(|task| changed_set.contains(&task.id))
            .map(|task| task.project_id.clone())
            .collect::<HashSet<_>>();
        for project_id in projects {
            self.load_project_tasks_for_batch_locked(&project_id, &mut working)?;
            validate_batch_relation_cycles(&project_id, &working)?;
        }
        let tasks = changed_ids
            .into_iter()
            .filter_map(|id| working.remove(&id))
            .collect();
        Ok((results, tasks))
    }

    pub fn update_task(
        &self,
        id: &str,
        patch: TaskPatch,
        expected_version: &str,
    ) -> Result<Task, StoreError> {
        validate_id(id)?;
        let _lock = self.lock_exclusive()?;
        let mut task = self.find_task(id)?;
        ensure_version(&task.version, expected_version)?;
        if let Some(description) = patch.description {
            task.description = clean_required(&description, "описание задачи", 20_000)?;
        }
        if let Some(urgency) = patch.urgency {
            task.urgency = urgency;
        }
        if let Some(status) = patch.status {
            task.status = status;
        }
        if let Some(source) = patch.source {
            validate_source(&source)?;
            task.source = source;
        }
        task.updated_at = Utc::now();
        self.write_task(&task)?;
        read_task(&self.task_path(&task.project_id, id))
    }

    pub fn complete_task(&self, id: &str, expected_version: &str) -> Result<Task, StoreError> {
        self.update_task(
            id,
            TaskPatch {
                status: Some(TaskStatus::Completed),
                ..TaskPatch::default()
            },
            expected_version,
        )
    }

    pub fn link_tasks(
        &self,
        id: &str,
        target_task_id: &str,
        kind: crate::TaskRelationKind,
        expected_version: &str,
    ) -> Result<Task, StoreError> {
        validate_id(id)?;
        validate_id(target_task_id)?;
        if id == target_task_id {
            return Err(StoreError::Validation(
                "задачу нельзя связать саму с собой".into(),
            ));
        }
        let _lock = self.lock_exclusive()?;
        let mut task = self.find_task(id)?;
        if task
            .relations
            .iter()
            .any(|relation| relation.task_id == target_task_id && relation.kind == kind)
        {
            return Ok(task);
        }
        ensure_version(&task.version, expected_version)?;
        if task.relations.len() >= 50 {
            return Err(StoreError::Validation(
                "у задачи может быть не более 50 связей".into(),
            ));
        }
        let target = self.find_task(target_task_id)?;
        if target.project_id != task.project_id {
            return Err(StoreError::Validation(
                "связывать задачи пока можно только внутри одного проекта".into(),
            ));
        }
        if matches!(
            kind,
            crate::TaskRelationKind::BlockedBy | crate::TaskRelationKind::SubtaskOf
        ) && self.relation_path_exists_locked(&task.project_id, target_task_id, id, &kind)?
        {
            return Err(StoreError::Validation(
                "эта связь создаёт цикл между задачами".into(),
            ));
        }
        task.relations.push(crate::TaskRelation {
            task_id: target_task_id.to_owned(),
            kind,
        });
        task.updated_at = Utc::now();
        self.write_task(&task)?;
        read_task(&self.task_path(&task.project_id, id))
    }

    pub fn unlink_tasks(
        &self,
        id: &str,
        target_task_id: &str,
        kind: crate::TaskRelationKind,
        expected_version: &str,
    ) -> Result<Task, StoreError> {
        validate_id(id)?;
        validate_id(target_task_id)?;
        let _lock = self.lock_exclusive()?;
        let mut task = self.find_task(id)?;
        let previous_len = task.relations.len();
        task.relations
            .retain(|relation| relation.task_id != target_task_id || relation.kind != kind);
        if task.relations.len() == previous_len {
            return Ok(task);
        }
        ensure_version(&task.version, expected_version)?;
        task.updated_at = Utc::now();
        self.write_task(&task)?;
        read_task(&self.task_path(&task.project_id, id))
    }

    pub fn task_readiness(&self, id: &str) -> Result<crate::TaskReadiness, StoreError> {
        validate_id(id)?;
        let _lock = self.lock_shared()?;
        let task = self.find_task(id)?;
        let mut blocked_by = Vec::new();
        let mut missing_blocker_ids = Vec::new();
        for relation in task
            .relations
            .iter()
            .filter(|relation| relation.kind == crate::TaskRelationKind::BlockedBy)
        {
            match self.find_task(&relation.task_id) {
                Ok(blocker) if blocker.project_id != task.project_id => {
                    missing_blocker_ids.push(relation.task_id.clone());
                }
                Ok(blocker)
                    if blocker.status != TaskStatus::Completed || blocker.trashed_at.is_some() =>
                {
                    blocked_by.push(TaskSummary::from(blocker));
                }
                Ok(_) => {}
                Err(StoreError::NotFound(_)) => {
                    missing_blocker_ids.push(relation.task_id.clone());
                }
                Err(error) => return Err(error),
            }
        }
        let ready = task.status == TaskStatus::Open
            && task.trashed_at.is_none()
            && blocked_by.is_empty()
            && missing_blocker_ids.is_empty();
        Ok(crate::TaskReadiness {
            task_id: task.id,
            ready,
            blocked_by,
            missing_blocker_ids,
        })
    }

    pub fn append_task_checkpoint_idempotent(
        &self,
        id: &str,
        draft: crate::TaskCheckpointDraft,
        expected_version: &str,
        request_id: &str,
    ) -> Result<CreateOutcome<Task>, StoreError> {
        self.append_task_checkpoint_inner(id, draft, Some(expected_version), request_id)
    }

    pub fn append_agent_checkpoint_idempotent(
        &self,
        id: &str,
        run_id: &str,
        mut draft: crate::TaskCheckpointDraft,
    ) -> Result<CreateOutcome<Task>, StoreError> {
        validate_id(run_id)?;
        let run = self.get_agent_run(run_id)?;
        if run.task_id != id {
            return Err(StoreError::Validation(
                "запуск агента связан с другой задачей".into(),
            ));
        }
        draft.source = crate::TaskCheckpointSource::Agent;
        draft.agent_run_id = Some(run_id.to_owned());
        let turn_id = run.last_response_request_id.as_deref().unwrap_or("initial");
        self.append_task_checkpoint_inner(
            id,
            draft,
            None,
            &format!("agent-run:{run_id}:checkpoint:{turn_id}"),
        )
    }

    fn append_task_checkpoint_inner(
        &self,
        id: &str,
        draft: crate::TaskCheckpointDraft,
        expected_version: Option<&str>,
        request_id: &str,
    ) -> Result<CreateOutcome<Task>, StoreError> {
        validate_id(id)?;
        let request_id = clean_required(request_id, "request_id", 200)?;
        let draft = normalize_task_checkpoint_draft(draft)?;
        let checkpoint_id = deterministic_id(&format!("task-checkpoint:{id}"), &request_id);
        let _lock = self.lock_exclusive()?;
        let mut task = self.find_task(id)?;
        if let Some(existing) = task
            .checkpoints
            .iter()
            .find(|checkpoint| checkpoint.id == checkpoint_id)
        {
            if existing.source != draft.source
                || existing.summary != draft.summary
                || existing.verification != draft.verification
                || existing.remaining != draft.remaining
                || existing.blocker != draft.blocker
                || existing.result != draft.result
                || existing.agent_run_id != draft.agent_run_id
            {
                return Err(StoreError::Validation(
                    "request_id уже использован для другой контрольной точки".into(),
                ));
            }
            return Ok(CreateOutcome {
                value: task,
                created: false,
            });
        }
        if let Some(expected_version) = expected_version {
            ensure_version(&task.version, expected_version)?;
        }
        if task.checkpoints.len() >= 50 {
            return Err(StoreError::Validation(
                "у задачи может быть не более 50 контрольных точек".into(),
            ));
        }
        task.checkpoints.push(crate::TaskCheckpoint {
            id: checkpoint_id,
            created_at: Utc::now(),
            source: draft.source,
            summary: draft.summary,
            verification: draft.verification,
            remaining: draft.remaining,
            blocker: draft.blocker,
            result: draft.result,
            agent_run_id: draft.agent_run_id,
        });
        task.updated_at = Utc::now();
        self.write_task(&task)?;
        Ok(CreateOutcome {
            value: read_task(&self.task_path(&task.project_id, id))?,
            created: true,
        })
    }

    fn relation_path_exists_locked(
        &self,
        project_id: &str,
        start: &str,
        target: &str,
        kind: &crate::TaskRelationKind,
    ) -> Result<bool, StoreError> {
        let mut stack = vec![start.to_owned()];
        let mut visited = HashSet::new();
        while let Some(task_id) = stack.pop() {
            if task_id == target {
                return Ok(true);
            }
            if !visited.insert(task_id.clone()) {
                continue;
            }
            let task = match self.find_task(&task_id) {
                Ok(task) if task.project_id == project_id => task,
                Ok(_) | Err(StoreError::NotFound(_)) => continue,
                Err(error) => return Err(error),
            };
            stack.extend(
                task.relations
                    .into_iter()
                    .filter(|relation| &relation.kind == kind)
                    .map(|relation| relation.task_id),
            );
        }
        Ok(false)
    }

    pub fn clear_task_source(&self, id: &str, expected_version: &str) -> Result<Task, StoreError> {
        self.update_task(
            id,
            TaskPatch {
                source: Some(None),
                ..TaskPatch::default()
            },
            expected_version,
        )
    }

    pub fn move_task(
        &self,
        id: &str,
        project_id: &str,
        expected_version: &str,
    ) -> Result<Task, StoreError> {
        validate_id(id)?;
        validate_id(project_id)?;
        let _lock = self.lock_exclusive()?;
        if !self.project_path(project_id).exists() {
            return Err(StoreError::NotFound(project_id.to_owned()));
        }
        let mut task = self.find_task(id)?;
        ensure_version(&task.version, expected_version)?;
        if task.project_id == project_id {
            return Ok(task);
        }
        if !task.relations.is_empty()
            || self.task_has_incoming_relations_locked(&task.project_id, id)?
        {
            return Err(StoreError::Validation(
                "перед переносом задачи в другой проект удалите её связи".into(),
            ));
        }
        let old_path = self.task_path(&task.project_id, id);
        let new_path = self.task_path(project_id, id);
        let old_attachments = self.attachment_dir(&task.project_id, id);
        let new_attachments = self.attachment_dir(project_id, id);
        fs::create_dir_all(self.task_dir(project_id))?;
        fs::rename(&old_path, &new_path)?;
        if old_attachments.exists() {
            if let Some(parent) = new_attachments.parent() {
                fs::create_dir_all(parent)?;
            }
            if let Err(error) = fs::rename(&old_attachments, &new_attachments) {
                let _ = fs::rename(&new_path, &old_path);
                return Err(error.into());
            }
        }
        let old_project_id = std::mem::replace(&mut task.project_id, project_id.to_owned());
        task.updated_at = Utc::now();
        if let Err(error) = self.write_task(&task) {
            let _ = fs::rename(&new_path, self.task_path(&old_project_id, id));
            if new_attachments.exists() {
                let _ = fs::rename(&new_attachments, self.attachment_dir(&old_project_id, id));
            }
            return Err(error);
        }
        read_task(&new_path)
    }

    pub fn trash_task(&self, id: &str, expected_version: &str) -> Result<Task, StoreError> {
        self.set_trashed(id, expected_version, true)
    }

    pub fn restore_task(&self, id: &str, expected_version: &str) -> Result<Task, StoreError> {
        self.set_trashed(id, expected_version, false)
    }

    pub fn delete_trashed_task(&self, id: &str, expected_version: &str) -> Result<(), StoreError> {
        validate_id(id)?;
        let _lock = self.lock_exclusive()?;
        let task = self.find_task(id)?;
        ensure_version(&task.version, expected_version)?;
        if task.trashed_at.is_none() {
            return Err(StoreError::Validation(
                "окончательно удалить можно только задачу из корзины".into(),
            ));
        }
        if self.task_has_incoming_relations_locked(&task.project_id, id)? {
            return Err(StoreError::Validation(
                "задача связана с другими задачами; перед удалением уберите связи".into(),
            ));
        }
        fs::remove_file(self.task_path(&task.project_id, id))?;
        let attachments = self.attachment_dir(&task.project_id, id);
        if attachments.exists() {
            fs::remove_dir_all(attachments)?;
        }
        Ok(())
    }

    pub fn empty_trash(&self) -> Result<usize, StoreError> {
        let _lock = self.lock_exclusive()?;
        let mut paths = Vec::new();
        for entry in fs::read_dir(self.projects_dir())? {
            let dir = entry?.path().join("tasks");
            if !dir.exists() {
                continue;
            }
            for entry in fs::read_dir(dir)? {
                let path = entry?.path();
                if path.extension().and_then(|value| value.to_str()) == Some("md")
                    && read_task(&path)?.trashed_at.is_some()
                {
                    let attachments = task_attachment_dir(&path);
                    paths.push((path, attachments));
                }
            }
        }
        let deleted_ids = paths
            .iter()
            .filter_map(|(path, _)| path.file_stem().and_then(|value| value.to_str()))
            .collect::<HashSet<_>>();
        for entry in fs::read_dir(self.projects_dir())? {
            let dir = entry?.path().join("tasks");
            if !dir.exists() {
                continue;
            }
            for entry in fs::read_dir(dir)? {
                let path = entry?.path();
                if path.extension().and_then(|value| value.to_str()) != Some("md") {
                    continue;
                }
                let task = read_task(&path)?;
                if deleted_ids.contains(task.id.as_str()) {
                    continue;
                }
                if task
                    .relations
                    .iter()
                    .any(|relation| deleted_ids.contains(relation.task_id.as_str()))
                {
                    return Err(StoreError::Validation(
                        "в корзине есть задачи, связанные с оставшимися задачами; удалите связи перед очисткой"
                            .into(),
                    ));
                }
            }
        }
        for (path, attachments) in &paths {
            fs::remove_file(path)?;
            if attachments.exists() {
                fs::remove_dir_all(attachments)?;
            }
        }
        Ok(paths.len())
    }

    fn task_has_incoming_relations_locked(
        &self,
        project_id: &str,
        task_id: &str,
    ) -> Result<bool, StoreError> {
        let directory = self.task_dir(project_id);
        if !directory.exists() {
            return Ok(false);
        }
        for entry in fs::read_dir(directory)? {
            let path = entry?.path();
            if path.extension().and_then(|value| value.to_str()) != Some("md") {
                continue;
            }
            let task = read_task(&path)?;
            if task.id != task_id
                && task
                    .relations
                    .iter()
                    .any(|relation| relation.task_id == task_id)
            {
                return Ok(true);
            }
        }
        Ok(false)
    }

    pub fn save_task_attachment(
        &self,
        id: &str,
        file_name: &str,
        bytes: &[u8],
    ) -> Result<String, StoreError> {
        validate_id(id)?;
        if bytes.is_empty() || bytes.len() as u64 > MAX_ATTACHMENT_BYTES {
            return Err(StoreError::Validation(
                "вложение должно быть размером от 1 байта до 25 МБ".into(),
            ));
        }
        let clean_name = clean_file_name(file_name)?;
        let _lock = self.lock_exclusive()?;
        let task = self.find_task(id)?;
        let stored_name = format!("{}-{clean_name}", Ulid::new());
        let path = self.attachment_dir(&task.project_id, id).join(&stored_name);
        atomic_write_bytes(&path, bytes)?;
        Ok(format!("attachments/{id}/{stored_name}"))
    }

    pub fn resolve_task_attachment(
        &self,
        id: &str,
        relative_path: &str,
    ) -> Result<PathBuf, StoreError> {
        validate_id(id)?;
        let _lock = self.lock_shared()?;
        let task = self.find_task(id)?;
        let prefix = format!("attachments/{id}/");
        let file_name = relative_path
            .strip_prefix(&prefix)
            .filter(|value| !value.is_empty() && !value.contains(['/', '\\']))
            .ok_or_else(|| StoreError::Validation("некорректный путь вложения".into()))?;
        let attachment_directory = self.attachment_dir(&task.project_id, id);
        let path = attachment_directory.join(file_name);
        if !path.is_file() {
            return Err(StoreError::NotFound(relative_path.to_owned()));
        }
        let canonical_directory = fs::canonicalize(attachment_directory)?;
        let canonical_path = fs::canonicalize(path)?;
        if !canonical_path.starts_with(canonical_directory) {
            return Err(StoreError::Validation(
                "путь вложения выходит за папку задачи".into(),
            ));
        }
        Ok(canonical_path)
    }

    pub fn read_task_attachment(
        &self,
        id: &str,
        relative_path: &str,
    ) -> Result<Vec<u8>, StoreError> {
        let path = self.resolve_task_attachment(id, relative_path)?;
        let size = fs::metadata(&path)?.len();
        if size == 0 || size > MAX_ATTACHMENT_BYTES {
            return Err(StoreError::Validation(
                "вложение должно быть размером от 1 байта до 25 МБ".into(),
            ));
        }
        Ok(fs::read(path)?)
    }

    pub fn attachment_cleanup_report(&self) -> Result<AttachmentCleanupReport, StoreError> {
        let _lock = self.lock_shared()?;
        Ok(self.scan_attachments()?.report)
    }

    pub fn cleanup_orphaned_attachments(&self) -> Result<AttachmentCleanupResult, StoreError> {
        let _lock = self.lock_exclusive()?;
        let scan = self.scan_attachments()?;
        let mut removed_files = 0;
        let mut removed_bytes = 0;
        let mut candidate_directories = HashSet::new();

        for (path, size) in scan.orphaned {
            if let Some(parent) = path.parent() {
                candidate_directories.insert(parent.to_path_buf());
            }
            match fs::remove_file(&path) {
                Ok(()) => {
                    removed_files += 1;
                    removed_bytes += size;
                }
                Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
                Err(error) => return Err(StoreError::Io(error)),
            }
        }

        for directory in candidate_directories {
            if directory.is_dir() && fs::read_dir(&directory)?.next().is_none() {
                fs::remove_dir(directory)?;
            }
        }

        Ok(AttachmentCleanupResult {
            removed_files,
            removed_bytes,
        })
    }

    pub fn create_backup(&self, destination: &Path) -> Result<(), StoreError> {
        let parent = destination
            .parent()
            .ok_or_else(|| StoreError::Backup("некорректный путь сохранения".into()))?;
        fs::create_dir_all(parent)?;
        let root = fs::canonicalize(&self.root)?;
        let destination_parent = fs::canonicalize(parent)?;
        if destination_parent.starts_with(&root) {
            return Err(StoreError::Backup(
                "резервную копию нельзя сохранить внутри папки данных".into(),
            ));
        }

        let _lock = self.lock_shared()?;
        let mut files = Vec::new();
        collect_backup_files(&self.projects_dir(), &mut files)?;
        let integrations = self.root.join("integrations");
        if integrations.exists() {
            collect_backup_files(&integrations, &mut files)?;
            let telegram_media_cache = integrations.join("telegram-media");
            files.retain(|path| {
                !path.starts_with(&integrations)
                    || (path != &self.telegram_sync_request_path()
                        && path != &self.telegram_sync_status_path()
                        && path != &self.telegram_connector_status_path()
                        && path != &self.telegram_media_requests_path()
                        && !path.starts_with(&telegram_media_cache)
                        && path
                            .strip_prefix(&integrations)
                            .is_ok_and(backup_integration_path_is_portable))
            });
        }
        let temporary = parent.join(format!(".flood-backup-{}.tmp", Ulid::new()));
        let result = (|| {
            let file = File::create(&temporary)?;
            let mut archive = ZipWriter::new(file);
            let options = SimpleFileOptions::default()
                .compression_method(zip::CompressionMethod::Deflated)
                .unix_permissions(0o600);
            let mut buffer = [0_u8; 64 * 1024];
            for path in files {
                let relative = path
                    .strip_prefix(&self.root)
                    .map_err(|_| StoreError::Backup("некорректный путь данных".into()))?;
                let name = relative.to_string_lossy().replace('\\', "/");
                archive
                    .start_file(name, options)
                    .map_err(|error| StoreError::Backup(error.to_string()))?;
                let mut source = File::open(path)?;
                loop {
                    let read = source.read(&mut buffer)?;
                    if read == 0 {
                        break;
                    }
                    archive
                        .write_all(&buffer[..read])
                        .map_err(|error| StoreError::Backup(error.to_string()))?;
                }
            }
            archive
                .finish()
                .map_err(|error| StoreError::Backup(error.to_string()))?
                .sync_all()?;
            if destination.exists() {
                fs::remove_file(destination)?;
            }
            fs::rename(&temporary, destination)?;
            Ok(())
        })();
        if result.is_err() {
            let _ = fs::remove_file(&temporary);
        }
        result
    }

    pub fn restore_backup(&self, source: &Path) -> Result<(), StoreError> {
        if !source.is_file() {
            return Err(StoreError::Backup("файл резервной копии не найден".into()));
        }
        let parent = self
            .root
            .parent()
            .ok_or_else(|| StoreError::Backup("некорректная папка данных".into()))?;
        let restore_root = parent.join(format!(".flood-restore-{}", Ulid::new()));
        let previous_projects = self
            .root
            .join(format!(".projects-before-restore-{}", Ulid::new()));
        let previous_integrations = self
            .root
            .join(format!(".integrations-before-restore-{}", Ulid::new()));
        let result = (|| {
            fs::create_dir_all(&restore_root)?;
            let mut archive = ZipArchive::new(File::open(source)?)
                .map_err(|error| StoreError::Backup(error.to_string()))?;
            if archive.len() > 20_000 {
                return Err(StoreError::Backup("в архиве слишком много файлов".into()));
            }
            let mut total_size = 0_u64;
            let mut extracted_size = 0_u64;
            let mut has_projects = false;
            for index in 0..archive.len() {
                let mut entry = archive
                    .by_index(index)
                    .map_err(|error| StoreError::Backup(error.to_string()))?;
                let relative = entry
                    .enclosed_name()
                    .ok_or_else(|| StoreError::Backup("архив содержит небезопасный путь".into()))?
                    .to_path_buf();
                let root_name = relative
                    .components()
                    .next()
                    .and_then(|part| part.as_os_str().to_str());
                if !matches!(root_name, Some("projects" | "chats" | "integrations")) {
                    return Err(StoreError::Backup(
                        "архив не является резервной копией flood.md".into(),
                    ));
                }
                if matches!(root_name, Some("projects" | "chats")) {
                    has_projects = true;
                }
                total_size = total_size.saturating_add(entry.size());
                if total_size > 1024 * 1024 * 1024 {
                    return Err(StoreError::Backup("архив превышает 1 ГБ".into()));
                }
                if entry
                    .unix_mode()
                    .is_some_and(|mode| mode & 0o170000 == 0o120000)
                {
                    return Err(StoreError::Backup(
                        "символические ссылки не поддерживаются".into(),
                    ));
                }
                let mut migrated_relative = if matches!(root_name, Some("projects" | "chats")) {
                    let mut path = PathBuf::from("projects");
                    path.extend(relative.components().skip(1));
                    path
                } else {
                    relative.clone()
                };
                if migrated_relative
                    .file_name()
                    .and_then(|value| value.to_str())
                    == Some("chat.md")
                {
                    migrated_relative.set_file_name("project.md");
                }
                let output = restore_root.join(&migrated_relative);
                if entry.is_dir() {
                    fs::create_dir_all(output)?;
                    continue;
                }
                let entry_limit = restore_entry_size_limit(&migrated_relative);
                if entry.size() > entry_limit {
                    return Err(StoreError::Backup(format!(
                        "файл {} превышает безопасный предел {entry_limit} байт",
                        migrated_relative.display()
                    )));
                }
                if is_attachment_path(&migrated_relative) && entry.size() == 0 {
                    return Err(StoreError::Backup(format!(
                        "архив содержит пустое вложение {}",
                        migrated_relative.display()
                    )));
                }
                if let Some(parent) = output.parent() {
                    fs::create_dir_all(parent)?;
                }
                let mut target = File::create(output)?;
                let copied = std::io::copy(&mut (&mut entry).take(entry_limit + 1), &mut target)?;
                if copied > entry_limit {
                    return Err(StoreError::Backup(format!(
                        "файл {} превысил безопасный предел при распаковке",
                        migrated_relative.display()
                    )));
                }
                extracted_size = extracted_size.saturating_add(copied);
                if extracted_size > 1024 * 1024 * 1024 {
                    return Err(StoreError::Backup(
                        "распакованные данные превышают 1 ГБ".into(),
                    ));
                }
                target.sync_all()?;
            }
            if !has_projects || !restore_root.join("projects").is_dir() {
                return Err(StoreError::Backup(
                    "в архиве отсутствует папка с проектами".into(),
                ));
            }

            let candidate = Store::new(&restore_root)?;
            candidate.list_projects()?;
            candidate.list_tasks(None, true)?;
            candidate.list_trashed_tasks()?;
            candidate.list_automation_events(None, None, None, 100)?;
            candidate.automation_settings()?;

            let _lock = self.lock_exclusive()?;
            let current_projects = self.projects_dir();
            fs::rename(&current_projects, &previous_projects)?;
            if let Err(error) = fs::rename(restore_root.join("projects"), &current_projects) {
                let _ = fs::rename(&previous_projects, &current_projects);
                return Err(error.into());
            }
            let current_integrations = self.root.join("integrations");
            let restored_integrations = restore_root.join("integrations");
            if current_integrations.exists()
                && let Err(error) = fs::rename(&current_integrations, &previous_integrations)
            {
                let _ = fs::remove_dir_all(&current_projects);
                let _ = fs::rename(&previous_projects, &current_projects);
                return Err(error.into());
            }
            if restored_integrations.exists()
                && let Err(error) = fs::rename(&restored_integrations, &current_integrations)
            {
                let _ = fs::remove_dir_all(&current_projects);
                let _ = fs::rename(&previous_projects, &current_projects);
                if previous_integrations.exists() {
                    let _ = fs::rename(&previous_integrations, &current_integrations);
                }
                return Err(error.into());
            }
            let _ = fs::remove_dir_all(&previous_projects);
            let _ = fs::remove_dir_all(&previous_integrations);
            Ok(())
        })();
        let _ = fs::remove_dir_all(&restore_root);
        if result.is_err() && previous_projects.exists() && !self.projects_dir().exists() {
            let _ = fs::rename(&previous_projects, self.projects_dir());
        }
        if result.is_err()
            && previous_integrations.exists()
            && !self.root.join("integrations").exists()
        {
            let _ = fs::rename(&previous_integrations, self.root.join("integrations"));
        }
        result
    }

    fn set_trashed(
        &self,
        id: &str,
        expected_version: &str,
        trashed: bool,
    ) -> Result<Task, StoreError> {
        validate_id(id)?;
        let _lock = self.lock_exclusive()?;
        let mut task = self.find_task(id)?;
        ensure_version(&task.version, expected_version)?;
        task.trashed_at = trashed.then(Utc::now);
        task.updated_at = Utc::now();
        self.write_task(&task)?;
        read_task(&self.task_path(&task.project_id, id))
    }

    fn projects_dir(&self) -> PathBuf {
        self.root.join("projects")
    }
    fn project_path(&self, id: &str) -> PathBuf {
        self.projects_dir().join(id).join("project.md")
    }
    fn project_workspace_kind_dir(
        &self,
        project_id: &str,
        kind: ProjectWorkspaceItemKind,
    ) -> PathBuf {
        self.projects_dir()
            .join(project_id)
            .join("workspace")
            .join(project_workspace_kind_directory(kind))
    }
    fn project_workspace_item_path(
        &self,
        project_id: &str,
        kind: ProjectWorkspaceItemKind,
        id: &str,
    ) -> PathBuf {
        self.project_workspace_kind_dir(project_id, kind)
            .join(format!("{id}.md"))
    }
    fn project_knowledge_proposals_dir(&self, project_id: &str) -> PathBuf {
        self.projects_dir().join(project_id).join("proposals")
    }
    fn project_knowledge_proposal_path(&self, project_id: &str, proposal_id: &str) -> PathBuf {
        self.project_knowledge_proposals_dir(project_id)
            .join(format!("{proposal_id}.json"))
    }
    fn task_dir(&self, project_id: &str) -> PathBuf {
        self.projects_dir().join(project_id).join("tasks")
    }
    fn task_path(&self, project_id: &str, id: &str) -> PathBuf {
        self.task_dir(project_id).join(format!("{id}.md"))
    }
    fn task_batches_dir(&self) -> PathBuf {
        self.root.join("task-batches")
    }
    fn task_batch_receipt_path(&self, request_id: &str) -> PathBuf {
        self.task_batches_dir().join(format!(
            "{}.json",
            deterministic_id("task-batch-receipt", request_id)
        ))
    }
    fn attachment_dir(&self, project_id: &str, id: &str) -> PathBuf {
        self.task_dir(project_id).join("attachments").join(id)
    }

    fn scan_attachments(&self) -> Result<AttachmentScan, StoreError> {
        let mut report = AttachmentCleanupReport {
            total_files: 0,
            total_bytes: 0,
            orphaned_files: 0,
            orphaned_bytes: 0,
        };
        let mut orphaned = Vec::new();

        for project in fs::read_dir(self.projects_dir())? {
            let tasks_directory = project?.path().join("tasks");
            if !tasks_directory.is_dir() {
                continue;
            }

            let mut tasks = HashMap::new();
            for entry in fs::read_dir(&tasks_directory)? {
                let path = entry?.path();
                if path.extension().and_then(|value| value.to_str()) == Some("md") {
                    let task = read_task(&path)?;
                    tasks.insert(task.id.clone(), task);
                }
            }

            let attachments_directory = tasks_directory.join("attachments");
            if !attachments_directory.is_dir() {
                continue;
            }
            let canonical_attachments = fs::canonicalize(&attachments_directory)?;

            for task_directory in fs::read_dir(&attachments_directory)? {
                let task_directory = task_directory?;
                if !task_directory.file_type()?.is_dir() {
                    continue;
                }
                let task_id = task_directory.file_name().to_string_lossy().into_owned();
                let task = tasks.get(&task_id);
                for attachment in fs::read_dir(task_directory.path())? {
                    let attachment = attachment?;
                    if !attachment.file_type()?.is_file() {
                        continue;
                    }
                    let path = attachment.path();
                    let canonical_path = fs::canonicalize(&path)?;
                    if !canonical_path.starts_with(&canonical_attachments) {
                        return Err(StoreError::Validation(
                            "путь вложения выходит за папку проекта".into(),
                        ));
                    }
                    let size = attachment.metadata()?.len();
                    let file_name = attachment.file_name().to_string_lossy().into_owned();
                    let relative_path = format!("attachments/{task_id}/{file_name}");
                    let referenced = task.is_some_and(|task| {
                        task.description.contains(&relative_path)
                            || task.source.as_ref().is_some_and(|source| {
                                source.media.iter().any(|media| {
                                    media.relative_path.as_deref().is_some_and(|path| {
                                        path.replace('\\', "/") == relative_path
                                    })
                                })
                            })
                    });

                    report.total_files += 1;
                    report.total_bytes = report.total_bytes.saturating_add(size);
                    if !referenced {
                        report.orphaned_files += 1;
                        report.orphaned_bytes = report.orphaned_bytes.saturating_add(size);
                        orphaned.push((canonical_path, size));
                    }
                }
            }
        }

        Ok(AttachmentScan { report, orphaned })
    }

    fn find_task(&self, id: &str) -> Result<Task, StoreError> {
        for entry in fs::read_dir(self.projects_dir())? {
            let path = entry?.path().join("tasks").join(format!("{id}.md"));
            if path.exists() {
                return read_task(&path);
            }
        }
        Err(StoreError::NotFound(id.to_owned()))
    }

    fn link_pending_telegram_candidates_to_task(
        &self,
        chat_id: i64,
        message_ids: &[i64],
        task_id: &str,
    ) -> Result<(), StoreError> {
        let mut document = self.read_telegram_inbox()?;
        let mut changed = false;
        for candidate in &mut document.candidates {
            if candidate.chat_id != chat_id
                || candidate.status != InboxCandidateStatus::Pending
                || !candidate_message_ids(candidate)
                    .iter()
                    .any(|id| message_ids.contains(id))
            {
                continue;
            }
            candidate.status = InboxCandidateStatus::Imported;
            candidate.processed_at = Some(Utc::now());
            candidate.task_id = Some(task_id.to_owned());
            candidate.linked_task = None;
            changed = true;
        }
        if changed {
            self.write_telegram_inbox(&document)?;
        }
        Ok(())
    }

    fn find_task_by_telegram_source(
        &self,
        chat_id: i64,
        message_ids: &[i64],
    ) -> Result<Option<Task>, StoreError> {
        if message_ids.is_empty() {
            return Ok(None);
        }
        for project in fs::read_dir(self.projects_dir())? {
            let directory = project?.path().join("tasks");
            if !directory.exists() {
                continue;
            }
            for entry in fs::read_dir(directory)? {
                let path = entry?.path();
                if path.extension().and_then(|value| value.to_str()) != Some("md") {
                    continue;
                }
                let task = read_task(&path)?;
                let Some(source) = task.source.as_ref().filter(|source| {
                    source.provider.as_deref() == Some("telegram")
                        && source.chat_id == Some(chat_id)
                }) else {
                    continue;
                };
                let source_ids = source_message_ids(source);
                if source_ids.iter().any(|id| message_ids.contains(id)) {
                    return Ok(Some(task));
                }
            }
        }
        Ok(None)
    }

    fn write_project(&self, project: &Project) -> Result<(), StoreError> {
        validate_project_memory(&project.memory)?;
        let doc = ProjectDocument {
            format_version: FORMAT_VERSION,
            id: project.id.clone(),
            title: project.title.clone(),
            created_at: project.created_at,
            updated_at: project.updated_at,
            telegram: None,
            telegram_chats: project.telegram_chats.clone(),
            telegram_participants: project.telegram_participants.clone(),
            resources: project.resources.clone(),
            memory: project.memory.clone(),
        };
        let body = if project.context.is_empty() {
            format!("# {}\n", project.title)
        } else {
            format!("# {}\n\n{}\n", project.title, project.context.trim())
        };
        atomic_write(&self.project_path(&project.id), &encode(&doc, &body)?)
    }

    fn write_project_workspace_item(&self, item: &ProjectWorkspaceItem) -> Result<(), StoreError> {
        validate_project_workspace_item(item)?;
        let path = self.project_workspace_item_path(&item.project_id, item.kind, &item.id);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        let doc = ProjectWorkspaceItemDocument {
            format_version: FORMAT_VERSION,
            id: item.id.clone(),
            project_id: item.project_id.clone(),
            kind: item.kind,
            title: item.title.clone(),
            summary: item.summary.clone(),
            agent_access: item.agent_access,
            created_at: item.created_at,
            updated_at: item.updated_at,
            revisions: item.revisions.clone(),
        };
        let body = if item.content.is_empty() {
            format!("# {}\n", item.title)
        } else {
            format!("# {}\n\n{}\n", item.title, item.content.trim())
        };
        atomic_write(&path, &encode(&doc, &body)?)
    }

    fn read_project_knowledge_proposal(
        &self,
        path: &Path,
    ) -> Result<ProjectKnowledgeProposal, StoreError> {
        serde_json::from_slice(&read_limited_bytes(path, MAX_KNOWLEDGE_PROPOSAL_BYTES)?)
            .map_err(StoreError::from)
    }

    fn write_project_knowledge_proposal(
        &self,
        proposal: &ProjectKnowledgeProposal,
    ) -> Result<(), StoreError> {
        let path = self.project_knowledge_proposal_path(&proposal.project_id, &proposal.id);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        let content = serde_json::to_string_pretty(proposal)?;
        if content.len() as u64 > MAX_KNOWLEDGE_PROPOSAL_BYTES {
            return Err(StoreError::Validation(
                "Предложение изменения knowledge слишком большое".into(),
            ));
        }
        atomic_write(&path, &content)
    }

    fn telegram_inbox_path(&self) -> PathBuf {
        self.root.join("integrations").join("telegram-inbox.json")
    }

    fn agent_runs_path(&self) -> PathBuf {
        self.root.join("agent-runs.json")
    }

    fn automation_events_path(&self) -> PathBuf {
        self.root
            .join("integrations")
            .join("automation-events.json")
    }

    fn automation_settings_path(&self) -> PathBuf {
        self.root
            .join("integrations")
            .join("automation-settings.json")
    }

    fn read_automation_settings(&self) -> Result<AutomationSettings, StoreError> {
        let path = self.automation_settings_path();
        if !path.exists() {
            return Ok(AutomationSettings::default());
        }
        serde_json::from_slice(&read_limited_bytes(&path, MAX_AUTOMATION_SETTINGS_BYTES)?)
            .map_err(StoreError::from)
    }

    fn write_automation_settings(&self, settings: &AutomationSettings) -> Result<(), StoreError> {
        let mut bytes = serde_json::to_vec_pretty(settings)?;
        bytes.push(b'\n');
        atomic_write_bytes(&self.automation_settings_path(), &bytes)?;
        Ok(())
    }

    fn read_automation_events(&self) -> Result<AutomationEventsDocument, StoreError> {
        let path = self.automation_events_path();
        if !path.exists() {
            return Ok(AutomationEventsDocument {
                format_version: automation_events_format_version(),
                events: Vec::new(),
            });
        }
        let document: AutomationEventsDocument =
            serde_json::from_slice(&read_limited_bytes(&path, MAX_AUTOMATION_EVENTS_BYTES)?)?;
        if document.format_version != automation_events_format_version() {
            return Err(StoreError::Validation(
                "неподдерживаемая версия очереди автоматизаций".into(),
            ));
        }
        if document.events.len() > MAX_AUTOMATION_EVENTS {
            return Err(StoreError::Validation(
                "очередь автоматизаций превышает безопасный лимит".into(),
            ));
        }
        for event in &document.events {
            validate_automation_event(event)?;
        }
        Ok(document)
    }

    fn write_automation_events(
        &self,
        document: &AutomationEventsDocument,
    ) -> Result<(), StoreError> {
        let mut bytes = serde_json::to_vec_pretty(document)?;
        bytes.push(b'\n');
        if bytes.len() as u64 > MAX_AUTOMATION_EVENTS_BYTES {
            return Err(StoreError::Validation(
                "очередь автоматизаций превышает безопасный размер".into(),
            ));
        }
        atomic_write_bytes(&self.automation_events_path(), &bytes)
    }

    fn sync_telegram_automation_events(
        &self,
        inbox: &TelegramInboxDocument,
    ) -> Result<(), StoreError> {
        let mut document = self.read_automation_events()?;
        let mut changed = false;
        for candidate in &inbox.candidates {
            let message_ids = candidate_message_ids(candidate);
            let external_id = if message_ids.len() > 1 {
                format!(
                    "messages:{}",
                    message_ids
                        .iter()
                        .map(i64::to_string)
                        .collect::<Vec<_>>()
                        .join(",")
                )
            } else {
                format!("message:{}", candidate.message_id)
            };
            let dedupe_key = format!(
                "telegram:{}:{}",
                candidate.chat_id,
                message_ids
                    .iter()
                    .map(i64::to_string)
                    .collect::<Vec<_>>()
                    .join(",")
            );
            let event = document.events.iter_mut().find(|event| {
                event.connector_id == flood_connectors::TELEGRAM_CONNECTOR_ID
                    && event.source_entity_id == candidate.id
            });
            let event = match event {
                Some(event) => event,
                None => {
                    document.events.push(AutomationEvent {
                        id: Ulid::new().to_string(),
                        project_id: candidate.project_id.clone(),
                        connector_id: flood_connectors::TELEGRAM_CONNECTOR_ID.into(),
                        source_entity_id: candidate.id.clone(),
                        external_id: external_id.clone(),
                        dedupe_key: dedupe_key.clone(),
                        kind: flood_connectors::ContextSignalKind::Message,
                        occurred_at: candidate.sent_at,
                        observed_at: candidate.discovered_at,
                        state: AutomationEventState::Pending,
                        attempts: 0,
                        processing_started_at: None,
                        claim_token: None,
                        retry_at: None,
                        processed_at: None,
                        outcome: None,
                        related_task_id: None,
                        detail: None,
                        error: None,
                    });
                    changed = true;
                    document.events.last_mut().expect("event was inserted")
                }
            };
            let before = event.clone();
            event.project_id = candidate.project_id.clone();
            event.external_id = external_id;
            event.dedupe_key = dedupe_key;
            event.occurred_at = candidate.sent_at;
            match candidate.status {
                InboxCandidateStatus::Pending => {
                    if event.state == AutomationEventState::Processed
                        && event.outcome == Some(AutomationEventOutcome::NoAction)
                    {
                        event.state = AutomationEventState::Pending;
                        event.attempts = 0;
                        event.processing_started_at = None;
                        event.claim_token = None;
                        event.retry_at = None;
                        event.processed_at = None;
                        event.outcome = None;
                        event.related_task_id = None;
                        event.detail = None;
                        event.error = None;
                    }
                }
                InboxCandidateStatus::Dismissed => {
                    // A claimed automation cycle records its own exact outcome.
                    // Updating the source candidate must not silently release
                    // that claim before `resolve_automation_event` runs.
                    if event.state != AutomationEventState::Processing
                        || event.claim_token.is_none()
                    {
                        event.state = AutomationEventState::Processed;
                        event.processing_started_at = None;
                        event.claim_token = None;
                        event.retry_at = None;
                        event.processed_at = candidate.processed_at.or(Some(Utc::now()));
                        event.outcome = Some(AutomationEventOutcome::NoAction);
                        event.related_task_id = None;
                        event.detail = None;
                        event.error = None;
                    }
                }
                InboxCandidateStatus::Imported => {
                    if event.state != AutomationEventState::Processing
                        || event.claim_token.is_none()
                    {
                        event.state = AutomationEventState::Processed;
                        event.processing_started_at = None;
                        event.claim_token = None;
                        event.retry_at = None;
                        event.processed_at = candidate.processed_at.or(Some(Utc::now()));
                        event.outcome = Some(AutomationEventOutcome::TaskCreatedOrLinked);
                        event.related_task_id = candidate.task_id.clone();
                        event.detail = None;
                        event.error = None;
                    }
                }
            }
            changed |= *event != before;
        }
        if changed {
            compact_automation_events(&mut document)?;
            self.write_automation_events(&document)?;
        }
        Ok(())
    }

    fn read_agent_runs(&self) -> Result<AgentRunsDocument, StoreError> {
        let path = self.agent_runs_path();
        if !path.exists() {
            return Ok(AgentRunsDocument {
                format_version: agent_runs_format_version(),
                runs: Vec::new(),
            });
        }
        let document: AgentRunsDocument =
            serde_json::from_slice(&read_limited_bytes(&path, MAX_AGENT_RUNS_BYTES)?)?;
        if document.format_version != agent_runs_format_version() {
            return Err(StoreError::Validation(
                "неподдерживаемая версия истории работы агента".into(),
            ));
        }
        Ok(document)
    }

    fn write_agent_runs(&self, document: &AgentRunsDocument) -> Result<(), StoreError> {
        let mut bytes = serde_json::to_vec_pretty(document)?;
        bytes.push(b'\n');
        if bytes.len() as u64 > MAX_AGENT_RUNS_BYTES {
            return Err(StoreError::Validation(
                "история работы агента превышает безопасный размер".into(),
            ));
        }
        atomic_write_bytes(&self.agent_runs_path(), &bytes)
    }

    fn telegram_sync_status_path(&self) -> PathBuf {
        self.root.join("integrations").join("telegram-sync.json")
    }

    fn telegram_connector_status_path(&self) -> PathBuf {
        self.root
            .join("integrations")
            .join("telegram-connector.json")
    }

    fn telegram_sync_request_path(&self) -> PathBuf {
        self.root
            .join("integrations")
            .join("telegram-sync-request.json")
    }

    fn telegram_chats_path(&self) -> PathBuf {
        self.root.join("integrations").join("telegram-chats.json")
    }

    fn telegram_agent_checkpoints_path(&self) -> PathBuf {
        self.root
            .join("integrations")
            .join("telegram-agent-checkpoints.json")
    }

    fn telegram_media_requests_path(&self) -> PathBuf {
        self.root
            .join("integrations")
            .join("telegram-media-requests.json")
    }

    fn read_telegram_chats(&self) -> Result<TelegramChatsDocument, StoreError> {
        let path = self.telegram_chats_path();
        if !path.exists() {
            return Ok(TelegramChatsDocument {
                format_version: telegram_chats_format_version(),
                chats: Vec::new(),
            });
        }
        let document: TelegramChatsDocument =
            serde_json::from_slice(&read_limited_bytes(&path, MAX_TELEGRAM_INBOX_BYTES)?)?;
        if document.format_version != telegram_chats_format_version() {
            return Err(StoreError::Validation(
                "неподдерживаемая версия локальной ленты Telegram".into(),
            ));
        }
        Ok(document)
    }

    fn write_telegram_chats(&self, document: &TelegramChatsDocument) -> Result<(), StoreError> {
        let mut bytes = serde_json::to_vec_pretty(document)?;
        bytes.push(b'\n');
        if bytes.len() as u64 > MAX_TELEGRAM_INBOX_BYTES {
            return Err(StoreError::Validation(
                "локальная лента Telegram превышает безопасный размер".into(),
            ));
        }
        atomic_write_bytes(&self.telegram_chats_path(), &bytes)
    }

    fn read_telegram_agent_checkpoints(
        &self,
    ) -> Result<TelegramAgentCheckpointsDocument, StoreError> {
        let path = self.telegram_agent_checkpoints_path();
        if !path.exists() {
            return Ok(TelegramAgentCheckpointsDocument {
                format_version: telegram_agent_checkpoints_format_version(),
                checkpoints: Vec::new(),
            });
        }
        let document: TelegramAgentCheckpointsDocument =
            serde_json::from_slice(&read_limited_bytes(&path, MAX_INTEGRATION_STATE_BYTES)?)?;
        if document.format_version != telegram_agent_checkpoints_format_version() {
            return Err(StoreError::Validation(
                "неподдерживаемая версия закладок Telegram-агента".into(),
            ));
        }
        Ok(document)
    }

    fn write_telegram_agent_checkpoints(
        &self,
        document: &TelegramAgentCheckpointsDocument,
    ) -> Result<(), StoreError> {
        let mut bytes = serde_json::to_vec_pretty(document)?;
        bytes.push(b'\n');
        if bytes.len() as u64 > MAX_INTEGRATION_STATE_BYTES {
            return Err(StoreError::Validation(
                "закладки Telegram-агента превышают безопасный размер".into(),
            ));
        }
        atomic_write_bytes(&self.telegram_agent_checkpoints_path(), &bytes)
    }

    fn read_telegram_media_requests(&self) -> Result<TelegramMediaRequestsDocument, StoreError> {
        let path = self.telegram_media_requests_path();
        if !path.exists() {
            return Ok(TelegramMediaRequestsDocument {
                format_version: telegram_media_requests_format_version(),
                requests: Vec::new(),
            });
        }
        let document: TelegramMediaRequestsDocument =
            serde_json::from_slice(&read_limited_bytes(&path, MAX_INTEGRATION_STATE_BYTES)?)?;
        if document.format_version != telegram_media_requests_format_version() {
            return Err(StoreError::Validation(
                "неподдерживаемая версия запросов Telegram-медиа".into(),
            ));
        }
        Ok(document)
    }

    fn write_telegram_media_requests(
        &self,
        document: &TelegramMediaRequestsDocument,
    ) -> Result<(), StoreError> {
        let mut bytes = serde_json::to_vec_pretty(document)?;
        bytes.push(b'\n');
        if bytes.len() as u64 > MAX_INTEGRATION_STATE_BYTES {
            return Err(StoreError::Validation(
                "очередь Telegram-медиа превышает безопасный размер".into(),
            ));
        }
        atomic_write_bytes(&self.telegram_media_requests_path(), &bytes)
    }

    fn remove_telegram_media_cache(&self, request: &TelegramMediaRequest) {
        let Some(relative_path) = request.relative_path.as_deref() else {
            return;
        };
        let path = Path::new(relative_path);
        if path.is_absolute() || path.components().any(|part| part.as_os_str() == "..") {
            return;
        }
        let absolute = self.root.join(path);
        let expected_parent = self
            .root
            .join("integrations")
            .join("telegram-media")
            .join(&request.id);
        if absolute.starts_with(&expected_parent) {
            let _ = fs::remove_file(&absolute);
            let _ = fs::remove_dir(&expected_parent);
        }
    }

    fn activity_path(&self) -> PathBuf {
        self.root.join("integrations").join("activity.json")
    }

    fn read_activity(&self) -> Result<ActivityDocument, StoreError> {
        let path = self.activity_path();
        if !path.exists() {
            return Ok(ActivityDocument {
                format_version: activity_format_version(),
                events: Vec::new(),
            });
        }
        let document: ActivityDocument =
            serde_json::from_slice(&read_limited_bytes(&path, MAX_ACTIVITY_BYTES)?)?;
        if document.format_version != activity_format_version() {
            return Err(StoreError::Validation(
                "неподдерживаемая версия журнала действий".into(),
            ));
        }
        if document.events.len() > MAX_ACTIVITY_EVENTS {
            return Err(StoreError::Validation(
                "журнал действий превышает безопасный лимит".into(),
            ));
        }
        for event in &document.events {
            validate_id(&event.id)?;
            validate_activity_reference(
                &event.entity_kind,
                event.entity_id.as_deref(),
                event.project_id.as_deref(),
            )?;
        }
        Ok(document)
    }

    fn write_activity(&self, document: &ActivityDocument) -> Result<(), StoreError> {
        let mut bytes = serde_json::to_vec_pretty(document)?;
        bytes.push(b'\n');
        if bytes.len() as u64 > MAX_ACTIVITY_BYTES {
            return Err(StoreError::Validation(
                "журнал действий превышает безопасный размер".into(),
            ));
        }
        atomic_write_bytes(&self.activity_path(), &bytes)
    }

    fn read_telegram_inbox(&self) -> Result<TelegramInboxDocument, StoreError> {
        let path = self.telegram_inbox_path();
        if !path.exists() {
            return Ok(TelegramInboxDocument {
                format_version: inbox_format_version(),
                candidates: Vec::new(),
            });
        }
        let document: TelegramInboxDocument =
            serde_json::from_slice(&read_limited_bytes(&path, MAX_TELEGRAM_INBOX_BYTES)?)?;
        if document.format_version != inbox_format_version() {
            return Err(StoreError::Validation(
                "неподдерживаемая версия очереди Telegram".into(),
            ));
        }
        Ok(document)
    }

    fn write_telegram_inbox(&self, document: &TelegramInboxDocument) -> Result<(), StoreError> {
        let mut bytes = serde_json::to_vec_pretty(document)?;
        bytes.push(b'\n');
        if bytes.len() as u64 > MAX_TELEGRAM_INBOX_BYTES {
            return Err(StoreError::Validation(
                "очередь Telegram превышает безопасный размер 64 МБ".into(),
            ));
        }
        atomic_write_bytes(&self.telegram_inbox_path(), &bytes)?;
        self.sync_telegram_automation_events(document)
    }

    fn write_task(&self, task: &Task) -> Result<(), StoreError> {
        validate_task_relations(&task.id, &task.relations)?;
        validate_task_checkpoints(&task.checkpoints)?;
        let doc = TaskDocument {
            format_version: FORMAT_VERSION,
            id: task.id.clone(),
            project_id: task.project_id.clone(),
            created_at: task.created_at,
            updated_at: task.updated_at,
            urgency: task.urgency.clone(),
            status: task.status.clone(),
            relations: task.relations.clone(),
            checkpoints: task.checkpoints.clone(),
            source: task.source.clone(),
            trashed_at: task.trashed_at,
        };
        atomic_write(
            &self.task_path(&task.project_id, &task.id),
            &encode(&doc, &task.description)?,
        )
    }

    fn load_batch_task_locked(
        &self,
        id: &str,
        working: &mut HashMap<String, Task>,
    ) -> Result<(), StoreError> {
        if !working.contains_key(id) {
            working.insert(id.to_owned(), self.find_task(id)?);
        }
        Ok(())
    }

    fn load_project_tasks_for_batch_locked(
        &self,
        project_id: &str,
        working: &mut HashMap<String, Task>,
    ) -> Result<(), StoreError> {
        let directory = self.task_dir(project_id);
        if !directory.exists() {
            return Ok(());
        }
        for entry in fs::read_dir(directory)? {
            let path = entry?.path();
            if path.extension().and_then(|value| value.to_str()) == Some("md") {
                let task = read_task(&path)?;
                working.entry(task.id.clone()).or_insert(task);
            }
        }
        Ok(())
    }

    fn apply_task_batch_tasks(&self, tasks: &[Task]) -> Result<(), StoreError> {
        for task in tasks {
            self.write_task(task)?;
        }
        Ok(())
    }

    fn read_task_batch_receipt(&self, path: &Path) -> Result<TaskBatchReceipt, StoreError> {
        let receipt: TaskBatchReceipt =
            serde_json::from_slice(&read_limited_bytes(path, MAX_TASK_BATCH_RECEIPT_BYTES)?)?;
        if receipt.format_version != 1 {
            return Err(StoreError::Validation(
                "неподдерживаемая версия журнала пакетных изменений".into(),
            ));
        }
        Ok(receipt)
    }

    fn write_task_batch_receipt(
        &self,
        path: &Path,
        receipt: &TaskBatchReceipt,
    ) -> Result<(), StoreError> {
        let mut bytes = serde_json::to_vec_pretty(receipt)?;
        bytes.push(b'\n');
        if bytes.len() as u64 > MAX_TASK_BATCH_RECEIPT_BYTES {
            return Err(StoreError::Validation(
                "журнал пакетного изменения превышает безопасный размер 4 МБ".into(),
            ));
        }
        atomic_write_bytes(path, &bytes)
    }

    fn finish_task_batch_receipt(
        &self,
        mut receipt: TaskBatchReceipt,
        path: &Path,
    ) -> Result<(TaskBatchReceipt, Vec<Task>), StoreError> {
        self.apply_task_batch_tasks(&receipt.tasks)?;
        let tasks = receipt
            .tasks
            .iter()
            .map(|task| read_task(&self.task_path(&task.project_id, &task.id)))
            .collect::<Result<Vec<_>, _>>()?;
        receipt.task_ids = tasks.iter().map(|task| task.id.clone()).collect();
        receipt.tasks.clear();
        receipt.applied = true;
        self.write_task_batch_receipt(path, &receipt)?;
        Ok((receipt, tasks))
    }

    fn read_applied_task_batch_tasks(
        &self,
        receipt: &TaskBatchReceipt,
    ) -> Result<Vec<Task>, StoreError> {
        receipt
            .task_ids
            .iter()
            .map(|id| self.find_task(id))
            .collect()
    }

    fn recover_task_batches_locked(&self) -> Result<(), StoreError> {
        let directory = self.task_batches_dir();
        if !directory.exists() {
            return Ok(());
        }
        for entry in fs::read_dir(directory)? {
            let path = entry?.path();
            if path.extension().and_then(|value| value.to_str()) != Some("json") {
                continue;
            }
            let receipt = self.read_task_batch_receipt(&path)?;
            if !receipt.applied {
                self.finish_task_batch_receipt(receipt, &path)?;
            }
        }
        Ok(())
    }

    fn lock_shared(&self) -> Result<StoreLock, StoreError> {
        let file = OpenOptions::new()
            .read(true)
            .write(true)
            .open(self.root.join(".flood.lock"))?;
        file.lock_shared()?;
        Ok(StoreLock(file))
    }

    fn lock_exclusive(&self) -> Result<StoreLock, StoreError> {
        let file = OpenOptions::new()
            .read(true)
            .write(true)
            .open(self.root.join(".flood.lock"))?;
        file.lock_exclusive()?;
        Ok(StoreLock(file))
    }
}

pub fn run_self_check() -> SelfCheckResult {
    let started = Instant::now();
    let root = env::temp_dir().join(format!("flood-self-check-{}", Ulid::new()));
    let mut checks = Vec::new();
    let result = run_isolated_self_check(&root, &mut checks);
    if let Err(error) = result {
        checks.push(SelfCheckItem {
            name: "Завершение проверки".into(),
            passed: false,
            detail: Some(error),
        });
    }
    let cleanup_error = fs::remove_dir_all(&root).err().filter(|_| root.exists());
    checks.push(SelfCheckItem {
        name: "Очистка временных данных".into(),
        passed: cleanup_error.is_none(),
        detail: cleanup_error.map(|error| error.to_string()),
    });
    SelfCheckResult {
        passed: checks.iter().all(|check| check.passed),
        duration_ms: started.elapsed().as_millis(),
        checks,
    }
}

fn run_isolated_self_check(root: &Path, checks: &mut Vec<SelfCheckItem>) -> Result<(), String> {
    let store = Store::new(root).map_err(|error| error.to_string())?;
    checks.push(SelfCheckItem {
        name: "Изолированное хранилище".into(),
        passed: true,
        detail: None,
    });

    let project = store
        .create_project("Проверка flood.md")
        .map_err(|error| error.to_string())?;
    let task = store
        .create_task(CreateTask {
            project_id: project.id.clone(),
            description: "Проверить полный цикл задачи".into(),
            urgency: Urgency::Important,
            source: None,
        })
        .map_err(|error| error.to_string())?;
    checks.push(SelfCheckItem {
        name: "Создание проекта и задачи".into(),
        passed: true,
        detail: None,
    });

    let projects = store.list_projects().map_err(|error| error.to_string())?;
    let tasks = store
        .list_tasks(Some(&project.id), false)
        .map_err(|error| error.to_string())?;
    let read_task = store
        .get_task(&task.id)
        .map_err(|error| error.to_string())?;
    let reading_ok = projects.len() == 1
        && projects[0].id == project.id
        && tasks.len() == 1
        && tasks[0].id == task.id
        && read_task.description == task.description;
    checks.push(SelfCheckItem {
        name: "Списки проектов, задач и чтение карточки".into(),
        passed: reading_ok,
        detail: (!reading_ok)
            .then(|| "Созданные данные не найдены через публичные операции чтения".into()),
    });
    if !reading_ok {
        return Err("Проверка операций чтения не пройдена".into());
    }

    let updated = store
        .update_task(
            &task.id,
            TaskPatch {
                description: Some("Проверить полный цикл задачи и конфликт".into()),
                urgency: Some(Urgency::Urgent),
                ..TaskPatch::default()
            },
            &task.version,
        )
        .map_err(|error| error.to_string())?;
    let update_ok = updated.description == "Проверить полный цикл задачи и конфликт"
        && updated.urgency == Urgency::Urgent;
    checks.push(SelfCheckItem {
        name: "Изменение описания и срочности".into(),
        passed: update_ok,
        detail: (!update_ok).then(|| "Изменения задачи не сохранились".into()),
    });
    if !update_ok {
        return Err("Проверка изменения задачи не пройдена".into());
    }

    let conflict_detected = matches!(
        store.complete_task(&task.id, &task.version),
        Err(StoreError::Conflict)
    );
    checks.push(SelfCheckItem {
        name: "Защита от перезаписи внешних изменений".into(),
        passed: conflict_detected,
        detail: (!conflict_detected).then(|| "Устаревшая версия не вызвала конфликт".into()),
    });
    if !conflict_detected {
        return Err("Проверка конфликтов не пройдена".into());
    }

    let attachment_path = store
        .save_task_attachment(&updated.id, "self-check.txt", b"flood-self-check")
        .map_err(|error| error.to_string())?;
    let attachment = store
        .read_task_attachment(&updated.id, &attachment_path)
        .map_err(|error| error.to_string())?;
    let attachment_ok = attachment == b"flood-self-check";
    checks.push(SelfCheckItem {
        name: "Запись и чтение вложений".into(),
        passed: attachment_ok,
        detail: (!attachment_ok).then(|| "Содержимое вложения изменилось".into()),
    });
    if !attachment_ok {
        return Err("Проверка вложений не пройдена".into());
    }

    let attachment_path_guarded = matches!(
        store.resolve_task_attachment(
            &updated.id,
            &format!("attachments/{}/../project.md", updated.id),
        ),
        Err(StoreError::Validation(_))
    );
    checks.push(SelfCheckItem {
        name: "Защита путей вложений".into(),
        passed: attachment_path_guarded,
        detail: (!attachment_path_guarded)
            .then(|| "Выход за папку вложений не был заблокирован".into()),
    });
    if !attachment_path_guarded {
        return Err("Проверка безопасных путей вложений не пройдена".into());
    }

    let oversized_path = root.join("oversized-self-check.md");
    File::create(&oversized_path)
        .and_then(|file| file.set_len(MAX_MARKDOWN_FILE_BYTES + 1))
        .map_err(|error| error.to_string())?;
    let oversized_file_guarded = matches!(
        read_limited_utf8(&oversized_path, MAX_MARKDOWN_FILE_BYTES),
        Err(StoreError::InvalidFile { .. })
    );
    let _ = fs::remove_file(&oversized_path);
    checks.push(SelfCheckItem {
        name: "Ограниченное чтение локальных файлов".into(),
        passed: oversized_file_guarded,
        detail: (!oversized_file_guarded)
            .then(|| "Файл сверх безопасного лимита был прочитан в память".into()),
    });
    if !oversized_file_guarded {
        return Err("Проверка ограниченного чтения не пройдена".into());
    }

    let completed = store
        .complete_task(&updated.id, &updated.version)
        .map_err(|error| error.to_string())?;
    let trashed = store
        .trash_task(&completed.id, &completed.version)
        .map_err(|error| error.to_string())?;
    let restored = store
        .restore_task(&trashed.id, &trashed.version)
        .map_err(|error| error.to_string())?;
    let reopened = Store::new(root)
        .and_then(|store| store.get_task(&restored.id))
        .map_err(|error| error.to_string())?;
    let lifecycle_ok = reopened.status == TaskStatus::Completed && reopened.trashed_at.is_none();
    checks.push(SelfCheckItem {
        name: "Завершение, корзина и восстановление".into(),
        passed: lifecycle_ok,
        detail: (!lifecycle_ok).then(|| "Состояние задачи не сохранилось после перезапуска".into()),
    });
    if !lifecycle_ok {
        return Err("Проверка жизненного цикла задачи не пройдена".into());
    }

    let retry_project = store
        .create_project_idempotent("Повторяемое создание", "self-check-project-request")
        .map_err(|error| error.to_string())?;
    let repeated_project = store
        .create_project_idempotent("Повторяемое создание", "self-check-project-request")
        .map_err(|error| error.to_string())?;
    let retry_task = store
        .create_task_idempotent(
            CreateTask {
                project_id: retry_project.value.id.clone(),
                description: "Не создавать дубль".into(),
                urgency: Urgency::Normal,
                source: None,
            },
            "self-check-task-request",
        )
        .map_err(|error| error.to_string())?;
    let repeated_task = store
        .create_task_idempotent(
            CreateTask {
                project_id: retry_project.value.id.clone(),
                description: "Не создавать дубль".into(),
                urgency: Urgency::Normal,
                source: None,
            },
            "self-check-task-request",
        )
        .map_err(|error| error.to_string())?;
    let idempotent_ok = retry_project.created
        && !repeated_project.created
        && retry_project.value.id == repeated_project.value.id
        && retry_task.created
        && !repeated_task.created
        && retry_task.value.id == repeated_task.value.id
        && store
            .list_tasks(Some(&retry_project.value.id), false)
            .map_err(|error| error.to_string())?
            .len()
            == 1;
    checks.push(SelfCheckItem {
        name: "Идемпотентное создание через MCP".into(),
        passed: idempotent_ok,
        detail: (!idempotent_ok).then(|| "Повтор запроса создал дубликат".into()),
    });
    if !idempotent_ok {
        return Err("Проверка идемпотентного создания не пройдена".into());
    }
    let batch_operations = vec![
        TaskBatchOperation::Create {
            operation_id: "self-check-child".into(),
            project_id: retry_project.value.id.clone(),
            description: "# Пакетная подзадача".into(),
            urgency: Urgency::Important,
            source: None,
        },
        TaskBatchOperation::Link {
            operation_id: "self-check-link".into(),
            task: TaskBatchReference {
                task_id: None,
                operation_id: Some("self-check-child".into()),
            },
            target: TaskBatchReference {
                task_id: Some(retry_task.value.id.clone()),
                operation_id: None,
            },
            relation: crate::TaskRelationKind::SubtaskOf,
        },
    ];
    let batch = store
        .apply_task_batch(
            batch_operations.clone(),
            Vec::new(),
            "self-check-task-batch",
        )
        .map_err(|error| error.to_string())?;
    let repeated_batch = store
        .apply_task_batch(batch_operations, Vec::new(), "self-check-task-batch")
        .map_err(|error| error.to_string())?;
    let batch_ok = !batch.repeated
        && repeated_batch.repeated
        && batch.operations == repeated_batch.operations
        && batch.tasks.len() == 1
        && batch.tasks[0].relations.len() == 1
        && store
            .list_tasks(Some(&retry_project.value.id), false)
            .map_err(|error| error.to_string())?
            .len()
            == 2;
    checks.push(SelfCheckItem {
        name: "Атомарный пакет задач и безопасный повтор".into(),
        passed: batch_ok,
        detail: (!batch_ok)
            .then(|| "Пакет не сохранился целиком или повтор создал дубликат".into()),
    });
    if !batch_ok {
        return Err("Проверка пакетного изменения задач не пройдена".into());
    }
    store
        .delete_project(&retry_project.value.id, &retry_project.value.version)
        .map_err(|error| error.to_string())?;

    let now = Utc::now();
    let candidate = TelegramInboxCandidate {
        id: Ulid::new().to_string(),
        project_id: project.id.clone(),
        chat_id: -100_000_000_001,
        chat_title: "Проверка Telegram".into(),
        message_id: 42,
        message_ids: vec![42, 43],
        text: "@flood преврати это сообщение в задачу".into(),
        author: "Self-check".into(),
        sender_id: Some("user:42".into()),
        sender_username: Some("flood_self_check".into()),
        is_outgoing: false,
        sent_at: now,
        url: Some("https://t.me/c/100000000001/42".into()),
        reason: InboxCandidateReason::Mention,
        status: InboxCandidateStatus::Pending,
        media: vec![SourceMedia {
            kind: SourceMediaKind::Photo,
            file_name: "self-check.jpg".into(),
            provider_file_id: Some(42),
            mime_type: Some("image/jpeg".into()),
            size: Some(1024),
            relative_path: None,
        }],
        context: vec![
            TelegramContextMessage {
                message_id: 41,
                message_ids: vec![41],
                author: "Коллега".into(),
                sender_id: Some("user:41".into()),
                sender_username: None,
                is_outgoing: false,
                sent_at: now - chrono::Duration::minutes(1),
                text: "Нужен контекст перед постановкой задачи".into(),
                url: Some("https://t.me/c/100000000001/41".into()),
                reply_to_message_id: None,
                is_target: false,
                media: Vec::new(),
            },
            TelegramContextMessage {
                message_id: 42,
                message_ids: vec![42, 43],
                author: "Self-check".into(),
                sender_id: Some("user:42".into()),
                sender_username: Some("flood_self_check".into()),
                is_outgoing: false,
                sent_at: now,
                text: "@flood преврати это сообщение в задачу".into(),
                url: Some("https://t.me/c/100000000001/42".into()),
                reply_to_message_id: Some(41),
                is_target: true,
                media: vec![SourceMedia {
                    kind: SourceMediaKind::Photo,
                    file_name: "self-check.jpg".into(),
                    provider_file_id: Some(42),
                    mime_type: Some("image/jpeg".into()),
                    size: Some(1024),
                    relative_path: None,
                }],
            },
        ],
        discovered_at: now,
        processed_at: None,
        task_id: None,
        linked_task: None,
    };
    let candidate_id = candidate.id.clone();
    let added = store
        .upsert_telegram_candidates(vec![candidate])
        .map_err(|error| error.to_string())?;
    let pending = store
        .list_telegram_inbox(Some(&project.id), false)
        .map_err(|error| error.to_string())?;
    let telegram_task = store
        .create_task_from_telegram_candidate(
            &candidate_id,
            Some("Разобрать сообщение из Telegram"),
            Urgency::Important,
        )
        .map_err(|error| error.to_string())?;
    let repeated = store
        .create_task_from_telegram_candidate(&candidate_id, None, Urgency::Normal)
        .map_err(|error| error.to_string())?;
    let imported = store
        .get_telegram_candidate(&candidate_id)
        .map_err(|error| error.to_string())?;
    let telegram_ok = added == 1
        && pending.len() == 1
        && telegram_task.id == repeated.id
        && telegram_task.source.as_ref().is_some_and(|source| {
            source.provider.as_deref() == Some("telegram")
                && source.message_ids == vec![42, 43]
                && source.media.len() == 1
                && source.context.len() == 2
                && source.context[0].message_id == 41
                && source.context[1].is_target
        })
        && imported.status == InboxCandidateStatus::Imported
        && imported.task_id.as_deref() == Some(telegram_task.id.as_str())
        && imported
            .linked_task
            .as_ref()
            .is_some_and(|task| task.id == telegram_task.id);
    checks.push(SelfCheckItem {
        name: "Входящие Telegram, источник и защита от дублей".into(),
        passed: telegram_ok,
        detail: (!telegram_ok).then(|| "Кандидат Telegram не прошёл полный цикл импорта".into()),
    });
    if !telegram_ok {
        return Err("Проверка входящих Telegram не пройдена".into());
    }

    let sync_request = store
        .request_telegram_sync()
        .map_err(|error| error.to_string())?;
    let sync_request_ok = store
        .telegram_sync_request()
        .map_err(|error| error.to_string())?
        .as_ref()
        == Some(&sync_request)
        && store
            .acknowledge_telegram_sync_request(&sync_request.id)
            .map_err(|error| error.to_string())?
        && store
            .telegram_sync_request()
            .map_err(|error| error.to_string())?
            .is_none();
    checks.push(SelfCheckItem {
        name: "Запрос синхронизации Telegram между MCP и приложением".into(),
        passed: sync_request_ok,
        detail: (!sync_request_ok)
            .then(|| "Запрос не сохранился или не подтвердился по идентификатору".into()),
    });
    if !sync_request_ok {
        return Err("Проверка запроса синхронизации Telegram не пройдена".into());
    }

    let first_activity = store
        .record_activity(RecordActivity {
            source: ActivitySource::Mcp,
            action: ActivityAction::ProjectCreated,
            entity_kind: ActivityEntityKind::Project,
            entity_id: Some(project.id.clone()),
            project_id: Some(project.id.clone()),
            reversible: true,
        })
        .map_err(|error| error.to_string())?;
    let second_activity = store
        .record_activity(RecordActivity {
            source: ActivitySource::Mcp,
            action: ActivityAction::TaskCompleted,
            entity_kind: ActivityEntityKind::Task,
            entity_id: Some(completed.id.clone()),
            project_id: Some(completed.project_id.clone()),
            reversible: true,
        })
        .map_err(|error| error.to_string())?;
    let first_page = store
        .list_activity(None, 1)
        .map_err(|error| error.to_string())?;
    let second_page = Store::new(root)
        .and_then(|reopened| reopened.list_activity(first_page.next_cursor.as_deref(), 1))
        .map_err(|error| error.to_string())?;
    let activity_ok = first_page.total == 2
        && first_page.remaining == 1
        && first_page.events.first().map(|event| event.id.as_str())
            == Some(second_activity.id.as_str())
        && second_page.remaining == 0
        && second_page.events.first().map(|event| event.id.as_str())
            == Some(first_activity.id.as_str());
    checks.push(SelfCheckItem {
        name: "Ограниченный журнал действий MCP".into(),
        passed: activity_ok,
        detail: (!activity_ok)
            .then(|| "Журнал не сохранился, нарушил порядок или пагинацию".into()),
    });
    if !activity_ok {
        return Err("Проверка журнала действий MCP не пройдена".into());
    }

    let diagnostics = store.diagnostics();
    checks.push(SelfCheckItem {
        name: "Диагностика Markdown-хранилища".into(),
        passed: diagnostics.healthy
            && diagnostics.project_count == 1
            && diagnostics.open_task_count == 1
            && diagnostics.completed_task_count == 1,
        detail: (!diagnostics.healthy).then(|| diagnostics.issues.join("; ")),
    });
    Ok(())
}

fn encode<T: Serialize>(metadata: &T, body: &str) -> Result<String, StoreError> {
    let yaml = serde_yaml::to_string(metadata)?;
    Ok(format!("---\n{yaml}---\n\n{}\n", body.trim()))
}

fn decode<T: DeserializeOwned>(path: &Path) -> Result<(T, String, String), StoreError> {
    let content = read_limited_utf8(path, MAX_MARKDOWN_FILE_BYTES)?;
    let version = digest(content.as_bytes());
    let rest = content
        .strip_prefix("---\n")
        .or_else(|| content.strip_prefix("---\r\n"))
        .ok_or_else(|| {
            invalid(
                path,
                "нет начала YAML front matter; восстановите начальный разделитель `---` или совместимую копию файла",
            )
        })?;
    // Editors and Windows Git checkouts can use CRLF. Locate the delimiter
    // without normalizing the body or the raw bytes used for conflict versions.
    let (yaml_end, delimiter_len) = rest
        .split_inclusive('\n')
        .scan(0, |offset, line| {
            let start = *offset;
            *offset += line.len();
            Some((start, line))
        })
        .find(|(_, line)| *line == "---\n" || *line == "---\r\n")
        .map(|(offset, line)| (offset, line.len()))
        .ok_or_else(|| {
            invalid(
                path,
                "нет конца YAML front matter; восстановите закрывающий разделитель `---` или совместимую копию файла",
            )
        })?;
    let yaml = &rest[..yaml_end];
    let body = &rest[yaml_end + delimiter_len..];
    let metadata = serde_yaml::from_str(yaml).map_err(|error| {
        invalid(
            path,
            format!(
                "некорректный YAML front matter: {error}; исправьте YAML вручную или восстановите совместимую копию файла"
            ),
        )
    })?;
    Ok((metadata, body.trim().to_owned(), version))
}

fn ensure_format_version(path: &Path, actual: u8) -> Result<(), StoreError> {
    if actual == FORMAT_VERSION {
        return Ok(());
    }
    Err(invalid(
        path,
        format!(
            "неподдерживаемая версия формата {actual}; обновите flood.md до версии, которая поддерживает этот файл, или восстановите совместимую копию"
        ),
    ))
}

fn path_component(path: &Path, message: &str) -> Result<String, StoreError> {
    path.file_name()
        .and_then(|value| value.to_str())
        .map(str::to_owned)
        .ok_or_else(|| invalid(path, message))
}

fn file_stem(path: &Path) -> Result<String, StoreError> {
    path.file_stem()
        .and_then(|value| value.to_str())
        .map(str::to_owned)
        .ok_or_else(|| invalid(path, "не удалось определить идентификатор из имени файла"))
}

fn project_id_from_project_path(path: &Path) -> Result<String, StoreError> {
    let project_dir = path
        .parent()
        .ok_or_else(|| invalid(path, "не удалось определить каталог проекта"))?;
    path_component(
        project_dir,
        "не удалось определить идентификатор каталога проекта",
    )
}

fn project_id_from_task_path(path: &Path) -> Result<String, StoreError> {
    let tasks_dir = path
        .parent()
        .ok_or_else(|| invalid(path, "не удалось определить каталог задач"))?;
    let project_dir = tasks_dir
        .parent()
        .ok_or_else(|| invalid(path, "не удалось определить каталог проекта задачи"))?;
    path_component(
        project_dir,
        "не удалось определить идентификатор проекта задачи",
    )
}

fn workspace_identity_from_path(
    path: &Path,
) -> Result<(String, String, ProjectWorkspaceItemKind), StoreError> {
    let item_id = file_stem(path)?;
    let kind_dir = path
        .parent()
        .ok_or_else(|| invalid(path, "не удалось определить каталог типа элемента проекта"))?;
    let kind_name = path_component(
        kind_dir,
        "не удалось определить тип элемента проекта из каталога",
    )?;
    let kind = match kind_name.as_str() {
        "documents" => ProjectWorkspaceItemKind::Document,
        "rules" => ProjectWorkspaceItemKind::Rule,
        "skills" => ProjectWorkspaceItemKind::Skill,
        _ => {
            return Err(invalid(
                path,
                format!(
                    "неизвестный каталог элемента проекта `{kind_name}`; верните файл в `documents`, `rules` или `skills`"
                ),
            ));
        }
    };
    let workspace_dir = kind_dir
        .parent()
        .ok_or_else(|| invalid(path, "не удалось определить каталог workspace"))?;
    let project_dir = workspace_dir
        .parent()
        .ok_or_else(|| invalid(path, "не удалось определить каталог проекта элемента"))?;
    let project_id = path_component(
        project_dir,
        "не удалось определить идентификатор проекта элемента",
    )?;
    Ok((item_id, project_id, kind))
}

fn read_project(path: &Path) -> Result<Project, StoreError> {
    let (doc, body, version): (ProjectDocument, _, _) = decode(path)?;
    ensure_format_version(path, doc.format_version)?;
    validate_id(&doc.id).map_err(|error| invalid(path, error.to_string()))?;
    let path_project_id = project_id_from_project_path(path)?;
    if doc.id != path_project_id {
        return Err(invalid(
            path,
            format!(
                "id проекта `{}` не совпадает с каталогом `{path_project_id}`; восстановите исходный id в YAML front matter или верните файл в каталог своего проекта",
                doc.id
            ),
        ));
    }
    validate_project_resources(&doc.resources).map_err(|error| invalid(path, error.to_string()))?;
    validate_project_memory(&doc.memory).map_err(|error| invalid(path, error.to_string()))?;
    let mut telegram_chats = doc.telegram_chats;
    if telegram_chats.is_empty()
        && let Some(legacy) = doc.telegram
    {
        telegram_chats.push(legacy);
    }
    Ok(Project {
        id: doc.id,
        context: project_context_from_body(&body, &doc.title),
        title: doc.title,
        resources: doc.resources,
        memory: doc.memory,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        telegram_chats,
        telegram_participants: doc.telegram_participants,
        version,
    })
}

fn read_project_workspace_item(path: &Path) -> Result<ProjectWorkspaceItem, StoreError> {
    let (doc, body, version): (ProjectWorkspaceItemDocument, _, _) = decode(path)?;
    ensure_format_version(path, doc.format_version)?;
    let (path_item_id, path_project_id, path_kind) = workspace_identity_from_path(path)?;
    if doc.id != path_item_id {
        return Err(invalid(
            path,
            format!(
                "id элемента `{}` не совпадает с именем файла `{path_item_id}.md`; восстановите исходный id в YAML front matter или имя файла",
                doc.id
            ),
        ));
    }
    if doc.project_id != path_project_id {
        return Err(invalid(
            path,
            format!(
                "project_id элемента `{}` не совпадает с каталогом проекта `{path_project_id}`; восстановите project_id в YAML front matter или верните файл в каталог своего проекта",
                doc.project_id
            ),
        ));
    }
    if doc.kind != path_kind {
        return Err(invalid(
            path,
            format!(
                "тип элемента `{:?}` не совпадает с каталогом `{}`; восстановите kind в YAML front matter или верните файл в каталог соответствующего типа",
                doc.kind,
                project_workspace_kind_directory(path_kind)
            ),
        ));
    }
    let item = ProjectWorkspaceItem {
        id: doc.id,
        project_id: doc.project_id,
        kind: doc.kind,
        title: doc.title,
        summary: doc.summary,
        content: workspace_content_from_body(&body),
        agent_access: doc.agent_access,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        revisions: doc.revisions,
        version,
    };
    validate_project_workspace_item(&item).map_err(|error| invalid(path, error.to_string()))?;
    Ok(item)
}

fn workspace_content_from_body(body: &str) -> String {
    let mut lines = body.lines();
    if lines
        .next()
        .is_some_and(|line| line.trim_start().starts_with("# "))
    {
        lines.collect::<Vec<_>>().join("\n").trim().to_owned()
    } else {
        body.trim().to_owned()
    }
}

fn project_context_from_body(body: &str, title: &str) -> String {
    let mut lines = body.lines();
    let first = lines.next().unwrap_or_default().trim();
    if first == format!("# {title}") {
        lines.collect::<Vec<_>>().join("\n").trim().to_owned()
    } else {
        body.trim().to_owned()
    }
}

fn read_task(path: &Path) -> Result<Task, StoreError> {
    let (doc, description, version): (TaskDocument, _, _) = decode(path)?;
    ensure_format_version(path, doc.format_version)?;
    validate_id(&doc.id).map_err(|error| invalid(path, error.to_string()))?;
    validate_id(&doc.project_id).map_err(|error| invalid(path, error.to_string()))?;
    let path_task_id = file_stem(path)?;
    if doc.id != path_task_id {
        return Err(invalid(
            path,
            format!(
                "id задачи `{}` не совпадает с именем файла `{path_task_id}.md`; восстановите исходный id в YAML front matter или имя файла",
                doc.id
            ),
        ));
    }
    let path_project_id = project_id_from_task_path(path)?;
    if doc.project_id != path_project_id {
        return Err(invalid(
            path,
            format!(
                "project_id задачи `{}` не совпадает с каталогом проекта `{path_project_id}`; восстановите project_id в YAML front matter или верните файл в каталог своего проекта",
                doc.project_id
            ),
        ));
    }
    validate_task_relations(&doc.id, &doc.relations)?;
    validate_task_checkpoints(&doc.checkpoints)?;
    Ok(Task {
        id: doc.id,
        project_id: doc.project_id,
        description,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        urgency: doc.urgency,
        status: doc.status,
        relations: doc.relations,
        checkpoints: doc.checkpoints,
        source: doc.source,
        trashed_at: doc.trashed_at,
        version,
    })
}

fn validate_task_relations(
    task_id: &str,
    relations: &[crate::TaskRelation],
) -> Result<(), StoreError> {
    if relations.len() > 50 {
        return Err(StoreError::Validation(
            "у задачи может быть не более 50 связей".into(),
        ));
    }
    let mut seen = HashSet::new();
    for relation in relations {
        validate_id(&relation.task_id)?;
        if relation.task_id == task_id {
            return Err(StoreError::Validation(
                "задачу нельзя связать саму с собой".into(),
            ));
        }
        if !seen.insert((relation.task_id.as_str(), relation.kind)) {
            return Err(StoreError::Validation(
                "связи задачи не должны повторяться".into(),
            ));
        }
    }
    Ok(())
}

fn normalize_task_checkpoint_draft(
    draft: crate::TaskCheckpointDraft,
) -> Result<crate::TaskCheckpointDraft, StoreError> {
    let agent_run_id = match draft.agent_run_id {
        Some(id) => {
            validate_id(&id)?;
            Some(id)
        }
        None => None,
    };
    Ok(crate::TaskCheckpointDraft {
        source: draft.source,
        summary: clean_required(&draft.summary, "итог контрольной точки", 4_000)?,
        verification: clean_checkpoint_items(draft.verification, "проверка")?,
        remaining: clean_checkpoint_items(draft.remaining, "оставшаяся работа")?,
        blocker: clean_optional_checkpoint_text(draft.blocker, "блокер", 2_000)?,
        result: clean_optional_checkpoint_text(draft.result, "результат", 20_000)?,
        agent_run_id,
    })
}

fn clean_checkpoint_items(items: Vec<String>, field: &str) -> Result<Vec<String>, StoreError> {
    if items.len() > 20 {
        return Err(StoreError::Validation(format!(
            "{field}: допускается не более 20 пунктов"
        )));
    }
    let mut cleaned = Vec::with_capacity(items.len());
    let mut seen = HashSet::new();
    for item in items {
        let item = clean_required(&item, field, 500)?;
        if seen.insert(item.to_lowercase()) {
            cleaned.push(item);
        }
    }
    Ok(cleaned)
}

fn clean_optional_checkpoint_text(
    value: Option<String>,
    field: &str,
    max: usize,
) -> Result<Option<String>, StoreError> {
    value
        .map(|value| {
            let value = value.trim();
            if value.is_empty() {
                Ok(None)
            } else {
                clean_required(value, field, max).map(Some)
            }
        })
        .transpose()
        .map(Option::flatten)
}

fn validate_task_checkpoints(checkpoints: &[crate::TaskCheckpoint]) -> Result<(), StoreError> {
    if checkpoints.len() > 50 {
        return Err(StoreError::Validation(
            "у задачи может быть не более 50 контрольных точек".into(),
        ));
    }
    let mut seen = HashSet::new();
    for checkpoint in checkpoints {
        validate_id(&checkpoint.id)?;
        if !seen.insert(checkpoint.id.as_str()) {
            return Err(StoreError::Validation(
                "контрольные точки задачи не должны повторяться".into(),
            ));
        }
        clean_required(&checkpoint.summary, "итог контрольной точки", 4_000)?;
        clean_checkpoint_items(checkpoint.verification.clone(), "проверка")?;
        clean_checkpoint_items(checkpoint.remaining.clone(), "оставшаяся работа")?;
        clean_optional_checkpoint_text(checkpoint.blocker.clone(), "блокер", 2_000)?;
        clean_optional_checkpoint_text(checkpoint.result.clone(), "результат", 20_000)?;
        if let Some(run_id) = checkpoint.agent_run_id.as_deref() {
            validate_id(run_id)?;
        }
    }
    Ok(())
}

fn batch_operation_id(operation: &TaskBatchOperation) -> &str {
    match operation {
        TaskBatchOperation::Create { operation_id, .. }
        | TaskBatchOperation::Update { operation_id, .. }
        | TaskBatchOperation::Link { operation_id, .. }
        | TaskBatchOperation::Unlink { operation_id, .. } => operation_id,
    }
}

fn resolve_batch_reference(
    reference: &TaskBatchReference,
    created_ids: &HashMap<String, String>,
) -> Result<String, StoreError> {
    match (&reference.task_id, &reference.operation_id) {
        (Some(task_id), None) => {
            validate_id(task_id)?;
            Ok(task_id.clone())
        }
        (None, Some(operation_id)) => created_ids.get(operation_id).cloned().ok_or_else(|| {
            StoreError::Validation(format!(
                "operation_id {operation_id} не указывает на создание задачи в этом пакете"
            ))
        }),
        _ => Err(StoreError::Validation(
            "ссылка на задачу должна содержать ровно одно поле: task_id или operation_id".into(),
        )),
    }
}

fn ensure_batch_expected_version(
    id: &str,
    working: &HashMap<String, Task>,
    created: &HashSet<String>,
    expected: &HashMap<String, String>,
    checked: &mut HashSet<String>,
) -> Result<(), StoreError> {
    if created.contains(id) || checked.contains(id) {
        return Ok(());
    }
    let version = expected.get(id).ok_or_else(|| {
        StoreError::Validation(format!(
            "для изменяемой существующей задачи {id} нужна expected_version"
        ))
    })?;
    ensure_version(&working[id].version, version)?;
    checked.insert(id.to_owned());
    Ok(())
}

fn validate_batch_relation_cycles(
    project_id: &str,
    tasks: &HashMap<String, Task>,
) -> Result<(), StoreError> {
    for kind in [
        crate::TaskRelationKind::SubtaskOf,
        crate::TaskRelationKind::BlockedBy,
    ] {
        let mut visiting = HashSet::new();
        let mut visited = HashSet::new();
        for task in tasks.values().filter(|task| task.project_id == project_id) {
            if batch_relation_cycle_from(&task.id, &kind, tasks, &mut visiting, &mut visited) {
                return Err(StoreError::Validation(
                    "пакет создаёт цикл между задачами".into(),
                ));
            }
        }
    }
    Ok(())
}

fn batch_relation_cycle_from(
    id: &str,
    kind: &crate::TaskRelationKind,
    tasks: &HashMap<String, Task>,
    visiting: &mut HashSet<String>,
    visited: &mut HashSet<String>,
) -> bool {
    if visited.contains(id) {
        return false;
    }
    if !visiting.insert(id.to_owned()) {
        return true;
    }
    let has_cycle = tasks.get(id).is_some_and(|task| {
        task.relations
            .iter()
            .filter(|relation| &relation.kind == kind)
            .any(|relation| {
                batch_relation_cycle_from(&relation.task_id, kind, tasks, visiting, visited)
            })
    });
    visiting.remove(id);
    visited.insert(id.to_owned());
    has_cycle
}

fn atomic_write(path: &Path, content: &str) -> Result<(), StoreError> {
    if content.len() as u64 > MAX_MARKDOWN_FILE_BYTES {
        return Err(StoreError::Validation(
            "Markdown-файл превышает безопасный размер 1 МБ".into(),
        ));
    }
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let mut file = AtomicWriteFile::options().open(path)?;
    file.write_all(content.as_bytes())?;
    file.commit()?;
    Ok(())
}

fn read_limited_utf8(path: &Path, max_bytes: u64) -> Result<String, StoreError> {
    String::from_utf8(read_limited_bytes(path, max_bytes)?)
        .map_err(|_| invalid(path, "файл должен быть в кодировке UTF-8"))
}

fn truncate_text(value: String, max_chars: usize) -> String {
    if value.chars().count() <= max_chars {
        return value;
    }
    let mut shortened = value
        .chars()
        .take(max_chars.saturating_sub(1))
        .collect::<String>();
    shortened.push('…');
    shortened
}

fn read_limited_bytes(path: &Path, max_bytes: u64) -> Result<Vec<u8>, StoreError> {
    let metadata = fs::metadata(path)?;
    if metadata.len() > max_bytes {
        return Err(invalid(
            path,
            format!("размер файла превышает безопасный предел {max_bytes} байт"),
        ));
    }
    let mut bytes = Vec::with_capacity(metadata.len().min(max_bytes) as usize);
    File::open(path)?
        .take(max_bytes + 1)
        .read_to_end(&mut bytes)?;
    if bytes.len() as u64 > max_bytes {
        return Err(invalid(
            path,
            format!("размер файла превышает безопасный предел {max_bytes} байт"),
        ));
    }
    Ok(bytes)
}

fn atomic_write_bytes(path: &Path, content: &[u8]) -> Result<(), StoreError> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let mut file = AtomicWriteFile::options().open(path)?;
    file.write_all(content)?;
    file.commit()?;
    Ok(())
}

fn collect_backup_files(directory: &Path, output: &mut Vec<PathBuf>) -> Result<(), StoreError> {
    if !directory.exists() {
        return Ok(());
    }
    for entry in fs::read_dir(directory)? {
        let entry = entry?;
        let path = entry.path();
        let kind = entry.file_type()?;
        if kind.is_dir() {
            collect_backup_files(&path, output)?;
        } else if kind.is_file() {
            output.push(path);
        }
    }
    output.sort();
    Ok(())
}

fn backup_integration_path_is_portable(path: &Path) -> bool {
    !path.components().any(|component| {
        let Some(name) = component.as_os_str().to_str() else {
            return true;
        };
        let name = name.to_ascii_lowercase();
        name == ".env"
            || name.starts_with(".env.")
            || matches!(
                name.as_str(),
                "credential"
                    | "credentials"
                    | "credentials.json"
                    | "secret"
                    | "secrets"
                    | "secrets.json"
                    | "secrets.yml"
                    | "secrets.yaml"
                    | "session"
                    | "session.json"
                    | "sessions"
                    | "sessions.json"
                    | "token"
                    | "token.json"
                    | "tokens"
                    | "tokens.json"
                    | "id_rsa"
                    | "id_ed25519"
            )
            || name.contains("access-token")
            || name.contains("refresh-token")
            || [".pem", ".key", ".p12", ".pfx"]
                .iter()
                .any(|extension| name.ends_with(extension))
    })
}

fn is_attachment_path(path: &Path) -> bool {
    path.components().any(|part| {
        matches!(
            part.as_os_str().to_str(),
            Some("attachments" | "telegram-media")
        )
    })
}

fn restore_entry_size_limit(path: &Path) -> u64 {
    if is_attachment_path(path) {
        return MAX_ATTACHMENT_BYTES;
    }
    if path.extension().and_then(|value| value.to_str()) == Some("md") {
        return MAX_MARKDOWN_FILE_BYTES;
    }
    if path.starts_with("integrations") {
        return match path.file_name().and_then(|value| value.to_str()) {
            Some("telegram-inbox.json" | "telegram-chats.json") => MAX_TELEGRAM_INBOX_BYTES,
            Some("activity.json") => MAX_ACTIVITY_BYTES,
            Some("automation-events.json") => MAX_AUTOMATION_EVENTS_BYTES,
            Some("automation-settings.json") => MAX_AUTOMATION_SETTINGS_BYTES,
            _ => MAX_INTEGRATION_STATE_BYTES,
        };
    }
    MAX_MARKDOWN_FILE_BYTES
}

fn clean_file_name(value: &str) -> Result<String, StoreError> {
    let name = Path::new(value)
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("")
        .trim();
    if name.is_empty() || name.len() > 180 {
        return Err(StoreError::Validation("некорректное имя вложения".into()));
    }
    Ok(name
        .chars()
        .map(|char| {
            if char.is_whitespace()
                || matches!(
                    char,
                    '<' | '>'
                        | ':'
                        | '"'
                        | '/'
                        | '\\'
                        | '|'
                        | '?'
                        | '*'
                        | '('
                        | ')'
                        | '['
                        | ']'
                        | '`'
                )
            {
                '_'
            } else {
                char
            }
        })
        .collect())
}

fn task_attachment_dir(task_path: &Path) -> PathBuf {
    let id = task_path
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or("");
    task_path
        .parent()
        .unwrap_or_else(|| Path::new("."))
        .join("attachments")
        .join(id)
}

fn digest(content: &[u8]) -> String {
    hex::encode(Sha256::digest(content))
}

fn deterministic_id(namespace: &str, request_id: &str) -> String {
    let mut digest = Sha256::new();
    digest.update(b"flood.idempotent-create.v1\0");
    digest.update(namespace.as_bytes());
    digest.update(b"\0");
    digest.update(request_id.as_bytes());
    let bytes = digest.finalize();
    let mut value = [0_u8; 16];
    value.copy_from_slice(&bytes[..16]);
    Ulid::from(u128::from_be_bytes(value)).to_string()
}
fn ensure_version(actual: &str, expected: &str) -> Result<(), StoreError> {
    if actual == expected {
        Ok(())
    } else {
        Err(StoreError::Conflict)
    }
}
fn status_rank(value: &TaskStatus) -> u8 {
    match value {
        TaskStatus::Open => 0,
        TaskStatus::Completed => 1,
    }
}
fn urgency_rank(value: &crate::Urgency) -> u8 {
    match value {
        crate::Urgency::Normal => 0,
        crate::Urgency::Important => 1,
        crate::Urgency::Urgent => 2,
    }
}
fn invalid(path: &Path, message: impl Into<String>) -> StoreError {
    StoreError::InvalidFile {
        path: path.display().to_string(),
        message: message.into(),
    }
}
fn map_missing(error: StoreError, id: &str) -> StoreError {
    match error {
        StoreError::Io(ref inner) if inner.kind() == std::io::ErrorKind::NotFound => {
            StoreError::NotFound(id.to_owned())
        }
        other => other,
    }
}
fn validate_id(id: &str) -> Result<(), StoreError> {
    Ulid::from_string(id)
        .map(|_| ())
        .map_err(|_| StoreError::Validation("некорректный идентификатор".into()))
}

fn project_workspace_kind_directory(kind: ProjectWorkspaceItemKind) -> &'static str {
    match kind {
        ProjectWorkspaceItemKind::Document => "documents",
        ProjectWorkspaceItemKind::Rule => "rules",
        ProjectWorkspaceItemKind::Skill => "skills",
    }
}

fn clean_optional(
    value: Option<&str>,
    field: &str,
    max: usize,
) -> Result<Option<String>, StoreError> {
    value
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(|value| clean_required(value, field, max))
        .transpose()
}

fn clean_workspace_content(value: &str) -> Result<String, StoreError> {
    if value.chars().count() > MAX_PROJECT_WORKSPACE_CONTENT_CHARS {
        return Err(StoreError::Validation(format!(
            "содержимое превышает допустимые {MAX_PROJECT_WORKSPACE_CONTENT_CHARS} символов"
        )));
    }
    Ok(value.trim().to_owned())
}

fn validate_project_workspace_item(item: &ProjectWorkspaceItem) -> Result<(), StoreError> {
    validate_id(&item.id)?;
    validate_id(&item.project_id)?;
    clean_required(&item.title, "название", 120)?;
    clean_optional(item.summary.as_deref(), "описание", 500)?;
    clean_workspace_content(&item.content)?;
    if item.revisions.len() > MAX_PROJECT_WORKSPACE_REVISIONS {
        return Err(StoreError::Validation(format!(
            "история содержит больше {MAX_PROJECT_WORKSPACE_REVISIONS} версий"
        )));
    }
    for revision in &item.revisions {
        clean_required(&revision.title, "название предыдущей версии", 120)?;
        clean_optional(
            revision.summary.as_deref(),
            "описание предыдущей версии",
            500,
        )?;
        clean_workspace_content(&revision.content)?;
    }
    Ok(())
}

fn validate_project_knowledge_proposal_parts(
    target: &ProjectKnowledgeProposalTarget,
    payload: &ProjectKnowledgeProposalPayload,
    summary: &str,
    reason: &str,
) -> Result<(), StoreError> {
    if summary.trim().is_empty() || reason.trim().is_empty() {
        return Err(StoreError::Validation(
            "Предложению нужны непустые summary и reason".into(),
        ));
    }
    match (target, payload) {
        (
            ProjectKnowledgeProposalTarget::WorkspaceItem { item_id, .. },
            ProjectKnowledgeProposalPayload::WorkspaceItem { title, .. },
        ) => {
            validate_id(item_id)?;
            if title.trim().is_empty() {
                return Err(StoreError::Validation(
                    "У предложенного материала должен быть заголовок".into(),
                ));
            }
        }
        (
            ProjectKnowledgeProposalTarget::ProjectMemory { memory_id },
            ProjectKnowledgeProposalPayload::ProjectMemory { text, .. },
        ) => {
            validate_id(memory_id)?;
            if text.trim().is_empty() {
                return Err(StoreError::Validation(
                    "Предложенная запись памяти не может быть пустой".into(),
                ));
            }
        }
        _ => {
            return Err(StoreError::Validation(
                "Тип цели и payload предложения не совпадают".into(),
            ));
        }
    }
    Ok(())
}

fn ensure_project_knowledge_base(
    store: &Store,
    project_id: &str,
    target: &ProjectKnowledgeProposalTarget,
    base_version: &str,
) -> Result<(), StoreError> {
    match target {
        ProjectKnowledgeProposalTarget::WorkspaceItem { item_id, item_kind } => {
            let item = store.get_project_workspace_item(project_id, item_id)?;
            if item.kind != *item_kind {
                return Err(StoreError::Validation(
                    "Тип целевого материала не совпадает".into(),
                ));
            }
            ensure_version(&item.version, base_version)
        }
        ProjectKnowledgeProposalTarget::ProjectMemory { memory_id } => {
            let project = store.get_project(project_id)?;
            if !project.memory.iter().any(|entry| entry.id == *memory_id) {
                return Err(StoreError::NotFound(memory_id.clone()));
            }
            ensure_version(&project.version, base_version)
        }
    }
}

fn project_knowledge_payload_matches_current(
    store: &Store,
    proposal: &ProjectKnowledgeProposal,
) -> Result<bool, StoreError> {
    match (&proposal.target, &proposal.payload) {
        (
            ProjectKnowledgeProposalTarget::WorkspaceItem { item_id, item_kind },
            ProjectKnowledgeProposalPayload::WorkspaceItem {
                title,
                summary,
                content,
                agent_access,
            },
        ) => {
            let item = store.get_project_workspace_item(&proposal.project_id, item_id)?;
            Ok(item.kind == *item_kind
                && item.title == *title
                && item.summary == *summary
                && item.content == *content
                && item.agent_access == *agent_access)
        }
        (
            ProjectKnowledgeProposalTarget::ProjectMemory { memory_id },
            ProjectKnowledgeProposalPayload::ProjectMemory { text, pinned },
        ) => {
            let project = store.get_project(&proposal.project_id)?;
            Ok(project
                .memory
                .iter()
                .find(|entry| entry.id == *memory_id)
                .is_some_and(|entry| entry.text == *text && entry.pinned == *pinned))
        }
        _ => Ok(false),
    }
}

fn validate_activity_reference(
    entity_kind: &ActivityEntityKind,
    entity_id: Option<&str>,
    project_id: Option<&str>,
) -> Result<(), StoreError> {
    if let Some(project_id) = project_id {
        validate_id(project_id)?;
    }
    match (entity_kind, entity_id) {
        (ActivityEntityKind::Workspace, None) => Ok(()),
        (ActivityEntityKind::Project | ActivityEntityKind::Task, Some(id)) => validate_id(id),
        (ActivityEntityKind::TelegramCandidate, Some(id)) => {
            clean_required(id, "идентификатор Telegram-кандидата", 160).map(|_| ())
        }
        _ => Err(StoreError::Validation(
            "тип объекта и entity_id события не согласованы".into(),
        )),
    }
}

fn clean_required(value: &str, field: &str, max: usize) -> Result<String, StoreError> {
    let value = value.trim();
    if value.is_empty() {
        return Err(StoreError::Validation(format!(
            "{field} не может быть пустым"
        )));
    }
    if value.chars().count() > max {
        return Err(StoreError::Validation(format!(
            "{field}: превышено ограничение {max} символов"
        )));
    }
    Ok(value.to_owned())
}

fn validate_project_resources(resources: &[ProjectResource]) -> Result<(), StoreError> {
    if resources.len() > 20 {
        return Err(StoreError::Validation(
            "у проекта может быть не более 20 источников контекста".into(),
        ));
    }
    let mut seen = HashSet::new();
    for resource in resources {
        if resource.id.is_empty()
            || resource.id.len() > 80
            || !resource.id.bytes().all(|byte| {
                byte.is_ascii_lowercase()
                    || byte.is_ascii_digit()
                    || matches!(byte, b'-' | b'_' | b'.')
            })
        {
            return Err(StoreError::Validation(
                "id источника должен содержать до 80 строчных латинских букв, цифр, точек, дефисов или подчёркиваний".into(),
            ));
        }
        if !seen.insert(resource.id.as_str()) {
            return Err(StoreError::Validation(
                "id источников проекта не должны повторяться".into(),
            ));
        }
        clean_required(&resource.label, "название источника проекта", 120)?;
        clean_required(&resource.location, "адрес источника проекта", 2_048)?;
        if resource.location.contains(['\r', '\n']) {
            return Err(StoreError::Validation(
                "адрес источника проекта должен занимать одну строку".into(),
            ));
        }
        if resource
            .notes
            .as_ref()
            .is_some_and(|notes| notes.chars().count() > 4_000)
        {
            return Err(StoreError::Validation(
                "заметка об источнике проекта превышает 4000 символов".into(),
            ));
        }
    }
    Ok(())
}

fn validate_project_memory(memory: &[crate::ProjectMemoryEntry]) -> Result<(), StoreError> {
    if memory.len() > MAX_PROJECT_MEMORY_ENTRIES {
        return Err(StoreError::Validation(format!(
            "в памяти проекта может быть не более {MAX_PROJECT_MEMORY_ENTRIES} записей"
        )));
    }
    let mut ids = HashSet::new();
    for entry in memory {
        validate_id(&entry.id)?;
        if !ids.insert(entry.id.as_str()) {
            return Err(StoreError::Validation(
                "идентификаторы записей памяти не должны повторяться".into(),
            ));
        }
        clean_required(&entry.text, "запись памяти", 600)?;
        if let Some(task_id) = entry.source_task_id.as_deref() {
            validate_id(task_id)?;
        }
        if entry.revisions.len() > 10 {
            return Err(StoreError::Validation(
                "у записи памяти может быть не более 10 предыдущих версий".into(),
            ));
        }
        for revision in &entry.revisions {
            clean_required(&revision.text, "предыдущая версия записи памяти", 600)?;
        }
        if entry.state.is_active() && entry.superseded_by.is_some() {
            return Err(StoreError::Validation(
                "актуальная запись памяти не может ссылаться на замену".into(),
            ));
        }
        if !entry.state.is_active() && entry.pinned {
            return Err(StoreError::Validation(
                "заменённую запись памяти нельзя закрепить".into(),
            ));
        }
    }
    for entry in memory {
        if let Some(replacement_id) = entry.superseded_by.as_deref()
            && (replacement_id == entry.id
                || !memory
                    .iter()
                    .any(|candidate| candidate.id == replacement_id))
        {
            return Err(StoreError::Validation(
                "запись памяти ссылается на отсутствующую замену".into(),
            ));
        }
    }
    Ok(())
}

fn ensure_unique_active_memory_text(
    memory: &[crate::ProjectMemoryEntry],
    text: &str,
    excluded_id: Option<&str>,
) -> Result<(), StoreError> {
    let comparable = text.trim().to_lowercase();
    if memory.iter().any(|entry| {
        entry.state.is_active()
            && Some(entry.id.as_str()) != excluded_id
            && entry.text.trim().to_lowercase() == comparable
    }) {
        return Err(StoreError::Validation(
            "такая актуальная запись уже есть в памяти проекта".into(),
        ));
    }
    Ok(())
}

fn compact_project_memory(memory: &mut Vec<crate::ProjectMemoryEntry>) -> Result<(), StoreError> {
    while memory.len() > PROJECT_MEMORY_COMPACT_TARGET {
        let removable = memory
            .iter()
            .enumerate()
            .filter(|(_, entry)| !entry.state.is_active())
            .min_by_key(|(_, entry)| entry.updated_at.unwrap_or(entry.created_at))
            .map(|(index, _)| index)
            .or_else(|| {
                memory
                    .iter()
                    .enumerate()
                    .filter(|(_, entry)| entry.state.is_active() && !entry.pinned)
                    .min_by_key(|(_, entry)| entry.updated_at.unwrap_or(entry.created_at))
                    .map(|(index, _)| index)
            });
        let Some(index) = removable else {
            break;
        };
        let removed_id = memory.remove(index).id;
        for entry in memory.iter_mut() {
            if entry.superseded_by.as_deref() == Some(removed_id.as_str()) {
                entry.superseded_by = None;
            }
        }
    }
    validate_project_memory(memory)
}

fn normalize_project_resources(resources: &mut [ProjectResource]) {
    for resource in resources {
        resource.id = resource.id.trim().to_owned();
        resource.label = resource.label.trim().to_owned();
        resource.location = resource.location.trim().to_owned();
        resource.notes = resource
            .notes
            .take()
            .map(|notes| notes.trim().to_owned())
            .filter(|notes| !notes.is_empty());
    }
}

fn validate_source(source: &Option<crate::MessageSnapshot>) -> Result<(), StoreError> {
    if let Some(source) = source {
        if source.text.trim().is_empty() && source.media.is_empty() {
            return Err(StoreError::Validation(
                "источник должен содержать текст или медиа".into(),
            ));
        }
        if source.text.chars().count() > 50_000 {
            return Err(StoreError::Validation(
                "текст исходного сообщения: превышено ограничение 50000 символов".into(),
            ));
        }
        if source.url.as_ref().is_some_and(|url| url.len() > 2_000) {
            return Err(StoreError::Validation(
                "ссылка исходного сообщения слишком длинная".into(),
            ));
        }
        if source.media.len() > 20 {
            return Err(StoreError::Validation(
                "у источника может быть не более 20 медиафайлов".into(),
            ));
        }
        for media in &source.media {
            clean_required(&media.file_name, "имя медиафайла", 240)?;
            if media
                .relative_path
                .as_ref()
                .is_some_and(|path| path.contains("..") || Path::new(path).is_absolute())
            {
                return Err(StoreError::Validation(
                    "некорректный относительный путь медиафайла".into(),
                ));
            }
        }
        if source.context.len() > 20 {
            return Err(StoreError::Validation(
                "контекст источника может содержать не более 20 сообщений".into(),
            ));
        }
        if !source.context.is_empty() && !source.context.iter().any(|message| message.is_target) {
            return Err(StoreError::Validation(
                "контекст источника должен отмечать исходное сообщение".into(),
            ));
        }
        for message in &source.context {
            clean_required(&message.author, "автор сообщения контекста", 240)?;
            if message.text.chars().count() > 20_000 {
                return Err(StoreError::Validation(
                    "сообщение контекста: превышено ограничение 20000 символов".into(),
                ));
            }
            if message.url.as_ref().is_some_and(|url| url.len() > 2_000) {
                return Err(StoreError::Validation(
                    "ссылка сообщения контекста слишком длинная".into(),
                ));
            }
            if message.media.len() > 20 {
                return Err(StoreError::Validation(
                    "сообщение контекста может содержать не более 20 медиафайлов".into(),
                ));
            }
            for media in &message.media {
                clean_required(&media.file_name, "имя медиафайла контекста", 240)?;
            }
        }
    }
    Ok(())
}

fn validate_candidate(candidate: &TelegramInboxCandidate) -> Result<(), StoreError> {
    validate_id(&candidate.project_id)?;
    clean_required(&candidate.id, "идентификатор кандидата", 160)?;
    clean_required(&candidate.chat_title, "название Telegram-чата", 240)?;
    clean_required(&candidate.author, "автор сообщения", 240)?;
    if candidate.text.trim().is_empty() && candidate.media.is_empty() {
        return Err(StoreError::Validation(
            "сообщение-кандидат должно содержать текст или медиа".into(),
        ));
    }
    validate_source(&Some(candidate.snapshot()))
}

fn validate_automation_event(event: &AutomationEvent) -> Result<(), StoreError> {
    validate_id(&event.id)?;
    validate_id(&event.project_id)?;
    clean_required(&event.connector_id, "идентификатор коннектора", 80)?;
    clean_required(&event.source_entity_id, "ссылка на источник события", 240)?;
    clean_required(&event.external_id, "внешний идентификатор события", 500)?;
    clean_required(&event.dedupe_key, "ключ дедупликации события", 700)?;
    if let Some(task_id) = event.related_task_id.as_deref() {
        validate_id(task_id)?;
    }
    if event.attempts > MAX_AUTOMATION_EVENT_ATTEMPTS {
        return Err(StoreError::Validation(
            "число попыток обработки события превышает лимит".into(),
        ));
    }
    if let Some(claim_token) = event.claim_token.as_deref() {
        validate_id(claim_token)?;
    }
    if event.state == AutomationEventState::Processing
        && (event.claim_token.is_none() || event.processing_started_at.is_none())
    {
        return Err(StoreError::Validation(
            "обрабатываемое событие не содержит действующую аренду".into(),
        ));
    }
    if event.state != AutomationEventState::Processing
        && (event.claim_token.is_some() || event.processing_started_at.is_some())
    {
        return Err(StoreError::Validation(
            "аренда может принадлежать только обрабатываемому событию".into(),
        ));
    }
    if event
        .error
        .as_ref()
        .is_some_and(|error| error.chars().count() > 2_000)
    {
        return Err(StoreError::Validation(
            "описание ошибки события превышает 2000 символов".into(),
        ));
    }
    Ok(())
}

fn ensure_automation_claim(event: &AutomationEvent, claim_token: &str) -> Result<(), StoreError> {
    if event.state != AutomationEventState::Processing {
        return Err(StoreError::Conflict);
    }
    if event.claim_token.as_deref() != Some(claim_token) {
        return Err(StoreError::Conflict);
    }
    Ok(())
}

fn recover_stale_automation_event_claims(
    document: &mut AutomationEventsDocument,
    now: chrono::DateTime<Utc>,
) -> bool {
    let stale_before = now - chrono::Duration::minutes(AUTOMATION_EVENT_LEASE_MINUTES);
    let mut changed = false;
    for event in &mut document.events {
        if event.state != AutomationEventState::Processing
            || event
                .processing_started_at
                .is_some_and(|started_at| started_at > stale_before)
        {
            continue;
        }
        event.processing_started_at = None;
        event.claim_token = None;
        event.processed_at = None;
        event.outcome = None;
        event.related_task_id = None;
        if event.attempts < MAX_AUTOMATION_EVENT_ATTEMPTS {
            event.state = AutomationEventState::Pending;
            event.retry_at = Some(now + chrono::Duration::minutes(1));
            event.error =
                Some("предыдущая обработка прервалась; событие возвращено в очередь".into());
        } else {
            event.state = AutomationEventState::Failed;
            event.retry_at = None;
            event.error = Some("обработка прервалась после максимального числа попыток".into());
        }
        changed = true;
    }
    changed
}

fn validate_telegram_chat_snapshot(snapshot: &TelegramChatSnapshot) -> Result<(), StoreError> {
    clean_required(&snapshot.title, "название Telegram-чата", 240)?;
    if snapshot.messages.len() > MAX_TELEGRAM_CHAT_MESSAGES {
        return Err(StoreError::Validation(format!(
            "локальная лента Telegram может содержать не более {MAX_TELEGRAM_CHAT_MESSAGES} сообщений"
        )));
    }
    let mut seen = HashSet::new();
    for message in &snapshot.messages {
        if !seen.insert(message.message_id) {
            return Err(StoreError::Validation(
                "локальная лента Telegram содержит повтор сообщения".into(),
            ));
        }
        clean_required(&message.author, "автор сообщения Telegram", 240)?;
        if message.text.chars().count() > 20_000 {
            return Err(StoreError::Validation(
                "сообщение Telegram превышает ограничение 20000 символов".into(),
            ));
        }
        if message.media.len() > 20 {
            return Err(StoreError::Validation(
                "сообщение Telegram может содержать не более 20 медиафайлов".into(),
            ));
        }
        for media in &message.media {
            clean_required(&media.file_name, "имя медиафайла Telegram", 240)?;
        }
    }
    Ok(())
}

fn candidate_message_ids(candidate: &TelegramInboxCandidate) -> Vec<i64> {
    if candidate.message_ids.is_empty() {
        vec![candidate.message_id]
    } else {
        candidate.message_ids.clone()
    }
}

fn greater_urgency(current: Urgency, incoming: Urgency) -> Urgency {
    let rank = |value: &Urgency| match value {
        Urgency::Normal => 0,
        Urgency::Important => 1,
        Urgency::Urgent => 2,
    };
    if rank(&incoming) > rank(&current) {
        incoming
    } else {
        current
    }
}

fn merge_telegram_sources(
    mut existing: crate::MessageSnapshot,
    incoming: crate::MessageSnapshot,
) -> crate::MessageSnapshot {
    for message in incoming.context {
        let ids = telegram_context_message_ids(&message);
        if !existing.context.iter().any(|known| {
            telegram_context_message_ids(known)
                .iter()
                .any(|id| ids.contains(id))
        }) {
            existing.context.push(message);
        }
    }
    existing.context.sort_by_key(|message| message.sent_at);
    if existing.context.len() > 20 {
        existing.context.drain(..existing.context.len() - 20);
    }
    for media in incoming.media {
        let duplicate = existing.media.iter().any(|known| {
            match (known.provider_file_id, media.provider_file_id) {
                (Some(known_id), Some(media_id)) => known_id == media_id,
                _ => known == &media,
            }
        });
        if !duplicate && existing.media.len() < 20 {
            existing.media.push(media);
        }
    }
    existing.message_ids.extend(incoming.message_ids);
    if let Some(message_id) = incoming.message_id {
        existing.message_ids.push(message_id);
    }
    existing.message_ids.sort_unstable();
    existing.message_ids.dedup();
    existing
}

fn telegram_context_message_ids(message: &TelegramContextMessage) -> Vec<i64> {
    let mut ids = message.message_ids.clone();
    if !ids.contains(&message.message_id) {
        ids.push(message.message_id);
    }
    ids
}

fn telegram_message_contains_id(message: &TelegramContextMessage, message_id: i64) -> bool {
    message.message_id == message_id || message.message_ids.contains(&message_id)
}

fn candidate_context_media(
    candidate: &TelegramInboxCandidate,
    message_id: i64,
    media_index: usize,
) -> Result<SourceMedia, StoreError> {
    if let Some(message) = candidate.context.iter().find(|message| {
        message.message_id == message_id || message.message_ids.contains(&message_id)
    }) {
        return message.media.get(media_index).cloned().ok_or_else(|| {
            StoreError::NotFound(format!("медиа {media_index} сообщения {message_id}"))
        });
    }
    if candidate.message_id == message_id || candidate.message_ids.contains(&message_id) {
        return candidate.media.get(media_index).cloned().ok_or_else(|| {
            StoreError::NotFound(format!("медиа {media_index} сообщения {message_id}"))
        });
    }
    Err(StoreError::NotFound(format!(
        "сообщение {message_id} в контексте кандидата"
    )))
}

fn chat_snapshot_media(
    chat: &TelegramChatSnapshot,
    message_id: i64,
    media_index: usize,
) -> Result<SourceMedia, StoreError> {
    let message = chat
        .messages
        .iter()
        .find(|message| {
            message.message_id == message_id || message.message_ids.contains(&message_id)
        })
        .ok_or_else(|| StoreError::NotFound(format!("сообщение Telegram {message_id}")))?;
    message
        .media
        .get(media_index)
        .cloned()
        .ok_or_else(|| StoreError::NotFound(format!("медиа {media_index} сообщения {message_id}")))
}

fn default_telegram_task_title(candidate: &TelegramInboxCandidate) -> String {
    let without_leading_mentions = candidate
        .text
        .split_whitespace()
        .skip_while(|word| word.starts_with('@'))
        .collect::<Vec<_>>()
        .join(" ");
    let normalized = without_leading_mentions.trim();
    if normalized.is_empty() {
        return candidate
            .media
            .first()
            .map(|_| {
                if candidate.media.len() == 1 {
                    "Разобрать медиа из Telegram".to_owned()
                } else {
                    format!("Разобрать медиа из Telegram ({})", candidate.media.len())
                }
            })
            .unwrap_or_else(|| "Разобрать сообщение из Telegram".into());
    }
    let sentence = normalized
        .split(['\n', '\r'])
        .find(|line| !line.trim().is_empty())
        .unwrap_or(normalized)
        .trim();
    let mut characters = sentence.chars();
    let capitalized = characters
        .next()
        .map(|first| first.to_uppercase().collect::<String>() + characters.as_str())
        .unwrap_or_default();
    let mut title = capitalized.chars().take(88).collect::<String>();
    if sentence.chars().count() > 88 {
        title = format!("{}…", title.trim_end());
    }
    title
}

fn source_message_ids(source: &crate::MessageSnapshot) -> Vec<i64> {
    if source.message_ids.is_empty() {
        source.message_id.into_iter().collect()
    } else {
        source.message_ids.clone()
    }
}

fn compact_telegram_inbox(document: &mut TelegramInboxDocument) {
    let processed_cutoff = Utc::now() - chrono::Duration::days(30);
    document.candidates.retain(|candidate| {
        candidate.status == InboxCandidateStatus::Pending
            || candidate
                .processed_at
                .is_none_or(|date| date >= processed_cutoff)
    });
    document
        .candidates
        .sort_by_key(|candidate| Reverse(candidate.sent_at));
    let mut pending_per_project = std::collections::HashMap::<String, usize>::new();
    let mut processed_per_project = std::collections::HashMap::<String, usize>::new();
    document.candidates.retain(|candidate| {
        let counts = if candidate.status == InboxCandidateStatus::Pending {
            &mut pending_per_project
        } else {
            &mut processed_per_project
        };
        let count = counts.entry(candidate.project_id.clone()).or_default();
        *count += 1;
        *count <= 500
    });
    document.candidates.truncate(10_000);
}

fn compact_activity(document: &mut ActivityDocument) {
    if document.events.len() > MAX_ACTIVITY_EVENTS {
        let remove = document.events.len() - MAX_ACTIVITY_EVENTS;
        document.events.drain(..remove);
    }
}

fn compact_automation_events(document: &mut AutomationEventsDocument) -> Result<(), StoreError> {
    let processed_cutoff = Utc::now() - chrono::Duration::days(30);
    document.events.retain(|event| {
        event.state != AutomationEventState::Processed
            || event
                .processed_at
                .is_none_or(|date| date >= processed_cutoff)
    });
    if document.events.len() <= MAX_AUTOMATION_EVENTS {
        return Ok(());
    }
    document.events.sort_by_key(|event| event.observed_at);
    let remove = document.events.len() - MAX_AUTOMATION_EVENTS;
    let removable = document
        .events
        .iter()
        .filter(|event| event.state == AutomationEventState::Processed)
        .count();
    if removable < remove {
        return Err(StoreError::Validation(
            "слишком много необработанных событий; автоматизации приостановлены до освобождения очереди"
                .into(),
        ));
    }
    let mut remaining = remove;
    document.events.retain(|event| {
        if remaining > 0 && event.state == AutomationEventState::Processed {
            remaining -= 1;
            false
        } else {
            true
        }
    });
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{AppliedGuidance, GuidanceKind, GuidanceReference};

    #[test]
    fn store_error_codes_are_stable() {
        let errors = [
            (StoreError::Conflict, "conflict"),
            (StoreError::NotFound("task".into()), "not_found"),
            (StoreError::Validation("title".into()), "validation"),
            (
                StoreError::InvalidFile {
                    path: "task.md".into(),
                    message: "frontmatter".into(),
                },
                "invalid_file",
            ),
            (StoreError::Io(std::io::Error::other("disk")), "io"),
            (
                StoreError::Yaml(serde_yaml::from_str::<serde_yaml::Value>("[").unwrap_err()),
                "yaml",
            ),
            (
                StoreError::Json(serde_json::from_str::<serde_json::Value>("{").unwrap_err()),
                "json",
            ),
            (StoreError::Backup("copy".into()), "backup"),
        ];

        for (error, expected) in errors {
            assert_eq!(error.code(), expected);
        }
    }

    fn temp_store() -> Store {
        let root = env::temp_dir().join(format!("flood-test-{}", Ulid::new()));
        Store::new(root).unwrap()
    }

    fn assert_invalid_file_contains(error: StoreError, expected: &str) {
        match error {
            StoreError::InvalidFile { message, .. } => assert!(
                message.contains(expected),
                "ожидали `{expected}` в сообщении об ошибке, получили `{message}`"
            ),
            other => panic!("ожидалась ошибка повреждённого Markdown-файла, получили {other}"),
        }
    }

    #[test]
    fn background_ai_triage_requires_an_explicit_persisted_choice() {
        let store = temp_store();
        let defaults = store.automation_settings().unwrap();
        assert!(!defaults.background_ai_triage);
        assert_eq!(defaults.provider, AutomationProvider::Jev);

        let provider = store
            .set_automation_provider(AutomationProvider::Gemini)
            .unwrap();
        assert_eq!(provider.provider, AutomationProvider::Gemini);

        let enabled = store.set_background_ai_triage(true).unwrap();
        assert!(enabled.background_ai_triage);
        assert_eq!(enabled.provider, AutomationProvider::Gemini);
        assert!(enabled.updated_at.is_some());

        let reopened = Store::new(store.root()).unwrap();
        let reopened_settings = reopened.automation_settings().unwrap();
        assert!(reopened_settings.background_ai_triage);
        assert_eq!(reopened_settings.provider, AutomationProvider::Gemini);
        assert!(
            !reopened
                .set_background_ai_triage(false)
                .unwrap()
                .background_ai_triage
        );
    }

    #[test]
    fn enabling_background_triage_does_not_consume_the_existing_inbox() {
        let store = temp_store();
        let project = store.create_project("Граница автоматизации").unwrap();
        let now = Utc::now();
        let candidate = TelegramInboxCandidate {
            id: format!("telegram:{}:-100:1", project.id),
            project_id: project.id,
            chat_id: -100,
            chat_title: "Рабочий чат".into(),
            message_id: 1,
            message_ids: vec![1],
            text: "Старое сообщение до включения".into(),
            author: "Автор".into(),
            sender_id: None,
            sender_username: None,
            is_outgoing: false,
            sent_at: now,
            url: None,
            reason: InboxCandidateReason::Mention,
            status: InboxCandidateStatus::Pending,
            media: Vec::new(),
            context: Vec::new(),
            discovered_at: now,
            processed_at: None,
            task_id: None,
            linked_task: None,
        };
        store
            .upsert_telegram_candidates(vec![candidate.clone()])
            .unwrap();

        assert_eq!(store.baseline_pending_automation_events().unwrap(), 1);
        store.upsert_telegram_candidates(vec![candidate]).unwrap();

        let inbox = store.list_telegram_inbox(None, false).unwrap();
        assert_eq!(inbox.len(), 1);
        let events = store.list_automation_events(None, None, None, 10).unwrap();
        assert_eq!(events.events.len(), 1);
        assert_eq!(events.events[0].state, AutomationEventState::Processed);
        assert_eq!(
            events.events[0].outcome,
            Some(AutomationEventOutcome::SkippedWhileOff)
        );
    }

    #[test]
    fn project_auto_run_is_protected_and_preserved_with_global_triage() {
        let store = temp_store();
        let project = store.create_project("Автоматизация").unwrap();
        assert!(
            !store
                .project_automation_policy(&project.id)
                .unwrap()
                .auto_run_created_tasks
        );
        assert!(store.set_project_auto_run(&project.id, true).is_err());

        let configured = store
            .update_project_details(
                &project.id,
                "",
                vec![crate::ProjectResource {
                    id: "workspace".into(),
                    kind: crate::ProjectResourceKind::Directory,
                    label: "Рабочая папка".into(),
                    location: store.root().to_string_lossy().into_owned(),
                    notes: None,
                    agent_access: true,
                }],
                &project.version,
            )
            .unwrap();
        let enabled = store.set_project_auto_run(&project.id, true).unwrap();
        assert!(enabled.auto_run_created_tasks);
        assert_eq!(store.automation_settings().unwrap().projects, vec![enabled]);

        let global = store.set_background_ai_triage(true).unwrap();
        assert!(global.background_ai_triage);
        assert_eq!(global.projects.len(), 1);

        store
            .delete_project(&configured.id, &configured.version)
            .unwrap();
        assert!(store.automation_settings().unwrap().projects.is_empty());
    }

    #[test]
    fn running_agent_runs_are_interrupted_while_queued_work_survives_restart() {
        let store = temp_store();
        let project = store.create_project("Agent run").unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: project.id,
                description: "Проверить сценарий запуска".into(),
                urgency: Urgency::Normal,
                source: None,
            })
            .unwrap();
        let run = store.create_agent_run(&task.id, store.root()).unwrap();
        let queued_task = store
            .create_task(CreateTask {
                project_id: task.project_id.clone(),
                description: "Следующая задача".into(),
                urgency: Urgency::Normal,
                source: None,
            })
            .unwrap();
        let queued = store
            .create_agent_run(&queued_task.id, store.root())
            .unwrap();
        let continued_task = store
            .create_task(CreateTask {
                project_id: task.project_id.clone(),
                description: "Продолженная задача".into(),
                urgency: Urgency::Normal,
                source: None,
            })
            .unwrap();
        let continued = store
            .create_agent_run(&continued_task.id, store.root())
            .unwrap();
        store
            .update_agent_run(
                &continued.id,
                AgentRunPatch {
                    thread_id: Some(Some("thread-1".into())),
                    last_response: Some(Some("Продолжай".into())),
                    ..AgentRunPatch::default()
                },
            )
            .unwrap();
        store
            .update_agent_run(
                &run.id,
                AgentRunPatch {
                    state: Some(AgentRunState::Running),
                    progress: Some(Some("Читаю проект".into())),
                    blocker: Some(Some("Какой вариант выбрать?".into())),
                    last_response: Some(Some("Первый".into())),
                    ..AgentRunPatch::default()
                },
            )
            .unwrap();

        let reopened = Store::new(store.root()).unwrap();
        assert_eq!(reopened.list_task_agent_runs(&task.id).unwrap().len(), 1);
        assert_eq!(reopened.interrupt_nonrecoverable_agent_runs().unwrap(), 1);
        let interrupted = reopened.get_agent_run(&run.id).unwrap();
        assert_eq!(interrupted.state, AgentRunState::Interrupted);
        assert!(interrupted.finished_at.is_some());
        assert_eq!(
            interrupted.blocker.as_deref(),
            Some("Какой вариант выбрать?")
        );
        assert_eq!(interrupted.last_response.as_deref(), Some("Первый"));
        assert_eq!(
            reopened.get_agent_run(&queued.id).unwrap().state,
            AgentRunState::Queued
        );
        assert_eq!(
            reopened.get_agent_run(&continued.id).unwrap().state,
            AgentRunState::Queued
        );
    }

    #[test]
    fn agent_run_request_id_is_retry_safe() {
        let store = temp_store();
        let project = store.create_project("Agent queue").unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: project.id.clone(),
                description: "Первая задача".into(),
                urgency: Urgency::Normal,
                source: None,
            })
            .unwrap();
        let other_task = store
            .create_task(CreateTask {
                project_id: project.id,
                description: "Вторая задача".into(),
                urgency: Urgency::Normal,
                source: None,
            })
            .unwrap();

        let first = store
            .create_agent_run_idempotent(&task.id, store.root(), "agent-queue-request")
            .unwrap();
        assert!(first.created);
        assert_eq!(
            first.value.request_id.as_deref(),
            Some("agent-queue-request")
        );

        let retried = store
            .create_agent_run_idempotent(&task.id, store.root(), "agent-queue-request")
            .unwrap();
        assert!(!retried.created);
        assert_eq!(retried.value.id, first.value.id);

        let error = store
            .create_agent_run_idempotent(&other_task.id, store.root(), "agent-queue-request")
            .unwrap_err();
        assert!(error.to_string().contains("другой задачи"));

        let reopened = Store::new(store.root()).unwrap();
        assert_eq!(
            reopened
                .get_agent_run(&first.value.id)
                .unwrap()
                .request_id
                .as_deref(),
            Some("agent-queue-request")
        );
    }

    #[test]
    fn agent_run_guidance_is_versioned_and_persistent() {
        let store = temp_store();
        let project = store.create_project("Agent guidance").unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: project.id,
                description: "Проверить UI".into(),
                urgency: Urgency::Normal,
                source: None,
            })
            .unwrap();
        let run = store.create_agent_run(&task.id, store.root()).unwrap();
        let guidance = AppliedGuidance {
            reference: GuidanceReference {
                kind: GuidanceKind::Skill,
                id: "ui-skill".into(),
                title: "Реализация UI".into(),
                version: "sha256-version".into(),
            },
            reason: "Совпало с задачей: ui".into(),
        };
        store
            .update_agent_run(
                &run.id,
                AgentRunPatch {
                    guidance: Some(vec![guidance.clone()]),
                    ..AgentRunPatch::default()
                },
            )
            .unwrap();

        let reopened = Store::new(store.root()).unwrap();
        assert_eq!(
            reopened.get_agent_run(&run.id).unwrap().guidance,
            vec![guidance]
        );
    }

    #[test]
    fn accepting_agent_result_completes_task_and_is_retry_safe() {
        let store = temp_store();
        let project = store.create_project("Agent result").unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: project.id,
                description: "Проверить результат".into(),
                urgency: Urgency::Normal,
                source: None,
            })
            .unwrap();
        let run = store.create_agent_run(&task.id, store.root()).unwrap();
        let run = store
            .update_agent_run(
                &run.id,
                AgentRunPatch {
                    state: Some(AgentRunState::ReadyForReview),
                    result: Some(Some("Готово".into())),
                    ..AgentRunPatch::default()
                },
            )
            .unwrap();

        let (accepted, completed) = store.accept_agent_run(&run.id, &task.version).unwrap();
        assert_eq!(accepted.state, AgentRunState::Accepted);
        assert_eq!(completed.status, TaskStatus::Completed);

        let (retried_run, retried_task) = store.accept_agent_run(&run.id, &task.version).unwrap();
        assert_eq!(retried_run.id, accepted.id);
        assert_eq!(retried_task.id, completed.id);
        assert_eq!(retried_task.version, completed.version);
    }

    #[test]
    fn agent_answer_is_queued_once_and_survives_restart() {
        let store = temp_store();
        let project = store.create_project("Agent question").unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: project.id,
                description: "Уточнить вариант".into(),
                urgency: Urgency::Normal,
                source: None,
            })
            .unwrap();
        let run = store.create_agent_run(&task.id, store.root()).unwrap();
        let run = store
            .update_agent_run(
                &run.id,
                AgentRunPatch {
                    state: Some(AgentRunState::NeedsInput),
                    thread_id: Some(Some("thread-question".into())),
                    blocker: Some(Some("Какой вариант использовать?".into())),
                    ..AgentRunPatch::default()
                },
            )
            .unwrap();

        let first = store
            .answer_agent_run_idempotent(&run.id, "Используй первый", "answer-request")
            .unwrap();
        assert!(first.created);
        assert_eq!(first.value.state, AgentRunState::Queued);
        assert_eq!(
            first.value.last_response.as_deref(),
            Some("Используй первый")
        );

        let repeated = store
            .answer_agent_run_idempotent(&run.id, "Используй первый", "answer-request")
            .unwrap();
        assert!(!repeated.created);
        assert_eq!(repeated.value.id, first.value.id);

        let reopened = Store::new(store.root()).unwrap();
        assert_eq!(reopened.interrupt_nonrecoverable_agent_runs().unwrap(), 0);
        assert_eq!(
            reopened.get_agent_run(&run.id).unwrap().state,
            AgentRunState::Queued
        );
    }

    #[test]
    fn activity_journal_is_persistent_paginated_and_bounded() {
        let store = temp_store();
        let project = store.create_project("Журнал").unwrap();
        let first = store
            .record_activity(RecordActivity {
                source: ActivitySource::Mcp,
                action: ActivityAction::ProjectCreated,
                entity_kind: ActivityEntityKind::Project,
                entity_id: Some(project.id.clone()),
                project_id: Some(project.id.clone()),
                reversible: true,
            })
            .unwrap();
        let second = store
            .record_activity(RecordActivity {
                source: ActivitySource::Mcp,
                action: ActivityAction::TelegramSyncRequested,
                entity_kind: ActivityEntityKind::Workspace,
                entity_id: None,
                project_id: None,
                reversible: false,
            })
            .unwrap();
        let third = store
            .record_activity(RecordActivity {
                source: ActivitySource::Mcp,
                action: ActivityAction::TaskCreated,
                entity_kind: ActivityEntityKind::Task,
                entity_id: Some(Ulid::new().to_string()),
                project_id: Some(project.id),
                reversible: true,
            })
            .unwrap();

        let page = store.list_activity(None, 2).unwrap();
        assert_eq!(page.total, 3);
        assert_eq!(page.events.len(), 2);
        assert_eq!(page.remaining, 1);
        let final_page = store.list_activity(page.next_cursor.as_deref(), 2).unwrap();
        assert_eq!(final_page.events.len(), 1);
        assert_eq!(final_page.remaining, 0);
        let returned_ids = page
            .events
            .iter()
            .chain(&final_page.events)
            .map(|event| event.id.as_str())
            .collect::<HashSet<_>>();
        assert_eq!(
            returned_ids,
            HashSet::from([first.id.as_str(), second.id.as_str(), third.id.as_str()])
        );

        let reopened = Store::new(store.root()).unwrap();
        assert_eq!(reopened.list_activity(None, 10).unwrap().total, 3);

        let mut document = ActivityDocument {
            format_version: activity_format_version(),
            events: (0..MAX_ACTIVITY_EVENTS + 5)
                .map(|_| ActivityEvent {
                    id: Ulid::new().to_string(),
                    occurred_at: Utc::now(),
                    source: ActivitySource::Mcp,
                    action: ActivityAction::TaskUpdated,
                    entity_kind: ActivityEntityKind::Task,
                    entity_id: Some(Ulid::new().to_string()),
                    project_id: None,
                    reversible: false,
                    provenance: None,
                })
                .collect(),
        };
        let removed_ids = document.events[..5]
            .iter()
            .map(|event| event.id.clone())
            .collect::<HashSet<_>>();
        compact_activity(&mut document);
        assert_eq!(document.events.len(), MAX_ACTIVITY_EVENTS);
        assert!(
            document
                .events
                .iter()
                .all(|event| !removed_ids.contains(&event.id))
        );
    }

    #[test]
    fn legacy_chat_layout_is_migrated_to_projects() {
        let store = temp_store();
        let root = store.root().to_path_buf();
        let project = store.create_project("Старый проект").unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: project.id.clone(),
                description: "Сохранить задачу".into(),
                urgency: crate::Urgency::Normal,
                source: None,
            })
            .unwrap();
        drop(store);

        let current_root = root.join("projects");
        let legacy_root = root.join("chats");
        fs::rename(&current_root, &legacy_root).unwrap();
        let project_dir = legacy_root.join(&project.id);
        fs::rename(project_dir.join("project.md"), project_dir.join("chat.md")).unwrap();
        let task_path = project_dir.join("tasks").join(format!("{}.md", task.id));
        let content = fs::read_to_string(&task_path)
            .unwrap()
            .replace("project_id:", "chat_id:");
        fs::write(&task_path, content).unwrap();

        let migrated = Store::new(&root).unwrap();
        assert!(!legacy_root.exists());
        assert!(
            root.join("projects")
                .join(&project.id)
                .join("project.md")
                .is_file()
        );
        assert_eq!(migrated.get_task(&task.id).unwrap().project_id, project.id);
        assert!(fs::read_to_string(task_path.with_file_name(format!("{}.md", task.id))).is_err());
        let migrated_task = root
            .join("projects")
            .join(&project.id)
            .join("tasks")
            .join(format!("{}.md", task.id));
        assert!(
            fs::read_to_string(migrated_task)
                .unwrap()
                .contains("project_id:")
        );
    }

    #[test]
    fn full_task_flow_and_conflict_detection() {
        let store = temp_store();
        let project = store.create_project("Рабочий чат").unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: project.id,
                description: "Подготовить отчёт".into(),
                urgency: crate::Urgency::Important,
                source: None,
            })
            .unwrap();
        let updated = store
            .update_task(
                &task.id,
                TaskPatch {
                    description: Some("Подготовить отчёт за август".into()),
                    ..Default::default()
                },
                &task.version,
            )
            .unwrap();
        assert_eq!(updated.description, "Подготовить отчёт за август");
        assert!(matches!(
            store.complete_task(&task.id, &task.version),
            Err(StoreError::Conflict)
        ));
        let completed = store.complete_task(&task.id, &updated.version).unwrap();
        assert_eq!(completed.status, TaskStatus::Completed);
    }

    #[test]
    fn markdown_is_readable_and_external_edits_change_version() {
        let store = temp_store();
        let project = store.create_project("Флудилка").unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: project.id,
                description: "Позвонить заказчику".into(),
                urgency: crate::Urgency::Normal,
                source: None,
            })
            .unwrap();
        let path = store.task_path(&task.project_id, &task.id);
        let original = fs::read_to_string(&path).unwrap();
        assert!(original.contains("Позвонить заказчику"));
        let edited = original.replace("Позвонить", "Написать");
        fs::write(&path, &edited).unwrap();
        let reread = store.get_task(&task.id).unwrap();
        assert_eq!(reread.description, "Написать заказчику");
        assert_ne!(reread.version, task.version);
        assert_eq!(fs::read_to_string(&path).unwrap(), edited);
        assert!(matches!(
            store.complete_task(&task.id, &task.version),
            Err(StoreError::Conflict)
        ));
    }

    #[test]
    fn valid_manual_metadata_edit_is_read_without_hidden_migration() {
        let store = temp_store();
        let project = store.create_project("Ручное редактирование").unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: project.id,
                description: "Проверить Markdown".into(),
                urgency: Urgency::Normal,
                source: None,
            })
            .unwrap();
        let path = store.task_path(&task.project_id, &task.id);
        let original = fs::read_to_string(&path).unwrap();
        let edited = original.replacen("urgency: normal", "urgency: important", 1);
        assert_ne!(edited, original);
        fs::write(&path, &edited).unwrap();

        let reread = store.get_task(&task.id).unwrap();
        assert_eq!(reread.id, task.id);
        assert_eq!(reread.project_id, task.project_id);
        assert_eq!(reread.urgency, Urgency::Important);
        assert_eq!(fs::read_to_string(path).unwrap(), edited);
    }

    #[test]
    fn project_metadata_identity_must_match_project_directory() {
        let store = temp_store();
        let project = store.create_project("Identity проекта").unwrap();
        let path = store.project_path(&project.id);
        let original = fs::read_to_string(&path).unwrap();
        let other_id = Ulid::new().to_string();
        let mismatched = original.replacen(
            &format!("id: {}", project.id),
            &format!("id: {other_id}"),
            1,
        );
        fs::write(&path, mismatched).unwrap();

        assert_invalid_file_contains(
            store.get_project(&project.id).unwrap_err(),
            "не совпадает с каталогом",
        );
    }

    #[test]
    fn task_metadata_identity_must_match_filename_and_project_directory() {
        let store = temp_store();
        let first = store.create_project("Первый проект").unwrap();
        let second = store.create_project("Второй проект").unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: first.id.clone(),
                description: "Identity задачи".into(),
                urgency: Urgency::Normal,
                source: None,
            })
            .unwrap();
        let path = store.task_path(&first.id, &task.id);
        let original = fs::read_to_string(&path).unwrap();
        let other_task_id = Ulid::new().to_string();
        let mismatched_id = original.replacen(
            &format!("id: {}", task.id),
            &format!("id: {other_task_id}"),
            1,
        );
        fs::write(&path, mismatched_id).unwrap();
        assert_invalid_file_contains(
            store.get_task(&task.id).unwrap_err(),
            "не совпадает с именем файла",
        );

        fs::write(&path, &original).unwrap();
        let mismatched_project = original.replacen(
            &format!("project_id: {}", first.id),
            &format!("project_id: {}", second.id),
            1,
        );
        fs::write(&path, mismatched_project).unwrap();
        assert_invalid_file_contains(
            store.get_task(&task.id).unwrap_err(),
            "не совпадает с каталогом проекта",
        );
    }

    #[test]
    fn workspace_metadata_identity_must_match_filename_project_and_kind_directory() {
        let store = temp_store();
        let first = store.create_project("Первый workspace").unwrap();
        let second = store.create_project("Второй workspace").unwrap();
        let item = store
            .create_project_workspace_item_idempotent(
                &first.id,
                ProjectWorkspaceItemKind::Skill,
                "Identity workspace",
                None,
                "Проверить identity.",
                true,
                "workspace-identity-test",
            )
            .unwrap()
            .value;
        let path =
            store.project_workspace_item_path(&first.id, ProjectWorkspaceItemKind::Skill, &item.id);
        let original = fs::read_to_string(&path).unwrap();
        let other_item_id = Ulid::new().to_string();
        let mismatched_id = original.replacen(
            &format!("id: {}", item.id),
            &format!("id: {other_item_id}"),
            1,
        );
        fs::write(&path, mismatched_id).unwrap();
        assert_invalid_file_contains(
            store
                .get_project_workspace_item(&first.id, &item.id)
                .unwrap_err(),
            "не совпадает с именем файла",
        );

        fs::write(&path, &original).unwrap();
        let mismatched_project = original.replacen(
            &format!("project_id: {}", first.id),
            &format!("project_id: {}", second.id),
            1,
        );
        fs::write(&path, mismatched_project).unwrap();
        assert_invalid_file_contains(
            store
                .get_project_workspace_item(&first.id, &item.id)
                .unwrap_err(),
            "не совпадает с каталогом проекта",
        );

        fs::write(&path, &original).unwrap();
        let mismatched_kind = original.replacen("kind: skill", "kind: rule", 1);
        fs::write(&path, mismatched_kind).unwrap();
        assert_invalid_file_contains(
            store
                .get_project_workspace_item(&first.id, &item.id)
                .unwrap_err(),
            "не совпадает с каталогом `skills`",
        );
    }

    #[test]
    fn incompatible_or_malformed_markdown_is_rejected_without_rewriting_the_file() {
        let store = temp_store();
        let project = store.create_project("Ошибки Markdown").unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: project.id,
                description: "Проверить восстановление".into(),
                urgency: Urgency::Normal,
                source: None,
            })
            .unwrap();
        let path = store.task_path(&task.project_id, &task.id);
        let original = fs::read_to_string(&path).unwrap();

        let unsupported = original.replacen("format_version: 1", "format_version: 99", 1);
        fs::write(&path, &unsupported).unwrap();
        assert_invalid_file_contains(
            store.get_task(&task.id).unwrap_err(),
            "восстановите совместимую копию",
        );
        assert_eq!(fs::read_to_string(&path).unwrap(), unsupported);

        let malformed = original.replacen("format_version: 1", "format_version: [", 1);
        fs::write(&path, &malformed).unwrap();
        assert_invalid_file_contains(
            store.get_task(&task.id).unwrap_err(),
            "исправьте YAML вручную",
        );
        assert_eq!(fs::read_to_string(path).unwrap(), malformed);
    }

    #[test]
    fn task_metadata_and_source_round_trip_through_markdown() {
        let store = temp_store();
        let project = store.create_project("Проект из чата").unwrap();
        let renamed = store
            .update_project(&project.id, "Переименованный проект", &project.version)
            .unwrap();
        assert_eq!(renamed.id, project.id);
        assert_eq!(renamed.title, "Переименованный проект");
        let now = Utc::now();
        let source = crate::MessageSnapshot {
            text: "Проверь сборку к вечеру".into(),
            author: Some("Анна".into()),
            sent_at: Some(Utc::now()),
            url: Some("https://example.com/message/42".into()),
            provider: Some("telegram".into()),
            chat_id: Some(-1001234567890),
            chat_title: Some("Команда".into()),
            message_id: Some(42),
            message_ids: vec![42],
            media: Vec::new(),
            context: vec![
                crate::TelegramContextMessage {
                    message_id: 41,
                    message_ids: vec![41],
                    author: "Олег".into(),
                    sender_id: None,
                    sender_username: None,
                    is_outgoing: false,
                    sent_at: now - chrono::Duration::minutes(2),
                    text: "На старой прошивке пустой экран".into(),
                    url: Some("https://example.com/message/41".into()),
                    reply_to_message_id: None,
                    is_target: false,
                    media: Vec::new(),
                },
                crate::TelegramContextMessage {
                    message_id: 42,
                    message_ids: vec![42],
                    author: "Анна".into(),
                    sender_id: None,
                    sender_username: None,
                    is_outgoing: false,
                    sent_at: now,
                    text: "Проверь сборку к вечеру".into(),
                    url: Some("https://example.com/message/42".into()),
                    reply_to_message_id: Some(41),
                    is_target: true,
                    media: Vec::new(),
                },
            ],
        };
        let task = store
            .create_task(CreateTask {
                project_id: project.id,
                description: "# Проверить сборку\n\nПройти основной сценарий".into(),
                urgency: crate::Urgency::Urgent,
                source: Some(source.clone()),
            })
            .unwrap();

        let content = fs::read_to_string(store.task_path(&task.project_id, &task.id)).unwrap();
        assert!(content.contains("created_at:"));
        assert!(content.contains("updated_at:"));
        assert!(content.contains("project_id:"));
        assert!(content.contains("urgency: urgent"));
        assert!(content.contains("status: open"));
        assert!(content.contains("author: Анна"));

        let restored = store.get_task(&task.id).unwrap();
        assert_eq!(restored.source, Some(source));
        assert_eq!(
            restored.description,
            "# Проверить сборку\n\nПройти основной сценарий"
        );

        let cleared = store
            .clear_task_source(&restored.id, &restored.version)
            .unwrap();
        assert!(cleared.source.is_none());
    }

    #[test]
    fn telegram_chat_link_round_trips_through_project_markdown() {
        let store = temp_store();
        let project = store.create_project("Поддержка").unwrap();
        let linked = store
            .set_project_telegram_chats(
                &project.id,
                vec![crate::TelegramProjectLink {
                    chat_id: -1001234567890,
                    title: "Команда поддержки".into(),
                    inbox_mode: crate::TelegramInboxMode::MentionsAndReplies,
                }],
                &project.version,
            )
            .unwrap();
        assert_eq!(linked.telegram_chats[0].chat_id, -1001234567890);
        let content = fs::read_to_string(store.project_path(&project.id)).unwrap();
        assert!(content.contains("telegram_chats:"));
        assert!(content.contains("chat_id: -1001234567890"));

        let unlinked = store
            .set_project_telegram_chats(&linked.id, Vec::new(), &linked.version)
            .unwrap();
        assert!(unlinked.telegram_chats.is_empty());
    }

    #[test]
    fn telegram_inbox_candidate_can_be_imported_once() {
        let store = temp_store();
        let project = store.create_project("Интеграция").unwrap();
        let now = Utc::now();
        let candidate = TelegramInboxCandidate {
            id: "telegram:-100123:77".into(),
            project_id: project.id.clone(),
            chat_id: -100123,
            chat_title: "Рабочий чат".into(),
            message_id: 77,
            message_ids: vec![77],
            text: "@tillwithered подготовь макет".into(),
            author: "Ирина".into(),
            sender_id: None,
            sender_username: None,
            is_outgoing: false,
            sent_at: now,
            url: Some("https://t.me/c/123/77".into()),
            reason: crate::InboxCandidateReason::Mention,
            status: InboxCandidateStatus::Pending,
            media: vec![crate::SourceMedia {
                kind: crate::SourceMediaKind::Document,
                file_name: "brief.pdf".into(),
                provider_file_id: Some(901),
                mime_type: Some("application/pdf".into()),
                size: Some(1024),
                relative_path: None,
            }],
            context: vec![
                crate::TelegramContextMessage {
                    message_id: 76,
                    message_ids: vec![76],
                    author: "Олег".into(),
                    sender_id: None,
                    sender_username: None,
                    is_outgoing: false,
                    sent_at: now - chrono::Duration::minutes(2),
                    text: "На старой прошивке пустой экран".into(),
                    url: Some("https://t.me/c/123/76".into()),
                    reply_to_message_id: None,
                    is_target: false,
                    media: Vec::new(),
                },
                crate::TelegramContextMessage {
                    message_id: 77,
                    message_ids: vec![77],
                    author: "Ирина".into(),
                    sender_id: None,
                    sender_username: None,
                    is_outgoing: false,
                    sent_at: now,
                    text: "@tillwithered подготовь макет".into(),
                    url: Some("https://t.me/c/123/77".into()),
                    reply_to_message_id: Some(76),
                    is_target: true,
                    media: Vec::new(),
                },
            ],
            discovered_at: now,
            processed_at: None,
            task_id: None,
            linked_task: None,
        };
        assert_eq!(
            store
                .upsert_telegram_candidates(vec![candidate.clone()])
                .unwrap(),
            1
        );
        assert_eq!(store.list_telegram_inbox(None, false).unwrap().len(), 1);
        let pending_events = store
            .list_automation_events(
                Some(&project.id),
                Some(AutomationEventState::Pending),
                None,
                10,
            )
            .unwrap();
        assert_eq!(pending_events.total, 1);
        assert_eq!(pending_events.events[0].connector_id, "telegram");
        assert_eq!(pending_events.events[0].source_entity_id, candidate.id);
        let event_id = pending_events.events[0].id.clone();

        assert_eq!(
            store
                .upsert_telegram_candidates(vec![candidate.clone()])
                .unwrap(),
            0
        );
        assert_eq!(
            store
                .list_automation_events(Some(&project.id), None, None, 10)
                .unwrap()
                .total,
            1
        );

        let dismissed = store
            .set_telegram_candidate_status(&candidate.id, InboxCandidateStatus::Dismissed)
            .unwrap();
        assert_eq!(dismissed.status, InboxCandidateStatus::Dismissed);
        assert!(store.list_telegram_inbox(None, false).unwrap().is_empty());
        let event = store.get_automation_event(&event_id).unwrap();
        assert_eq!(event.state, AutomationEventState::Processed);
        assert_eq!(event.outcome, Some(AutomationEventOutcome::NoAction));
        let restored = store
            .set_telegram_candidate_status(&candidate.id, InboxCandidateStatus::Pending)
            .unwrap();
        assert_eq!(restored.status, InboxCandidateStatus::Pending);
        assert!(restored.processed_at.is_none());
        assert_eq!(store.list_telegram_inbox(None, false).unwrap().len(), 1);
        let event = store.get_automation_event(&event_id).unwrap();
        assert_eq!(event.state, AutomationEventState::Pending);
        assert_eq!(event.outcome, None);

        let task = store
            .create_task_from_telegram_candidate(
                &candidate.id,
                Some("Подготовить макет"),
                crate::Urgency::Important,
            )
            .unwrap();
        assert_eq!(task.source.as_ref().unwrap().message_id, Some(77));
        assert_eq!(task.source.as_ref().unwrap().media.len(), 1);
        assert_eq!(task.source.as_ref().unwrap().context.len(), 2);
        assert_eq!(task.source.as_ref().unwrap().context[0].message_id, 76);
        assert!(task.source.as_ref().unwrap().context[1].is_target);
        assert!(store.list_telegram_inbox(None, false).unwrap().is_empty());
        let event = store.get_automation_event(&event_id).unwrap();
        assert_eq!(event.state, AutomationEventState::Processed);
        assert_eq!(
            event.outcome,
            Some(AutomationEventOutcome::TaskCreatedOrLinked)
        );
        assert_eq!(event.related_task_id.as_deref(), Some(task.id.as_str()));

        let repeated = store
            .create_task_from_telegram_candidate(&candidate.id, None, crate::Urgency::Normal)
            .unwrap();
        assert_eq!(repeated.id, task.id);
        assert!(matches!(
            store.set_telegram_candidate_status(&candidate.id, InboxCandidateStatus::Dismissed),
            Err(StoreError::Validation(_))
        ));

        let archive = store.create_project("Архив").unwrap();
        let moved = store
            .move_task(&task.id, &archive.id, &task.version)
            .unwrap();

        let mut same_album = candidate.clone();
        same_album.id = "telegram:album:900".into();
        same_album.message_id = 78;
        same_album.message_ids = vec![77, 78];
        same_album.status = InboxCandidateStatus::Pending;
        same_album.processed_at = None;
        same_album.task_id = None;
        store
            .upsert_telegram_candidates(vec![same_album.clone()])
            .unwrap();
        assert!(store.list_telegram_inbox(None, false).unwrap().is_empty());
        let linked = store
            .get_telegram_candidate(&same_album.id)
            .unwrap()
            .linked_task
            .unwrap();
        assert_eq!(linked.id, task.id);
        assert_eq!(linked.urgency, crate::Urgency::Important);
        assert_eq!(linked.status, crate::TaskStatus::Open);

        let completed = store
            .update_task(
                &task.id,
                TaskPatch {
                    urgency: Some(crate::Urgency::Urgent),
                    status: Some(crate::TaskStatus::Completed),
                    ..Default::default()
                },
                &moved.version,
            )
            .unwrap();
        let linked = store
            .get_telegram_candidate(&same_album.id)
            .unwrap()
            .linked_task
            .unwrap();
        assert_eq!(linked.status, crate::TaskStatus::Completed);
        assert_eq!(linked.urgency, crate::Urgency::Urgent);
        assert_eq!(linked.title, completed.description);
    }

    #[test]
    fn telegram_candidate_updates_an_open_task_without_duplicate_context() {
        let store = temp_store();
        let project = store.create_project("Обновление задачи").unwrap();
        let now = Utc::now();
        let first_message = crate::TelegramContextMessage {
            message_id: 41,
            message_ids: vec![41],
            author: "Дима".into(),
            sender_id: Some("10".into()),
            sender_username: Some("dima".into()),
            is_outgoing: false,
            sent_at: now - chrono::Duration::minutes(5),
            text: "Поправь форму оплаты".into(),
            url: Some("https://t.me/c/100/41".into()),
            reply_to_message_id: None,
            is_target: true,
            media: Vec::new(),
        };
        let original_source = crate::MessageSnapshot {
            provider: Some("telegram".into()),
            chat_id: Some(-100100),
            chat_title: Some("Рабочий чат".into()),
            message_id: Some(41),
            message_ids: vec![41],
            url: Some("https://t.me/c/100/41".into()),
            author: Some("Дима".into()),
            sent_at: Some(first_message.sent_at),
            text: first_message.text.clone(),
            context: vec![first_message.clone()],
            media: Vec::new(),
        };
        let task = store
            .create_task(CreateTask {
                project_id: project.id.clone(),
                description: "Исправить форму оплаты".into(),
                urgency: crate::Urgency::Normal,
                source: Some(original_source),
            })
            .unwrap();
        let follow_up = crate::TelegramContextMessage {
            message_id: 42,
            message_ids: vec![42],
            author: "Дима".into(),
            sender_id: Some("10".into()),
            sender_username: Some("dima".into()),
            is_outgoing: false,
            sent_at: now,
            text: "И обязательно проверь мобильную версию".into(),
            url: Some("https://t.me/c/100/42".into()),
            reply_to_message_id: Some(41),
            is_target: true,
            media: vec![crate::SourceMedia {
                kind: crate::SourceMediaKind::Photo,
                file_name: "mobile.png".into(),
                provider_file_id: Some(902),
                mime_type: Some("image/png".into()),
                size: Some(2048),
                relative_path: None,
            }],
        };
        let candidate = TelegramInboxCandidate {
            id: "telegram:-100100:42".into(),
            project_id: project.id.clone(),
            chat_id: -100100,
            chat_title: "Рабочий чат".into(),
            message_id: 42,
            message_ids: vec![42],
            text: follow_up.text.clone(),
            author: follow_up.author.clone(),
            sender_id: follow_up.sender_id.clone(),
            sender_username: follow_up.sender_username.clone(),
            is_outgoing: false,
            sent_at: now,
            url: follow_up.url.clone(),
            reason: crate::InboxCandidateReason::Reply,
            status: InboxCandidateStatus::Pending,
            media: follow_up.media.clone(),
            context: vec![first_message, follow_up],
            discovered_at: now,
            processed_at: None,
            task_id: None,
            linked_task: None,
        };
        assert_eq!(
            store
                .upsert_telegram_candidates(vec![candidate.clone()])
                .unwrap(),
            1
        );

        let updated = store
            .update_task_from_telegram_candidate(
                &candidate.id,
                &task.id,
                "Проверить мобильную версию формы оплаты.",
                crate::Urgency::Urgent,
            )
            .unwrap();
        assert_eq!(updated.urgency, crate::Urgency::Urgent);
        assert!(updated.description.contains("## Обновление из Telegram"));
        assert!(
            updated
                .description
                .contains("Проверить мобильную версию формы оплаты.")
        );
        let source = updated.source.as_ref().unwrap();
        assert_eq!(source.message_ids, vec![41, 42]);
        assert_eq!(source.context.len(), 2);
        assert_eq!(source.media.len(), 1);
        assert_eq!(source.media[0].provider_file_id, Some(902));
        assert!(source.context.iter().any(|message| message.is_target));

        let repeated = store
            .update_task_from_telegram_candidate(
                &candidate.id,
                &task.id,
                "Эта строка не должна добавиться повторно.",
                crate::Urgency::Normal,
            )
            .unwrap();
        assert_eq!(repeated.version, updated.version);
        assert!(!repeated.description.contains("Эта строка"));
        let imported = store.get_telegram_candidate(&candidate.id).unwrap();
        assert_eq!(imported.status, InboxCandidateStatus::Imported);
        assert_eq!(imported.task_id.as_deref(), Some(task.id.as_str()));
    }

    #[test]
    fn claimed_telegram_event_keeps_its_lease_until_exact_outcome_is_recorded() {
        let store = temp_store();
        let project = store.create_project("Аренда события").unwrap();
        let candidate: TelegramInboxCandidate = serde_json::from_value(serde_json::json!({
            "id": format!("telegram:{}:-100:9", project.id),
            "project_id": project.id,
            "chat_id": -100,
            "chat_title": "Рабочий чат",
            "message_id": 9,
            "text": "Проверить оплату",
            "author": "Дима",
            "sent_at": "2026-09-16T08:00:00Z",
            "reason": "mention",
            "status": "pending",
            "media": [],
            "discovered_at": "2026-09-16T08:00:01Z"
        }))
        .unwrap();
        store
            .upsert_telegram_candidates(vec![candidate.clone()])
            .unwrap();
        let claim = store
            .claim_automation_event_batch(Some(&project.id), 12)
            .unwrap();
        let event = claim.events.first().unwrap();
        let claim_token = claim.claim_token.as_deref().unwrap();

        let task = store
            .create_task_from_telegram_candidate(
                &candidate.id,
                Some("# Проверить оплату"),
                crate::Urgency::Important,
            )
            .unwrap();
        let still_claimed = store.get_automation_event(&event.id).unwrap();
        assert_eq!(still_claimed.state, AutomationEventState::Processing);
        assert_eq!(still_claimed.claim_token.as_deref(), Some(claim_token));
        assert_eq!(still_claimed.outcome, None);

        let resolved = store
            .resolve_automation_event(
                &event.id,
                claim_token,
                AutomationEventOutcome::AgentQueued,
                Some(&task.id),
            )
            .unwrap();
        assert_eq!(resolved.state, AutomationEventState::Processed);
        assert_eq!(resolved.outcome, Some(AutomationEventOutcome::AgentQueued));
        assert_eq!(resolved.related_task_id.as_deref(), Some(task.id.as_str()));
    }

    #[test]
    fn automation_events_are_grouped_claimed_retried_and_resolved_once() {
        let store = temp_store();
        let project = store.create_project("Автоматизация").unwrap();
        let now = Utc::now();
        let events = (0..2)
            .map(|index| AutomationEvent {
                id: Ulid::new().to_string(),
                project_id: project.id.clone(),
                connector_id: "telegram".into(),
                source_entity_id: format!("telegram:-100:{}", index + 1),
                external_id: format!("message:{}", index + 1),
                dedupe_key: format!("telegram:-100:{}", index + 1),
                kind: flood_connectors::ContextSignalKind::Message,
                occurred_at: now + chrono::Duration::seconds(index * 30),
                observed_at: now,
                state: AutomationEventState::Pending,
                attempts: 0,
                processing_started_at: None,
                claim_token: None,
                retry_at: None,
                processed_at: None,
                outcome: None,
                related_task_id: None,
                detail: None,
                error: None,
            })
            .collect::<Vec<_>>();
        store
            .write_automation_events(&AutomationEventsDocument {
                format_version: automation_events_format_version(),
                events,
            })
            .unwrap();

        let claim = store.claim_automation_event_batch(None, 10).unwrap();
        let claim_token = claim.claim_token.clone().unwrap();
        assert_eq!(claim.events.len(), 2);
        assert!(claim.events.iter().all(|event| {
            event.state == AutomationEventState::Processing
                && event.attempts == 1
                && event.claim_token.as_deref() == Some(claim_token.as_str())
        }));
        assert!(
            store
                .claim_automation_event_batch(None, 10)
                .unwrap()
                .events
                .is_empty()
        );
        assert!(matches!(
            store.resolve_automation_event(
                &claim.events[0].id,
                &Ulid::new().to_string(),
                AutomationEventOutcome::NoAction,
                None,
            ),
            Err(StoreError::Conflict)
        ));

        let retry = store
            .fail_automation_event(&claim.events[0].id, &claim_token, "временный лимит", true)
            .unwrap();
        assert_eq!(retry.state, AutomationEventState::Pending);
        assert!(retry.retry_at.is_some());
        let resolved = store
            .resolve_automation_event(
                &claim.events[1].id,
                &claim_token,
                AutomationEventOutcome::NoAction,
                None,
            )
            .unwrap();
        assert_eq!(resolved.state, AutomationEventState::Processed);
        assert!(
            store
                .claim_automation_event_batch(None, 10)
                .unwrap()
                .events
                .is_empty()
        );

        let mut document = store.read_automation_events().unwrap();
        document
            .events
            .iter_mut()
            .find(|event| event.id == retry.id)
            .unwrap()
            .retry_at = Some(Utc::now() - chrono::Duration::seconds(1));
        store.write_automation_events(&document).unwrap();
        let retry_claim = store.claim_automation_event_batch(None, 10).unwrap();
        assert_eq!(retry_claim.events.len(), 1);
        assert_eq!(retry_claim.events[0].attempts, 2);
        let retry_token = retry_claim.claim_token.unwrap();
        let duplicate_task = store
            .create_task(CreateTask {
                project_id: project.id,
                description: "Уже существующая задача".into(),
                urgency: crate::Urgency::Normal,
                source: None,
            })
            .unwrap();
        let finished = store
            .resolve_automation_event(
                &retry.id,
                &retry_token,
                AutomationEventOutcome::Duplicate,
                Some(&duplicate_task.id),
            )
            .unwrap();
        assert_eq!(finished.outcome, Some(AutomationEventOutcome::Duplicate));
        let repeated = store
            .resolve_automation_event(
                &retry.id,
                &retry_token,
                AutomationEventOutcome::Duplicate,
                Some(&duplicate_task.id),
            )
            .unwrap();
        assert_eq!(repeated, finished);

        let exhausted_id = Ulid::new().to_string();
        let stale_id = Ulid::new().to_string();
        let mut document = store.read_automation_events().unwrap();
        document.events.extend([
            AutomationEvent {
                id: exhausted_id.clone(),
                project_id: duplicate_task.project_id.clone(),
                connector_id: "github".into(),
                source_entity_id: "issue:1".into(),
                external_id: "issue:1".into(),
                dedupe_key: "github:issue:1".into(),
                kind: flood_connectors::ContextSignalKind::Issue,
                occurred_at: now,
                observed_at: now,
                state: AutomationEventState::Pending,
                attempts: 2,
                processing_started_at: None,
                claim_token: None,
                retry_at: None,
                processed_at: None,
                outcome: None,
                related_task_id: None,
                detail: None,
                error: None,
            },
            AutomationEvent {
                id: stale_id.clone(),
                project_id: duplicate_task.project_id,
                connector_id: "telegram".into(),
                source_entity_id: "telegram:-100:stale".into(),
                external_id: "message:stale".into(),
                dedupe_key: "telegram:-100:stale".into(),
                kind: flood_connectors::ContextSignalKind::Message,
                occurred_at: now,
                observed_at: now,
                state: AutomationEventState::Processing,
                attempts: 1,
                processing_started_at: Some(
                    now - chrono::Duration::minutes(AUTOMATION_EVENT_LEASE_MINUTES + 1),
                ),
                claim_token: Some(Ulid::new().to_string()),
                retry_at: None,
                processed_at: None,
                outcome: None,
                related_task_id: None,
                detail: None,
                error: None,
            },
        ]);
        store.write_automation_events(&document).unwrap();
        let final_attempt = store.claim_automation_event_batch(None, 10).unwrap();
        assert_eq!(final_attempt.events.len(), 1);
        assert_eq!(final_attempt.events[0].id, exhausted_id);
        assert_eq!(final_attempt.events[0].attempts, 3);
        let exhausted = store
            .fail_automation_event(
                &exhausted_id,
                final_attempt.claim_token.as_deref().unwrap(),
                "лимит всё ещё исчерпан",
                true,
            )
            .unwrap();
        assert_eq!(exhausted.state, AutomationEventState::Failed);
        let stale = store.get_automation_event(&stale_id).unwrap();
        assert_eq!(stale.state, AutomationEventState::Pending);
        assert!(stale.claim_token.is_none());
        assert!(stale.retry_at.is_some());

        assert_eq!(store.retry_failed_automation_events().unwrap(), 1);
        let retried = store.get_automation_event(&exhausted_id).unwrap();
        assert_eq!(retried.state, AutomationEventState::Pending);
        assert_eq!(retried.attempts, 0);
        assert!(retried.error.is_none());
        assert_eq!(store.get_automation_event(&finished.id).unwrap(), finished);
    }

    #[test]
    fn automation_clarification_requeues_the_same_event_with_user_context() {
        let store = temp_store();
        let project = store.create_project("Уточнение").unwrap();
        let now = Utc::now();
        let event_id = Ulid::new().to_string();
        store
            .write_automation_events(&AutomationEventsDocument {
                format_version: automation_events_format_version(),
                events: vec![AutomationEvent {
                    id: event_id.clone(),
                    project_id: project.id,
                    connector_id: "telegram".into(),
                    source_entity_id: "telegram:-100:1".into(),
                    external_id: "message:1".into(),
                    dedupe_key: "telegram:-100:1".into(),
                    kind: flood_connectors::ContextSignalKind::Message,
                    occurred_at: now,
                    observed_at: now,
                    state: AutomationEventState::Pending,
                    attempts: 0,
                    processing_started_at: None,
                    claim_token: None,
                    retry_at: None,
                    processed_at: None,
                    outcome: None,
                    related_task_id: None,
                    detail: None,
                    error: None,
                }],
            })
            .unwrap();
        let claim = store.claim_automation_event_batch(None, 1).unwrap();
        let question = store
            .resolve_automation_event_with_detail(
                &event_id,
                claim.claim_token.as_deref().unwrap(),
                AutomationEventOutcome::NeedsData,
                None,
                Some("К какому экрану относится скриншот?"),
            )
            .unwrap();
        assert_eq!(
            question.detail.as_deref(),
            Some("К какому экрану относится скриншот?")
        );

        let answered = store
            .answer_automation_event(&event_id, "К экрану контекста проекта")
            .unwrap();
        assert_eq!(answered.state, AutomationEventState::Pending);
        assert_eq!(answered.outcome, None);
        assert_eq!(
            answered.detail.as_deref(),
            Some("К экрану контекста проекта")
        );
        assert_eq!(answered.attempts, 0);
    }

    #[test]
    fn telegram_inbox_pages_separate_pending_and_processed_items() {
        let store = temp_store();
        let project = store.create_project("История Telegram").unwrap();
        let now = Utc::now();
        let candidates = (0_i64..3)
            .map(|index| TelegramInboxCandidate {
                id: format!("telegram:{}:-100:{}", project.id, index + 1),
                project_id: project.id.clone(),
                chat_id: -100,
                chat_title: "Рабочий чат".into(),
                message_id: index + 1,
                message_ids: vec![index + 1],
                text: format!("Сообщение {index}"),
                author: "Автор".into(),
                sender_id: None,
                sender_username: None,
                is_outgoing: false,
                sent_at: now - chrono::Duration::minutes(index),
                url: None,
                reason: InboxCandidateReason::Manual,
                status: InboxCandidateStatus::Pending,
                media: Vec::new(),
                context: Vec::new(),
                discovered_at: now,
                processed_at: None,
                task_id: None,
                linked_task: None,
            })
            .collect::<Vec<_>>();
        store
            .upsert_telegram_candidates(candidates.clone())
            .unwrap();
        store
            .set_telegram_candidate_status(&candidates[0].id, InboxCandidateStatus::Dismissed)
            .unwrap();
        store
            .create_task_from_telegram_candidate(&candidates[1].id, None, Urgency::Normal)
            .unwrap();

        let first = store
            .list_telegram_inbox_page(Some(&project.id), true, true, None, 2)
            .unwrap();
        assert_eq!(first.total, 3);
        assert_eq!(first.candidates.len(), 2);
        assert_eq!(first.remaining, 1);
        let second = store
            .list_telegram_inbox_page(
                Some(&project.id),
                true,
                true,
                first.next_cursor.as_deref(),
                2,
            )
            .unwrap();
        assert_eq!(second.candidates.len(), 1);
        assert_eq!(second.remaining, 0);

        let processed = store
            .list_telegram_inbox_page(Some(&project.id), false, true, None, 20)
            .unwrap();
        assert_eq!(processed.total, 2);
        assert!(
            processed
                .candidates
                .iter()
                .all(|candidate| candidate.status != InboxCandidateStatus::Pending)
        );
        assert!(
            processed
                .candidates
                .iter()
                .find(|candidate| candidate.status == InboxCandidateStatus::Imported)
                .and_then(|candidate| candidate.linked_task.as_ref())
                .is_some()
        );
        assert!(matches!(
            store.list_telegram_inbox_page(None, false, false, None, 20),
            Err(StoreError::Validation(_))
        ));
    }

    #[test]
    fn telegram_sync_status_is_shared_and_bounded() {
        let store = temp_store();
        assert!(store.telegram_sync_status().unwrap().is_none());
        let status = TelegramSyncStatus {
            completed_at: Utc::now(),
            request_id: Some(Ulid::new().to_string()),
            health: crate::TelegramSyncHealth::Partial,
            scanned_projects: 2,
            added_candidates: 3,
            downloaded_media: 1,
            failures: 1,
            errors: vec!["Один чат временно недоступен".into()],
        };
        store.record_telegram_sync_status(&status).unwrap();
        assert_eq!(store.telegram_sync_status().unwrap(), Some(status));

        let invalid = TelegramSyncStatus {
            completed_at: Utc::now(),
            request_id: None,
            health: crate::TelegramSyncHealth::Error,
            scanned_projects: 0,
            added_candidates: 0,
            downloaded_media: 0,
            failures: 9,
            errors: (0..9).map(|index| format!("ошибка {index}")).collect(),
        };
        assert!(matches!(
            store.record_telegram_sync_status(&invalid),
            Err(StoreError::Validation(_))
        ));
    }

    #[test]
    fn telegram_connector_status_is_shared_without_credentials() {
        let store = temp_store();
        assert!(store.telegram_connector_status().unwrap().is_none());
        let status = crate::TelegramConnectorStatus {
            observed_at: Utc::now(),
            step: "ready".into(),
            configured: true,
            managed_credentials: true,
            account_name: Some("Олег".into()),
            account_username: Some("tillwithered".into()),
            error: None,
        };
        store.record_telegram_connector_status(&status).unwrap();
        assert_eq!(store.telegram_connector_status().unwrap(), Some(status));

        let invalid = crate::TelegramConnectorStatus {
            observed_at: Utc::now(),
            step: String::new(),
            configured: false,
            managed_credentials: false,
            account_name: None,
            account_username: None,
            error: None,
        };
        assert!(matches!(
            store.record_telegram_connector_status(&invalid),
            Err(StoreError::Validation(_))
        ));
    }

    #[test]
    fn telegram_sync_request_is_durable_and_acknowledged_by_id() {
        let store = temp_store();
        assert!(store.telegram_sync_request().unwrap().is_none());
        let request = store.request_telegram_sync().unwrap();
        assert_eq!(store.request_telegram_sync().unwrap(), request);
        assert_eq!(
            store.telegram_sync_request().unwrap().as_ref(),
            Some(&request)
        );
        assert!(
            !store
                .acknowledge_telegram_sync_request(&Ulid::new().to_string())
                .unwrap()
        );
        assert_eq!(
            store.telegram_sync_request().unwrap().as_ref(),
            Some(&request)
        );
        assert!(
            store
                .acknowledge_telegram_sync_request(&request.id)
                .unwrap()
        );
        assert!(store.telegram_sync_request().unwrap().is_none());
    }

    #[test]
    fn media_only_telegram_candidate_gets_a_readable_task_title() {
        let store = temp_store();
        let project = store.create_project("Медиа").unwrap();
        let now = Utc::now();
        let candidate = TelegramInboxCandidate {
            id: format!("telegram:{}:-100:78", project.id),
            project_id: project.id,
            chat_id: -100,
            chat_title: "Рабочий чат".into(),
            message_id: 78,
            message_ids: vec![78],
            text: String::new(),
            author: "Ирина".into(),
            sender_id: None,
            sender_username: None,
            is_outgoing: false,
            sent_at: now,
            url: None,
            reason: crate::InboxCandidateReason::Manual,
            status: InboxCandidateStatus::Pending,
            media: vec![crate::SourceMedia {
                kind: crate::SourceMediaKind::Photo,
                file_name: "photo-78.jpg".into(),
                provider_file_id: Some(902),
                mime_type: Some("image/jpeg".into()),
                size: Some(2048),
                relative_path: None,
            }],
            context: Vec::new(),
            discovered_at: now,
            processed_at: None,
            task_id: None,
            linked_task: None,
        };
        store
            .upsert_telegram_candidates(vec![candidate.clone()])
            .unwrap();
        let task = store
            .create_task_from_telegram_candidate(&candidate.id, None, crate::Urgency::Normal)
            .unwrap();
        assert_eq!(task.description, "Разобрать медиа из Telegram");
        assert_eq!(task.source.unwrap().media.len(), 1);
    }

    #[test]
    fn task_can_move_to_trash_restore_and_change_project() {
        let store = temp_store();
        let first = store.create_project("Первый чат").unwrap();
        let second = store.create_project("Второй чат").unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: first.id.clone(),
                description: "Перенести задачу".into(),
                urgency: crate::Urgency::Normal,
                source: None,
            })
            .unwrap();

        let moved = store
            .move_task(&task.id, &second.id, &task.version)
            .unwrap();
        assert_eq!(moved.id, task.id);
        assert_eq!(moved.project_id, second.id);
        assert!(!store.task_path(&first.id, &task.id).exists());
        assert!(store.task_path(&second.id, &task.id).exists());

        let trashed = store.trash_task(&moved.id, &moved.version).unwrap();
        assert!(trashed.trashed_at.is_some());
        assert!(store.list_tasks(None, true).unwrap().is_empty());
        assert_eq!(store.list_trashed_tasks().unwrap().len(), 1);

        let restored = store.restore_task(&trashed.id, &trashed.version).unwrap();
        assert!(restored.trashed_at.is_none());
        assert_eq!(store.list_tasks(None, true).unwrap().len(), 1);
        assert!(store.list_trashed_tasks().unwrap().is_empty());
    }

    #[test]
    fn task_relations_are_durable_cycle_safe_and_drive_readiness() {
        let store = temp_store();
        let project = store.create_project("Зависимости").unwrap();
        let blocker = store
            .create_task(CreateTask {
                project_id: project.id.clone(),
                description: "# Подготовить API".into(),
                urgency: crate::Urgency::Important,
                source: None,
            })
            .unwrap();
        let dependent = store
            .create_task(CreateTask {
                project_id: project.id.clone(),
                description: "# Подключить интерфейс".into(),
                urgency: crate::Urgency::Normal,
                source: None,
            })
            .unwrap();

        let linked = store
            .link_tasks(
                &dependent.id,
                &blocker.id,
                crate::TaskRelationKind::BlockedBy,
                &dependent.version,
            )
            .unwrap();
        assert_eq!(linked.relations.len(), 1);
        let repeated = store
            .link_tasks(
                &dependent.id,
                &blocker.id,
                crate::TaskRelationKind::BlockedBy,
                &dependent.version,
            )
            .unwrap();
        assert_eq!(repeated.version, linked.version);

        let readiness = store.task_readiness(&dependent.id).unwrap();
        assert!(!readiness.ready);
        assert_eq!(readiness.blocked_by[0].id, blocker.id);
        assert!(matches!(
            store.link_tasks(
                &blocker.id,
                &dependent.id,
                crate::TaskRelationKind::BlockedBy,
                &blocker.version,
            ),
            Err(StoreError::Validation(_))
        ));

        let reopened = Store::new(store.root()).unwrap();
        assert_eq!(reopened.get_task(&dependent.id).unwrap().relations.len(), 1);
        let blocker = reopened
            .complete_task(&blocker.id, &blocker.version)
            .unwrap();
        assert_eq!(blocker.status, TaskStatus::Completed);
        assert!(reopened.task_readiness(&dependent.id).unwrap().ready);

        let unlinked = reopened
            .unlink_tasks(
                &dependent.id,
                &blocker.id,
                crate::TaskRelationKind::BlockedBy,
                &linked.version,
            )
            .unwrap();
        assert!(unlinked.relations.is_empty());
        let repeated = reopened
            .unlink_tasks(
                &dependent.id,
                &blocker.id,
                crate::TaskRelationKind::BlockedBy,
                &linked.version,
            )
            .unwrap();
        assert_eq!(repeated.version, unlinked.version);
    }

    #[test]
    fn linked_tasks_cannot_move_or_be_permanently_deleted() {
        let store = temp_store();
        let project = store.create_project("Основной").unwrap();
        let other = store.create_project("Другой").unwrap();
        let first = store
            .create_task(CreateTask {
                project_id: project.id.clone(),
                description: "# Первая".into(),
                urgency: crate::Urgency::Normal,
                source: None,
            })
            .unwrap();
        let second = store
            .create_task(CreateTask {
                project_id: project.id,
                description: "# Вторая".into(),
                urgency: crate::Urgency::Normal,
                source: None,
            })
            .unwrap();
        let second = store
            .link_tasks(
                &second.id,
                &first.id,
                crate::TaskRelationKind::Related,
                &second.version,
            )
            .unwrap();
        assert!(matches!(
            store.move_task(&first.id, &other.id, &first.version),
            Err(StoreError::Validation(_))
        ));
        assert!(matches!(
            store.move_task(&second.id, &other.id, &second.version),
            Err(StoreError::Validation(_))
        ));
        let first = store.trash_task(&first.id, &first.version).unwrap();
        assert!(matches!(
            store.delete_trashed_task(&first.id, &first.version),
            Err(StoreError::Validation(_))
        ));
    }

    #[test]
    fn task_checkpoints_are_durable_retry_safe_and_bound_to_agent_runs() {
        let store = temp_store();
        let project = store.create_project("Контрольные точки").unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: project.id,
                description: "# Продолжить работу после перерыва".into(),
                urgency: crate::Urgency::Important,
                source: None,
            })
            .unwrap();
        let draft = crate::TaskCheckpointDraft {
            source: crate::TaskCheckpointSource::Agent,
            summary: "Собран первый рабочий вариант".into(),
            verification: vec!["Проверена сборка".into()],
            remaining: vec!["Проверить сценарий в приложении".into()],
            blocker: None,
            result: Some("dist/report.html".into()),
            agent_run_id: None,
        };

        let first = store
            .append_task_checkpoint_idempotent(
                &task.id,
                draft.clone(),
                &task.version,
                "checkpoint-request",
            )
            .unwrap();
        assert!(first.created);
        assert_eq!(first.value.checkpoints.len(), 1);
        assert_eq!(first.value.checkpoints[0].summary, draft.summary);

        let repeated = store
            .append_task_checkpoint_idempotent(
                &task.id,
                draft.clone(),
                &task.version,
                "checkpoint-request",
            )
            .unwrap();
        assert!(!repeated.created);
        assert_eq!(repeated.value.version, first.value.version);
        assert_eq!(repeated.value.checkpoints.len(), 1);

        let conflicting = store
            .append_task_checkpoint_idempotent(
                &task.id,
                crate::TaskCheckpointDraft {
                    summary: "Другой итог".into(),
                    ..draft
                },
                &first.value.version,
                "checkpoint-request",
            )
            .unwrap_err();
        assert!(conflicting.to_string().contains("другой контрольной точки"));

        let run = store.create_agent_run(&task.id, store.root()).unwrap();
        let agent = store
            .append_agent_checkpoint_idempotent(
                &task.id,
                &run.id,
                crate::TaskCheckpointDraft {
                    source: crate::TaskCheckpointSource::User,
                    summary: "Codex подготовил исправление".into(),
                    verification: vec!["cargo test".into()],
                    remaining: Vec::new(),
                    blocker: None,
                    result: None,
                    agent_run_id: None,
                },
            )
            .unwrap();
        assert!(agent.created);
        assert_eq!(agent.value.checkpoints.len(), 2);
        assert_eq!(
            agent.value.checkpoints[1].source,
            crate::TaskCheckpointSource::Agent
        );
        assert_eq!(
            agent.value.checkpoints[1].agent_run_id.as_deref(),
            Some(run.id.as_str())
        );
        let agent_retry = store
            .append_agent_checkpoint_idempotent(
                &task.id,
                &run.id,
                crate::TaskCheckpointDraft {
                    source: crate::TaskCheckpointSource::Agent,
                    summary: "Codex подготовил исправление".into(),
                    verification: vec!["cargo test".into()],
                    remaining: Vec::new(),
                    blocker: None,
                    result: None,
                    agent_run_id: Some(run.id.clone()),
                },
            )
            .unwrap();
        assert!(!agent_retry.created);
        assert_eq!(agent_retry.value.checkpoints.len(), 2);

        store
            .update_agent_run(
                &run.id,
                AgentRunPatch {
                    state: Some(AgentRunState::NeedsInput),
                    thread_id: Some(Some("thread-checkpoint".into())),
                    blocker: Some(Some("Как продолжить?".into())),
                    ..AgentRunPatch::default()
                },
            )
            .unwrap();
        store
            .answer_agent_run_idempotent(&run.id, "Продолжай", "answer-checkpoint")
            .unwrap();
        let continued = store
            .append_agent_checkpoint_idempotent(
                &task.id,
                &run.id,
                crate::TaskCheckpointDraft {
                    source: crate::TaskCheckpointSource::Agent,
                    summary: "Работа продолжена после ответа".into(),
                    verification: Vec::new(),
                    remaining: Vec::new(),
                    blocker: None,
                    result: Some("Готово".into()),
                    agent_run_id: Some(run.id.clone()),
                },
            )
            .unwrap();
        assert!(continued.created);
        assert_eq!(continued.value.checkpoints.len(), 3);

        let reopened = Store::new(store.root()).unwrap();
        assert_eq!(reopened.get_task(&task.id).unwrap().checkpoints.len(), 3);
    }

    #[test]
    fn trashed_tasks_can_be_deleted_individually_or_together() {
        let store = temp_store();
        let project = store.create_project("Корзина").unwrap();
        let create = |description: &str| {
            store
                .create_task(CreateTask {
                    project_id: project.id.clone(),
                    description: description.into(),
                    urgency: crate::Urgency::Normal,
                    source: None,
                })
                .unwrap()
        };
        let first = create("Первая");
        let second = create("Вторая");
        let first = store.trash_task(&first.id, &first.version).unwrap();
        store.trash_task(&second.id, &second.version).unwrap();

        store
            .delete_trashed_task(&first.id, &first.version)
            .unwrap();
        assert!(matches!(
            store.get_task(&first.id),
            Err(StoreError::NotFound(_))
        ));
        assert_eq!(store.empty_trash().unwrap(), 1);
        assert!(store.list_trashed_tasks().unwrap().is_empty());
    }

    #[test]
    fn project_deletion_checks_version_and_removes_its_tasks() {
        let store = temp_store();
        let project = store.create_project("На удаление").unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: project.id.clone(),
                description: "Задача вместе с чатом".into(),
                urgency: crate::Urgency::Normal,
                source: None,
            })
            .unwrap();

        assert!(matches!(
            store.delete_project(&project.id, "stale"),
            Err(StoreError::Conflict)
        ));
        store.delete_project(&project.id, &project.version).unwrap();
        assert!(matches!(
            store.get_project(&project.id),
            Err(StoreError::NotFound(_))
        ));
        assert!(matches!(
            store.get_task(&task.id),
            Err(StoreError::NotFound(_))
        ));
    }

    #[test]
    fn attachments_follow_a_task_and_are_removed_with_it() {
        let store = temp_store();
        let first = store.create_project("Первый").unwrap();
        let second = store.create_project("Второй").unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: first.id.clone(),
                description: "Задача с файлом".into(),
                urgency: crate::Urgency::Normal,
                source: None,
            })
            .unwrap();
        let relative = store
            .save_task_attachment(&task.id, "макет.png", b"image-bytes")
            .unwrap();
        assert!(
            store
                .resolve_task_attachment(&task.id, &relative)
                .unwrap()
                .is_file()
        );
        assert_eq!(
            store.read_task_attachment(&task.id, &relative).unwrap(),
            b"image-bytes"
        );
        assert!(matches!(
            store.resolve_task_attachment(
                &task.id,
                &format!("attachments/{}/../project.md", task.id)
            ),
            Err(StoreError::Validation(_))
        ));

        let oversized = store.resolve_task_attachment(&task.id, &relative).unwrap();
        OpenOptions::new()
            .write(true)
            .open(&oversized)
            .unwrap()
            .set_len(MAX_ATTACHMENT_BYTES + 1)
            .unwrap();
        assert!(matches!(
            store.read_task_attachment(&task.id, &relative),
            Err(StoreError::Validation(_))
        ));
        std::fs::write(&oversized, b"image-bytes").unwrap();

        let moved = store
            .move_task(&task.id, &second.id, &task.version)
            .unwrap();
        assert!(
            store
                .resolve_task_attachment(&task.id, &relative)
                .unwrap()
                .is_file()
        );
        let trashed = store.trash_task(&moved.id, &moved.version).unwrap();
        store
            .delete_trashed_task(&trashed.id, &trashed.version)
            .unwrap();
        assert!(matches!(
            store.resolve_task_attachment(&task.id, &relative),
            Err(StoreError::NotFound(_))
        ));
    }

    #[test]
    fn attachment_cleanup_removes_only_unreferenced_files() {
        let store = temp_store();
        let project = store.create_project("Вложения").unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: project.id,
                description: "Задача с вложениями".into(),
                urgency: Urgency::Normal,
                source: None,
            })
            .unwrap();
        let markdown_attachment = store
            .save_task_attachment(&task.id, "макет.png", b"markdown-image")
            .unwrap();
        let source_attachment = store
            .save_task_attachment(&task.id, "source.jpg", b"source-image")
            .unwrap();
        let orphaned_attachment = store
            .save_task_attachment(&task.id, "unused.bin", b"unused")
            .unwrap();

        let task = store
            .update_task(
                &task.id,
                TaskPatch {
                    description: Some(format!(
                        "Задача с вложениями\n\n![Макет]({markdown_attachment})"
                    )),
                    source: Some(Some(crate::MessageSnapshot {
                        text: "Исходное сообщение".into(),
                        author: Some("Автор".into()),
                        sent_at: Some(Utc::now()),
                        url: None,
                        provider: Some("telegram".into()),
                        chat_id: Some(42),
                        chat_title: Some("Чат".into()),
                        message_id: Some(7),
                        message_ids: vec![7],
                        media: vec![SourceMedia {
                            kind: SourceMediaKind::Photo,
                            file_name: "source.jpg".into(),
                            provider_file_id: None,
                            mime_type: Some("image/jpeg".into()),
                            size: Some(12),
                            relative_path: Some(source_attachment.clone()),
                        }],
                        context: Vec::new(),
                    })),
                    ..TaskPatch::default()
                },
                &task.version,
            )
            .unwrap();

        let report = store.attachment_cleanup_report().unwrap();
        assert_eq!(report.total_files, 3);
        assert_eq!(report.orphaned_files, 1);
        assert_eq!(report.orphaned_bytes, 6);

        let result = store.cleanup_orphaned_attachments().unwrap();
        assert_eq!(result.removed_files, 1);
        assert_eq!(result.removed_bytes, 6);
        assert!(matches!(
            store.resolve_task_attachment(&task.id, &orphaned_attachment),
            Err(StoreError::NotFound(_))
        ));
        assert_eq!(
            store
                .read_task_attachment(&task.id, &markdown_attachment)
                .unwrap(),
            b"markdown-image"
        );
        assert_eq!(
            store
                .read_task_attachment(&task.id, &source_attachment)
                .unwrap(),
            b"source-image"
        );

        let trashed = store.trash_task(&task.id, &task.version).unwrap();
        let report = store.attachment_cleanup_report().unwrap();
        assert_eq!(report.total_files, 2);
        assert_eq!(report.orphaned_files, 0);
        store
            .delete_trashed_task(&trashed.id, &trashed.version)
            .unwrap();
    }

    #[test]
    fn oversized_local_state_is_rejected_before_loading() {
        let store = temp_store();
        let project = store.create_project("Лимиты").unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: project.id.clone(),
                description: "Проверить ограничение Markdown".into(),
                urgency: Urgency::Normal,
                source: None,
            })
            .unwrap();
        File::options()
            .write(true)
            .open(store.task_path(&project.id, &task.id))
            .unwrap()
            .set_len(MAX_MARKDOWN_FILE_BYTES + 1)
            .unwrap();
        assert!(matches!(
            store.get_task(&task.id),
            Err(StoreError::InvalidFile { .. })
        ));
        let diagnostics = store.diagnostics();
        assert!(!diagnostics.healthy);
        assert!(!diagnostics.issues.is_empty());

        let inbox_path = store.telegram_inbox_path();
        fs::create_dir_all(inbox_path.parent().unwrap()).unwrap();
        File::create(&inbox_path)
            .unwrap()
            .set_len(MAX_TELEGRAM_INBOX_BYTES + 1)
            .unwrap();
        assert!(matches!(
            store.list_telegram_inbox(None, false),
            Err(StoreError::InvalidFile { .. })
        ));
    }

    #[test]
    fn restore_rejects_oversized_entries_before_installing_backup() {
        let store = temp_store();
        assert_eq!(
            restore_entry_size_limit(Path::new(
                "projects/01M23H3GZCFYH03AS42M4ZSZFB/tasks/attachments/01M23H3NY62JB10E9PBXMK9JCP/file.bin"
            )),
            MAX_ATTACHMENT_BYTES
        );
        let archive_path =
            env::temp_dir().join(format!("flood-oversized-backup-test-{}.zip", Ulid::new()));
        let mut archive = ZipWriter::new(File::create(&archive_path).unwrap());
        archive
            .start_file(
                "projects/01M23H3GZCFYH03AS42M4ZSZFB/project.md",
                SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated),
            )
            .unwrap();
        archive
            .write_all(&vec![b'x'; MAX_MARKDOWN_FILE_BYTES as usize + 1])
            .unwrap();
        archive.finish().unwrap();

        let error = store.restore_backup(&archive_path).unwrap_err();
        assert!(
            matches!(error, StoreError::Backup(ref message) if message.contains("превышает безопасный предел"))
        );
        assert!(store.list_projects().unwrap().is_empty());
        let _ = fs::remove_file(archive_path);
    }

    #[test]
    fn backup_restores_markdown_and_attachments() {
        let store = temp_store();
        let project = store.create_project("Резервная копия").unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: project.id.clone(),
                description: "# Исходная задача".into(),
                urgency: crate::Urgency::Important,
                source: None,
            })
            .unwrap();
        let attachment = store
            .save_task_attachment(&task.id, "пример.png", b"backup-image")
            .unwrap();
        let now = Utc::now();
        let candidate = TelegramInboxCandidate {
            id: format!("telegram:{}:-100:88", project.id),
            project_id: project.id,
            chat_id: -100,
            chat_title: "Рабочий чат".into(),
            message_id: 88,
            message_ids: vec![88],
            text: "Сообщение во входящих".into(),
            author: "Анна".into(),
            sender_id: None,
            sender_username: None,
            is_outgoing: false,
            sent_at: now,
            url: None,
            reason: crate::InboxCandidateReason::Manual,
            status: InboxCandidateStatus::Pending,
            media: Vec::new(),
            context: Vec::new(),
            discovered_at: now,
            processed_at: None,
            task_id: None,
            linked_task: None,
        };
        store
            .upsert_telegram_candidates(vec![candidate.clone()])
            .unwrap();
        let backed_up_activity = store
            .record_activity(RecordActivity {
                source: ActivitySource::Mcp,
                action: ActivityAction::TaskCreated,
                entity_kind: ActivityEntityKind::Task,
                entity_id: Some(task.id.clone()),
                project_id: Some(task.project_id.clone()),
                reversible: true,
            })
            .unwrap();
        let transient_sync_request = store.request_telegram_sync().unwrap();
        let archive = env::temp_dir().join(format!("flood-backup-test-{}.zip", Ulid::new()));
        store.create_backup(&archive).unwrap();
        assert!(
            store
                .acknowledge_telegram_sync_request(&transient_sync_request.id)
                .unwrap()
        );

        let changed = store
            .update_task(
                &task.id,
                TaskPatch {
                    description: Some("# Изменённая задача".into()),
                    ..Default::default()
                },
                &task.version,
            )
            .unwrap();
        assert_eq!(changed.description, "# Изменённая задача");
        store
            .set_telegram_candidate_status(&candidate.id, InboxCandidateStatus::Dismissed)
            .unwrap();
        store
            .record_activity(RecordActivity {
                source: ActivitySource::Mcp,
                action: ActivityAction::TaskUpdated,
                entity_kind: ActivityEntityKind::Task,
                entity_id: Some(task.id.clone()),
                project_id: Some(task.project_id.clone()),
                reversible: false,
            })
            .unwrap();

        store.restore_backup(&archive).unwrap();
        assert_eq!(
            store.get_task(&task.id).unwrap().description,
            "# Исходная задача"
        );
        assert_eq!(
            store.read_task_attachment(&task.id, &attachment).unwrap(),
            b"backup-image"
        );
        assert_eq!(store.list_telegram_inbox(None, false).unwrap().len(), 1);
        let restored_activity = store.list_activity(None, 10).unwrap();
        assert_eq!(restored_activity.total, 1);
        assert_eq!(restored_activity.events[0].id, backed_up_activity.id);
        assert!(store.telegram_sync_request().unwrap().is_none());
        let _ = fs::remove_file(archive);
    }

    #[test]
    fn project_context_and_resources_round_trip_and_survive_rename() {
        let store = temp_store();
        let project = store.create_project("Клиент").unwrap();
        let context =
            "## Репозиторий\n\n`C:/work/client`\n\n## Макеты\n\nhttps://figma.com/file/example";
        let updated = store
            .update_project_details(
                &project.id,
                context,
                vec![
                    crate::ProjectResource {
                        id: "main-repository".into(),
                        kind: crate::ProjectResourceKind::Repository,
                        label: "Основной репозиторий".into(),
                        location: " C:/work/client ".into(),
                        notes: Some(" Рабочая копия для разработки ".into()),
                        agent_access: true,
                    },
                    crate::ProjectResource {
                        id: "product-layouts".into(),
                        kind: crate::ProjectResourceKind::Figma,
                        label: "Макеты".into(),
                        location: "https://figma.com/file/example".into(),
                        notes: None,
                        agent_access: false,
                    },
                ],
                &project.version,
            )
            .unwrap();
        assert_eq!(updated.context, context);
        assert_eq!(updated.resources.len(), 2);
        assert_eq!(updated.resources[0].location, "C:/work/client");
        assert_eq!(
            updated.resources[0].notes.as_deref(),
            Some("Рабочая копия для разработки")
        );
        let renamed = store
            .update_project(&updated.id, "Клиентское приложение", &updated.version)
            .unwrap();
        assert_eq!(renamed.context, context);
        assert_eq!(renamed.resources, updated.resources);
        let markdown = fs::read_to_string(store.project_path(&renamed.id)).unwrap();
        assert!(markdown.contains("# Клиентское приложение"));
        assert!(markdown.contains("## Репозиторий"));
        assert!(markdown.contains("resources:"));
        assert!(markdown.contains("kind: repository"));
        assert!(markdown.contains("kind: figma"));
        assert!(markdown.contains("agent_access: true"));
        assert!(
            store
                .set_project_resources(
                    &renamed.id,
                    vec![crate::ProjectResource {
                        id: "Bad ID".into(),
                        kind: crate::ProjectResourceKind::Other,
                        label: "Некорректный".into(),
                        location: "value".into(),
                        notes: None,
                        agent_access: false,
                    }],
                    &renamed.version,
                )
                .is_err()
        );
    }

    #[test]
    fn project_workspace_items_are_markdown_versioned_and_retry_safe() {
        let store = temp_store();
        let project = store.create_project("Рабочая среда").unwrap();
        let created = store
            .create_project_workspace_item_idempotent(
                &project.id,
                crate::ProjectWorkspaceItemKind::Skill,
                "Проверка интерфейса",
                Some("Когда менять продуктовый UI"),
                "## Порядок\n\nСначала открыть реальное окно.",
                true,
                "workspace-skill-create",
            )
            .unwrap();
        assert!(created.created);
        let retry = store
            .create_project_workspace_item_idempotent(
                &project.id,
                crate::ProjectWorkspaceItemKind::Skill,
                "Проверка интерфейса",
                Some("Когда менять продуктовый UI"),
                "## Порядок\n\nСначала открыть реальное окно.",
                true,
                "workspace-skill-create",
            )
            .unwrap();
        assert!(!retry.created);
        assert_eq!(retry.value.id, created.value.id);

        let updated = store
            .update_project_workspace_item(
                &project.id,
                &created.value.id,
                "Проверка интерфейса",
                Some("Проверенный рабочий порядок"),
                "## Порядок\n\nСначала открыть реальное окно, затем проверить обе темы.",
                true,
                &created.value.version,
            )
            .unwrap();
        assert_eq!(updated.id, created.value.id);
        assert_eq!(updated.revisions.len(), 1);
        assert!(
            updated
                .revisions
                .first()
                .unwrap()
                .content
                .contains("реальное окно")
        );
        assert!(
            store
                .update_project_workspace_item(
                    &project.id,
                    &updated.id,
                    &updated.title,
                    updated.summary.as_deref(),
                    "конфликт",
                    true,
                    &created.value.version,
                )
                .is_err()
        );

        let markdown = fs::read_to_string(store.project_workspace_item_path(
            &project.id,
            crate::ProjectWorkspaceItemKind::Skill,
            &updated.id,
        ))
        .unwrap();
        assert!(markdown.contains("kind: skill"));
        assert!(markdown.contains("# Проверка интерфейса"));
        let reopened = Store::new(store.root()).unwrap();
        let items = reopened
            .list_project_workspace_items(&project.id, Some(crate::ProjectWorkspaceItemKind::Skill))
            .unwrap();
        assert_eq!(items, vec![updated]);
    }

    #[test]
    fn project_workspace_item_rollback_is_versioned_and_reversible() {
        let store = temp_store();
        let project = store.create_project("Rollback workspace").unwrap();
        let created = store
            .create_project_workspace_item_idempotent(
                &project.id,
                crate::ProjectWorkspaceItemKind::Document,
                "Версия 1",
                None,
                "Первое содержимое",
                true,
                "rollback-workspace-create",
            )
            .unwrap()
            .value;
        let updated = store
            .update_project_workspace_item(
                &project.id,
                &created.id,
                "Версия 2",
                Some("Изменено"),
                "Второе содержимое",
                false,
                &created.version,
            )
            .unwrap();

        let rolled_back = store
            .rollback_project_workspace_item(&project.id, &updated.id, 0, &updated.version)
            .unwrap();
        assert_eq!(rolled_back.title, "Версия 1");
        assert_eq!(rolled_back.content, "Первое содержимое");
        assert!(rolled_back.agent_access);
        assert_eq!(rolled_back.revisions.len(), 2);
        assert_eq!(rolled_back.revisions[1].title, "Версия 2");
        assert_ne!(rolled_back.version, updated.version);

        assert!(matches!(
            store.rollback_project_workspace_item(&project.id, &updated.id, 0, &updated.version),
            Err(StoreError::Conflict)
        ));
        let restored_forward = store
            .rollback_project_workspace_item(&project.id, &updated.id, 1, &rolled_back.version)
            .unwrap();
        assert_eq!(restored_forward.title, "Версия 2");
        assert_eq!(restored_forward.content, "Второе содержимое");
    }

    #[test]
    fn project_memory_is_bounded_deduplicated_and_persistent() {
        let store = temp_store();
        let project = store.create_project("Память").unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: project.id.clone(),
                description: "Проверить тему".into(),
                urgency: Urgency::Normal,
                source: None,
            })
            .unwrap();
        let added = store
            .append_project_memory(
                &project.id,
                Some(&task.id),
                vec![
                    "Использовать системные токены цвета".into(),
                    "Использовать системные токены цвета".into(),
                ],
            )
            .unwrap();
        assert_eq!(added.len(), 1);
        assert_eq!(added[0].source_task_id.as_deref(), Some(task.id.as_str()));
        assert!(
            store
                .append_project_memory(
                    &project.id,
                    Some(&task.id),
                    vec!["использовать системные токены цвета".into()],
                )
                .unwrap()
                .is_empty()
        );
        let reopened = Store::new(store.root()).unwrap();
        let memory = reopened.get_project(&project.id).unwrap().memory;
        assert_eq!(memory.len(), 1);
        assert_eq!(memory[0].text, "Использовать системные токены цвета");
    }

    #[test]
    fn project_memory_supports_edit_pin_supersede_and_delete() {
        let store = temp_store();
        let project = store.create_project("Жизненный цикл памяти").unwrap();
        let created = store
            .add_project_memory_idempotent(
                &project.id,
                "Использовать старую сетку",
                None,
                false,
                &project.version,
                "memory-create",
            )
            .unwrap();
        assert!(created.created);
        let retry = store
            .add_project_memory_idempotent(
                &project.id,
                "Использовать старую сетку",
                None,
                false,
                "stale-version-is-ignored-for-exact-retry",
                "memory-create",
            )
            .unwrap();
        assert!(!retry.created);
        let memory_id = retry.value.memory[0].id.clone();

        let edited = store
            .update_project_memory(
                &project.id,
                &memory_id,
                "Использовать сетку 720 px",
                true,
                &retry.value.version,
            )
            .unwrap();
        let entry = edited
            .memory
            .iter()
            .find(|entry| entry.id == memory_id)
            .unwrap();
        assert!(entry.pinned);
        assert_eq!(entry.revisions.len(), 1);
        assert_eq!(entry.revisions[0].text, "Использовать старую сетку");

        let replaced = store
            .supersede_project_memory_idempotent(
                &project.id,
                &memory_id,
                "Основная рабочая колонка — 720 px",
                true,
                &edited.version,
                "memory-replace",
            )
            .unwrap();
        assert!(replaced.created);
        let old = replaced
            .value
            .memory
            .iter()
            .find(|entry| entry.id == memory_id)
            .unwrap();
        assert_eq!(old.state, crate::ProjectMemoryState::Superseded);
        let replacement_id = old.superseded_by.clone().unwrap();
        let replacement = replaced
            .value
            .memory
            .iter()
            .find(|entry| entry.id == replacement_id)
            .unwrap();
        assert_eq!(replacement.text, "Основная рабочая колонка — 720 px");
        assert!(replacement.pinned);

        let deleted = store
            .delete_project_memory(&project.id, &memory_id, &replaced.value.version)
            .unwrap();
        assert_eq!(deleted.memory.len(), 1);
        assert_eq!(deleted.memory[0].id, replacement_id);
    }

    #[test]
    fn project_memory_rollback_keeps_current_value_as_revision() {
        let store = temp_store();
        let project = store.create_project("Rollback памяти").unwrap();
        let created = store
            .add_project_memory_idempotent(
                &project.id,
                "Первая версия",
                None,
                false,
                &project.version,
                "rollback-memory-create",
            )
            .unwrap()
            .value;
        let memory_id = created.memory[0].id.clone();
        let updated = store
            .update_project_memory(
                &project.id,
                &memory_id,
                "Вторая версия",
                false,
                &created.version,
            )
            .unwrap();

        let rolled_back = store
            .rollback_project_memory(&project.id, &memory_id, 0, &updated.version)
            .unwrap();
        let entry = rolled_back
            .memory
            .iter()
            .find(|entry| entry.id == memory_id)
            .unwrap();
        assert_eq!(entry.text, "Первая версия");
        assert_eq!(entry.revisions.len(), 2);
        assert_eq!(entry.revisions[1].text, "Вторая версия");
        assert!(matches!(
            store.rollback_project_memory(&project.id, &memory_id, 0, &updated.version),
            Err(StoreError::Conflict)
        ));
    }

    #[test]
    fn telegram_chat_snapshot_supports_human_style_paging() {
        let store = temp_store();
        let now = Utc::now();
        let messages = (1..=30)
            .map(|message_id| crate::TelegramContextMessage {
                message_id,
                message_ids: vec![message_id],
                author: "Команда".into(),
                sender_id: None,
                sender_username: None,
                is_outgoing: false,
                sent_at: now + chrono::Duration::seconds(message_id),
                text: format!("Сообщение {message_id}"),
                url: None,
                reply_to_message_id: (message_id == 25).then_some(2),
                is_target: false,
                media: Vec::new(),
            })
            .collect();
        store
            .upsert_telegram_chat_snapshot(TelegramChatSnapshot {
                chat_id: -10042,
                title: "Рабочий чат".into(),
                synced_at: now,
                messages,
            })
            .unwrap();

        let latest = store.read_telegram_chat(-10042, None, None, 10).unwrap();
        assert_eq!(latest.messages.first().unwrap().message_id, 21);
        assert_eq!(latest.messages.last().unwrap().message_id, 30);
        assert!(latest.has_older);
        assert!(!latest.has_newer);

        let older = store.read_telegram_chat(-10042, Some(21), None, 5).unwrap();
        assert_eq!(older.messages.first().unwrap().message_id, 16);
        assert_eq!(older.messages.last().unwrap().message_id, 20);
        assert!(older.has_older);
        assert!(older.has_newer);

        let newer = store
            .read_telegram_chat(-10042, None, Some(27), 10)
            .unwrap();
        assert_eq!(newer.messages.len(), 3);
        assert_eq!(newer.messages[0].message_id, 28);
        assert!(!newer.has_newer);

        let context = store
            .read_telegram_message_context(-10042, 25, 3, 3)
            .unwrap();
        assert_eq!(context.returned_before, 3);
        assert_eq!(context.returned_after, 3);
        assert!(context.reply_parent_added);
        assert_eq!(context.messages.len(), 8);
        assert_eq!(context.messages[context.target_index].message_id, 25);
        assert!(context.messages[context.target_index].is_target);
        assert_eq!(context.messages[0].message_id, 2);
        assert!(context.has_older);
        assert!(context.has_newer);

        let initial_updates = store.read_telegram_updates(-10042, 5).unwrap();
        assert!(initial_updates.initial_window);
        assert!(initial_updates.initial_window_truncated);
        assert_eq!(initial_updates.messages[0].message_id, 26);
        assert_eq!(initial_updates.messages[4].message_id, 30);
        assert_eq!(initial_updates.remaining, 0);

        let checkpoint = store.acknowledge_telegram_updates(-10042, 28).unwrap();
        assert_eq!(checkpoint.last_read_message_id, 28);
        let first_unread = store.read_telegram_updates(-10042, 1).unwrap();
        assert!(!first_unread.initial_window);
        assert_eq!(first_unread.messages[0].message_id, 29);
        assert_eq!(first_unread.remaining, 1);

        store.acknowledge_telegram_updates(-10042, 29).unwrap();
        let reopened = Store::new(store.root().to_path_buf()).unwrap();
        let next_unread = reopened.read_telegram_updates(-10042, 10).unwrap();
        assert_eq!(next_unread.messages.len(), 1);
        assert_eq!(next_unread.messages[0].message_id, 30);
        assert!(store.acknowledge_telegram_updates(-10042, 28).is_err());
    }

    #[test]
    fn telegram_image_request_is_idempotent_and_readable_when_prepared() {
        let store = temp_store();
        let project = store.create_project("Медиа агента").unwrap();
        let now = Utc::now();
        let candidate = TelegramInboxCandidate {
            id: format!("telegram:{}:-10042:77", project.id),
            project_id: project.id,
            chat_id: -10042,
            chat_title: "Рабочий чат".into(),
            message_id: 77,
            message_ids: vec![77],
            text: "Посмотри скриншот".into(),
            author: "Анна".into(),
            sender_id: None,
            sender_username: None,
            is_outgoing: false,
            sent_at: now,
            url: None,
            reason: InboxCandidateReason::Mention,
            status: InboxCandidateStatus::Pending,
            media: vec![SourceMedia {
                kind: SourceMediaKind::Photo,
                file_name: "screen.jpg".into(),
                provider_file_id: Some(77),
                mime_type: Some("image/jpeg".into()),
                size: Some(4),
                relative_path: None,
            }],
            context: Vec::new(),
            discovered_at: now,
            processed_at: None,
            task_id: None,
            linked_task: None,
        };
        store
            .upsert_telegram_candidates(vec![candidate.clone()])
            .unwrap();
        let request = store
            .request_telegram_media(-10042, 77, 0, Some(&candidate.id))
            .unwrap();
        let repeated = store
            .request_telegram_media(-10042, 77, 0, Some(&candidate.id))
            .unwrap();
        assert_eq!(request.id, repeated.id);
        assert_eq!(request.state, TelegramMediaRequestState::Queued);
        assert_eq!(store.pending_telegram_media_requests(3).unwrap().len(), 1);
        assert_eq!(
            store
                .telegram_media_request_source(&request.id)
                .unwrap()
                .provider_file_id,
            Some(77)
        );
        store
            .fail_telegram_media_request(&request.id, "временная ошибка")
            .unwrap();
        let retried = store
            .request_telegram_media(-10042, 77, 0, Some(&candidate.id))
            .unwrap();
        assert_eq!(retried.id, request.id);
        assert_eq!(retried.state, TelegramMediaRequestState::Queued);

        let ready = store
            .complete_telegram_media_request(&request.id, b"jpeg")
            .unwrap();
        assert_eq!(ready.state, TelegramMediaRequestState::Ready);
        assert_eq!(
            store.read_telegram_media_request(&request.id).unwrap(),
            b"jpeg"
        );
        assert!(store.pending_telegram_media_requests(3).unwrap().is_empty());
    }

    #[test]
    fn telegram_discussion_becomes_one_task_with_context_and_media() {
        let store = temp_store();
        let project = store.create_project("Интерфейс").unwrap();
        let project = store
            .set_project_telegram_chats(
                &project.id,
                vec![TelegramProjectLink {
                    chat_id: -10055,
                    title: "Рабочий чат".into(),
                    inbox_mode: crate::TelegramInboxMode::Manual,
                }],
                &project.version,
            )
            .unwrap();
        let now = Utc::now();
        let photo = |id: i32, name: &str| SourceMedia {
            kind: SourceMediaKind::Photo,
            file_name: name.into(),
            provider_file_id: Some(id),
            mime_type: Some("image/jpeg".into()),
            size: Some(4),
            relative_path: None,
        };
        store
            .upsert_telegram_chat_snapshot(TelegramChatSnapshot {
                chat_id: -10055,
                title: "Рабочий чат".into(),
                synced_at: now,
                messages: vec![
                    TelegramContextMessage {
                        message_id: 1,
                        message_ids: vec![1],
                        author: "Анна".into(),
                        sender_id: Some("user:1".into()),
                        sender_username: Some("anna".into()),
                        is_outgoing: false,
                        sent_at: now,
                        text: "Мне не нравится это поле".into(),
                        url: Some("https://t.me/c/55/1".into()),
                        reply_to_message_id: None,
                        is_target: false,
                        media: vec![photo(101, "before.jpg")],
                    },
                    TelegramContextMessage {
                        message_id: 2,
                        message_ids: vec![2],
                        author: "Олег".into(),
                        sender_id: Some("user:2".into()),
                        sender_username: Some("oleg".into()),
                        is_outgoing: true,
                        sent_at: now + chrono::Duration::seconds(1),
                        text: "Сделаем его компактнее".into(),
                        url: Some("https://t.me/c/55/2".into()),
                        reply_to_message_id: Some(1),
                        is_target: false,
                        media: Vec::new(),
                    },
                    TelegramContextMessage {
                        message_id: 3,
                        message_ids: vec![3],
                        author: "Анна".into(),
                        sender_id: Some("user:1".into()),
                        sender_username: Some("anna".into()),
                        is_outgoing: false,
                        sent_at: now + chrono::Duration::seconds(2),
                        text: "@tillwithered поправь поле сегодня".into(),
                        url: Some("https://t.me/c/55/3".into()),
                        reply_to_message_id: Some(2),
                        is_target: false,
                        media: vec![photo(103, "reference.jpg")],
                    },
                ],
            })
            .unwrap();
        let candidate = TelegramInboxCandidate {
            id: format!("telegram:{}:-10055:3", project.id),
            project_id: project.id.clone(),
            chat_id: -10055,
            chat_title: "Рабочий чат".into(),
            message_id: 3,
            message_ids: vec![3],
            text: "@tillwithered поправь поле сегодня".into(),
            author: "Анна".into(),
            sender_id: Some("user:1".into()),
            sender_username: Some("anna".into()),
            is_outgoing: false,
            sent_at: now + chrono::Duration::seconds(2),
            url: Some("https://t.me/c/55/3".into()),
            reason: InboxCandidateReason::Mention,
            status: InboxCandidateStatus::Pending,
            media: vec![photo(103, "reference.jpg")],
            context: Vec::new(),
            discovered_at: now,
            processed_at: None,
            task_id: None,
            linked_task: None,
        };
        store
            .upsert_telegram_candidates(vec![candidate.clone()])
            .unwrap();

        let created = store
            .create_task_from_telegram_messages_idempotent(
                CreateTelegramDiscussionTask {
                    project_id: project.id.clone(),
                    chat_id: -10055,
                    target_message_id: 3,
                    context_message_ids: vec![1, 2],
                    description: "Исправить поле\n\nСделать компактнее по обсуждению.".into(),
                    urgency: Urgency::Important,
                },
                "telegram-discussion-request",
            )
            .unwrap();
        assert!(created.created);
        let source = created.value.source.as_ref().unwrap();
        assert_eq!(source.message_id, Some(3));
        assert_eq!(source.message_ids, vec![1, 2, 3]);
        assert_eq!(source.context.len(), 3);
        assert_eq!(source.context[2].reply_to_message_id, Some(2));
        assert!(source.context[2].is_target);
        assert_eq!(source.media.len(), 2);
        assert_eq!(source.media[0].provider_file_id, Some(101));
        assert_eq!(source.media[1].provider_file_id, Some(103));
        let imported_candidate = store.get_telegram_candidate(&candidate.id).unwrap();
        assert_eq!(imported_candidate.status, InboxCandidateStatus::Imported);
        assert_eq!(
            imported_candidate.task_id.as_deref(),
            Some(created.value.id.as_str())
        );
        let refined = store
            .update_task(
                &created.value.id,
                TaskPatch {
                    description: Some("Исправить поле по уточнённому решению".into()),
                    ..TaskPatch::default()
                },
                &created.value.version,
            )
            .unwrap();

        let repeated = store
            .create_task_from_telegram_messages_idempotent(
                CreateTelegramDiscussionTask {
                    project_id: project.id.clone(),
                    chat_id: -10055,
                    target_message_id: 3,
                    context_message_ids: vec![1, 2],
                    description: "Исправить поле\n\nСделать компактнее по обсуждению.".into(),
                    urgency: Urgency::Important,
                },
                "telegram-discussion-request",
            )
            .unwrap();
        assert!(!repeated.created);
        assert_eq!(repeated.value.id, created.value.id);
        assert_eq!(repeated.value.description, refined.description);

        let same_source = store
            .create_task_from_telegram_messages_idempotent(
                CreateTelegramDiscussionTask {
                    project_id: project.id,
                    chat_id: -10055,
                    target_message_id: 3,
                    context_message_ids: vec![1, 2],
                    description: "Другой заголовок".into(),
                    urgency: Urgency::Urgent,
                },
                "another-discussion-request",
            )
            .unwrap();
        assert!(!same_source.created);
        assert_eq!(same_source.value.id, created.value.id);
    }

    #[test]
    fn telegram_participants_keep_stable_identity_and_project_roles() {
        let store = temp_store();
        let project = store.create_project("Команда").unwrap();
        let project = store
            .set_project_telegram_chats(
                &project.id,
                vec![TelegramProjectLink {
                    chat_id: -10077,
                    title: "Рабочий чат".into(),
                    inbox_mode: crate::TelegramInboxMode::MentionsAndReplies,
                }],
                &project.version,
            )
            .unwrap();
        let now = Utc::now();
        store
            .upsert_telegram_chat_snapshot(TelegramChatSnapshot {
                chat_id: -10077,
                title: "Рабочий чат".into(),
                synced_at: now,
                messages: vec![
                    TelegramContextMessage {
                        message_id: 1,
                        message_ids: vec![1],
                        author: "Алекс".into(),
                        sender_id: Some("user:10".into()),
                        sender_username: Some("alex_ceo".into()),
                        is_outgoing: false,
                        sent_at: now,
                        text: "Поправь экран".into(),
                        url: None,
                        reply_to_message_id: None,
                        is_target: false,
                        media: Vec::new(),
                    },
                    TelegramContextMessage {
                        message_id: 2,
                        message_ids: vec![2],
                        author: "Алекс".into(),
                        sender_id: Some("user:20".into()),
                        sender_username: Some("alex_owner".into()),
                        is_outgoing: true,
                        sent_at: now + chrono::Duration::seconds(1),
                        text: "Понял".into(),
                        url: None,
                        reply_to_message_id: Some(1),
                        is_target: false,
                        media: Vec::new(),
                    },
                ],
            })
            .unwrap();
        let project = store
            .set_project_telegram_participants(
                &project.id,
                vec![crate::TelegramParticipantRole {
                    sender_id: "user:10".into(),
                    display_name: "Алекс".into(),
                    username: Some("@alex_ceo".into()),
                    role: "CEO".into(),
                    source: crate::TelegramParticipantRoleSource::Manual,
                }],
                &project.version,
            )
            .unwrap();

        let people = store
            .list_project_telegram_participants(&project.id)
            .unwrap();
        assert_eq!(people.len(), 2);
        assert_eq!(people[0].sender_id, "user:20");
        assert!(people[0].is_current_user);
        let ceo = people
            .iter()
            .find(|person| person.sender_id == "user:10")
            .unwrap();
        assert_eq!(ceo.role.as_deref(), Some("CEO"));
        assert_eq!(ceo.username.as_deref(), Some("alex_ceo"));
        assert_eq!(
            store
                .get_project(&project.id)
                .unwrap()
                .telegram_participants,
            project.telegram_participants
        );
    }

    #[test]
    fn task_batch_creates_updates_and_links_as_one_idempotent_plan() {
        let store = temp_store();
        let project = store.create_project("Пакет").unwrap();
        let existing = store
            .create_task(CreateTask {
                project_id: project.id.clone(),
                description: "# Исходная задача".into(),
                urgency: Urgency::Normal,
                source: None,
            })
            .unwrap();
        let operations = vec![
            TaskBatchOperation::Create {
                operation_id: "new-subtask".into(),
                project_id: project.id.clone(),
                description: "# Новая подзадача".into(),
                urgency: Urgency::Important,
                source: None,
            },
            TaskBatchOperation::Update {
                operation_id: "raise-priority".into(),
                task: TaskBatchReference {
                    task_id: Some(existing.id.clone()),
                    operation_id: None,
                },
                patch: TaskPatch {
                    urgency: Some(Urgency::Urgent),
                    ..TaskPatch::default()
                },
            },
            TaskBatchOperation::Link {
                operation_id: "attach-subtask".into(),
                task: TaskBatchReference {
                    task_id: None,
                    operation_id: Some("new-subtask".into()),
                },
                target: TaskBatchReference {
                    task_id: Some(existing.id.clone()),
                    operation_id: None,
                },
                relation: crate::TaskRelationKind::SubtaskOf,
            },
        ];
        let versions = vec![crate::ExpectedTaskVersion {
            task_id: existing.id.clone(),
            version: existing.version.clone(),
        }];

        let first = store
            .apply_task_batch(operations.clone(), versions.clone(), "batch-request-1")
            .unwrap();
        assert!(!first.repeated);
        assert_eq!(first.operations.len(), 3);
        assert_eq!(first.tasks.len(), 2);
        let new_id = first.operations[0].task_id.clone();
        assert_eq!(
            store.get_task(&existing.id).unwrap().urgency,
            Urgency::Urgent
        );
        assert_eq!(
            store.get_task(&new_id).unwrap().relations,
            vec![crate::TaskRelation {
                task_id: existing.id.clone(),
                kind: crate::TaskRelationKind::SubtaskOf,
            }]
        );

        let repeated = store
            .apply_task_batch(operations, versions, "batch-request-1")
            .unwrap();
        assert!(repeated.repeated);
        assert_eq!(repeated.operations, first.operations);
        assert_eq!(store.list_tasks(Some(&project.id), false).unwrap().len(), 2);
    }

    #[test]
    fn task_batch_preview_is_read_only_and_rejects_stale_versions() {
        let store = temp_store();
        let project = store.create_project("Preview пакета").unwrap();
        let existing = store
            .create_task(CreateTask {
                project_id: project.id,
                description: "# Исходная задача".into(),
                urgency: Urgency::Normal,
                source: None,
            })
            .unwrap();
        let operations = vec![TaskBatchOperation::Update {
            operation_id: "raise-priority".into(),
            task: TaskBatchReference {
                task_id: Some(existing.id.clone()),
                operation_id: None,
            },
            patch: TaskPatch {
                urgency: Some(Urgency::Urgent),
                ..TaskPatch::default()
            },
        }];
        let versions = vec![crate::ExpectedTaskVersion {
            task_id: existing.id.clone(),
            version: existing.version.clone(),
        }];
        let request_id = "batch-preview-read-only";

        let first = store
            .preview_task_batch(operations.clone(), versions.clone(), request_id)
            .unwrap();
        let second = store
            .preview_task_batch(operations.clone(), versions.clone(), request_id)
            .unwrap();
        assert!(!first.repeated);
        assert!(!second.repeated);
        assert_eq!(first.operations, second.operations);
        assert_eq!(first.tasks[0].urgency, Urgency::Urgent);
        assert_eq!(
            store.get_task(&existing.id).unwrap().urgency,
            Urgency::Normal
        );
        assert!(!store.task_batch_receipt_path(request_id).exists());

        store
            .update_task(
                &existing.id,
                TaskPatch {
                    description: Some("# Изменено отдельно".into()),
                    ..TaskPatch::default()
                },
                &existing.version,
            )
            .unwrap();
        assert!(matches!(
            store.preview_task_batch(operations, versions, request_id),
            Err(StoreError::Conflict)
        ));
        assert!(!store.task_batch_receipt_path(request_id).exists());
    }

    #[test]
    fn invalid_task_batch_leaves_no_partial_tasks() {
        let store = temp_store();
        let project = store.create_project("Цикл").unwrap();
        let reference = |operation_id: &str| TaskBatchReference {
            task_id: None,
            operation_id: Some(operation_id.into()),
        };
        let operations = vec![
            TaskBatchOperation::Create {
                operation_id: "first".into(),
                project_id: project.id.clone(),
                description: "# Первая".into(),
                urgency: Urgency::Normal,
                source: None,
            },
            TaskBatchOperation::Create {
                operation_id: "second".into(),
                project_id: project.id.clone(),
                description: "# Вторая".into(),
                urgency: Urgency::Normal,
                source: None,
            },
            TaskBatchOperation::Link {
                operation_id: "first-second".into(),
                task: reference("first"),
                target: reference("second"),
                relation: crate::TaskRelationKind::BlockedBy,
            },
            TaskBatchOperation::Link {
                operation_id: "second-first".into(),
                task: reference("second"),
                target: reference("first"),
                relation: crate::TaskRelationKind::BlockedBy,
            },
        ];

        let error = store
            .apply_task_batch(operations, Vec::new(), "batch-cycle")
            .unwrap_err();
        assert!(error.to_string().contains("цикл"));
        assert!(
            store
                .list_tasks(Some(&project.id), false)
                .unwrap()
                .is_empty()
        );
        assert!(!store.task_batch_receipt_path("batch-cycle").exists());
    }

    #[test]
    fn pending_task_batch_is_recovered_when_store_reopens() {
        let store = temp_store();
        let project = store.create_project("Восстановление").unwrap();
        let outcome = store
            .apply_task_batch(
                vec![TaskBatchOperation::Create {
                    operation_id: "created".into(),
                    project_id: project.id.clone(),
                    description: "# Восстановить".into(),
                    urgency: Urgency::Normal,
                    source: None,
                }],
                Vec::new(),
                "batch-recovery",
            )
            .unwrap();
        let task = outcome.tasks[0].clone();
        fs::remove_file(store.task_path(&task.project_id, &task.id)).unwrap();
        let receipt_path = store.task_batch_receipt_path("batch-recovery");
        let mut receipt = store.read_task_batch_receipt(&receipt_path).unwrap();
        receipt.applied = false;
        receipt.task_ids.clear();
        receipt.tasks = vec![task.clone()];
        store
            .write_task_batch_receipt(&receipt_path, &receipt)
            .unwrap();

        let reopened = Store::new(store.root()).unwrap();
        assert_eq!(
            reopened.get_task(&task.id).unwrap().description,
            "# Восстановить"
        );
        assert!(
            reopened
                .read_task_batch_receipt(&receipt_path)
                .unwrap()
                .applied
        );
    }

    #[test]
    fn pending_task_batch_recovers_from_every_task_write_boundary() {
        for written_count in 0..=2 {
            let store = temp_store();
            let project = store.create_project("Границы восстановления").unwrap();
            let request_id = format!("batch-boundary-{written_count}");
            let outcome = store
                .apply_task_batch(
                    vec![
                        TaskBatchOperation::Create {
                            operation_id: "first".into(),
                            project_id: project.id.clone(),
                            description: "# Первая".into(),
                            urgency: Urgency::Normal,
                            source: None,
                        },
                        TaskBatchOperation::Create {
                            operation_id: "second".into(),
                            project_id: project.id.clone(),
                            description: "# Вторая".into(),
                            urgency: Urgency::Important,
                            source: None,
                        },
                    ],
                    Vec::new(),
                    &request_id,
                )
                .unwrap();
            let targets = outcome.tasks.clone();
            let receipt_path = store.task_batch_receipt_path(&request_id);
            let mut receipt = store.read_task_batch_receipt(&receipt_path).unwrap();
            receipt.applied = false;
            receipt.task_ids.clear();
            receipt.tasks = targets.clone();
            store
                .write_task_batch_receipt(&receipt_path, &receipt)
                .unwrap();

            for task in targets.iter().skip(written_count) {
                fs::remove_file(store.task_path(&task.project_id, &task.id)).unwrap();
            }

            let reopened = Store::new(store.root()).unwrap();
            for target in &targets {
                let recovered = reopened.get_task(&target.id).unwrap();
                assert_eq!(recovered.description, target.description);
                assert_eq!(recovered.urgency, target.urgency);
            }
            let finalized = reopened.read_task_batch_receipt(&receipt_path).unwrap();
            assert!(finalized.applied);
            assert!(finalized.tasks.is_empty());
            assert_eq!(finalized.task_ids.len(), 2);

            let reopened_again = Store::new(store.root()).unwrap();
            assert_eq!(
                reopened_again
                    .list_tasks(Some(&project.id), false)
                    .unwrap()
                    .len(),
                2
            );
        }
    }

    #[test]
    fn knowledge_proposal_survives_restart_rejects_stale_base_and_retries_apply() {
        let store = temp_store();
        let project = store.create_project("Knowledge proposals").unwrap();
        let item = store
            .create_project_workspace_item_idempotent(
                &project.id,
                ProjectWorkspaceItemKind::Rule,
                "Правило",
                None,
                "Старая версия",
                true,
                "knowledge-proposal-rule",
            )
            .unwrap()
            .value;
        let stale = store
            .create_project_knowledge_proposal(
                &project.id,
                ProjectKnowledgeProposalTarget::WorkspaceItem {
                    item_id: item.id.clone(),
                    item_kind: item.kind,
                },
                &item.version,
                ProjectKnowledgeProposalPayload::WorkspaceItem {
                    title: item.title.clone(),
                    summary: item.summary.clone(),
                    content: "Предлагаемая версия".into(),
                    agent_access: item.agent_access,
                },
                "Обновить правило",
                "Новая проверенная договорённость",
                vec!["issue-29".into()],
                None,
            )
            .unwrap();

        let reopened = Store::new(store.root()).unwrap();
        assert_eq!(
            reopened
                .get_project_knowledge_proposal(&project.id, &stale.id)
                .unwrap(),
            stale
        );
        let concurrent = reopened
            .update_project_workspace_item(
                &project.id,
                &item.id,
                &item.title,
                item.summary.as_deref(),
                "Параллельная версия",
                item.agent_access,
                &item.version,
            )
            .unwrap();
        assert!(matches!(
            reopened.apply_project_knowledge_proposal(&project.id, &stale.id),
            Err(StoreError::Conflict)
        ));

        let proposal = reopened
            .create_project_knowledge_proposal(
                &project.id,
                ProjectKnowledgeProposalTarget::WorkspaceItem {
                    item_id: concurrent.id.clone(),
                    item_kind: concurrent.kind,
                },
                &concurrent.version,
                ProjectKnowledgeProposalPayload::WorkspaceItem {
                    title: concurrent.title.clone(),
                    summary: concurrent.summary.clone(),
                    content: "Итоговая версия".into(),
                    agent_access: concurrent.agent_access,
                },
                "Применить итог",
                "Ревью завершено",
                Vec::new(),
                None,
            )
            .unwrap();
        let applied = reopened
            .apply_project_knowledge_proposal(&project.id, &proposal.id)
            .unwrap();
        assert_eq!(applied.state, ProjectKnowledgeProposalState::Applied);
        let repeated = reopened
            .apply_project_knowledge_proposal(&project.id, &proposal.id)
            .unwrap();
        assert_eq!(repeated, applied);
        assert_eq!(
            reopened
                .get_project_workspace_item(&project.id, &item.id)
                .unwrap()
                .content,
            "Итоговая версия"
        );
    }

    #[test]
    fn rejected_knowledge_proposal_is_persistent_and_idempotent() {
        let store = temp_store();
        let project = store.create_project("Rejected proposal").unwrap();
        let item = store
            .create_project_workspace_item_idempotent(
                &project.id,
                ProjectWorkspaceItemKind::Document,
                "Документ",
                None,
                "Текущий текст",
                true,
                "knowledge-proposal-document",
            )
            .unwrap()
            .value;
        let proposal = store
            .create_project_knowledge_proposal(
                &project.id,
                ProjectKnowledgeProposalTarget::WorkspaceItem {
                    item_id: item.id.clone(),
                    item_kind: item.kind,
                },
                &item.version,
                ProjectKnowledgeProposalPayload::WorkspaceItem {
                    title: item.title.clone(),
                    summary: item.summary.clone(),
                    content: "Отклонённый текст".into(),
                    agent_access: item.agent_access,
                },
                "Изменить документ",
                "Предложение агента",
                Vec::new(),
                None,
            )
            .unwrap();
        let rejected = store
            .reject_project_knowledge_proposal(&project.id, &proposal.id, Some("Не подходит"), None)
            .unwrap();
        assert_eq!(rejected.state, ProjectKnowledgeProposalState::Rejected);
        assert_eq!(rejected.decision_reason.as_deref(), Some("Не подходит"));
        assert_eq!(
            store
                .reject_project_knowledge_proposal(
                    &project.id,
                    &proposal.id,
                    Some("Другая причина"),
                    None
                )
                .unwrap(),
            rejected
        );
        assert!(
            store
                .apply_project_knowledge_proposal(&project.id, &proposal.id)
                .is_err()
        );

        let reopened = Store::new(store.root()).unwrap();
        assert_eq!(
            reopened
                .get_project_knowledge_proposal(&project.id, &proposal.id)
                .unwrap(),
            rejected
        );
        assert_eq!(
            reopened
                .get_project_workspace_item(&project.id, &item.id)
                .unwrap()
                .content,
            "Текущий текст"
        );
    }
}
