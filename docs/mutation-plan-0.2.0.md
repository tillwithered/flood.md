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

Existing simple local edits keep their current expected-version behavior. The first integration test binds the new contract to the existing atomic task-batch semantics: exact retry stays idempotent, changed payload under the same request is rejected, and stale expected versions fail before a batch write. Preview/apply surfaces can migrate to the same contract incrementally without changing stored Markdown formats.
