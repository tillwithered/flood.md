use chrono::{DateTime, Utc};
use flood_connectors::{
    CONNECTOR_CONTRACT_VERSION, ContextAssetKind, ContextAssetReference, ContextSignal,
    ContextSignalKind, ExternalActor, TELEGRAM_CONNECTOR_ID,
};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

fn bool_is_false(value: &bool) -> bool {
    !*value
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct Project {
    pub id: String,
    pub title: String,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub context: String,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub resources: Vec<ProjectResource>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub memory: Vec<ProjectMemoryEntry>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub telegram_chats: Vec<TelegramProjectLink>,
    /// Короткие роли участников Telegram внутри этого проекта. Это подсказки
    /// для человека и агента, а не отдельная база сотрудников.
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub telegram_participants: Vec<TelegramParticipantRole>,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct ProjectMemoryEntry {
    pub id: String,
    pub text: String,
    pub created_at: DateTime<Utc>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_task_id: Option<String>,
    #[serde(default, skip_serializing_if = "bool_is_false")]
    pub pinned: bool,
    #[serde(default, skip_serializing_if = "ProjectMemoryState::is_active")]
    pub state: ProjectMemoryState,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub superseded_by: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub revisions: Vec<ProjectMemoryRevision>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct ProjectMemoryRevision {
    pub text: String,
    pub changed_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ProjectMemoryState {
    #[default]
    Active,
    Superseded,
}

impl ProjectMemoryState {
    pub fn is_active(&self) -> bool {
        *self == Self::Active
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ProjectResourceKind {
    Repository,
    Directory,
    /// Явно подключённый локальный SKILL.md. flood.md хранит только ссылку,
    /// ничего не устанавливает и не обновляет скрытно.
    Skill,
    Figma,
    Documentation,
    Website,
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct ProjectResource {
    pub id: String,
    pub kind: ProjectResourceKind,
    pub label: String,
    /// Локальный путь или публичный адрес. Секреты и токены здесь хранить нельзя.
    pub location: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    /// Пользователь явно разрешил подключённому агенту читать этот источник.
    #[serde(default)]
    pub agent_access: bool,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum ProjectWorkspaceItemKind {
    Document,
    Rule,
    Skill,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct ProjectWorkspaceRevision {
    pub title: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub summary: Option<String>,
    pub content: String,
    #[serde(default)]
    pub agent_access: bool,
    pub changed_at: DateTime<Utc>,
}

/// Project-owned context that is readable by people and agents through the same
/// versioned Markdown contract. External skill folders remain ProjectResource
/// references; these items are owned and updated by flood.md itself.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct ProjectWorkspaceItem {
    pub id: String,
    pub project_id: String,
    pub kind: ProjectWorkspaceItemKind,
    pub title: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub summary: Option<String>,
    pub content: String,
    #[serde(default)]
    pub agent_access: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub revisions: Vec<ProjectWorkspaceRevision>,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct TelegramProjectLink {
    pub chat_id: i64,
    pub title: String,
    #[serde(default)]
    pub inbox_mode: TelegramInboxMode,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TelegramParticipantRoleSource {
    Manual,
    Agent,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct TelegramParticipantRole {
    /// Стабильный локальный ключ вида `user:123` или `chat:-100123`.
    pub sender_id: String,
    pub display_name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,
    /// Свободная короткая роль: например, `CEO` или `Backend + DevOps`.
    pub role: String,
    pub source: TelegramParticipantRoleSource,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct TelegramParticipant {
    pub sender_id: String,
    pub display_name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,
    #[serde(default)]
    pub is_current_user: bool,
    #[serde(default)]
    pub message_count: usize,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub role: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub role_source: Option<TelegramParticipantRoleSource>,
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
pub struct TelegramContextMessage {
    pub message_id: i64,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub message_ids: Vec<i64>,
    pub author: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sender_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sender_username: Option<String>,
    /// True для сообщений владельца подключённого Telegram-аккаунта.
    #[serde(default)]
    pub is_outgoing: bool,
    pub sent_at: DateTime<Utc>,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub text: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reply_to_message_id: Option<i64>,
    #[serde(default)]
    pub is_target: bool,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub media: Vec<SourceMedia>,
}

impl TelegramContextMessage {
    pub fn context_signal(&self, chat_id: i64) -> ContextSignal {
        let mut attributes = std::collections::BTreeMap::new();
        if self.message_ids.len() > 1 {
            attributes.insert("album_size".into(), self.message_ids.len().to_string());
        }
        ContextSignal {
            contract_version: CONNECTOR_CONTRACT_VERSION,
            connector_id: TELEGRAM_CONNECTOR_ID.into(),
            source_id: format!("chat:{chat_id}"),
            external_id: format!("message:{}", self.message_id),
            kind: ContextSignalKind::Message,
            occurred_at: self.sent_at,
            actor: self.sender_id.as_ref().map(|sender_id| ExternalActor {
                actor_id: sender_id.clone(),
                display_name: self.author.clone(),
                username: self.sender_username.clone(),
                is_current_user: self.is_outgoing,
            }),
            text: self.text.clone(),
            reply_to_external_id: self
                .reply_to_message_id
                .map(|message_id| format!("message:{message_id}")),
            assets: self
                .media
                .iter()
                .enumerate()
                .map(|(index, media)| ContextAssetReference {
                    asset_id: format!("message:{}:media:{index}", self.message_id),
                    kind: match &media.kind {
                        SourceMediaKind::Photo => ContextAssetKind::Image,
                        SourceMediaKind::Video | SourceMediaKind::Animation => {
                            ContextAssetKind::Video
                        }
                        SourceMediaKind::Audio | SourceMediaKind::Voice => ContextAssetKind::Audio,
                        SourceMediaKind::Document => ContextAssetKind::Document,
                        SourceMediaKind::Other => ContextAssetKind::Other,
                    },
                    file_name: media.file_name.clone(),
                    mime_type: media.mime_type.clone(),
                    size: media.size,
                })
                .collect(),
            url: self.url.clone(),
            attributes,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct TelegramChatSnapshot {
    pub chat_id: i64,
    pub title: String,
    pub synced_at: DateTime<Utc>,
    #[serde(default)]
    pub messages: Vec<TelegramContextMessage>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct TelegramAgentCheckpoint {
    pub chat_id: i64,
    pub last_read_message_id: i64,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TelegramMediaRequestState {
    Queued,
    Ready,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct TelegramMediaRequest {
    pub id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub candidate_id: Option<String>,
    pub chat_id: i64,
    pub message_id: i64,
    pub media_index: usize,
    pub file_name: String,
    pub mime_type: String,
    pub requested_at: DateTime<Utc>,
    pub state: TelegramMediaRequestState,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub completed_at: Option<DateTime<Utc>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub relative_path: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
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

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum TaskRelationKind {
    Related,
    SubtaskOf,
    BlockedBy,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct TaskRelation {
    pub task_id: String,
    pub kind: TaskRelationKind,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TaskCheckpointSource {
    User,
    Agent,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct TaskCheckpoint {
    pub id: String,
    pub created_at: DateTime<Utc>,
    pub source: TaskCheckpointSource,
    pub summary: String,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub verification: Vec<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub remaining: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub blocker: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub result: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub agent_run_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct TaskCheckpointDraft {
    pub source: TaskCheckpointSource,
    pub summary: String,
    #[serde(default)]
    pub verification: Vec<String>,
    #[serde(default)]
    pub remaining: Vec<String>,
    #[serde(default)]
    pub blocker: Option<String>,
    #[serde(default)]
    pub result: Option<String>,
    #[serde(default)]
    pub agent_run_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AgentRunState {
    Queued,
    Running,
    ReadyForReview,
    Accepted,
    NeedsInput,
    Failed,
    Cancelled,
    Interrupted,
}

impl AgentRunState {
    pub fn is_active(&self) -> bool {
        matches!(self, Self::Queued | Self::Running)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum GuidanceKind {
    Rule,
    Skill,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct GuidanceReference {
    pub kind: GuidanceKind,
    pub id: String,
    pub title: String,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct AppliedGuidance {
    #[serde(flatten)]
    pub reference: GuidanceReference,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct AgentRun {
    pub id: String,
    pub task_id: String,
    pub project_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub request_id: Option<String>,
    pub provider: String,
    pub state: AgentRunState,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub started_at: Option<DateTime<Utc>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub finished_at: Option<DateTime<Utc>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub thread_id: Option<String>,
    pub working_directory: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub progress: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub result: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub memory: Vec<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub guidance: Vec<AppliedGuidance>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub blocker: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_response: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_response_request_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, Default)]
pub struct AgentRunPatch {
    pub state: Option<AgentRunState>,
    pub started_at: Option<Option<DateTime<Utc>>>,
    pub finished_at: Option<Option<DateTime<Utc>>>,
    pub thread_id: Option<Option<String>>,
    pub progress: Option<Option<String>>,
    pub result: Option<Option<String>>,
    pub memory: Option<Vec<String>>,
    pub guidance: Option<Vec<AppliedGuidance>>,
    pub blocker: Option<Option<String>>,
    pub last_response: Option<Option<String>>,
    pub last_response_request_id: Option<Option<String>>,
    pub error: Option<Option<String>>,
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
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub context: Vec<TelegramContextMessage>,
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

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AutomationEventState {
    Pending,
    Processing,
    Processed,
    Failed,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AutomationEventOutcome {
    TaskCreatedOrLinked,
    TaskUpdated,
    Duplicate,
    NoAction,
    NeedsData,
    AgentQueued,
    SkippedWhileOff,
}

/// Сохраняемая ссылка на событие интеграции. Полный текст и медиа остаются в
/// хранилище коннектора и подгружаются только когда событие действительно
/// обрабатывается.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct AutomationEvent {
    pub id: String,
    pub project_id: String,
    pub connector_id: String,
    pub source_entity_id: String,
    pub external_id: String,
    pub dedupe_key: String,
    pub kind: ContextSignalKind,
    pub occurred_at: DateTime<Utc>,
    pub observed_at: DateTime<Utc>,
    pub state: AutomationEventState,
    #[serde(default)]
    pub attempts: u8,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub processing_started_at: Option<DateTime<Utc>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub claim_token: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub retry_at: Option<DateTime<Utc>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub processed_at: Option<DateTime<Utc>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub outcome: Option<AutomationEventOutcome>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub related_task_id: Option<String>,
    /// Короткий итог обработки, например конкретный вопрос пользователю.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Protected application preference. It lives outside project Markdown so an
/// agent cannot grant itself permission to send connector context to AI or
/// modify a project's working files.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct ProjectAutomationPolicy {
    pub project_id: String,
    #[serde(default)]
    pub auto_run_created_tasks: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,
}

impl ProjectAutomationPolicy {
    pub fn disabled(project_id: impl Into<String>) -> Self {
        Self {
            project_id: project_id.into(),
            auto_run_created_tasks: false,
            updated_at: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct AutomationSettings {
    #[serde(default)]
    pub background_ai_triage: bool,
    /// Локальный агент, которому пользователь явно разрешил разбирать новые
    /// сигналы. `Auto` выбирает первый доступный CLI и не переключается на
    /// облачный API или другой платный способ незаметно.
    #[serde(default)]
    pub provider: AutomationProvider,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub projects: Vec<ProjectAutomationPolicy>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,
}

impl Default for AutomationSettings {
    fn default() -> Self {
        Self {
            background_ai_triage: false,
            provider: AutomationProvider::Auto,
            projects: Vec::new(),
            updated_at: None,
        }
    }
}

#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AutomationProvider {
    #[default]
    Auto,
    Codex,
    Claude,
    Gemini,
}

impl AutomationProvider {
    pub fn id(self) -> &'static str {
        match self {
            Self::Auto => "auto",
            Self::Codex => "codex",
            Self::Claude => "claude",
            Self::Gemini => "gemini",
        }
    }
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
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub request_id: Option<String>,
    pub health: TelegramSyncHealth,
    pub scanned_projects: usize,
    pub added_candidates: usize,
    pub downloaded_media: usize,
    pub failures: usize,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct TelegramSyncRequest {
    pub id: String,
    pub requested_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct TelegramConnectorStatus {
    pub observed_at: DateTime<Utc>,
    pub step: String,
    pub configured: bool,
    pub managed_credentials: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub account_name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub account_username: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ActivitySource {
    Mcp,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ActivityEntityKind {
    Workspace,
    Project,
    Task,
    TelegramCandidate,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ActivityAction {
    ProjectCreated,
    ProjectUpdated,
    ProjectDeleted,
    TaskCreated,
    TaskUpdated,
    TaskCompleted,
    TaskMoved,
    TaskTrashed,
    TaskRestored,
    TaskDeleted,
    TrashEmptied,
    TelegramTaskCreated,
    TelegramCandidateDismissed,
    TelegramCandidateRestored,
    TelegramSyncRequested,
    MutationApplied,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct ActivityGuidanceRef {
    pub kind: GuidanceKind,
    pub id: String,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct ActivityOperationResult {
    pub operation_id: String,
    pub kind: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub target_id: Option<String>,
    pub changed: bool,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ActivityApplyResult {
    Applied,
    NoChanges,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ActivityRecoveryAvailability {
    Available,
    BestEffort,
    Unavailable,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct ActivityProvenance {
    pub initiator: crate::MutationInitiator,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub run_id: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub guidance: Vec<ActivityGuidanceRef>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub sources: Vec<crate::MutationSourceRef>,
    pub approved_plan_id: String,
    pub approved_plan_digest: String,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub operations: Vec<ActivityOperationResult>,
    pub result: ActivityApplyResult,
    pub recovery: ActivityRecoveryAvailability,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct ActivityEvent {
    pub id: String,
    pub occurred_at: DateTime<Utc>,
    pub source: ActivitySource,
    pub action: ActivityAction,
    pub entity_kind: ActivityEntityKind,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub entity_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub project_id: Option<String>,
    pub reversible: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub provenance: Option<ActivityProvenance>,
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
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sender_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sender_username: Option<String>,
    #[serde(default)]
    pub is_outgoing: bool,
    pub sent_at: DateTime<Utc>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    pub reason: InboxCandidateReason,
    pub status: InboxCandidateStatus,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub media: Vec<SourceMedia>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub context: Vec<TelegramContextMessage>,
    pub discovered_at: DateTime<Utc>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub processed_at: Option<DateTime<Utc>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub task_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub linked_task: Option<TelegramLinkedTask>,
}

impl TelegramInboxCandidate {
    pub fn context_signal(&self) -> ContextSignal {
        let mut attributes = std::collections::BTreeMap::new();
        attributes.insert(
            "reason".into(),
            match &self.reason {
                InboxCandidateReason::Manual => "manual",
                InboxCandidateReason::Mention => "mention",
                InboxCandidateReason::Reply => "reply",
                InboxCandidateReason::LinkedChat => "linked_chat",
            }
            .into(),
        );
        if self.message_ids.len() > 1 {
            attributes.insert("album_size".into(), self.message_ids.len().to_string());
        }
        ContextSignal {
            contract_version: CONNECTOR_CONTRACT_VERSION,
            connector_id: TELEGRAM_CONNECTOR_ID.into(),
            source_id: format!("chat:{}", self.chat_id),
            external_id: format!("message:{}", self.message_id),
            kind: ContextSignalKind::Message,
            occurred_at: self.sent_at,
            actor: self.sender_id.as_ref().map(|sender_id| ExternalActor {
                actor_id: sender_id.clone(),
                display_name: self.author.clone(),
                username: self.sender_username.clone(),
                is_current_user: self.is_outgoing,
            }),
            text: self.text.clone(),
            reply_to_external_id: self
                .context
                .iter()
                .find(|message| message.is_target)
                .and_then(|message| message.reply_to_message_id)
                .map(|message_id| format!("message:{message_id}")),
            assets: self
                .media
                .iter()
                .enumerate()
                .map(|(index, media)| ContextAssetReference {
                    asset_id: format!("message:{}:media:{index}", self.message_id),
                    kind: match &media.kind {
                        SourceMediaKind::Photo => ContextAssetKind::Image,
                        SourceMediaKind::Video | SourceMediaKind::Animation => {
                            ContextAssetKind::Video
                        }
                        SourceMediaKind::Audio | SourceMediaKind::Voice => ContextAssetKind::Audio,
                        SourceMediaKind::Document => ContextAssetKind::Document,
                        SourceMediaKind::Other => ContextAssetKind::Other,
                    },
                    file_name: media.file_name.clone(),
                    mime_type: media.mime_type.clone(),
                    size: media.size,
                })
                .collect(),
            url: self.url.clone(),
            attributes,
        }
    }

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
            context: self.context.clone(),
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
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub relations: Vec<TaskRelation>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub checkpoints: Vec<TaskCheckpoint>,
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
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub relations: Vec<TaskRelation>,
    #[serde(default, skip_serializing_if = "is_zero")]
    pub checkpoint_count: usize,
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
            relations: task.relations,
            checkpoint_count: task.checkpoints.len(),
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

fn is_zero(value: &usize) -> bool {
    *value == 0
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct TaskReadiness {
    pub task_id: String,
    pub ready: bool,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub blocked_by: Vec<TaskSummary>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub missing_blocker_ids: Vec<String>,
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

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct ExpectedTaskVersion {
    pub task_id: String,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct TaskBatchReference {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub task_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub operation_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum TaskBatchOperation {
    Create {
        operation_id: String,
        project_id: String,
        description: String,
        #[serde(default = "default_urgency")]
        urgency: Urgency,
        #[serde(default)]
        source: Option<MessageSnapshot>,
    },
    Update {
        operation_id: String,
        task: TaskBatchReference,
        patch: TaskPatch,
    },
    Link {
        operation_id: String,
        task: TaskBatchReference,
        target: TaskBatchReference,
        relation: TaskRelationKind,
    },
    Unlink {
        operation_id: String,
        task: TaskBatchReference,
        target: TaskBatchReference,
        relation: TaskRelationKind,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TaskBatchAction {
    Create,
    Update,
    Link,
    Unlink,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct TaskBatchOperationResult {
    pub operation_id: String,
    pub action: TaskBatchAction,
    pub task_id: String,
    pub changed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct TaskBatchOutcome {
    pub request_id: String,
    pub repeated: bool,
    pub operations: Vec<TaskBatchOperationResult>,
    pub tasks: Vec<Task>,
}

fn default_urgency() -> Urgency {
    Urgency::Normal
}
