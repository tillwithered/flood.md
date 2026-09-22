use std::collections::{BTreeMap, HashSet};

use chrono::{DateTime, Utc};
use flood_core::{
    Project, ProjectWorkspaceItem, ProjectWorkspaceItemKind, WORK_CONTRACT_VERSION,
    WorkPacketEvidence,
};
use rmcp::schemars;
use serde::Serialize;
use sha2::{Digest, Sha256};

/// Session evidence contains versions, never a second copy of project knowledge.
#[derive(Debug, Clone)]
pub(super) struct ProjectContextSnapshot {
    pub revision: String,
    pub project_version: String,
    pub items: BTreeMap<String, ContextItemVersion>,
}

#[derive(Debug, Clone)]
pub(super) struct ContextItemVersion {
    pub kind: ProjectWorkspaceItemKind,
    pub version: String,
}

impl ProjectContextSnapshot {
    pub fn new(project: &Project, items: &[ProjectWorkspaceItem]) -> Self {
        let items = items
            .iter()
            .filter(|item| item.agent_access)
            .map(|item| {
                (
                    item.id.clone(),
                    ContextItemVersion {
                        kind: item.kind,
                        version: item.version.clone(),
                    },
                )
            })
            .collect::<BTreeMap<_, _>>();
        Self::from_versions(&project.id, project.version.clone(), items)
    }

    pub fn from_evidence(evidence: &WorkPacketEvidence) -> Self {
        let items = evidence
            .items
            .iter()
            .map(|item| {
                (
                    item.id.clone(),
                    ContextItemVersion {
                        kind: item.kind,
                        version: item.version.clone(),
                    },
                )
            })
            .collect();
        Self::from_versions(
            &evidence.project_id,
            evidence.project_version.clone(),
            items,
        )
    }

    fn from_versions(
        project_id: &str,
        project_version: String,
        items: BTreeMap<String, ContextItemVersion>,
    ) -> Self {
        let mut snapshot = Self {
            revision: String::new(),
            project_version,
            items,
        };
        snapshot.refresh_revision(project_id);
        snapshot
    }

    pub fn refresh_revision(&mut self, project_id: &str) {
        // Keep the existing context_revision contract and deterministic ID order.
        let mut digest = Sha256::new();
        digest.update(WORK_CONTRACT_VERSION.to_be_bytes());
        digest.update(project_id.as_bytes());
        digest.update([0]);
        digest.update(self.project_version.as_bytes());
        for (id, item) in &self.items {
            digest.update([0]);
            digest.update(id.as_bytes());
            digest.update([0]);
            digest.update(item.version.as_bytes());
        }
        self.revision = format!("{:x}", digest.finalize());
    }

    pub fn changes_since(&self, previous: &Self) -> Vec<ProjectContextChange> {
        let mut changes = Vec::new();
        for (id, current) in &self.items {
            let prior = previous.items.get(id);
            if prior.is_some_and(|prior| prior.version == current.version) {
                continue;
            }
            changes.push(ProjectContextChange {
                id: id.clone(),
                kind: current.kind,
                change: if prior.is_some() { "updated" } else { "added" },
                previous_version: prior.map(|prior| prior.version.clone()),
                current_version: Some(current.version.clone()),
            });
        }
        for (id, prior) in &previous.items {
            if !self.items.contains_key(id) {
                // Deletion and revoked access are intentionally indistinguishable.
                changes.push(ProjectContextChange {
                    id: id.clone(),
                    kind: prior.kind,
                    change: "removed",
                    previous_version: Some(prior.version.clone()),
                    current_version: None,
                });
            }
        }
        changes.sort_by(|left, right| left.id.cmp(&right.id));
        changes
    }

    pub fn pending_rules(&self, previous: &Self, pending: &HashSet<String>) -> Vec<String> {
        self.items
            .iter()
            .filter(|(id, item)| {
                item.kind == ProjectWorkspaceItemKind::Rule
                    && (pending.contains(*id)
                        || previous
                            .items
                            .get(*id)
                            .is_none_or(|old| old.version != item.version))
            })
            .map(|(id, _)| id.clone())
            .collect()
    }
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
pub(super) struct ProjectContextChange {
    pub id: String,
    pub kind: ProjectWorkspaceItemKind,
    pub change: &'static str,
    pub previous_version: Option<String>,
    pub current_version: Option<String>,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
pub(super) struct ProjectContextCheckOutput {
    pub project_id: String,
    /// missing, current, stale, or incomplete. A check never acknowledges changes.
    pub status: &'static str,
    pub context_revision: String,
    pub previous_context_revision: Option<String>,
    pub project_version: String,
    /// None means this MCP session has no baseline to compare against.
    pub project_changed: Option<bool>,
    pub changes: Vec<ProjectContextChange>,
    pub pending_rule_ids: Vec<String>,
    /// Selected skills whose full current body was not present in the packet.
    pub pending_skill_ids: Vec<String>,
    pub requires_context_reload: bool,
    pub context_ready: bool,
    pub suggested_tools: Vec<&'static str>,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
pub(super) struct ProjectWorkspaceItemSummary {
    pub id: String,
    pub project_id: String,
    pub kind: ProjectWorkspaceItemKind,
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub summary: Option<String>,
    pub agent_access: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub version: String,
    pub content_chars: usize,
    pub revision_count: usize,
    /// Omitted by default; absence never means an empty Markdown body.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
}

impl ProjectWorkspaceItemSummary {
    pub fn new(item: ProjectWorkspaceItem, include_content: bool) -> Self {
        let revision_count = if item.agent_access {
            item.revisions
                .iter()
                .filter(|revision| revision.agent_access)
                .count()
        } else {
            0
        };
        Self {
            content_chars: item.content.chars().count(),
            revision_count,
            id: item.id,
            project_id: item.project_id,
            kind: item.kind,
            title: item.title,
            summary: item.summary,
            agent_access: item.agent_access,
            created_at: item.created_at,
            updated_at: item.updated_at,
            version: item.version,
            content: (include_content && item.agent_access).then_some(item.content),
        }
    }
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
pub(super) struct ProjectWorkspaceItemReadOutput {
    pub item: ProjectWorkspaceItem,
    // Preserve the original single-item read envelope for existing clients.
    pub created: bool,
    pub request_id: Option<String>,
    pub revision_count: usize,
    pub history_included: bool,
    pub content_is_untrusted_data: bool,
}

impl ProjectWorkspaceItemReadOutput {
    pub fn new(mut item: ProjectWorkspaceItem, include_history: bool) -> Self {
        item.revisions.retain(|revision| revision.agent_access);
        let revision_count = item.revisions.len();
        if !include_history {
            item.revisions.clear();
        }
        Self {
            item,
            created: false,
            request_id: None,
            revision_count,
            history_included: include_history,
            content_is_untrusted_data: true,
        }
    }
}
