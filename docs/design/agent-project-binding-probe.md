# Agent project and task binding — local capability probe

Date: 2026-09-22. This is research evidence, not a shipped integration contract.

## Installed protocol

The installed Codex CLI exposes `project/list`, `project/read`, `project/create`, `project/import`, `project/update`, `project/move` and `project/delete` in its generated experimental JSON schema. `project/create` requires `idempotencyKey`, `name` and `roots` and accepts string metadata. `thread/start.projectId` assigns a durable conversation to a project; `thread/metadata/update.projectId` can change an existing assignment.

The schema was generated with `codex app-server generate-json-schema --experimental`. Do not infer support on other Codex versions; capability detection is required.

## Observed results

- An external stdio App Server accepted initialize, thread/start, thread/name/set and turn/start. A synthetic read-only request completed with `FLOOD_APP_SERVER_OK`.
- The desktop app's read-thread API read that same saved user turn and answer after the external server exited. Thread: `01a0c7b7-ded7-7f82-8f99-40fb77061086`.
- A synthetic project was created with idempotency key `flood-project-probe-20260922`, metadata `flood_project_id=synthetic-integration-probe`, and the existing dedicated probe directory. Returned project: `01a0c7b8-adce-7970-9ad3-37c84d6abd25`.
- A new conversation started with that projectId and returned the same projectId. Its completed synthetic turn was readable by the desktop API. Thread: `01a0c7b8-add5-73b1-a294-c679945f0876`.
- The desktop app's saved-project list did NOT return the newly created server project during this probe. Visible sidebar registration/grouping remains unverified. Do not advertise automatic sidebar mirroring yet.
- Starting an empty thread, even naming it, did not produce a readable durable rollout after process exit. The completed first turn did. A production implementation must not claim delivery or persist an unusable destination merely because thread/start returned an ID.

No real flood projects or tasks were mirrored. Synthetic probes used a read-only sandbox and requested no tools or file changes.

## Follow-up: durable bootstrap is not automatic execution

An external App Server accepted `thread/inject_items` with synthetic project-context data and persisted the previously empty conversation without starting a model turn. After server exit, `codex queue` accepted a message for conversation `01a0c7c0-f4a7-7e22-8b1f-915277566176`, queue ID `01a0c7c1-276b-72b0-a4a5-acbb4dbb0d65`. Desktop readback still showed no turns and `notLoaded`. Therefore queue acceptance does not demonstrate automatic execution in a newly bootstrapped conversation. The generated protocol also has `thread/queue/start`, but runtime ownership, approval delivery and desktop adoption remain unverified. This bootstrap MUST NOT be substituted for the requested automatic workflow.

Native verification is blocked: the Windows runtime fails at initialization with a missing-path error, and CUA exposes only browser surfaces. The application compiles and its desktop process runs, but that is not evidence for native interaction or cross-application execution ownership.

## Proposed product mapping

Keep flood project/task IDs as the source of truth. Store an optional provider-neutral binding `{ provider, project_id, conversation_id }` on a task, with a separate project-to-provider-project mapping. A task can continue its own conversation; creating a task must never automatically start model work. Create the conversation on the user's first send, reuse it afterward, and retain the draft on failure. Do not copy task status from conversation completion.

Project grouping can be enabled only after native sidebar compatibility is verified. Until then, conversation linkage and sidebar mirroring are separate capabilities.

Reference: [official App Server documentation](https://learn.chatgpt.com/docs/app-server). Installed generated schemas are the evidence for the experimental project methods absent from the general documentation.
