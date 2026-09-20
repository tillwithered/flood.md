# Project Context ownership and lifecycle — 0.2.0

This document fixes the ownership and canonical lifecycle of Project Context before the context compiler and UI grow further. `flood-core::Store` is the canonical read/validation/mutation boundary for persisted project data. Desktop and MCP may add presentation or policy, but they must not maintain an independent copy or editor for the same state.

## Ownership boundaries

| Owner | Canonical state |
| --- | --- |
| Global | connected accounts/providers, installed app capabilities, language/theme, application permissions, background-AI enablement and provider choice |
| Project | project brief, resources/integration scope, Documents, Memory, Rules, Skills, project automation policy, project-facing audit/history |
| Task | task Markdown and metadata, source snapshot, relations, checkpoints, agent runs and their results |
| Transient run | drafts, previews, selections, validation results, queue/claim state and other disposable execution state |

Transient state may point at canonical entities and versions. It never becomes a second source of truth.

## Canonical artifact matrix

| Artifact | Source of truth | Stable identity and version | Canonical mutation path | History / restore | MCP contract | Canonical desktop surface |
| --- | --- | --- | --- | --- | --- | --- |
| Project brief | `projects/<project>/project.md` via `Project` | project `id`; project `version` covers brief, resources and memory | `Store::update_project*` / `Store::set_project_resources` | external edits are reread; stale writes fail by `expected_version` | readable in project brief/work packet; mutations use the same Store version checks | Project Context → Overview |
| Documents | project-owned Markdown workspace item | item `id` + item `version` | `Store::{create,update,delete}_project_workspace_item*` | bounded `revisions`; restoring a revision is a normal update against the current version | explicit list/read; update uses preview/apply policy and cannot bypass Store version checks | Project Context → Documents → shared Artifact Modal |
| Rules | same workspace-item storage and lifecycle as Documents | item `id` + item `version` | same shared workspace-item Store path | same bounded revisions and restore-as-update behavior | readable only when Agent access allows it; enabled Rules are always included as project guidance | Project Context → Rules → shared Artifact Modal |
| Skills | same workspace-item storage and lifecycle as Documents | item `id` + item `version` | same shared workspace-item Store path | same bounded revisions and restore-as-update behavior | selected/deferred by context policy; a Skill never grants permissions or bypasses mutation gates | Project Context → Skills → shared Artifact Modal |
| Memory | `Project.memory` inside canonical `project.md` | memory entry `id`; concurrency is guarded by parent project `version` | `Store::{add,update,mark_stale,supersede,delete}_project_memory*`; agent output remains a proposal | edited text keeps bounded entry revisions; stale/supersede preserve the old fact and an explicit reason; supersede points to the replacement | only active entries enter bounded project context; agent suggestions use the same proposal review/apply path | Project Context → Memory |
| Integrations / resources | account/credential connection is global; the selected project scope is `Project.resources` plus project connector links | resource `id`; project `version` guards scope changes | global connector settings use their connector/settings path; project resource bindings use `Store::set_project_resources` and dedicated project-link mutations | no parallel editor or shadow copy; changes are represented by current project state and audit events | only explicitly allowed project resources enter agent context; `agent_access` is a read boundary, not write permission | Project Context → Integrations |
| Automation | global provider/triage settings live in `integrations/automation-settings.json`; `ProjectAutomationPolicy` is project-owned policy stored in that protected settings document | project policy keyed by `project_id`; settings carry their own update timestamp rather than project Markdown version | global settings via `Store::set_background_ai_triage` / `set_automation_provider`; project policy via `Store::set_project_auto_run` | audit/activity describes changes; runtime queue/events are transient execution records and do not replace policy | MCP/agents may observe applicable policy/context; project materials and skills cannot self-enable automation or expand permissions | Project Context → Automation for project policy; Settings for global automation/provider controls |
| History | derived audit/activity plus bounded revisions attached to canonical artifacts | event/revision identity belongs to the underlying record | written only as a consequence of canonical mutations | read-only explanation/recovery surface; it is never edited as primary data | read-only activity/history tools; historical bodies obey the artifact's current access rules | Project Context → History for project artifacts; Settings → MCP and AI for runtime audit |

Documents, Rules and Skills are one artifact family. They have one storage model, one Store CRUD path and one desktop Artifact Modal. The kind changes context semantics, not ownership or editing infrastructure.

## Permission invariants

Reading context never grants write authority. `agent_access` only controls whether material may be included in agent-readable context. Write authority still comes from the caller/tool contract, current project-work-context policy, preview/approval requirements where applicable, and the canonical Store version check.

Rules with Agent access are always-on guidance within the project scope. Skills are optional procedures selected for the current work. Neither Rules nor Skills can expand filesystem, connector, mutation, approval or user-granted permissions. A newly created Rule or Skill cannot use its own content to grant itself access.

Global integration connection and project integration selection are deliberately separate: connecting an account does not attach all of its data to every project, and selecting a resource for a project does not grant the agent permission to mutate that external system.

## Version, conflict and restore rules

All persisted edits go through `Store`. When an artifact has a `version`, writers must send the version they read; external or parallel changes make that write fail with `StoreError::Conflict`. Callers then reread and let the user reconcile instead of silently overwriting disk state.

Workspace-item and Memory history belongs to the canonical object. Restoring historical content means applying that content as a new current mutation against the latest version, so the restore itself participates in normal validation, conflict detection and history. History views must not become independent editable copies.

Knowledge proposals are persistent review records, not shadow copies. They bind an exact base version and, for agent-created proposals, the source run whose immutable turn receipt produced the suggestion. The proposal itself has a content-derived version: Apply/Reject must echo the exact reviewed version, so a changed payload requires a new review. Apply also rechecks the target base version; reject preserves the decision. Neither accepting an AgentRun nor rendering a diff applies the proposal.

## Surface invariant

Each entity has one canonical desktop editor. Other surfaces may summarize, deep-link, preview or show history, but must not maintain a second mutation flow for the same state. In particular, project-owned Skills in the shared Artifact Modal are distinct from external Skill-folder references under Integrations/resources: the former are owned Markdown artifacts; the latter are project bindings to externally owned material.

## Verification anchors

- `crates/flood-core/tests/external_conflict_recovery.rs` covers external edits, conflict detection, reread and retry for project/task/workspace Markdown.
- `crates/flood-core/src/store.rs` fixtures cover versioned workspace items and bounded/versioned project Memory.
- `crates/flood-mcp/src/project_context_tests.rs` covers project-context reads, access filtering, Rule/Skill self-grant prevention, history exposure rules and stale parallel context.
- `src-tauri/src/lib.rs` exposes desktop Project Context commands as thin calls into the same `Store`; `src/App.svelte` uses one Artifact Modal for Documents, Rules and Skills and preserves local drafts when a Store conflict is returned.

