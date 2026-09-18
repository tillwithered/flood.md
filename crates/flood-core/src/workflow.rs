use crate::{
    AgentRunState, AppliedGuidance, AutomationSettings, GuidanceKind, GuidanceReference, Project,
    ProjectAutomationPolicy, ProjectMemoryEntry, ProjectResource, ProjectWorkspaceItem,
    ProjectWorkspaceItemKind, Store, StoreError, Task, TaskSummary,
};
use flood_connectors::ContextSignal;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use thiserror::Error;

pub const WORK_CONTRACT_VERSION: u16 = 3;
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
const MAX_WORKSPACE_ITEM_CHARS: usize = 8_000;
const MAX_TASK_DESCRIPTION_BUDGET: usize = 8_000;
const MAX_RULES_BUDGET: usize = 12_000;
const MAX_STATEMENT_BUDGET: usize = 6_000;
const MAX_MEMORY_BUDGET: usize = 4_000;
const MAX_PROJECT_SKILLS_BUDGET: usize = 6_000;
const MAX_DOCUMENTS_BUDGET: usize = 3_000;
const MAX_SIGNALS_BUDGET: usize = 4_000;
const MAX_OPEN_TASKS_BUDGET: usize = 3_000;

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
    let mut ranked = packet
        .project
        .project_skills
        .drain(..)
        .map(|item| {
            let title_terms = routing_terms(&item.title);
            let summary_terms = routing_terms(item.summary.as_deref().unwrap_or_default());
            let content_terms = routing_terms(&item.content);
            let mut matches = task_terms
                .iter()
                .filter_map(|term| {
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
                    (score > 0).then(|| (term.clone(), score))
                })
                .collect::<Vec<_>>();
            matches.sort_by(|left, right| right.1.cmp(&left.1).then_with(|| left.0.cmp(&right.0)));
            let score = matches.iter().map(|(_, score)| score).sum::<usize>();
            (item, score, matches)
        })
        .collect::<Vec<_>>();
    ranked.sort_by(|left, right| {
        right
            .1
            .cmp(&left.1)
            .then_with(|| left.0.title.cmp(&right.0.title))
    });

    let mut selected = Vec::new();
    let mut deferred = Vec::new();
    for (item, score, matches) in ranked {
        if score > 0 && selected.len() < MAX_RELEVANT_PROJECT_SKILLS {
            let matched = matches
                .into_iter()
                .take(4)
                .map(|(term, _)| term)
                .collect::<Vec<_>>()
                .join(", ");
            packet.guidance.push(AppliedGuidance {
                reference: workspace_guidance_reference(&item, GuidanceKind::Skill),
                reason: format!("Совпало с задачей: {matched}"),
            });
            selected.push(item);
        } else {
            deferred.push(workspace_guidance_reference(&item, GuidanceKind::Skill));
        }
    }
    packet.project.project_skills = selected;
    packet.project.deferred_project_skills = deferred;
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
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub blocker: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub result: Option<String>,
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

pub trait AgentRunner: Send + Sync {
    fn provider_id(&self) -> &'static str;
    fn run(&self, packet: WorkPacket) -> Result<WorkResult, AgentRunnerError>;
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{AutomationProvider, CreateTask, ProjectResource, ProjectResourceKind, Urgency};

    fn settings(enabled: bool) -> AutomationSettings {
        AutomationSettings {
            background_ai_triage: enabled,
            provider: AutomationProvider::Auto,
            projects: Vec::new(),
            updated_at: None,
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
        assert_eq!(packet.contract_version, 3);
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
}
