use std::collections::{BTreeSet, HashSet};

use chrono::{DateTime, Utc};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};
use thiserror::Error;
use ulid::Ulid;

pub const MUTATION_PLAN_CONTRACT_VERSION: u8 = 1;

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MutationInitiatorKind {
    Human,
    Agent,
    Automation,
    Connector,
    System,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct MutationInitiator {
    pub kind: MutationInitiatorKind,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub provider: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq, PartialOrd, Ord)]
pub struct MutationEntityRef {
    pub kind: String,
    pub id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub project_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct MutationTarget {
    pub kind: String,
    pub id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub project_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct MutationExpectedVersion {
    pub entity: MutationEntityRef,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct MutationOperation {
    pub operation_id: String,
    pub kind: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub target: Option<MutationEntityRef>,
    pub payload: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq, PartialOrd, Ord)]
pub struct MutationSourceRef {
    pub kind: String,
    pub id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MutationExternalEffect {
    None,
    ReadOnly,
    Write,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MutationCostKind {
    None,
    Unknown,
    Estimated,
    Exact,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct MutationCost {
    pub kind: MutationCostKind,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub value: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub unit: Option<String>,
}

impl Default for MutationCost {
    fn default() -> Self {
        Self {
            kind: MutationCostKind::None,
            value: None,
            unit: None,
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MutationReversibility {
    Reversible,
    BestEffort,
    Irreversible,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MutationApprovalLevel {
    None,
    Review,
    Explicit,
    Elevated,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct MutationPlanDraft {
    pub request_id: String,
    pub initiator: MutationInitiator,
    pub target: MutationTarget,
    #[serde(default)]
    pub expected_versions: Vec<MutationExpectedVersion>,
    pub operations: Vec<MutationOperation>,
    #[serde(default)]
    pub affected_entities: Vec<MutationEntityRef>,
    #[serde(default)]
    pub reasons: Vec<String>,
    #[serde(default)]
    pub sources: Vec<MutationSourceRef>,
    pub external_effect: MutationExternalEffect,
    #[serde(default)]
    pub cost: MutationCost,
    pub reversibility: MutationReversibility,
    pub approval_level: MutationApprovalLevel,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct MutationPlan {
    pub contract_version: u8,
    pub plan_id: String,
    pub request_id: String,
    pub initiator: MutationInitiator,
    pub target: MutationTarget,
    #[serde(default)]
    pub expected_versions: Vec<MutationExpectedVersion>,
    pub operations: Vec<MutationOperation>,
    #[serde(default)]
    pub affected_entities: Vec<MutationEntityRef>,
    #[serde(default)]
    pub reasons: Vec<String>,
    #[serde(default)]
    pub sources: Vec<MutationSourceRef>,
    pub external_effect: MutationExternalEffect,
    #[serde(default)]
    pub cost: MutationCost,
    pub reversibility: MutationReversibility,
    /// Required human/host gate. It is descriptive only: a valid plan or
    /// confirmation never grants filesystem, network, connector, or agent authority.
    pub approval_level: MutationApprovalLevel,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<DateTime<Utc>>,
    pub content_digest: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct MutationConfirmation {
    pub plan_id: String,
    pub content_digest: String,
}

#[derive(Debug, Error)]
pub enum MutationPlanError {
    #[error("request_id must be non-empty, trimmed, and at most 200 characters")]
    InvalidRequestId,
    #[error("mutation plan must contain at least one operation")]
    EmptyOperations,
    #[error("mutation operation_id must be non-empty, trimmed, and unique")]
    InvalidOperationId,
    #[error("mutation expected version must be non-empty")]
    InvalidExpectedVersion,
    #[error("mutation plan integrity check failed")]
    IntegrityMismatch,
    #[error("mutation confirmation does not match this plan")]
    ConfirmationMismatch,
    #[error("mutation plan has expired")]
    Expired,
    #[error("failed to serialize mutation plan: {0}")]
    Serialization(#[from] serde_json::Error),
}

impl MutationPlan {
    pub fn new(draft: MutationPlanDraft) -> Result<Self, MutationPlanError> {
        validate_draft(&draft)?;
        let content_digest = digest_draft(&draft)?;
        let plan_id = stable_plan_id(&draft.request_id, &content_digest);
        Ok(Self {
            contract_version: MUTATION_PLAN_CONTRACT_VERSION,
            plan_id,
            request_id: draft.request_id,
            initiator: draft.initiator,
            target: draft.target,
            expected_versions: draft.expected_versions,
            operations: draft.operations,
            affected_entities: draft.affected_entities,
            reasons: draft.reasons,
            sources: draft.sources,
            external_effect: draft.external_effect,
            cost: draft.cost,
            reversibility: draft.reversibility,
            approval_level: draft.approval_level,
            expires_at: draft.expires_at,
            content_digest,
        })
    }

    pub fn confirmation(&self) -> MutationConfirmation {
        MutationConfirmation {
            plan_id: self.plan_id.clone(),
            content_digest: self.content_digest.clone(),
        }
    }

    pub fn verify_integrity(&self) -> Result<(), MutationPlanError> {
        if self.contract_version != MUTATION_PLAN_CONTRACT_VERSION {
            return Err(MutationPlanError::IntegrityMismatch);
        }
        let draft = self.as_draft();
        validate_draft(&draft)?;
        let digest = digest_draft(&draft)?;
        let plan_id = stable_plan_id(&self.request_id, &digest);
        if digest != self.content_digest || plan_id != self.plan_id {
            return Err(MutationPlanError::IntegrityMismatch);
        }
        Ok(())
    }

    /// Verifies that the confirmation still describes these exact bytes/scope and
    /// that the plan is not expired. Callers must still perform their normal
    /// authorization/capability checks before applying anything.
    pub fn verify_confirmation_at(
        &self,
        confirmation: &MutationConfirmation,
        now: DateTime<Utc>,
    ) -> Result<(), MutationPlanError> {
        self.verify_integrity()?;
        if self.expires_at.is_some_and(|expires_at| now >= expires_at) {
            return Err(MutationPlanError::Expired);
        }
        if confirmation.plan_id != self.plan_id
            || confirmation.content_digest != self.content_digest
        {
            return Err(MutationPlanError::ConfirmationMismatch);
        }
        Ok(())
    }

    fn as_draft(&self) -> MutationPlanDraft {
        MutationPlanDraft {
            request_id: self.request_id.clone(),
            initiator: self.initiator.clone(),
            target: self.target.clone(),
            expected_versions: self.expected_versions.clone(),
            operations: self.operations.clone(),
            affected_entities: self.affected_entities.clone(),
            reasons: self.reasons.clone(),
            sources: self.sources.clone(),
            external_effect: self.external_effect,
            cost: self.cost.clone(),
            reversibility: self.reversibility,
            approval_level: self.approval_level,
            expires_at: self.expires_at,
        }
    }
}

fn validate_draft(draft: &MutationPlanDraft) -> Result<(), MutationPlanError> {
    let request_id = draft.request_id.trim();
    if request_id.is_empty()
        || request_id != draft.request_id
        || draft.request_id.chars().count() > 200
    {
        return Err(MutationPlanError::InvalidRequestId);
    }
    if draft.operations.is_empty() {
        return Err(MutationPlanError::EmptyOperations);
    }
    let mut operation_ids = HashSet::new();
    for operation in &draft.operations {
        let operation_id = operation.operation_id.trim();
        if operation_id.is_empty()
            || operation_id != operation.operation_id
            || !operation_ids.insert(operation.operation_id.as_str())
        {
            return Err(MutationPlanError::InvalidOperationId);
        }
    }
    if draft
        .expected_versions
        .iter()
        .any(|expected| expected.version.trim().is_empty())
    {
        return Err(MutationPlanError::InvalidExpectedVersion);
    }
    Ok(())
}

#[derive(Serialize)]
struct DigestContent {
    contract_version: u8,
    request_id: String,
    initiator: MutationInitiator,
    target: MutationTarget,
    expected_versions: Vec<MutationExpectedVersion>,
    operations: Vec<MutationOperation>,
    affected_entities: Vec<MutationEntityRef>,
    reasons: Vec<String>,
    sources: Vec<MutationSourceRef>,
    external_effect: MutationExternalEffect,
    cost: MutationCost,
    reversibility: MutationReversibility,
    approval_level: MutationApprovalLevel,
    expires_at: Option<DateTime<Utc>>,
}

fn digest_draft(draft: &MutationPlanDraft) -> Result<String, MutationPlanError> {
    let mut expected_versions = draft.expected_versions.clone();
    expected_versions
        .sort_by(|left, right| (&left.entity, &left.version).cmp(&(&right.entity, &right.version)));
    let affected_entities = draft
        .affected_entities
        .iter()
        .cloned()
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect();
    let reasons = draft
        .reasons
        .iter()
        .cloned()
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect();
    let sources = draft
        .sources
        .iter()
        .cloned()
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect();
    let operations = draft
        .operations
        .iter()
        .cloned()
        .map(|mut operation| {
            operation.payload = canonical_json(operation.payload);
            operation
        })
        .collect();
    let content = DigestContent {
        contract_version: MUTATION_PLAN_CONTRACT_VERSION,
        request_id: draft.request_id.clone(),
        initiator: draft.initiator.clone(),
        target: draft.target.clone(),
        expected_versions,
        operations,
        affected_entities,
        reasons,
        sources,
        external_effect: draft.external_effect,
        cost: draft.cost.clone(),
        reversibility: draft.reversibility,
        approval_level: draft.approval_level,
        expires_at: draft.expires_at,
    };
    let bytes = serde_json::to_vec(&content)?;
    let mut digest = Sha256::new();
    digest.update(b"flood.mutation-plan.content.v1\0");
    digest.update(bytes);
    Ok(hex::encode(digest.finalize()))
}

fn canonical_json(value: Value) -> Value {
    match value {
        Value::Object(map) => {
            let sorted = map
                .into_iter()
                .map(|(key, value)| (key, canonical_json(value)))
                .collect::<std::collections::BTreeMap<_, _>>();
            Value::Object(sorted.into_iter().collect())
        }
        Value::Array(values) => Value::Array(values.into_iter().map(canonical_json).collect()),
        other => other,
    }
}

fn stable_plan_id(request_id: &str, content_digest: &str) -> String {
    let mut digest = Sha256::new();
    digest.update(b"flood.mutation-plan.id.v1\0");
    digest.update(request_id.as_bytes());
    digest.update(b"\0");
    digest.update(content_digest.as_bytes());
    let bytes = digest.finalize();
    let mut value = [0_u8; 16];
    value.copy_from_slice(&bytes[..16]);
    Ulid::from(u128::from_be_bytes(value)).to_string()
}

#[cfg(test)]
mod tests {
    use chrono::Duration;
    use serde_json::json;

    use super::*;

    fn draft(payload: Value, version: &str) -> MutationPlanDraft {
        MutationPlanDraft {
            request_id: "request-123".into(),
            initiator: MutationInitiator {
                kind: MutationInitiatorKind::Agent,
                id: Some("run-1".into()),
                provider: Some("codex".into()),
            },
            target: MutationTarget {
                kind: "task_batch".into(),
                id: "batch-1".into(),
                project_id: Some("project-1".into()),
            },
            expected_versions: vec![MutationExpectedVersion {
                entity: MutationEntityRef {
                    kind: "task".into(),
                    id: "task-1".into(),
                    project_id: Some("project-1".into()),
                },
                version: version.into(),
            }],
            operations: vec![MutationOperation {
                operation_id: "update-1".into(),
                kind: "update_task".into(),
                target: Some(MutationEntityRef {
                    kind: "task".into(),
                    id: "task-1".into(),
                    project_id: Some("project-1".into()),
                }),
                payload,
            }],
            affected_entities: vec![MutationEntityRef {
                kind: "task".into(),
                id: "task-1".into(),
                project_id: Some("project-1".into()),
            }],
            reasons: vec!["user_request".into()],
            sources: vec![MutationSourceRef {
                kind: "task".into(),
                id: "task-1".into(),
                version: Some(version.into()),
            }],
            external_effect: MutationExternalEffect::None,
            cost: MutationCost::default(),
            reversibility: MutationReversibility::Reversible,
            approval_level: MutationApprovalLevel::Explicit,
            expires_at: None,
        }
    }

    #[test]
    fn exact_plan_is_idempotent_and_json_key_order_is_canonical() {
        let first = MutationPlan::new(draft(
            json!({"status": "completed", "urgency": "urgent"}),
            "v1",
        ))
        .unwrap();
        let second = MutationPlan::new(draft(
            json!({"urgency": "urgent", "status": "completed"}),
            "v1",
        ))
        .unwrap();
        assert_eq!(first.content_digest, second.content_digest);
        assert_eq!(first.plan_id, second.plan_id);
        first.verify_integrity().unwrap();
    }

    #[test]
    fn payload_scope_and_version_changes_invalidate_old_confirmation() {
        let base = MutationPlan::new(draft(json!({"status": "completed"}), "v1")).unwrap();
        let confirmation = base.confirmation();

        let payload = MutationPlan::new(draft(json!({"status": "open"}), "v1")).unwrap();
        assert_ne!(base.content_digest, payload.content_digest);
        assert!(matches!(
            payload.verify_confirmation_at(&confirmation, Utc::now()),
            Err(MutationPlanError::ConfirmationMismatch)
        ));

        let mut scoped = draft(json!({"status": "completed"}), "v1");
        scoped.target.id = "batch-2".into();
        let scoped = MutationPlan::new(scoped).unwrap();
        assert_ne!(base.content_digest, scoped.content_digest);

        let version = MutationPlan::new(draft(json!({"status": "completed"}), "v2")).unwrap();
        assert_ne!(base.content_digest, version.content_digest);
    }

    #[test]
    fn expired_or_tampered_plan_cannot_reuse_confirmation() {
        let mut expiring = draft(json!({"status": "completed"}), "v1");
        expiring.expires_at = Some(Utc::now() - Duration::seconds(1));
        let expired = MutationPlan::new(expiring).unwrap();
        assert!(matches!(
            expired.verify_confirmation_at(&expired.confirmation(), Utc::now()),
            Err(MutationPlanError::Expired)
        ));

        let mut tampered = MutationPlan::new(draft(json!({"status": "completed"}), "v1")).unwrap();
        let confirmation = tampered.confirmation();
        tampered.operations[0].payload = json!({"status": "open"});
        assert!(matches!(
            tampered.verify_confirmation_at(&confirmation, Utc::now()),
            Err(MutationPlanError::IntegrityMismatch)
        ));
    }
}
