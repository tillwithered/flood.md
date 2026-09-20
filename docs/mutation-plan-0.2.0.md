# Mutation Plan contract — 0.2.0

`MutationPlan` is the provider-neutral description of a meaningful change before it is applied. It lives in `flood-core`, so desktop, MCP, agent providers, connectors, and later automation can share the same content-binding rules.

The v1 contract records:

- stable `plan_id` plus caller-supplied `request_id`;
- initiator and target;
- expected entity versions;
- ordered operations and their payloads;
- affected entities, reasons, and source references;
- external-effect class, cost metadata, reversibility, optional compensating actions, and required approval level;
- optional expiry;
- `content_digest` covering all of the fields above.

`plan_id` is deterministic for the same request and exact plan content. Object-key order inside JSON payloads and order of set-like metadata do not change the digest. Operation order remains significant.

Changing payload, target/scope, expected version, effect/cost/reversibility/approval metadata, compensating actions, source set, or expiry changes `content_digest` and therefore `plan_id`. A `MutationConfirmation` contains the exact `plan_id` and digest. `verify_confirmation_at` rejects stale, altered, expired, or tampered plans.

Confirmation is only content binding. It is not a capability token and does not grant filesystem, connector, network, agent, or external-write authority. Every apply path must still run its existing access, scope, expected-version, and policy checks before the first write.

Existing simple local edits keep their current expected-version behavior. Stored Markdown formats do not change.

The shared lifecycle is now wired into two meaningful MCP mutation paths:

- `preview_project_workspace_item_update` returns a `MutationPlan`; its existing `preview_token` is the serialized confirmation for that exact plan. `apply_project_workspace_item_update` rebuilds the plan and verifies the token before calling `Store`.
- `preview_task_batch` validates the complete create/update/link/unlink batch without writing and returns the predicted outcome, `MutationPlan`, and `confirmation_token`. `apply_task_batch` accepts only the unchanged operations, expected versions, request ID, and token from that preview.

For task batches, preview is read-only, payload substitution is rejected as `preview_mismatch`, expected versions are checked again immediately before the atomic write, and an exact retry returns the original result with `repeated = true`. Cross-layer MCP coverage also verifies that an external task change after preview produces `conflict` and leaves the external value intact.

## Recovery and rollback

Task-batch journal format v2 persists an exact original Markdown snapshot plus original and target digests for every changed task before the first task write. If the process stops before the commit receipt is durable, `Store::new` restores only artifacts that are still at the known original or target version and removes the unfinished v2 receipt. Unknown newer content produces `conflict` instead of being overwritten. An exact retry with the same `request_id` can then apply the approved plan again.

A committed v2 receipt retains its snapshots for `Store::rollback_task_batch`. Rollback first persists `rollback_in_progress`, then restores the exact previous Markdown bytes or removes tasks created by the batch, and finally persists `rolled_back`. Startup completes an interrupted rollback deterministically. The preflight refuses unknown newer versions before the first restore write. It also refuses to remove a batch-created task when a task outside the receipt gained a relation to it after apply, so rollback cannot leave dangling references. Repeated rollback is idempotent. Legacy v1 pending receipts remain readable and keep their previous deterministic roll-forward recovery behavior; committed v1 receipts cannot claim automatic rollback because they do not contain original snapshots.

`MutationPlan.compensating_actions` carries content-bound provider/action/target metadata when an external write may need a compensating action instead of a transactional rollback. The field is optional and omitted when empty, so existing v1 plan digests without compensation remain stable. The metadata is descriptive only: it never claims that a provider supports rollback or grants authority to perform the compensating action.

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
