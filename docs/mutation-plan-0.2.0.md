# Mutation Plan contract — 0.2.0

`MutationPlan` is the provider-neutral description of a meaningful change before it is applied. It lives in `flood-core`, so desktop, MCP, agent providers, connectors, and later automation can share the same content-binding rules.

The v1 contract records:

- stable `plan_id` plus caller-supplied `request_id`;
- initiator and target;
- expected entity versions;
- ordered operations and their payloads;
- affected entities, reasons, and source references;
- external-effect class, cost metadata, reversibility, and required approval level;
- optional expiry;
- `content_digest` covering all of the fields above.

`plan_id` is deterministic for the same request and exact plan content. Object-key order inside JSON payloads and order of set-like metadata do not change the digest. Operation order remains significant.

Changing payload, target/scope, expected version, effect/cost/reversibility/approval metadata, source set, or expiry changes `content_digest` and therefore `plan_id`. A `MutationConfirmation` contains the exact `plan_id` and digest. `verify_confirmation_at` rejects stale, altered, expired, or tampered plans.

Confirmation is only content binding. It is not a capability token and does not grant filesystem, connector, network, agent, or external-write authority. Every apply path must still run its existing access, scope, expected-version, and policy checks before the first write.

Existing simple local edits keep their current expected-version behavior. Stored Markdown formats do not change.

The shared lifecycle is now wired into two meaningful MCP mutation paths:

- `preview_project_workspace_item_update` returns a `MutationPlan`; its existing `preview_token` is the serialized confirmation for that exact plan. `apply_project_workspace_item_update` rebuilds the plan and verifies the token before calling `Store`.
- `preview_task_batch` validates the complete create/update/link/unlink batch without writing and returns the predicted outcome, `MutationPlan`, and `confirmation_token`. `apply_task_batch` accepts only the unchanged operations, expected versions, request ID, and token from that preview.

For task batches, preview is read-only, payload substitution is rejected as `preview_mismatch`, expected versions are checked again immediately before the atomic write, and an exact retry returns the original result with `repeated = true`. Cross-layer MCP coverage also verifies that an external task change after preview produces `conflict` and leaves the external value intact.

## Provenance audit

Every successfully applied meaningful MCP mutation also writes one `mutation_applied` activity event with an optional `provenance` object. The audit record contains only reconstruction metadata:

- initiator kind/provider and optional run ID;
- project guidance references (`kind`, `id`, `version`);
- source references by kind and stable ID;
- approved plan ID and digest;
- operation IDs, kinds, optional target IDs, and whether each operation changed data;
- aggregate apply result and recovery availability.

The provenance record deliberately excludes mutation payloads, task descriptions, message bodies, reasons, credentials, and secret values. Source messages are represented only by stable references such as `chat_id:message_id`.

Older `activity.json` entries remain valid because `provenance` is optional. Existing per-entity activity events are retained; the provenance event adds one human-readable reconstruction point for the approved apply without changing Markdown storage formats.

## Rollback and interrupted apply recovery

Versioned project workspace items and project memory entries can be restored to a retained revision through `Store` with the current `expected_version`. A rollback writes the restored value as a new version and preserves the value being replaced as another revision, so the rollback itself can be reversed. Existing Markdown formats do not change.

Task batch apply persists its recovery receipt before task writes. If the process stops after the receipt is durable, reopening the store deterministically reapplies the target task snapshots and finalizes the receipt. An ordinary in-process write failure first attempts to restore the original files; if that rollback cannot finish, the pending receipt remains and startup continues forward to the approved target state. Reopening an already finalized receipt is idempotent.

Mutation provenance also records compensation metadata. Local reversible mutations use `local_rollback`. A plan with an external write records `external_compensating_action` when compensation may be possible, or `unavailable` when the plan is irreversible. This is reconstruction metadata only; flood.md does not claim or perform rollback in an external system unless that provider supplies a real compensating operation.
