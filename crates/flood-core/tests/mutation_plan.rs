use flood_core::{
    CreateTask, ExpectedTaskVersion, MutationApprovalLevel, MutationCost, MutationEntityRef,
    MutationExternalEffect, MutationInitiator, MutationInitiatorKind, MutationOperation,
    MutationPlan, MutationPlanDraft, MutationPlanError, MutationReversibility, MutationTarget,
    Store, StoreError, TaskBatchOperation, TaskBatchReference, TaskPatch, Urgency,
};
use serde_json::json;
use ulid::Ulid;

fn temp_store() -> Store {
    Store::new(
        std::env::temp_dir().join(format!("flood-mutation-plan-integration-{}", Ulid::new())),
    )
    .unwrap()
}

fn plan_for_batch(
    request_id: &str,
    project_id: &str,
    task_id: &str,
    expected_version: &str,
    urgency: Urgency,
) -> MutationPlan {
    MutationPlan::new(MutationPlanDraft {
        request_id: request_id.into(),
        initiator: MutationInitiator {
            kind: MutationInitiatorKind::Agent,
            id: Some("integration-run".into()),
            provider: Some("test".into()),
        },
        target: MutationTarget {
            kind: "task_batch".into(),
            id: request_id.into(),
            project_id: Some(project_id.into()),
        },
        expected_versions: vec![flood_core::MutationExpectedVersion {
            entity: MutationEntityRef {
                kind: "task".into(),
                id: task_id.into(),
                project_id: Some(project_id.into()),
            },
            version: expected_version.into(),
        }],
        operations: vec![MutationOperation {
            operation_id: "raise-priority".into(),
            kind: "update_task".into(),
            target: Some(MutationEntityRef {
                kind: "task".into(),
                id: task_id.into(),
                project_id: Some(project_id.into()),
            }),
            payload: json!({"urgency": urgency}),
        }],
        affected_entities: vec![MutationEntityRef {
            kind: "task".into(),
            id: task_id.into(),
            project_id: Some(project_id.into()),
        }],
        reasons: vec!["integration_test".into()],
        sources: Vec::new(),
        external_effect: MutationExternalEffect::None,
        cost: MutationCost::default(),
        reversibility: MutationReversibility::Reversible,
        approval_level: MutationApprovalLevel::Explicit,
        expires_at: None,
    })
    .unwrap()
}

#[test]
fn mutation_plan_matches_existing_task_batch_safety_contract() {
    let store = temp_store();
    let project = store.create_project("Mutation plan integration").unwrap();
    let task = store
        .create_task(CreateTask {
            project_id: project.id.clone(),
            description: "# Existing task".into(),
            urgency: Urgency::Normal,
            source: None,
        })
        .unwrap();

    let request_id = "mutation-plan-batch-1";
    let plan = plan_for_batch(
        request_id,
        &project.id,
        &task.id,
        &task.version,
        Urgency::Urgent,
    );
    let confirmation = plan.confirmation();
    plan.verify_confirmation_at(&confirmation, chrono::Utc::now())
        .unwrap();

    let operations = vec![TaskBatchOperation::Update {
        operation_id: "raise-priority".into(),
        task: TaskBatchReference {
            task_id: Some(task.id.clone()),
            operation_id: None,
        },
        patch: TaskPatch {
            urgency: Some(Urgency::Urgent),
            ..TaskPatch::default()
        },
    }];
    let versions = vec![ExpectedTaskVersion {
        task_id: task.id.clone(),
        version: task.version.clone(),
    }];
    let first = store
        .apply_task_batch(operations.clone(), versions.clone(), request_id)
        .unwrap();
    assert!(!first.repeated);

    let changed_plan = plan_for_batch(
        request_id,
        &project.id,
        &task.id,
        &task.version,
        Urgency::Important,
    );
    assert_ne!(plan.content_digest, changed_plan.content_digest);
    assert!(matches!(
        changed_plan.verify_confirmation_at(&confirmation, chrono::Utc::now()),
        Err(MutationPlanError::ConfirmationMismatch)
    ));

    let changed_operations = vec![TaskBatchOperation::Update {
        operation_id: "raise-priority".into(),
        task: TaskBatchReference {
            task_id: Some(task.id.clone()),
            operation_id: None,
        },
        patch: TaskPatch {
            urgency: Some(Urgency::Important),
            ..TaskPatch::default()
        },
    }];
    let reused = store
        .apply_task_batch(changed_operations, versions, request_id)
        .unwrap_err();
    assert!(matches!(reused, StoreError::Validation(_)));

    let fresh_task = store.get_task(&task.id).unwrap();
    let stale = store
        .apply_task_batch(
            operations,
            vec![ExpectedTaskVersion {
                task_id: task.id,
                version: task.version,
            }],
            "mutation-plan-batch-stale",
        )
        .unwrap_err();
    assert!(matches!(stale, StoreError::Conflict));
    assert_eq!(fresh_task.urgency, Urgency::Urgent);
}
