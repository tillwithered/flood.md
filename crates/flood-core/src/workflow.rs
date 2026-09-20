use crate::{
    AgentRunState, AppliedGuidance, AutomationSettings, GuidanceKind, GuidanceReference, Project,
    ProjectAutomationPolicy, ProjectMemoryEntry, ProjectResource, ProjectWorkspaceItem,
    ProjectWorkspaceItemKind, Store, StoreError, Task, TaskSummary,
};
use chrono::{DateTime, Utc};
use flood_connectors::ContextSignal;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use thiserror::Error;

pub const WORK_CONTRACT_VERSION: u16 = 4;
pub const CONTEXT_MANIFEST_SCHEMA_VERSION: u16 = 1;
pub const WORK_PACKET_DELTA_SCHEMA_VERSION: u16 = 1;
pub const DEFAULT_WORK_PACKET_CHAR_BUDGET: usize = 32_000;
pub const MIN_WORK_PACKET_CHAR_BUDGET: usize = 8_000;
pub const MAX_WORK_PACKET_CHAR_BUDGET: usize = 64_000;
const MAX_PACKET_SIGNALS: usize = 50;
const DEFAULT_PACKET_OPEN_TASKS: usize = 10;
const MAX_PACKET_OPEN_TASKS: usize = 20;
const MAX_PROJECT_STATEMENT_CHARS: usize = 12_000;
const MAX_PROJECT_MEMORY: usize = 20;
const MAX_PROJECT_RESOURCES: usize = 20;
const MAX_TASK_SUMMARY_CHARS: usize = 500;
const MAX_WORKSPACE_ITEMS_PER_KIND: usize = 20;
const MAX_RELEVANT_PROJECT_SKILLS: usize = 3;
const MIN_PROJECT_SKILL_ROUTING_SCORE: isize = 6;
const MAX_WORKSPACE_ITEM_CHARS: usize = 8_000;
const MAX_TASK_DESCRIPTION_BUDGET: usize = 8_000;
const MAX_RULES_BUDGET: usize = 12_000;
const MAX_STATEMENT_BUDGET: usize = 6_000;
const MAX_MEMORY_BUDGET: usize = 4_000;
const MAX_PROJECT_SKILLS_BUDGET: usize = 6_000;
const MAX_DOCUMENTS_BUDGET: usize = 3_000;
const MAX_SIGNALS_BUDGET: usize = 4_000;
const MAX_OPEN_TASKS_BUDGET: usize = 3_000;

pub fn enforce_input_token_ceiling(
    estimated_input_tokens: usize,
    hard_limit_tokens: usize,
) -> Result<(), AgentRunnerError> {
    if hard_limit_tokens == 0 || estimated_input_tokens > hard_limit_tokens {
        return Err(AgentRunnerError::Unavailable(format!(
            "estimated input {estimated_input_tokens} exceeds hard limit {hard_limit_tokens}"
        )));
    }
    Ok(())
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum WorkPurpose {
    Triage,
    Plan,
    Execute,
    Continue,
    Verify,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum WorkAction {
    ReadProjectContext,
    ReadConnectorContext,
    CreateTask,
    UpdateTask,
    CompleteTask,
    RunLocalAgent,
    ModifyProjectFiles,
    WriteExternalService,
    DeleteData,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum WorkInitiator {
    User,
    McpClient,
    BackgroundAutomation,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum PolicyVerdict {
    Allow,
    RequireConfirmation,
    Deny,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct PolicyDecision {
    pub verdict: PolicyVerdict,
    pub reason: String,
}

#[derive(Debug, Clone, Copy)]
pub struct PolicyContext<'a> {
    pub initiator: WorkInitiator,
    pub automation: &'a AutomationSettings,
    pub project: &'a ProjectAutomationPolicy,
    pub source_agent_access: bool,
    pub explicit_confirmation: bool,
}

/// One policy gate for the desktop app and MCP. External content can suggest an
/// action, but it can never expand the permissions granted by the user.
pub struct PolicyGate;

impl PolicyGate {
    pub fn decide(action: WorkAction, context: PolicyContext<'_>) -> PolicyDecision {
        use PolicyVerdict::{Allow, Deny, RequireConfirmation};
        use WorkAction::*;
        use WorkInitiator::*;

        let (verdict, reason) = match action {
            ReadProjectContext => (
                Allow,
                "Контекст проекта хранится локально и доступен выбранному агенту",
            ),
            ReadConnectorContext if !context.source_agent_access => {
                (Deny, "Источник не разрешён для чтения агентом")
            }
            ReadConnectorContext => (Allow, "Пользователь разрешил агенту читать этот источник"),
            CreateTask | UpdateTask if context.initiator == BackgroundAutomation => {
                if context.automation.background_ai_triage {
                    (Allow, "Фоновый разбор явно включён пользователем")
                } else {
                    (Deny, "Фоновый разбор выключен")
                }
            }
            CreateTask | UpdateTask => (
                Allow,
                "Изменение запрошено пользователем через приложение или MCP",
            ),
            RunLocalAgent if context.initiator == BackgroundAutomation => {
                if context.automation.background_ai_triage && context.project.auto_run_created_tasks
                {
                    (Allow, "Автозапуск разрешён для этого проекта")
                } else {
                    (Deny, "Автозапуск не разрешён для этого проекта")
                }
            }
            RunLocalAgent | ModifyProjectFiles if context.initiator == User => {
                (Allow, "Локальное действие явно запущено пользователем")
            }
            RunLocalAgent | ModifyProjectFiles if context.explicit_confirmation => {
                (Allow, "Пользователь подтвердил локальное действие")
            }
            RunLocalAgent | ModifyProjectFiles => (
                RequireConfirmation,
                "Нужно явное подтверждение пользователя",
            ),
            CompleteTask if context.explicit_confirmation => {
                (Allow, "Пользователь подтвердил завершение задачи")
            }
            CompleteTask => (
                RequireConfirmation,
                "Результат нужно принять перед завершением задачи",
            ),
            WriteExternalService | DeleteData if context.explicit_confirmation => (
                Allow,
                "Пользователь явно подтвердил внешнее или необратимое действие",
            ),
            WriteExternalService | DeleteData if context.initiator == BackgroundAutomation => (
                Deny,
                "Фоновая автоматизация не выполняет внешние или необратимые действия",
            ),
            WriteExternalService | DeleteData => (
                RequireConfirmation,
                "Нужно отдельное подтверждение внешнего или необратимого действия",
            ),
        };
        PolicyDecision {
            verdict,
            reason: reason.into(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct WorkProjectContext {
    pub id: String,
    pub title: String,
    pub statement: String,
    #[serde(default)]
    pub statement_truncated: bool,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub memory: Vec<ProjectMemoryEntry>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub resources: Vec<ProjectResource>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub skills: Vec<ProjectResource>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub documents: Vec<ProjectWorkspaceItem>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub rules: Vec<ProjectWorkspaceItem>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub project_skills: Vec<ProjectWorkspaceItem>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub deferred_project_skills: Vec<GuidanceReference>,
    #[serde(default)]
    pub memory_truncated: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct WorkPacketTruncation {
    pub section: String,
    pub affected_items: usize,
    pub next_tool: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct WorkPacketBudget {
    pub limit_chars: usize,
    pub included_text_chars: usize,
    pub estimated_input_tokens: usize,
    pub truncated: bool,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub truncations: Vec<WorkPacketTruncation>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct ContextManifestItem {
    pub section: String,
    pub kind: String,
    pub id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
    pub reason: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub next_tool: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct ContextManifest {
    pub schema_version: u16,
    pub context_digest: String,
    pub project_id: String,
    pub project_version: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub task_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub task_version: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub included: Vec<ContextManifestItem>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub deferred: Vec<ContextManifestItem>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub truncations: Vec<WorkPacketTruncation>,
    pub included_text_chars: usize,
    pub estimated_input_tokens: usize,
    pub complete: bool,
}

impl Default for ContextManifest {
    fn default() -> Self {
        Self {
            schema_version: CONTEXT_MANIFEST_SCHEMA_VERSION,
            context_digest: String::new(),
            project_id: String::new(),
            project_version: String::new(),
            task_id: None,
            task_version: None,
            included: Vec::new(),
            deferred: Vec::new(),
            truncations: Vec::new(),
            included_text_chars: 0,
            estimated_input_tokens: 0,
            complete: false,
        }
    }
}

impl From<Project> for WorkProjectContext {
    fn from(project: Project) -> Self {
        let statement_truncated = project.context.chars().count() > MAX_PROJECT_STATEMENT_CHARS;
        let mut memory = project
            .memory
            .into_iter()
            .filter(|entry| entry.state.is_active())
            .collect::<Vec<_>>();
        memory.sort_by(|left, right| {
            right.pinned.cmp(&left.pinned).then_with(|| {
                right
                    .updated_at
                    .unwrap_or(right.created_at)
                    .cmp(&left.updated_at.unwrap_or(left.created_at))
            })
        });
        let memory_truncated = memory.len() > MAX_PROJECT_MEMORY;
        memory.truncate(MAX_PROJECT_MEMORY);
        let allowed_resources = project
            .resources
            .into_iter()
            .filter(|resource| resource.agent_access)
            .collect::<Vec<_>>();
        let skills = allowed_resources
            .iter()
            .filter(|resource| resource.kind == crate::ProjectResourceKind::Skill)
            .take(MAX_PROJECT_RESOURCES)
            .cloned()
            .collect::<Vec<_>>();
        let resources = allowed_resources
            .into_iter()
            .filter(|resource| resource.kind != crate::ProjectResourceKind::Skill)
            .take(MAX_PROJECT_RESOURCES)
            .collect();
        Self {
            id: project.id,
            title: project.title,
            statement: truncate_chars(&project.context, MAX_PROJECT_STATEMENT_CHARS),
            statement_truncated,
            memory,
            resources,
            skills,
            documents: Vec::new(),
            rules: Vec::new(),
            project_skills: Vec::new(),
            deferred_project_skills: Vec::new(),
            memory_truncated,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct WorkPacket {
    pub contract_version: u16,
    pub purpose: WorkPurpose,
    pub project: WorkProjectContext,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub task: Option<Task>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub open_tasks: Vec<TaskSummary>,
    #[serde(default)]
    pub open_tasks_truncated: bool,
    pub open_task_total: usize,
    pub open_tasks_remaining: usize,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub signals: Vec<ContextSignal>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub allowed_actions: Vec<WorkAction>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub guidance: Vec<AppliedGuidance>,
    pub budget: WorkPacketBudget,
    #[serde(default)]
    pub manifest: ContextManifest,
}

#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct WorkPacketDeliveryCapabilities {
    #[serde(default)]
    pub delta_context: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum WorkPacketReuseSection {
    ProjectStatement,
    TaskDescription,
    DocumentContent,
    RuleContent,
    ProjectSkillContent,
    MemoryText,
    OpenTaskDescription,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct WorkPacketReuseReference {
    pub section: WorkPacketReuseSection,
    pub id: String,
    pub version: String,
    pub content_digest: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case", tag = "mode")]
pub enum WorkPacketDelivery {
    Full {
        packet: WorkPacket,
    },
    Delta {
        schema_version: u16,
        base_context_digest: String,
        context_digest: String,
        reused: Vec<WorkPacketReuseReference>,
        packet: WorkPacket,
    },
}

#[derive(Debug, Error, PartialEq, Eq)]
pub enum WorkPacketDeltaError {
    #[error("unsupported work packet delta schema: {0}")]
    UnsupportedSchema(u16),
    #[error("delta packet requires the referenced base context")]
    MissingBase,
    #[error("delta base context digest does not match")]
    BaseDigestMismatch,
    #[error("delta current context digest does not match its packet")]
    CurrentDigestMismatch,
    #[error("delta reuse reference is missing from base context: {0}")]
    MissingReuseSource(String),
    #[error("delta reuse version does not match base context: {0}")]
    ReuseVersionMismatch(String),
    #[error("delta reuse content digest does not match base context: {0}")]
    ReuseDigestMismatch(String),
}

impl WorkPacketDelivery {
    pub fn prepare(
        current: WorkPacket,
        previous: Option<&WorkPacket>,
        capabilities: WorkPacketDeliveryCapabilities,
    ) -> Self {
        let Some(base) = previous else {
            return Self::Full { packet: current };
        };
        if !capabilities.delta_context
            || current.contract_version != base.contract_version
            || current.manifest.schema_version != base.manifest.schema_version
            || current.manifest.context_digest.is_empty()
            || base.manifest.context_digest.is_empty()
            || current.manifest.project_id != base.manifest.project_id
            || current.manifest.task_id != base.manifest.task_id
        {
            return Self::Full { packet: current };
        }

        let mut packet = current.clone();
        let mut reused = Vec::new();

        reuse_text_if_unchanged(
            &mut packet.project.statement,
            &current.project.statement,
            &base.project.statement,
            WorkPacketReuseSection::ProjectStatement,
            &current.project.id,
            &current.manifest.project_version,
            &base.manifest.project_version,
            &mut reused,
        );

        if let (Some(current_task), Some(base_task), Some(packet_task)) =
            (&current.task, &base.task, packet.task.as_mut())
            && current_task.id == base_task.id
        {
            reuse_text_if_unchanged(
                &mut packet_task.description,
                &current_task.description,
                &base_task.description,
                WorkPacketReuseSection::TaskDescription,
                &current_task.id,
                &current_task.version,
                &base_task.version,
                &mut reused,
            );
        }

        reuse_workspace_items(
            &current.project.documents,
            &base.project.documents,
            &mut packet.project.documents,
            WorkPacketReuseSection::DocumentContent,
            &mut reused,
        );
        reuse_workspace_items(
            &current.project.rules,
            &base.project.rules,
            &mut packet.project.rules,
            WorkPacketReuseSection::RuleContent,
            &mut reused,
        );
        reuse_workspace_items(
            &current.project.project_skills,
            &base.project.project_skills,
            &mut packet.project.project_skills,
            WorkPacketReuseSection::ProjectSkillContent,
            &mut reused,
        );

        for (index, current_entry) in current.project.memory.iter().enumerate() {
            let Some(base_entry) = base
                .project
                .memory
                .iter()
                .find(|entry| entry.id == current_entry.id)
            else {
                continue;
            };
            let Some(current_version) =
                manifest_item_version(&current, "memory", &current_entry.id)
            else {
                continue;
            };
            let Some(base_version) = manifest_item_version(base, "memory", &base_entry.id) else {
                continue;
            };
            reuse_text_if_unchanged(
                &mut packet.project.memory[index].text,
                &current_entry.text,
                &base_entry.text,
                WorkPacketReuseSection::MemoryText,
                &current_entry.id,
                current_version,
                base_version,
                &mut reused,
            );
        }

        for (index, current_task) in current.open_tasks.iter().enumerate() {
            let Some(base_task) = base
                .open_tasks
                .iter()
                .find(|task| task.id == current_task.id)
            else {
                continue;
            };
            reuse_text_if_unchanged(
                &mut packet.open_tasks[index].description,
                &current_task.description,
                &base_task.description,
                WorkPacketReuseSection::OpenTaskDescription,
                &current_task.id,
                &current_task.version,
                &base_task.version,
                &mut reused,
            );
        }

        if reused.is_empty() {
            return Self::Full { packet: current };
        }

        Self::Delta {
            schema_version: WORK_PACKET_DELTA_SCHEMA_VERSION,
            base_context_digest: base.manifest.context_digest.clone(),
            context_digest: current.manifest.context_digest.clone(),
            reused,
            packet,
        }
    }

    pub fn reconstruct(
        &self,
        base: Option<&WorkPacket>,
    ) -> Result<WorkPacket, WorkPacketDeltaError> {
        match self {
            Self::Full { packet } => Ok(packet.clone()),
            Self::Delta {
                schema_version,
                base_context_digest,
                context_digest,
                reused,
                packet,
            } => {
                if *schema_version != WORK_PACKET_DELTA_SCHEMA_VERSION {
                    return Err(WorkPacketDeltaError::UnsupportedSchema(*schema_version));
                }
                let base = base.ok_or(WorkPacketDeltaError::MissingBase)?;
                if base.manifest.context_digest != *base_context_digest {
                    return Err(WorkPacketDeltaError::BaseDigestMismatch);
                }
                if packet.manifest.context_digest != *context_digest {
                    return Err(WorkPacketDeltaError::CurrentDigestMismatch);
                }
                let mut rebuilt = packet.clone();
                for reference in reused {
                    restore_reused_text(&mut rebuilt, base, reference)?;
                }
                Ok(rebuilt)
            }
        }
    }
}

fn reuse_workspace_items(
    current: &[ProjectWorkspaceItem],
    base: &[ProjectWorkspaceItem],
    packet: &mut [ProjectWorkspaceItem],
    section: WorkPacketReuseSection,
    reused: &mut Vec<WorkPacketReuseReference>,
) {
    for (index, current_item) in current.iter().enumerate() {
        let Some(base_item) = base.iter().find(|item| item.id == current_item.id) else {
            continue;
        };
        reuse_text_if_unchanged(
            &mut packet[index].content,
            &current_item.content,
            &base_item.content,
            section.clone(),
            &current_item.id,
            &current_item.version,
            &base_item.version,
            reused,
        );
    }
}

#[allow(clippy::too_many_arguments)]
fn reuse_text_if_unchanged(
    packet_text: &mut String,
    current_text: &str,
    base_text: &str,
    section: WorkPacketReuseSection,
    id: &str,
    current_version: &str,
    base_version: &str,
    reused: &mut Vec<WorkPacketReuseReference>,
) {
    if current_text.is_empty() || current_version != base_version || current_text != base_text {
        return;
    }
    reused.push(WorkPacketReuseReference {
        section,
        id: id.to_owned(),
        version: current_version.to_owned(),
        content_digest: content_digest(current_text),
    });
    packet_text.clear();
}

fn manifest_item_version<'a>(packet: &'a WorkPacket, section: &str, id: &str) -> Option<&'a str> {
    packet
        .manifest
        .included
        .iter()
        .find(|item| item.section == section && item.id == id)
        .and_then(|item| item.version.as_deref())
}

fn content_digest(value: &str) -> String {
    hex::encode(Sha256::digest(value.as_bytes()))
}

fn restore_reused_text(
    packet: &mut WorkPacket,
    base: &WorkPacket,
    reference: &WorkPacketReuseReference,
) -> Result<(), WorkPacketDeltaError> {
    let key = format!("{:?}:{}", reference.section, reference.id);

    let (base_version, base_text) = match reference.section {
        WorkPacketReuseSection::ProjectStatement => {
            if base.project.id != reference.id {
                return Err(WorkPacketDeltaError::MissingReuseSource(key));
            }
            (
                base.manifest.project_version.as_str(),
                base.project.statement.as_str(),
            )
        }
        WorkPacketReuseSection::TaskDescription => {
            let task = base
                .task
                .as_ref()
                .filter(|task| task.id == reference.id)
                .ok_or_else(|| WorkPacketDeltaError::MissingReuseSource(key.clone()))?;
            (task.version.as_str(), task.description.as_str())
        }
        WorkPacketReuseSection::DocumentContent => {
            let item = base
                .project
                .documents
                .iter()
                .find(|item| item.id == reference.id)
                .ok_or_else(|| WorkPacketDeltaError::MissingReuseSource(key.clone()))?;
            (item.version.as_str(), item.content.as_str())
        }
        WorkPacketReuseSection::RuleContent => {
            let item = base
                .project
                .rules
                .iter()
                .find(|item| item.id == reference.id)
                .ok_or_else(|| WorkPacketDeltaError::MissingReuseSource(key.clone()))?;
            (item.version.as_str(), item.content.as_str())
        }
        WorkPacketReuseSection::ProjectSkillContent => {
            let item = base
                .project
                .project_skills
                .iter()
                .find(|item| item.id == reference.id)
                .ok_or_else(|| WorkPacketDeltaError::MissingReuseSource(key.clone()))?;
            (item.version.as_str(), item.content.as_str())
        }
        WorkPacketReuseSection::MemoryText => {
            let entry = base
                .project
                .memory
                .iter()
                .find(|entry| entry.id == reference.id)
                .ok_or_else(|| WorkPacketDeltaError::MissingReuseSource(key.clone()))?;
            let version = manifest_item_version(base, "memory", &entry.id)
                .ok_or_else(|| WorkPacketDeltaError::MissingReuseSource(key.clone()))?;
            (version, entry.text.as_str())
        }
        WorkPacketReuseSection::OpenTaskDescription => {
            let task = base
                .open_tasks
                .iter()
                .find(|task| task.id == reference.id)
                .ok_or_else(|| WorkPacketDeltaError::MissingReuseSource(key.clone()))?;
            (task.version.as_str(), task.description.as_str())
        }
    };

    if base_version != reference.version {
        return Err(WorkPacketDeltaError::ReuseVersionMismatch(key));
    }
    if content_digest(base_text) != reference.content_digest {
        return Err(WorkPacketDeltaError::ReuseDigestMismatch(key));
    }

    match reference.section {
        WorkPacketReuseSection::ProjectStatement => packet.project.statement = base_text.to_owned(),
        WorkPacketReuseSection::TaskDescription => {
            let task = packet
                .task
                .as_mut()
                .filter(|task| task.id == reference.id)
                .ok_or_else(|| WorkPacketDeltaError::MissingReuseSource(key.clone()))?;
            task.description = base_text.to_owned();
        }
        WorkPacketReuseSection::DocumentContent => {
            let item = packet
                .project
                .documents
                .iter_mut()
                .find(|item| item.id == reference.id)
                .ok_or_else(|| WorkPacketDeltaError::MissingReuseSource(key.clone()))?;
            item.content = base_text.to_owned();
        }
        WorkPacketReuseSection::RuleContent => {
            let item = packet
                .project
                .rules
                .iter_mut()
                .find(|item| item.id == reference.id)
                .ok_or_else(|| WorkPacketDeltaError::MissingReuseSource(key.clone()))?;
            item.content = base_text.to_owned();
        }
        WorkPacketReuseSection::ProjectSkillContent => {
            let item = packet
                .project
                .project_skills
                .iter_mut()
                .find(|item| item.id == reference.id)
                .ok_or_else(|| WorkPacketDeltaError::MissingReuseSource(key.clone()))?;
            item.content = base_text.to_owned();
        }
        WorkPacketReuseSection::MemoryText => {
            let entry = packet
                .project
                .memory
                .iter_mut()
                .find(|entry| entry.id == reference.id)
                .ok_or_else(|| WorkPacketDeltaError::MissingReuseSource(key.clone()))?;
            entry.text = base_text.to_owned();
        }
        WorkPacketReuseSection::OpenTaskDescription => {
            let task = packet
                .open_tasks
                .iter_mut()
                .find(|task| task.id == reference.id)
                .ok_or(WorkPacketDeltaError::MissingReuseSource(key))?;
            task.description = base_text.to_owned();
        }
    }

    Ok(())
}

/// Versions of the exact inputs used to assemble a work packet, before budgeting.
/// Kept outside the wire packet so receipts need neither another storage read nor
/// a second copy of Markdown/history. Deferred and omitted materials are included.
#[derive(Debug, Clone)]
pub struct WorkPacketEvidence {
    pub project_id: String,
    pub project_version: String,
    pub items: Vec<WorkPacketItemEvidence>,
}

#[derive(Debug, Clone)]
pub struct WorkPacketItemEvidence {
    pub id: String,
    pub kind: ProjectWorkspaceItemKind,
    pub version: String,
    pub content_chars: usize,
}

pub struct ContextBuilder<'a> {
    store: &'a Store,
    char_budget: usize,
    open_task_limit: usize,
}

impl<'a> ContextBuilder<'a> {
    pub fn new(store: &'a Store) -> Self {
        Self {
            store,
            char_budget: DEFAULT_WORK_PACKET_CHAR_BUDGET,
            open_task_limit: DEFAULT_PACKET_OPEN_TASKS,
        }
    }

    pub fn with_char_budget(mut self, char_budget: usize) -> Self {
        self.char_budget =
            char_budget.clamp(MIN_WORK_PACKET_CHAR_BUDGET, MAX_WORK_PACKET_CHAR_BUDGET);
        self
    }

    pub fn with_open_task_limit(mut self, open_task_limit: usize) -> Self {
        self.open_task_limit = open_task_limit.clamp(1, MAX_PACKET_OPEN_TASKS);
        self
    }

    pub fn for_project(
        &self,
        project_id: &str,
        purpose: WorkPurpose,
        signals: Vec<ContextSignal>,
        allowed_actions: Vec<WorkAction>,
    ) -> Result<WorkPacket, StoreError> {
        self.for_project_with_evidence(project_id, purpose, signals, allowed_actions)
            .map(|(packet, _)| packet)
    }

    pub fn for_project_with_evidence(
        &self,
        project_id: &str,
        purpose: WorkPurpose,
        signals: Vec<ContextSignal>,
        allowed_actions: Vec<WorkAction>,
    ) -> Result<(WorkPacket, WorkPacketEvidence), StoreError> {
        let (mut packet, evidence) =
            self.project_packet(project_id, purpose, signals, allowed_actions)?;
        defer_all_project_skills(&mut packet);
        apply_work_packet_budget(&mut packet, self.char_budget);
        finalize_context_manifest(&mut packet, &evidence);
        Ok((packet, evidence))
    }

    fn project_packet(
        &self,
        project_id: &str,
        purpose: WorkPurpose,
        signals: Vec<ContextSignal>,
        allowed_actions: Vec<WorkAction>,
    ) -> Result<(WorkPacket, WorkPacketEvidence), StoreError> {
        if signals.len() > MAX_PACKET_SIGNALS {
            return Err(StoreError::Validation(format!(
                "рабочий пакет содержит больше {MAX_PACKET_SIGNALS} сигналов"
            )));
        }
        for signal in &signals {
            signal
                .validate()
                .map_err(|error| StoreError::Validation(error.to_string()))?;
        }
        let project = self.store.get_project(project_id)?;
        let mut evidence = WorkPacketEvidence {
            project_id: project.id.clone(),
            project_version: project.version.clone(),
            items: Vec::new(),
        };
        let mut project_context: WorkProjectContext = project.into();
        let mut incomplete_rules = 0;
        for mut item in self
            .store
            .list_project_workspace_items(project_id, None)?
            .into_iter()
            .filter(|item| item.agent_access)
        {
            let kind = item.kind;
            let content_chars = item.content.chars().count();
            evidence.items.push(WorkPacketItemEvidence {
                id: item.id.clone(),
                kind,
                version: item.version.clone(),
                content_chars,
            });
            let item_was_truncated = content_chars > MAX_WORKSPACE_ITEM_CHARS;
            item.content = truncate_chars(&item.content, MAX_WORKSPACE_ITEM_CHARS);
            item.revisions.clear();
            let target = match kind {
                ProjectWorkspaceItemKind::Document => &mut project_context.documents,
                ProjectWorkspaceItemKind::Rule => &mut project_context.rules,
                ProjectWorkspaceItemKind::Skill => &mut project_context.project_skills,
            };
            if target.len() < MAX_WORKSPACE_ITEMS_PER_KIND {
                target.push(item);
                if kind == ProjectWorkspaceItemKind::Rule && item_was_truncated {
                    incomplete_rules += 1;
                }
            } else if kind == ProjectWorkspaceItemKind::Rule {
                incomplete_rules += 1;
            }
        }
        let guidance = project_context
            .rules
            .iter()
            .map(|item| AppliedGuidance {
                reference: workspace_guidance_reference(item, GuidanceKind::Rule),
                reason: "Обязательное правило проекта".into(),
            })
            .collect();
        let mut open_tasks = self.store.list_tasks(Some(project_id), false)?;
        let open_task_total = open_tasks.len();
        let open_tasks_truncated = open_task_total > self.open_task_limit;
        open_tasks.truncate(self.open_task_limit);
        let open_tasks_remaining = open_task_total.saturating_sub(open_tasks.len());
        for task in &mut open_tasks {
            task.description = truncate_chars(&task.description, MAX_TASK_SUMMARY_CHARS);
        }
        let packet = WorkPacket {
            contract_version: WORK_CONTRACT_VERSION,
            purpose,
            project: project_context,
            task: None,
            open_tasks,
            open_tasks_truncated,
            open_task_total,
            open_tasks_remaining,
            signals,
            allowed_actions: dedupe_actions(allowed_actions),
            guidance,
            budget: WorkPacketBudget {
                limit_chars: self.char_budget,
                included_text_chars: 0,
                estimated_input_tokens: 0,
                truncated: incomplete_rules > 0,
                truncations: if incomplete_rules > 0 {
                    vec![WorkPacketTruncation {
                        section: "rules".into(),
                        affected_items: incomplete_rules,
                        next_tool: "get_project_workspace_item".into(),
                    }]
                } else {
                    Vec::new()
                },
            },
            manifest: ContextManifest::default(),
        };
        Ok((packet, evidence))
    }

    pub fn for_task(
        &self,
        task_id: &str,
        purpose: WorkPurpose,
        allowed_actions: Vec<WorkAction>,
    ) -> Result<WorkPacket, StoreError> {
        self.for_task_with_evidence(task_id, purpose, allowed_actions)
            .map(|(packet, _)| packet)
    }

    pub fn for_task_with_evidence(
        &self,
        task_id: &str,
        purpose: WorkPurpose,
        allowed_actions: Vec<WorkAction>,
    ) -> Result<(WorkPacket, WorkPacketEvidence), StoreError> {
        let task = self.store.get_task(task_id)?;
        let (mut packet, evidence) =
            self.project_packet(&task.project_id, purpose, Vec::new(), allowed_actions)?;
        route_project_skills(&mut packet, &task);
        packet.task = Some(task);
        apply_work_packet_budget(&mut packet, self.char_budget);
        finalize_context_manifest(&mut packet, &evidence);
        Ok((packet, evidence))
    }
}

fn workspace_guidance_reference(
    item: &ProjectWorkspaceItem,
    kind: GuidanceKind,
) -> GuidanceReference {
    GuidanceReference {
        kind,
        id: item.id.clone(),
        title: item.title.clone(),
        version: item.version.clone(),
    }
}

fn defer_all_project_skills(packet: &mut WorkPacket) {
    packet.project.deferred_project_skills = packet
        .project
        .project_skills
        .drain(..)
        .map(|item| workspace_guidance_reference(&item, GuidanceKind::Skill))
        .collect();
}

fn route_project_skills(packet: &mut WorkPacket, task: &Task) {
    let task_terms = routing_terms(&task.description);
    let negative_task_terms = routing_negative_terms(&task.description);
    let positive_task_terms = task_terms
        .difference(&negative_task_terms)
        .cloned()
        .collect::<std::collections::BTreeSet<_>>();
    let mut ranked = packet
        .project
        .project_skills
        .drain(..)
        .map(|item| {
            let title_terms = routing_terms(&item.title);
            let summary_terms = routing_terms(item.summary.as_deref().unwrap_or_default());
            let content_terms = routing_terms(&item.content);
            let mut positive_matches = positive_task_terms
                .iter()
                .filter_map(|term| {
                    routing_signal_score(term, &title_terms, &summary_terms, &content_terms)
                })
                .collect::<Vec<_>>();
            positive_matches
                .sort_by(|left, right| right.1.cmp(&left.1).then_with(|| left.0.cmp(&right.0)));
            let mut negative_matches = negative_task_terms
                .iter()
                .filter_map(|term| {
                    routing_signal_score(term, &title_terms, &summary_terms, &content_terms)
                })
                .collect::<Vec<_>>();
            negative_matches
                .sort_by(|left, right| right.1.cmp(&left.1).then_with(|| left.0.cmp(&right.0)));
            let positive_score = positive_matches
                .iter()
                .map(|(_, score)| *score as isize)
                .sum::<isize>();
            let negative_score = negative_matches
                .iter()
                .map(|(_, score)| *score as isize)
                .sum::<isize>();
            let score = positive_score - negative_score;
            (item, score, positive_matches, negative_matches)
        })
        .collect::<Vec<_>>();
    ranked.sort_by(|left, right| {
        right
            .1
            .cmp(&left.1)
            .then_with(|| left.0.title.cmp(&right.0.title))
            .then_with(|| left.0.id.cmp(&right.0.id))
    });

    let mut selected = Vec::new();
    let mut deferred = Vec::new();
    for (item, score, positive_matches, negative_matches) in ranked {
        if score >= MIN_PROJECT_SKILL_ROUTING_SCORE && selected.len() < MAX_RELEVANT_PROJECT_SKILLS
        {
            let positive = positive_matches
                .into_iter()
                .take(4)
                .map(|(term, weight)| format!("{term}:+{weight}"))
                .collect::<Vec<_>>()
                .join(", ");
            let negative = negative_matches
                .into_iter()
                .take(4)
                .map(|(term, weight)| format!("{term}:-{weight}"))
                .collect::<Vec<_>>()
                .join(", ");
            let signals = if negative.is_empty() {
                format!("positive [{positive}]")
            } else {
                format!("positive [{positive}], negative [{negative}]")
            };
            packet.guidance.push(AppliedGuidance {
                reference: workspace_guidance_reference(&item, GuidanceKind::Skill),
                reason: format!(
                    "Skill routing score {score} >= {MIN_PROJECT_SKILL_ROUTING_SCORE}; {signals}"
                ),
            });
            selected.push(item);
        } else {
            deferred.push(workspace_guidance_reference(&item, GuidanceKind::Skill));
        }
    }
    packet.project.project_skills = selected;
    packet.project.deferred_project_skills = deferred;
}

fn routing_signal_score(
    term: &str,
    title_terms: &std::collections::BTreeSet<String>,
    summary_terms: &std::collections::BTreeSet<String>,
    content_terms: &std::collections::BTreeSet<String>,
) -> Option<(String, usize)> {
    let score = if title_terms
        .iter()
        .any(|candidate| routing_terms_match(term, candidate))
    {
        6
    } else if summary_terms
        .iter()
        .any(|candidate| routing_terms_match(term, candidate))
    {
        3
    } else if content_terms
        .iter()
        .any(|candidate| routing_terms_match(term, candidate))
    {
        1
    } else {
        0
    };
    (score > 0).then(|| (term.to_owned(), score))
}

fn routing_negative_terms(value: &str) -> std::collections::BTreeSet<String> {
    const NEGATORS: &[&str] = &[
        "без",
        "не",
        "исключая",
        "кроме",
        "without",
        "exclude",
        "except",
        "no",
    ];
    const NEGATION_WINDOW: usize = 2;

    let tokens = value
        .to_lowercase()
        .split(|character: char| !character.is_alphanumeric())
        .filter(|term| !term.is_empty())
        .map(str::to_owned)
        .collect::<Vec<_>>();
    let mut negative = std::collections::BTreeSet::new();
    for (index, token) in tokens.iter().enumerate() {
        if NEGATORS.contains(&token.as_str()) {
            for candidate in tokens.iter().skip(index + 1).take(NEGATION_WINDOW) {
                negative.extend(routing_terms(candidate));
            }
        }
    }
    negative
}

fn routing_terms_match(left: &str, right: &str) -> bool {
    left == right
        || left
            .chars()
            .zip(right.chars())
            .take_while(|(left, right)| left == right)
            .count()
            >= 5
}

fn routing_terms(value: &str) -> std::collections::BTreeSet<String> {
    const STOP_WORDS: &[&str] = &[
        "the",
        "and",
        "for",
        "with",
        "from",
        "into",
        "this",
        "that",
        "или",
        "для",
        "как",
        "что",
        "это",
        "при",
        "над",
        "под",
        "про",
        "его",
        "она",
        "они",
        "мы",
        "вы",
        "нужно",
        "сделать",
        "задача",
        "проект",
        "project",
        "task",
    ];
    value
        .to_lowercase()
        .split(|character: char| !character.is_alphanumeric())
        .filter(|term| term.chars().count() >= 3 && !STOP_WORDS.contains(term))
        .take(160)
        .map(str::to_owned)
        .collect()
}

struct PacketBudgetAccumulator {
    limit: usize,
    used: usize,
    truncations: Vec<WorkPacketTruncation>,
}

impl PacketBudgetAccumulator {
    fn new(limit: usize) -> Self {
        Self {
            limit,
            used: 0,
            truncations: Vec::new(),
        }
    }

    fn fit(&mut self, value: &mut String, section_remaining: &mut usize) -> bool {
        let original_chars = value.chars().count();
        let allowed = original_chars
            .min(self.limit.saturating_sub(self.used))
            .min(*section_remaining);
        if allowed < original_chars {
            *value = truncate_chars(value, allowed);
        }
        let included = value.chars().count();
        self.used += included;
        *section_remaining = section_remaining.saturating_sub(included);
        allowed < original_chars
    }

    fn record(&mut self, section: &str, affected_items: usize, next_tool: &str) {
        if affected_items > 0 {
            self.truncations.push(WorkPacketTruncation {
                section: section.into(),
                affected_items,
                next_tool: next_tool.into(),
            });
        }
    }
}

fn apply_work_packet_budget(packet: &mut WorkPacket, limit: usize) {
    let mut inherited_truncations = std::mem::take(&mut packet.budget.truncations);
    let mut budget = PacketBudgetAccumulator::new(limit);

    if let Some(task) = packet.task.as_mut() {
        let mut section = MAX_TASK_DESCRIPTION_BUDGET;
        let truncated = usize::from(budget.fit(&mut task.description, &mut section));
        budget.record("task", truncated, "get_task");
    }

    let mut section = MAX_RULES_BUDGET;
    let mut affected = 0;
    for item in &mut packet.project.rules {
        affected += usize::from(budget.fit(&mut item.content, &mut section));
    }
    budget.record("rules", affected, "get_project_workspace_item");

    let mut section = MAX_STATEMENT_BUDGET;
    let statement_truncated = budget.fit(&mut packet.project.statement, &mut section);
    packet.project.statement_truncated |= statement_truncated;
    budget.record(
        "project_statement",
        usize::from(statement_truncated),
        "get_project",
    );

    let mut section = MAX_MEMORY_BUDGET;
    let mut affected = 0;
    for entry in &mut packet.project.memory {
        entry.revisions.clear();
        affected += usize::from(budget.fit(&mut entry.text, &mut section));
    }
    budget.record("memory", affected, "list_project_memory");

    let mut section = MAX_PROJECT_SKILLS_BUDGET;
    let mut affected = 0;
    for item in &mut packet.project.project_skills {
        affected += usize::from(budget.fit(&mut item.content, &mut section));
    }
    budget.record("project_skills", affected, "get_project_workspace_item");

    let mut section = MAX_DOCUMENTS_BUDGET;
    let mut affected = 0;
    for item in &mut packet.project.documents {
        affected += usize::from(budget.fit(&mut item.content, &mut section));
    }
    budget.record("documents", affected, "get_project_workspace_item");

    let mut section = MAX_SIGNALS_BUDGET;
    let mut affected = 0;
    for signal in &mut packet.signals {
        affected += usize::from(budget.fit(&mut signal.text, &mut section));
    }
    budget.record("signals", affected, "connector-specific context tool");

    let mut section = MAX_OPEN_TASKS_BUDGET;
    let mut affected = 0;
    for task in &mut packet.open_tasks {
        affected += usize::from(budget.fit(&mut task.description, &mut section));
    }
    if affected > 0 {
        packet.open_tasks_truncated = true;
    }
    budget.record("open_tasks", affected, "list_tasks");

    inherited_truncations.extend(budget.truncations);
    packet.budget = WorkPacketBudget {
        limit_chars: limit,
        included_text_chars: budget.used,
        estimated_input_tokens: 0,
        truncated: !inherited_truncations.is_empty(),
        truncations: inherited_truncations,
    };
    packet.budget.estimated_input_tokens = serde_json::to_string(packet)
        .map(|serialized| serialized.chars().count().div_ceil(4))
        .unwrap_or_else(|_| packet.budget.included_text_chars.div_ceil(4));
}

fn manifest_item(
    section: &str,
    kind: &str,
    id: impl Into<String>,
    version: Option<String>,
    reason: impl Into<String>,
    next_tool: Option<&str>,
) -> ContextManifestItem {
    ContextManifestItem {
        section: section.into(),
        kind: kind.into(),
        id: id.into(),
        version,
        reason: reason.into(),
        next_tool: next_tool.map(str::to_owned),
    }
}

fn finalize_context_manifest(packet: &mut WorkPacket, evidence: &WorkPacketEvidence) {
    let project_version = evidence.project_version.clone();
    let mut included = vec![manifest_item(
        "project",
        "project",
        packet.project.id.clone(),
        Some(project_version.clone()),
        "Базовый контекст проекта",
        Some("get_project"),
    )];

    if let Some(task) = &packet.task {
        included.push(manifest_item(
            "task",
            "task",
            task.id.clone(),
            Some(task.version.clone()),
            "Текущая задача рабочего пакета",
            Some("get_task"),
        ));
    }
    for item in &packet.project.rules {
        let reason = packet
            .guidance
            .iter()
            .find(|guidance| guidance.reference.id == item.id)
            .map(|guidance| guidance.reason.clone())
            .unwrap_or_else(|| "Обязательное правило проекта".into());
        included.push(manifest_item(
            "rules",
            "rule",
            item.id.clone(),
            Some(item.version.clone()),
            reason,
            Some("get_project_workspace_item"),
        ));
    }
    for item in &packet.project.project_skills {
        let reason = packet
            .guidance
            .iter()
            .find(|guidance| guidance.reference.id == item.id)
            .map(|guidance| guidance.reason.clone())
            .unwrap_or_else(|| "Выбранный навык проекта".into());
        included.push(manifest_item(
            "project_skills",
            "skill",
            item.id.clone(),
            Some(item.version.clone()),
            reason,
            Some("get_project_workspace_item"),
        ));
    }
    for item in &packet.project.documents {
        included.push(manifest_item(
            "documents",
            "document",
            item.id.clone(),
            Some(item.version.clone()),
            "Документ проекта с доступом агенту",
            Some("get_project_workspace_item"),
        ));
    }
    for entry in &packet.project.memory {
        included.push(manifest_item(
            "memory",
            "memory",
            entry.id.clone(),
            Some(project_version.clone()),
            "Активная память проекта",
            Some("list_project_memory"),
        ));
    }
    for resource in packet
        .project
        .resources
        .iter()
        .chain(packet.project.skills.iter())
    {
        included.push(manifest_item(
            "resources",
            "resource",
            resource.id.clone(),
            Some(project_version.clone()),
            "Источник проекта с доступом агенту",
            Some("get_project"),
        ));
    }
    for task in &packet.open_tasks {
        included.push(manifest_item(
            "open_tasks",
            "task_summary",
            task.id.clone(),
            Some(task.version.clone()),
            "Открытая задача для контекста проекта",
            Some("list_tasks"),
        ));
    }
    for signal in &packet.signals {
        included.push(manifest_item(
            "signals",
            "signal",
            format!(
                "{}:{}:{}",
                signal.connector_id, signal.source_id, signal.external_id
            ),
            Some(signal.contract_version.to_string()),
            "Сигнал подключённого источника",
            Some("connector-specific context tool"),
        ));
    }

    let mut deferred = packet
        .project
        .deferred_project_skills
        .iter()
        .map(|skill| {
            manifest_item(
                "project_skills",
                "skill",
                skill.id.clone(),
                Some(skill.version.clone()),
                "Навык проекта не выбран для текущего рабочего пакета",
                Some("get_project_workspace_item"),
            )
        })
        .collect::<Vec<_>>();

    for item in &evidence.items {
        let already_accounted = included
            .iter()
            .chain(deferred.iter())
            .any(|entry| entry.id == item.id);
        if !already_accounted {
            deferred.push(manifest_item(
                match item.kind {
                    ProjectWorkspaceItemKind::Document => "documents",
                    ProjectWorkspaceItemKind::Rule => "rules",
                    ProjectWorkspaceItemKind::Skill => "project_skills",
                },
                match item.kind {
                    ProjectWorkspaceItemKind::Document => "document",
                    ProjectWorkspaceItemKind::Rule => "rule",
                    ProjectWorkspaceItemKind::Skill => "skill",
                },
                item.id.clone(),
                Some(item.version.clone()),
                "Не включено из-за ограничения размера рабочего пакета",
                Some("get_project_workspace_item"),
            ));
        }
    }

    included.sort_by(|a, b| (&a.section, &a.kind, &a.id).cmp(&(&b.section, &b.kind, &b.id)));
    deferred.sort_by(|a, b| (&a.section, &a.kind, &a.id).cmp(&(&b.section, &b.kind, &b.id)));
    let mut truncations = packet.budget.truncations.clone();
    if packet.project.memory_truncated && !truncations.iter().any(|item| item.section == "memory") {
        truncations.push(WorkPacketTruncation {
            section: "memory".into(),
            affected_items: 1,
            next_tool: "list_project_memory".into(),
        });
    }
    if packet.open_tasks_truncated && !truncations.iter().any(|item| item.section == "open_tasks") {
        truncations.push(WorkPacketTruncation {
            section: "open_tasks".into(),
            affected_items: packet.open_tasks_remaining.max(1),
            next_tool: "list_tasks".into(),
        });
    }
    truncations.sort_by(|a, b| (&a.section, &a.next_tool).cmp(&(&b.section, &b.next_tool)));

    packet.manifest = ContextManifest {
        schema_version: CONTEXT_MANIFEST_SCHEMA_VERSION,
        context_digest: "0".repeat(64),
        project_id: evidence.project_id.clone(),
        project_version,
        task_id: packet.task.as_ref().map(|task| task.id.clone()),
        task_version: packet.task.as_ref().map(|task| task.version.clone()),
        included,
        deferred,
        truncations,
        included_text_chars: packet.budget.included_text_chars,
        estimated_input_tokens: 0,
        complete: !packet.budget.truncated
            && !packet.project.memory_truncated
            && !packet.open_tasks_truncated,
    };
    packet.manifest.complete = !packet.budget.truncated
        && !packet.project.memory_truncated
        && !packet.open_tasks_truncated;

    let estimated = serde_json::to_string(packet)
        .map(|serialized| serialized.chars().count().div_ceil(4))
        .unwrap_or_else(|_| packet.budget.included_text_chars.div_ceil(4));
    packet.budget.estimated_input_tokens = estimated;
    packet.manifest.estimated_input_tokens = estimated;

    let mut digest_material = packet.manifest.clone();
    digest_material.context_digest.clear();
    let encoded = serde_json::to_vec(&digest_material).unwrap_or_default();
    packet.manifest.context_digest = hex::encode(Sha256::digest(encoded));
}

fn truncate_chars(value: &str, max_chars: usize) -> String {
    if value.chars().count() <= max_chars {
        return value.to_owned();
    }
    if max_chars == 0 {
        return String::new();
    }
    let mut output = value
        .chars()
        .take(max_chars.saturating_sub(1))
        .collect::<String>();
    output.push('…');
    output
}

fn dedupe_actions(actions: Vec<WorkAction>) -> Vec<WorkAction> {
    let mut unique = Vec::new();
    for action in actions {
        if !unique.contains(&action) {
            unique.push(action);
        }
    }
    unique
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum WorkResultStatus {
    #[serde(alias = "ready_for_review")]
    Completed,
    NeedsInput,
    Failed,
}

impl WorkResultStatus {
    pub fn agent_state(self) -> AgentRunState {
        match self {
            Self::Completed => AgentRunState::ReadyForReview,
            Self::NeedsInput => AgentRunState::NeedsInput,
            Self::Failed => AgentRunState::Failed,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct WorkResult {
    pub status: WorkResultStatus,
    pub summary: String,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub actions: Vec<WorkDecision>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub verification: Vec<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub remaining: Vec<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub memory: Vec<String>,
    /// Versioned project-knowledge changes proposed by the agent. They are
    /// persisted for human review and never mutate canonical knowledge here.
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub knowledge_proposals: Vec<WorkKnowledgeProposal>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub blocker: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub result: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct WorkKnowledgeProposal {
    pub target: crate::ProjectKnowledgeProposalTarget,
    pub base_version: String,
    pub payload: crate::ProjectKnowledgeProposalPayload,
    pub summary: String,
    pub reason: String,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub evidence: Vec<String>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum WorkDecisionAction {
    CreateTask,
    UpdateTask,
    Duplicate,
    NoAction,
    NeedsData,
    QueueAgent,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct WorkDecision {
    /// Стабильный идентификатор сигнала или события из WorkPacket.
    pub signal_id: String,
    pub action: WorkDecisionAction,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub urgency: Option<crate::Urgency>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub related_task_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub question: Option<String>,
}

#[derive(Debug, Error)]
pub enum AgentRunnerError {
    #[error("agent runner is unavailable: {0}")]
    Unavailable(String),
    #[error("agent runner failed: {0}")]
    Failed(String),
    #[error("agent runner returned an invalid result: {0}")]
    InvalidResult(String),
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct ProviderCapabilities {
    pub schema_version: u16,
    pub attachments: bool,
    pub images: bool,
    pub resume: bool,
    pub interactive_input: bool,
    pub usage: bool,
    pub structured_result: bool,
    pub interrupt: bool,
    pub model_identity: bool,
}

impl ProviderCapabilities {
    pub const fn codex_cli() -> Self {
        Self {
            schema_version: 1,
            attachments: true,
            images: true,
            resume: true,
            interactive_input: true,
            usage: true,
            structured_result: true,
            interrupt: true,
            model_identity: false,
        }
    }

    pub fn validate_turn(&self, mode: &ProviderTurnMode) -> Result<(), AgentRunnerError> {
        if self.schema_version != 1 {
            return Err(AgentRunnerError::Unavailable(format!(
                "неподдерживаемая версия provider capabilities: {}",
                self.schema_version
            )));
        }
        if !self.structured_result {
            return Err(AgentRunnerError::Unavailable(
                "provider не поддерживает структурированный результат".into(),
            ));
        }
        match mode {
            ProviderTurnMode::Start { attachments, .. } if !attachments.is_empty() => {
                if !self.attachments || !self.images {
                    return Err(AgentRunnerError::Unavailable(
                        "provider не поддерживает изображения или вложения".into(),
                    ));
                }
            }
            ProviderTurnMode::Resume { .. } if !self.resume || !self.interactive_input => {
                return Err(AgentRunnerError::Unavailable(
                    "provider не поддерживает продолжение с ответом пользователя".into(),
                ));
            }
            _ => {}
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct ProviderDescriptor {
    pub id: String,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    pub capabilities: ProviderCapabilities,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case", tag = "kind")]
pub enum ProviderTurnMode {
    Start {
        #[serde(default, skip_serializing_if = "Vec::is_empty")]
        attachments: Vec<String>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        previous_result: Option<String>,
    },
    Resume {
        session_id: String,
        input: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct ProviderTurnRequest {
    pub run_id: String,
    pub working_directory: String,
    pub packet: WorkPacket,
    pub mode: ProviderTurnMode,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct ProviderTurnOutcome {
    pub result: WorkResult,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub session_id: Option<String>,
    #[serde(default)]
    pub usage: crate::AgentRunUsage,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct WorkPacketReceipt {
    pub schema_version: u16,
    pub turn_id: String,
    pub run_id: String,
    pub created_at: DateTime<Utc>,
    pub purpose: WorkPurpose,
    pub project_id: String,
    pub project_version: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub task_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub task_version: Option<String>,
    pub context_manifest: ContextManifest,
    pub budget: WorkPacketBudget,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub allowed_actions: Vec<WorkAction>,
    pub provider: ProviderDescriptor,
    pub working_directory: String,
    pub sandbox: String,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub permissions: Vec<String>,
}

impl WorkPacketReceipt {
    pub fn capture(
        turn_id: String,
        run_id: String,
        packet: &WorkPacket,
        provider: ProviderDescriptor,
        working_directory: String,
        sandbox: String,
        permissions: Vec<String>,
    ) -> Self {
        Self {
            schema_version: 1,
            turn_id,
            run_id,
            created_at: Utc::now(),
            purpose: packet.purpose,
            project_id: packet.manifest.project_id.clone(),
            project_version: packet.manifest.project_version.clone(),
            task_id: packet.manifest.task_id.clone(),
            task_version: packet.manifest.task_version.clone(),
            context_manifest: packet.manifest.clone(),
            budget: packet.budget.clone(),
            allowed_actions: packet.allowed_actions.clone(),
            provider,
            working_directory,
            sandbox,
            permissions,
        }
    }
}

pub trait AgentProviderAdapter: Send + Sync {
    fn descriptor(&self) -> ProviderDescriptor;
    fn execute(
        &self,
        request: ProviderTurnRequest,
    ) -> Result<ProviderTurnOutcome, AgentRunnerError>;
    fn interrupt(&self, run_id: &str) -> Result<(), AgentRunnerError>;
}

/// Compatibility surface for bounded one-shot automation runners. Interactive
/// task execution uses `AgentProviderAdapter` so provider differences remain
/// explicit rather than being inferred by callers.
pub trait AgentRunner: Send + Sync {
    fn provider_id(&self) -> &'static str;
    fn run(&self, packet: WorkPacket) -> Result<WorkResult, AgentRunnerError>;
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{AutomationProvider, CreateTask, ProjectResource, ProjectResourceKind, Urgency};
    use std::sync::{
        Arc,
        atomic::{AtomicBool, Ordering},
    };

    struct FixtureProvider {
        interrupted: Arc<AtomicBool>,
        capabilities: ProviderCapabilities,
    }

    impl AgentProviderAdapter for FixtureProvider {
        fn descriptor(&self) -> ProviderDescriptor {
            ProviderDescriptor {
                id: "fixture".into(),
                name: "Fixture provider".into(),
                version: Some("1.0".into()),
                model: Some("deterministic".into()),
                capabilities: self.capabilities.clone(),
            }
        }

        fn execute(
            &self,
            request: ProviderTurnRequest,
        ) -> Result<ProviderTurnOutcome, AgentRunnerError> {
            self.capabilities.validate_turn(&request.mode)?;
            Ok(ProviderTurnOutcome {
                result: WorkResult {
                    status: WorkResultStatus::Completed,
                    summary: "fixture completed".into(),
                    actions: Vec::new(),
                    verification: vec!["contract".into()],
                    remaining: Vec::new(),
                    memory: Vec::new(),
                    knowledge_proposals: Vec::new(),
                    blocker: None,
                    result: Some("artifact".into()),
                },
                session_id: Some("fixture-session".into()),
                usage: crate::AgentRunUsage::default().with_actual(Some(12), Some(4)),
            })
        }

        fn interrupt(&self, _run_id: &str) -> Result<(), AgentRunnerError> {
            self.interrupted.store(true, Ordering::SeqCst);
            Ok(())
        }
    }

    fn settings(enabled: bool) -> AutomationSettings {
        AutomationSettings {
            background_ai_triage: enabled,
            provider: AutomationProvider::Auto,
            projects: Vec::new(),
            ..AutomationSettings::default()
        }
    }

    #[test]
    fn background_cannot_expand_permissions() {
        let settings = settings(true);
        let project = ProjectAutomationPolicy {
            project_id: "project".into(),
            auto_run_created_tasks: true,
            updated_at: None,
        };
        let context = PolicyContext {
            initiator: WorkInitiator::BackgroundAutomation,
            automation: &settings,
            project: &project,
            source_agent_access: true,
            explicit_confirmation: false,
        };
        assert_eq!(
            PolicyGate::decide(WorkAction::WriteExternalService, context).verdict,
            PolicyVerdict::Deny
        );
        assert_eq!(
            PolicyGate::decide(WorkAction::DeleteData, context).verdict,
            PolicyVerdict::Deny
        );
    }

    #[test]
    fn project_autorun_requires_both_switches() {
        let settings = settings(true);
        let disabled_project = ProjectAutomationPolicy::disabled("project");
        let context = PolicyContext {
            initiator: WorkInitiator::BackgroundAutomation,
            automation: &settings,
            project: &disabled_project,
            source_agent_access: true,
            explicit_confirmation: false,
        };
        assert_eq!(
            PolicyGate::decide(WorkAction::RunLocalAgent, context).verdict,
            PolicyVerdict::Deny
        );
    }

    #[test]
    fn connector_read_requires_agent_access() {
        let settings = settings(false);
        let project = ProjectAutomationPolicy::disabled("project");
        let context = PolicyContext {
            initiator: WorkInitiator::McpClient,
            automation: &settings,
            project: &project,
            source_agent_access: false,
            explicit_confirmation: false,
        };
        assert_eq!(
            PolicyGate::decide(WorkAction::ReadConnectorContext, context).verdict,
            PolicyVerdict::Deny
        );
    }

    #[test]
    fn context_builder_returns_a_bounded_agent_packet() {
        let root =
            std::env::temp_dir().join(format!("flood-work-packet-test-{}", ulid::Ulid::new()));
        let store = Store::new(&root).unwrap();
        let project = store.create_project("Packet").unwrap();
        let project = store
            .update_project_context(&project.id, &"x".repeat(13_000), &project.version)
            .unwrap();
        let project = store
            .set_project_resources(
                &project.id,
                vec![ProjectResource {
                    id: "ui-skill".into(),
                    kind: ProjectResourceKind::Skill,
                    label: "UI rules".into(),
                    location: "C:/skills/ui".into(),
                    notes: None,
                    agent_access: true,
                }],
                &project.version,
            )
            .unwrap();
        store
            .create_project_workspace_item_idempotent(
                &project.id,
                ProjectWorkspaceItemKind::Skill,
                "Пакет контекста",
                Some("Проверка рабочего пакета"),
                &"z".repeat(9_000),
                true,
                "packet-owned-skill",
            )
            .unwrap();
        store
            .create_project_workspace_item_idempotent(
                &project.id,
                ProjectWorkspaceItemKind::Skill,
                "Публикация релиза",
                Some("Сборка и публикация установщика"),
                "release only",
                true,
                "release-owned-skill",
            )
            .unwrap();
        let rule = store
            .create_project_workspace_item_idempotent(
                &project.id,
                ProjectWorkspaceItemKind::Rule,
                "Безопасность",
                Some("Обязательное правило"),
                "Не публиковать без подтверждения",
                true,
                "packet-rule",
            )
            .unwrap()
            .value;
        let task = store
            .create_task(CreateTask {
                project_id: project.id.clone(),
                description: format!("# Проверить пакет\n\n{}", "y".repeat(1_000)),
                urgency: Urgency::Normal,
                source: None,
            })
            .unwrap();

        let packet = ContextBuilder::new(&store)
            .for_task(
                &task.id,
                WorkPurpose::Execute,
                vec![
                    WorkAction::ReadProjectContext,
                    WorkAction::ReadProjectContext,
                ],
            )
            .unwrap();

        assert!(packet.project.statement_truncated);
        assert_eq!(
            packet.project.statement.chars().count(),
            MAX_STATEMENT_BUDGET
        );
        assert_eq!(packet.allowed_actions, vec![WorkAction::ReadProjectContext]);
        assert_eq!(packet.project.skills.len(), 1);
        assert_eq!(packet.project.project_skills.len(), 1);
        assert_eq!(packet.project.project_skills[0].title, "Пакет контекста");
        assert_eq!(packet.project.deferred_project_skills.len(), 1);
        assert_eq!(
            packet.project.deferred_project_skills[0].title,
            "Публикация релиза"
        );
        assert_eq!(
            packet.project.project_skills[0].content.chars().count(),
            MAX_PROJECT_SKILLS_BUDGET
        );
        assert!(packet.project.project_skills[0].revisions.is_empty());
        assert!(packet.guidance.iter().any(|item| {
            item.reference.id == rule.id
                && item.reference.version == rule.version
                && item.reason == "Обязательное правило проекта"
        }));
        assert!(packet.guidance.iter().any(|item| {
            item.reference.id == packet.project.project_skills[0].id
                && item.reference.version == packet.project.project_skills[0].version
                && item.reason.contains("пакет")
        }));
        assert!(packet.project.resources.is_empty());
        assert!(
            packet
                .open_tasks
                .iter()
                .all(|task| task.description.chars().count() <= MAX_TASK_SUMMARY_CHARS)
        );
        assert_eq!(
            packet.task.as_ref().map(|task| task.id.as_str()),
            Some(task.id.as_str())
        );
        assert_eq!(packet.contract_version, 4);
        assert_eq!(packet.budget.limit_chars, DEFAULT_WORK_PACKET_CHAR_BUDGET);
        assert!(packet.budget.included_text_chars <= packet.budget.limit_chars);
        assert!(
            packet.budget.estimated_input_tokens >= packet.budget.included_text_chars.div_ceil(4)
        );
        assert!(packet.budget.truncated);
        assert!(
            packet
                .budget
                .truncations
                .iter()
                .any(|item| item.section == "project_statement" && item.next_tool == "get_project")
        );
        assert!(
            packet
                .budget
                .truncations
                .iter()
                .any(|item| item.section == "project_skills"
                    && item.next_tool == "get_project_workspace_item")
        );
        assert_eq!(
            packet.manifest.schema_version,
            CONTEXT_MANIFEST_SCHEMA_VERSION
        );
        assert_eq!(packet.manifest.context_digest.len(), 64);
        assert!(!packet.manifest.complete);
        assert_eq!(packet.manifest.project_id, project.id);
        assert_eq!(packet.manifest.task_id.as_deref(), Some(task.id.as_str()));
        assert!(packet.manifest.included.iter().any(|item| {
            item.id == rule.id
                && item.version.as_deref() == Some(rule.version.as_str())
                && item.reason == "Обязательное правило проекта"
        }));
        assert!(packet.manifest.deferred.iter().any(|item| {
            item.id == packet.project.deferred_project_skills[0].id
                && item.version.as_deref()
                    == Some(packet.project.deferred_project_skills[0].version.as_str())
                && item.next_tool.as_deref() == Some("get_project_workspace_item")
        }));
        assert!(packet.manifest.truncations.iter().any(|item| {
            item.section == "project_statement" && item.next_tool == "get_project"
        }));

        std::fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn work_packet_delivery_requires_explicit_delta_capability() {
        let root =
            std::env::temp_dir().join(format!("flood-delta-capability-test-{}", ulid::Ulid::new()));
        let store = Store::new(&root).unwrap();
        let project = store.create_project("Delta").unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: project.id,
                description: "Проверить повторный контекст".into(),
                urgency: Urgency::Normal,
                source: None,
            })
            .unwrap();
        let packet = ContextBuilder::new(&store)
            .for_task(
                &task.id,
                WorkPurpose::Execute,
                vec![WorkAction::ReadProjectContext],
            )
            .unwrap();

        let delivery = WorkPacketDelivery::prepare(
            packet.clone(),
            Some(&packet),
            WorkPacketDeliveryCapabilities::default(),
        );
        assert_eq!(delivery, WorkPacketDelivery::Full { packet });

        let capabilities: WorkPacketDeliveryCapabilities = serde_json::from_str("{}").unwrap();
        assert!(!capabilities.delta_context);
        std::fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn delta_delivery_reconstructs_full_packet_from_local_base() {
        let root =
            std::env::temp_dir().join(format!("flood-delta-rebuild-test-{}", ulid::Ulid::new()));
        let store = Store::new(&root).unwrap();
        let project = store.create_project("Delta").unwrap();
        let project = store
            .update_project_context(&project.id, "Контекст проекта", &project.version)
            .unwrap();
        store
            .create_project_workspace_item_idempotent(
                &project.id,
                ProjectWorkspaceItemKind::Document,
                "Архитектура",
                Some("Основной документ"),
                "Стабильный контент документа",
                true,
                "delta-document",
            )
            .unwrap();
        let task = store
            .create_task(CreateTask {
                project_id: project.id,
                description: "Проверить delta-пакет".into(),
                urgency: Urgency::Normal,
                source: None,
            })
            .unwrap();
        let packet = ContextBuilder::new(&store)
            .for_task(
                &task.id,
                WorkPurpose::Execute,
                vec![WorkAction::ReadProjectContext],
            )
            .unwrap();

        let delivery = WorkPacketDelivery::prepare(
            packet.clone(),
            Some(&packet),
            WorkPacketDeliveryCapabilities {
                delta_context: true,
            },
        );
        let WorkPacketDelivery::Delta {
            reused,
            packet: delta_packet,
            ..
        } = &delivery
        else {
            panic!("expected delta delivery");
        };
        assert!(!reused.is_empty());
        assert!(reused.iter().all(|item| item.content_digest.len() == 64));
        assert!(reused.iter().all(|item| !item.version.is_empty()));
        assert!(delta_packet.project.statement.is_empty());
        assert!(delta_packet.task.as_ref().unwrap().description.is_empty());
        assert!(delta_packet.project.documents[0].content.is_empty());
        assert_eq!(delivery.reconstruct(Some(&packet)).unwrap(), packet);
        assert_eq!(
            delivery.reconstruct(None).unwrap_err(),
            WorkPacketDeltaError::MissingBase
        );

        std::fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn changed_workspace_version_is_not_reused_in_delta() {
        let root =
            std::env::temp_dir().join(format!("flood-delta-version-test-{}", ulid::Ulid::new()));
        let store = Store::new(&root).unwrap();
        let project = store.create_project("Delta").unwrap();
        let document = store
            .create_project_workspace_item_idempotent(
                &project.id,
                ProjectWorkspaceItemKind::Document,
                "Архитектура",
                None,
                "Версия один",
                true,
                "delta-changing-document",
            )
            .unwrap()
            .value;
        let task = store
            .create_task(CreateTask {
                project_id: project.id.clone(),
                description: "Проверить обновление документа".into(),
                urgency: Urgency::Normal,
                source: None,
            })
            .unwrap();
        let first = ContextBuilder::new(&store)
            .for_task(
                &task.id,
                WorkPurpose::Execute,
                vec![WorkAction::ReadProjectContext],
            )
            .unwrap();
        let updated = store
            .update_project_workspace_item(
                &project.id,
                &document.id,
                &document.title,
                document.summary.as_deref(),
                "Версия два",
                true,
                &document.version,
            )
            .unwrap();
        assert_ne!(updated.version, document.version);
        let second = ContextBuilder::new(&store)
            .for_task(
                &task.id,
                WorkPurpose::Execute,
                vec![WorkAction::ReadProjectContext],
            )
            .unwrap();

        let delivery = WorkPacketDelivery::prepare(
            second.clone(),
            Some(&first),
            WorkPacketDeliveryCapabilities {
                delta_context: true,
            },
        );
        let WorkPacketDelivery::Delta {
            reused,
            packet: delta_packet,
            ..
        } = &delivery
        else {
            panic!("expected delta delivery for unchanged surrounding context");
        };
        assert!(!reused.iter().any(|item| {
            item.section == WorkPacketReuseSection::DocumentContent && item.id == document.id
        }));
        assert_eq!(delta_packet.project.documents[0].content, "Версия два");
        assert_eq!(delivery.reconstruct(Some(&first)).unwrap(), second);

        std::fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn project_brief_defers_skill_content_until_a_task_matches() {
        let root =
            std::env::temp_dir().join(format!("flood-skill-routing-test-{}", ulid::Ulid::new()));
        let store = Store::new(&root).unwrap();
        let project = store.create_project("Routing").unwrap();
        store
            .create_project_workspace_item_idempotent(
                &project.id,
                ProjectWorkspaceItemKind::Skill,
                "Визуальный аудит UI",
                Some("Интерфейс, типографика и отступы"),
                "Проверить экран в обеих темах",
                true,
                "routing-ui-skill",
            )
            .unwrap();

        let packet = ContextBuilder::new(&store)
            .for_project(
                &project.id,
                WorkPurpose::Plan,
                Vec::new(),
                vec![WorkAction::ReadProjectContext],
            )
            .unwrap();

        assert!(packet.project.project_skills.is_empty());
        assert_eq!(packet.project.deferred_project_skills.len(), 1);
        assert!(packet.guidance.is_empty());
        std::fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn skill_routing_uses_threshold_negative_signals_and_stable_reasons() {
        let root = std::env::temp_dir().join(format!(
            "flood-skill-routing-fixtures-test-{}",
            ulid::Ulid::new()
        ));
        let store = Store::new(&root).unwrap();
        let project = store.create_project("Routing fixtures").unwrap();
        let relevant = store
            .create_project_workspace_item_idempotent(
                &project.id,
                ProjectWorkspaceItemKind::Skill,
                "Интерфейс аудит",
                Some("Проверка типографики"),
                "Проверить экран и отступы",
                true,
                "routing-relevant",
            )
            .unwrap()
            .value;
        let irrelevant = store
            .create_project_workspace_item_idempotent(
                &project.id,
                ProjectWorkspaceItemKind::Skill,
                "Релиз приложения",
                Some("Сборка установщика"),
                "Интерфейс упоминается только как общий контекст релиза",
                true,
                "routing-irrelevant",
            )
            .unwrap()
            .value;
        let negated = store
            .create_project_workspace_item_idempotent(
                &project.id,
                ProjectWorkspaceItemKind::Skill,
                "Telegram интеграция",
                Some("Работа с чатами"),
                "Подключение Telegram",
                true,
                "routing-negated",
            )
            .unwrap()
            .value;
        let task = store
            .create_task(CreateTask {
                project_id: project.id.clone(),
                description: "Провести интерфейс аудит без Telegram интеграции".into(),
                urgency: Urgency::Normal,
                source: None,
            })
            .unwrap();

        let first = ContextBuilder::new(&store)
            .for_task(
                &task.id,
                WorkPurpose::Execute,
                vec![WorkAction::ReadProjectContext],
            )
            .unwrap();
        let repeated = ContextBuilder::new(&store)
            .for_task(
                &task.id,
                WorkPurpose::Execute,
                vec![WorkAction::ReadProjectContext],
            )
            .unwrap();

        assert_eq!(
            first.project.project_skills,
            repeated.project.project_skills
        );
        assert_eq!(
            first.project.deferred_project_skills,
            repeated.project.deferred_project_skills
        );
        assert_eq!(first.manifest, repeated.manifest);
        assert_eq!(first.project.project_skills.len(), 1);
        assert_eq!(first.project.project_skills[0].id, relevant.id);
        assert!(
            first
                .project
                .deferred_project_skills
                .iter()
                .any(|item| item.id == irrelevant.id)
        );
        assert!(
            first
                .project
                .deferred_project_skills
                .iter()
                .any(|item| item.id == negated.id)
        );
        let reason = first
            .guidance
            .iter()
            .find(|item| item.reference.id == relevant.id)
            .map(|item| item.reason.as_str())
            .unwrap();
        assert!(reason.contains("score"));
        assert!(reason.contains(">= 6"));
        assert!(reason.contains("интерфейс:+6"));
        assert!(
            first
                .manifest
                .included
                .iter()
                .any(|item| { item.id == relevant.id && item.reason == reason })
        );

        std::fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn skill_routing_negative_signal_can_cancel_a_positive_title_match() {
        let root = std::env::temp_dir().join(format!(
            "flood-skill-routing-negative-test-{}",
            ulid::Ulid::new()
        ));
        let store = Store::new(&root).unwrap();
        let project = store.create_project("Negative routing").unwrap();
        let skill = store
            .create_project_workspace_item_idempotent(
                &project.id,
                ProjectWorkspaceItemKind::Skill,
                "Telegram интеграция",
                Some("Telegram чаты"),
                "Работа с Telegram",
                true,
                "routing-negative-title",
            )
            .unwrap()
            .value;
        let task = store
            .create_task(CreateTask {
                project_id: project.id.clone(),
                description: "Проверить проект без Telegram интеграции".into(),
                urgency: Urgency::Normal,
                source: None,
            })
            .unwrap();

        let packet = ContextBuilder::new(&store)
            .for_task(
                &task.id,
                WorkPurpose::Execute,
                vec![WorkAction::ReadProjectContext],
            )
            .unwrap();

        assert!(packet.project.project_skills.is_empty());
        assert!(
            packet
                .project
                .deferred_project_skills
                .iter()
                .any(|item| item.id == skill.id)
        );

        std::fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn context_manifest_is_deterministic_and_changes_with_versions() {
        let root =
            std::env::temp_dir().join(format!("flood-context-manifest-test-{}", ulid::Ulid::new()));
        let store = Store::new(&root).unwrap();
        let project = store.create_project("Manifest").unwrap();

        let first = ContextBuilder::new(&store)
            .for_project(
                &project.id,
                WorkPurpose::Plan,
                Vec::new(),
                vec![WorkAction::ReadProjectContext],
            )
            .unwrap();
        let repeated = ContextBuilder::new(&store)
            .for_project(
                &project.id,
                WorkPurpose::Plan,
                Vec::new(),
                vec![WorkAction::ReadProjectContext],
            )
            .unwrap();
        assert_eq!(first.manifest, repeated.manifest);

        store
            .update_project_context(&project.id, "Изменённый контекст", &project.version)
            .unwrap();
        let changed = ContextBuilder::new(&store)
            .for_project(
                &project.id,
                WorkPurpose::Plan,
                Vec::new(),
                vec![WorkAction::ReadProjectContext],
            )
            .unwrap();
        assert_ne!(
            first.manifest.project_version,
            changed.manifest.project_version
        );
        assert_ne!(
            first.manifest.context_digest,
            changed.manifest.context_digest
        );

        std::fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn legacy_work_packet_without_manifest_deserializes_with_safe_default() {
        let root = std::env::temp_dir().join(format!(
            "flood-context-manifest-legacy-test-{}",
            ulid::Ulid::new()
        ));
        let store = Store::new(&root).unwrap();
        let project = store.create_project("Legacy").unwrap();
        let packet = ContextBuilder::new(&store)
            .for_project(
                &project.id,
                WorkPurpose::Plan,
                Vec::new(),
                vec![WorkAction::ReadProjectContext],
            )
            .unwrap();
        let mut value = serde_json::to_value(packet).unwrap();
        value.as_object_mut().unwrap().remove("manifest");
        let restored: WorkPacket = serde_json::from_value(value).unwrap();
        assert_eq!(
            restored.manifest.schema_version,
            CONTEXT_MANIFEST_SCHEMA_VERSION
        );
        assert!(restored.manifest.context_digest.is_empty());
        assert!(!restored.manifest.complete);

        std::fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn provider_adapter_contract_is_capability_driven_and_interruptible() {
        let root = std::env::temp_dir().join(format!(
            "flood-provider-contract-test-{}",
            ulid::Ulid::new()
        ));
        let store = Store::new(&root).unwrap();
        let project = store.create_project("Provider contract").unwrap();
        let packet = ContextBuilder::new(&store)
            .for_project(
                &project.id,
                WorkPurpose::Execute,
                Vec::new(),
                vec![WorkAction::ReadProjectContext],
            )
            .unwrap();
        let interrupted = Arc::new(AtomicBool::new(false));
        let provider = FixtureProvider {
            interrupted: interrupted.clone(),
            capabilities: ProviderCapabilities::codex_cli(),
        };
        let outcome = provider
            .execute(ProviderTurnRequest {
                run_id: "run-1".into(),
                working_directory: root.display().to_string(),
                packet,
                mode: ProviderTurnMode::Start {
                    attachments: Vec::new(),
                    previous_result: None,
                },
            })
            .unwrap();
        assert_eq!(outcome.result.status, WorkResultStatus::Completed);
        assert_eq!(outcome.usage.actual_total_tokens, Some(16));
        assert_eq!(provider.descriptor().id, "fixture");
        provider.interrupt("run-1").unwrap();
        assert!(interrupted.load(Ordering::SeqCst));

        let limited = FixtureProvider {
            interrupted,
            capabilities: ProviderCapabilities {
                schema_version: 1,
                attachments: false,
                images: false,
                resume: false,
                interactive_input: false,
                usage: false,
                structured_result: true,
                interrupt: false,
                model_identity: false,
            },
        };
        assert!(
            limited
                .capabilities
                .validate_turn(&ProviderTurnMode::Resume {
                    session_id: "session".into(),
                    input: "answer".into(),
                })
                .is_err()
        );
        std::fs::remove_dir_all(root).unwrap();
    }
}
