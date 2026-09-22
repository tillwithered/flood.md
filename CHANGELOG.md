# Changelog

## 0.2.1 — 2026-09-22

- Restore the dock glass material in collapsed and expanded states using a separate translucent blur layer with standard rounded corners.
- Add an explicit manual release option for user-authorized hotfixes without tests; regular releases retain the CI gate.

## 0.2.0 — 2026-09-22

### Desktop workspace

- Simplified dark desktop interface, project task filters and quieter task cards.
- Centered task editor with a floating summary, subtasks and dependency context.
- Translucent command dock with slash commands, task context and Ctrl+K support across keyboard layouts.
- Project creation now starts with a name; Telegram, GitHub and local folders remain optional sources with explicit agent access.
- Refined application and project settings, dialog focus and draft preservation.

### Codex connection

- Detect the installed Codex CLI and its ChatGPT authorization; offer browser sign-in when needed.
- Register flood.md MCP through the connection flow and select existing conversations by name instead of entering IDs.
- Send explicitly submitted dock messages to the selected Codex conversation, preserving uncertain-delivery handling.
- Creating a new Codex conversation automatically is not supported yet; start it in Codex first.

### Maintenance

- Preserve conflict-safe local Markdown editing and Windows line-ending compatibility.
- Scope CI checks to affected application layers, with full checks for shared dependencies and CI changes.
- Keep internal design documents and development skills out of the application source distribution.

## 0.1.6 — 2026-09-12

### Telegram hotfix

- Fixed a Windows release-only stack overflow that could close flood.md immediately after Telegram two-factor authentication and on every later launch.
- Reduced large TDLib chat values before asynchronous suspension and boxed Telegram IPC futures, keeping chat listing and search off the desktop UI thread's limited stack.
- Existing Telegram sessions, project links, messages, media, and Markdown tasks remain intact; reconnecting the account is not required.

## 0.1.5 — 2026-09-12

### GitHub connector

- Added a first-party read-only GitHub App connector with desktop device authorization, OS credential storage, expiring-token refresh, installation-aware repository discovery, and explicit project linking.
- MCP can now retrieve a bounded repository tree, read selected UTF-8 files, search code, and open a compact README/issues/pull-request context only for repositories the user explicitly grants to the agent.
- Unified integration cards and moved Telegram and GitHub setup into spacious modal workspaces with shared status, action, error, and privacy patterns.
- Kept authorization dialogs stable during code selection, added an explicit copy state and a clear post-authorization confirmation before repository selection.
- Fixed repeated Telegram connector management after linking a chat: legacy sync-status files no longer crash the modal, the project picker returns to the connector workspace, stale overlay state is cleared, and conflicting saves are prevented.
- Telegram chat selection now shows the real chat avatar, chat type, username, and a stable ID fallback, making channels, groups, and direct messages with identical titles distinguishable.
- Scoped operating-system credentials to the GitHub App Client ID, with automatic migration from the earlier local credential names, so official builds and self-built forks cannot reuse each other's sessions.
- Official builds accept the public GitHub App Client ID and app slug through GitHub Actions variables; forks can configure their own GitHub App locally without a client secret.

### Agent workflow

- Added a project-wide Telegram triage context that combines unread chat updates, existing tasks, project notes, permitted local sources, and permitted GitHub repositories without dumping full histories.
- Added bounded neighboring-message and MCP image flows so multimodal agents can inspect the discussion and screenshots behind a potential task.
- Added stale-plan-safe batch creation and a task work-context entry point. An explicit create request may now preview and apply in one turn, while review-only requests remain read-only.
- Added ready-to-copy prompts for the complete “review chat → inspect project context → create prioritized tasks” and “open task → inspect source → help execute” workflows.

## 0.1.4 — 2026-09-11

### Telegram workflow

- Added a bounded Telegram inbox with mentions, replies, linked-chat messages, manual import, search, multi-select, preserved drafts, undo for dismissals, and paged history.
- Telegram albums stay grouped, source metadata remains attached to the task, and media downloads are resumed safely without duplicate Markdown inserts.
- Synchronization is serialized and observable, with explicit success, partial, error, stale, queued, and waiting-for-desktop states.

### MCP and AI

- Added bounded task search, priority digests, inbox triage batches, and a compact workspace brief so agents do not need to load the full workspace or chat history.
- Telegram triage now requires a preview and a confirmation token tied to the exact current plan before any mutation is applied.
- Project and task creation now require a stable `request_id`, making uncertain retries idempotent and preventing duplicate files and audit events.
- Added runtime compatibility checks, isolated self-checks, workspace readiness, attachment audits, Telegram sync requests, and a bounded metadata-only activity journal.
- Development MCP connections now launch an isolated temporary binary, so local Rust rebuilds are no longer blocked by an active client.

### Desktop, data, and UX

- Expanded the Settings workspace and separated General, Appearance, Data, Integrations, MCP & AI, and About sections.
- Replaced constrained native dropdown flows with project chat and Telegram inbox dialogs designed for longer lists and strategic actions.
- Improved source review, media handling, modal focus containment, first-run guidance, command palette, updater diagnostics, installation identity, and shortcut recovery.
- Enforced a 12 px minimum interface font size and reused flood.md material glyphs for product states.
- Hardened local state size limits, backup extraction, attachment paths and cleanup, atomic Telegram configuration, conflict detection, and recoverable task storage.

### Privacy

- Task and message text is excluded from the MCP activity journal.
- Telegram sessions, user credentials, signing material, and internal development guidance remain outside the repository and Markdown task data.
