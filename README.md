<p align="center"><img src="docs/assets/flood-mark.png" width="144" alt="flood.md logo" /></p>
<h1 align="center">flood.md</h1>
<p align="center"><strong>A calm, local task manager for work that starts in chats.</strong></p>
<p align="center">Telegram messages become focused Markdown tasks — without bots, accounts, or cloud storage.</p>
<p align="center"><a href="README.md">English</a> · <a href="README.ru.md">Русский</a></p>
<p align="center">
  <a href="https://github.com/tillwithered/flood.md/releases/latest"><img alt="Latest release" src="https://img.shields.io/github/v/release/tillwithered/flood.md?style=flat-square"></a>
  <img alt="Windows" src="https://img.shields.io/badge/Windows-10%2B-111111?style=flat-square">
  <img alt="Tauri 2" src="https://img.shields.io/badge/Tauri-2-111111?style=flat-square">
  <img alt="Local first" src="https://img.shields.io/badge/data-local--first-111111?style=flat-square">
</p>

See [what changed in 0.1.4](CHANGELOG.md).

## Why flood.md

Tasks often begin as a message, then disappear inside a busy chat. flood.md turns that message into a durable task while keeping the original author, date, text, and link as context.

- **Local-first:** readable `.md` files are the source of truth.
- **Telegram through TDLib:** connect a personal account directly, without a bot.
- **Project connections:** bind a project to one or several Telegram chats and choose a collection mode for each one.
- **Telegram inbox:** review mentions, replies, all new messages from selected chats, or messages added manually; shape a concise task title, notes, and urgency before creating it. Telegram albums stay grouped and their media is downloaded into the task automatically. Background inbox and media synchronization is serialized, observable in Settings, and reports partial failures instead of silently dropping them.
- **Source and media:** tasks preserve the original chat, author, date, message link, and media metadata; files are downloaded only on demand.
- **Focused editor:** Markdown, formatting, links, images, and local attachments.
- **Safe changes:** atomic writes, stable IDs, conflict detection, backups, and trash.
- **Agent-ready:** the bundled local MCP server uses the same task files.
- **Controlled AI triage:** agents receive bounded inbox batches, preview a plan, and must present a confirmation token before applying it.
- **Operational visibility:** Settings show storage health, Telegram synchronization, MCP readiness, attachment cleanup, and a bounded audit trail without task text.
- **Offline core:** projects and tasks remain usable without Telegram or a network.

## Install

Download the Windows installer from [the latest release](https://github.com/tillwithered/flood.md/releases/latest). Windows 10 or newer is recommended.

On first launch, open **Settings → Integrations → Telegram** and sign in with a QR code or phone number. The official build already contains application-level Telegram credentials; users do not need to create a Telegram application.

## Privacy and security

- Task content and Telegram sessions stay on the user's device.
- flood.md does not require an account or cloud backend.
- Telegram application credentials are injected only during the official GitHub Actions build and are absent from source control.
- The release binary contains an obfuscated application hash. Like every desktop credential, it cannot be made impossible to extract from a user-controlled machine.
- User authorization sessions live in TDLib's encrypted local database, outside Markdown and backups.
- Task content is never treated as an instruction to an agent or sent to external AI services automatically.

See [SECURITY.md](SECURITY.md) for vulnerability reporting and the trust model.

## Data format

Projects live in `projects/<project-id>/project.md`; tasks live in `projects/<project-id>/tasks/<task-id>.md`. YAML front matter stores explicit metadata and the body remains ordinary Markdown:

```markdown
---
format_version: 1
id: 01M21AQN9P0XMQBS39VNP0FK13
project_id: 01M21AQMP5ZW06S6DXVAX8P1MF
created_at: 2026-09-08T20:18:14Z
updated_at: 2026-09-08T20:18:15Z
urgency: important
status: open
source:
  text: Review the build before Friday
  author: Anna
  url: https://t.me/example/42
---

Review the release build
```

The default Windows data directory is `%APPDATA%\io.flood.desktop`. Set `FLOOD_DATA_DIR` to use another location.

## Local MCP server

The installer includes `flood-mcp.exe`, a local stdio MCP server with project, task, source, state, move, and recoverable trash operations. Irreversible deletion is disabled by default; it can only be enabled for an explicitly launched server with `FLOOD_MCP_ALLOW_DESTRUCTIVE=1`. The server can also list and read Telegram inbox candidates, dismiss or restore them, and create an idempotent task with a concise title, optional notes, urgency, and its source snapshot. Processed candidates expose the linked task's title, urgency, and live completion state so an MCP client can distinguish pending work from work already done.

For agent-assisted triage, `get_telegram_sync_status` reports when the desktop app last synchronized Telegram and whether that run succeeded, partially failed, or failed, so an agent can refuse to treat a stale local queue as current. `list_telegram_chats` and `read_telegram_chat` let the agent open a linked chat, read its latest locally cached messages, page backward, or request only messages newer than a remembered message ID. `read_project_telegram_updates` provides the more human starting point: one chronological “what is new in this project?” view across its linked chats, fairly bounded to 25 chats and 50 messages. It reports a per-chat acknowledgement boundary but never advances it itself. Telegram content is explicitly marked as untrusted project data: it can inform task extraction, but cannot grant the agent authority to execute instructions or perform external actions. For a single-chat loop, `read_telegram_updates` starts with a recent bounded window and later returns only messages beyond flood.md's local agent checkpoint; `acknowledge_telegram_updates` advances that checkpoint after the model actually processes a batch without sending a Telegram read receipt. The cache keeps a rolling window of 100 messages per chat and each MCP response is limited to 50, avoiding a full-history dump. `get_telegram_triage_batch` returns a compact page of pending candidates; for a selected candidate, `get_telegram_candidate_context` returns its saved conversation window with an available direct reply parent, album grouping, authors, timestamps, links, and media metadata. The agent can also use `create_task_from_telegram_discussion` to turn any selected target message plus up to 20 relevant surrounding messages into one idempotent task, even when the discussion never entered the automated inbox. The resulting Markdown task preserves the ordered conversation and gathers all selected media for local download. A multimodal agent can request one specific screenshot from either the ordinary chat timeline or a candidate through `request_telegram_image`, wait for the authorized desktop TDLib client to prepare it, and receive actual MCP image content from `read_telegram_image`. Images are limited to 8 MB, the cache is capped at 20 requests and excluded from backups, and local file paths are not exposed. The same timeline is visible in the desktop review flow and remains attached to the resulting Markdown task. A triage plan must pass through `preview_telegram_triage`; only the returned token can authorize that exact, still-current plan in `apply_telegram_triage`. Every candidate receives an independent result, and retries remain observable and idempotent. The desktop inbox mirrors this review model with multi-select, preserved drafts, undo for dismissals, bounded history, and a sequential task composer.

`get_workspace_brief` provides a bounded start-of-session view with storage readiness, priority work, Telegram freshness, recent metadata-only activity, and suggested next tools. Every `project.md` can also contain a free-form Markdown context below its title; it can be edited directly from a project's **Context** action or through `update_project_context`, with conflict protection in both cases. `get_project_brief` combines that Markdown with a bounded open-task digest, linked Telegram chat checkpoints, and sync freshness so an agent can begin from one project-sized context instead of broad workspace reads. This is the local place for project purpose, repository paths, design links, constraints, and conventions—never secrets. `get_runtime_info` reports the running server version, data folder, capabilities, and safety mode. `diagnose_store` reports local storage health without changing data, while `run_self_check` exercises the full task lifecycle in an isolated temporary store. The desktop app runs the same check through the actual bundled executable in **Settings → MCP & AI**, where ready-to-copy Codex, Claude, Cursor, and manual configurations are available. Project and task creation require a stable `request_id`, preventing duplicates after timeouts or uncertain retries. When MCP creates a task, the running desktop app downloads its Telegram media immediately; otherwise it resumes that work on the next launch. Desktop and MCP operations share validation, locking, conflict rules, and an audit trail that intentionally excludes task and message text.

For packaging and diagnostics, `flood-mcp.exe --version` prints the server version and `flood-mcp.exe --self-check` prints the isolated check result as JSON without starting the stdio transport.

## Development

Requirements: Node.js 22, stable Rust, and the [Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/).

```powershell
npm install
npm run tauri dev
```

For independent builds, leave `TG_API_ID` and `TG_API_HASH` unset and enter your own credentials in the app. Official releases receive them from GitHub Actions Secrets during compilation.

```powershell
npm run check
cargo test --workspace
npm run tauri build
```

## Stack

Tauri 2 · Rust · Svelte 5 · TypeScript · Vite · TDLib · MCP · Markdown

## License

Source is available under the [PolyForm Noncommercial 1.0.0](LICENSE.md) license. Personal and other noncommercial use is permitted; commercial use requires separate permission from the copyright holder.
