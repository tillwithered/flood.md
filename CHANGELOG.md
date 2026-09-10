# Changelog

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
