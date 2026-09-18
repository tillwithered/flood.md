use flood_core::{
    ActivityAction, ActivityApplyResult, ActivityEntityKind, ActivityGuidanceRef,
    ActivityOperationResult, ActivityProvenance, ActivityRecoveryAvailability, ActivitySource,
    GuidanceKind, MutationInitiator, MutationInitiatorKind, MutationSourceRef, RecordActivity,
    Store,
};
use std::{env, fs};
use ulid::Ulid;

fn temp_store() -> Store {
    Store::new(env::temp_dir().join(format!("flood-provenance-test-{}", Ulid::new()))).unwrap()
}

#[test]
fn provenance_is_persistent_structured_and_content_free() {
    let store = temp_store();
    let project_id = Ulid::new().to_string();
    let target_id = Ulid::new().to_string();
    let provenance = ActivityProvenance {
        initiator: MutationInitiator {
            kind: MutationInitiatorKind::Agent,
            id: None,
            provider: Some("mcp".into()),
        },
        run_id: Some(Ulid::new().to_string()),
        guidance: vec![ActivityGuidanceRef {
            kind: GuidanceKind::Rule,
            id: Ulid::new().to_string(),
            version: "rule-v3".into(),
        }],
        sources: vec![MutationSourceRef {
            kind: "telegram_message".into(),
            id: "-100123:456".into(),
            version: None,
        }],
        approved_plan_id: Ulid::new().to_string(),
        approved_plan_digest: "a".repeat(64),
        operations: vec![ActivityOperationResult {
            operation_id: "update-task".into(),
            kind: "update_task".into(),
            target_id: Some(target_id),
            changed: true,
        }],
        result: ActivityApplyResult::Applied,
        recovery: ActivityRecoveryAvailability::Available,
        compensation: None,
    };
    let recorded = store
        .record_activity_with_provenance(
            RecordActivity {
                source: ActivitySource::Mcp,
                action: ActivityAction::MutationApplied,
                entity_kind: ActivityEntityKind::Project,
                entity_id: Some(project_id.clone()),
                project_id: Some(project_id),
                reversible: true,
            },
            provenance.clone(),
        )
        .unwrap();

    assert_eq!(recorded.provenance.as_ref(), Some(&provenance));
    let activity_json =
        fs::read_to_string(store.root().join("integrations/activity.json")).unwrap();
    assert!(activity_json.contains(&provenance.approved_plan_digest));
    assert!(!activity_json.contains("PRIVATE TASK BODY"));
    assert!(!activity_json.contains("ghp_super_secret"));

    let reopened = Store::new(store.root()).unwrap();
    let page = reopened.list_activity(None, 10).unwrap();
    assert_eq!(page.events.len(), 1);
    assert_eq!(page.events[0].provenance.as_ref(), Some(&provenance));
}

#[test]
fn legacy_activity_without_provenance_remains_readable() {
    let store = temp_store();
    let project = store.create_project("Legacy activity").unwrap();
    store
        .record_activity(RecordActivity {
            source: ActivitySource::Mcp,
            action: ActivityAction::ProjectCreated,
            entity_kind: ActivityEntityKind::Project,
            entity_id: Some(project.id.clone()),
            project_id: Some(project.id),
            reversible: true,
        })
        .unwrap();

    let reopened = Store::new(store.root()).unwrap();
    let page = reopened.list_activity(None, 10).unwrap();
    assert_eq!(page.events.len(), 1);
    assert!(page.events[0].provenance.is_none());
}
