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
