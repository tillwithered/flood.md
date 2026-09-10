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

## Why flood.md

Tasks often begin as a message, then disappear inside a busy chat. flood.md turns that message into a durable task while keeping the original author, date, text, and link as context.

- **Local-first:** readable `.md` files are the source of truth.
- **Telegram through TDLib:** connect a personal account directly, without a bot.
- **Project connections:** bind a project to one or several Telegram chats and choose a collection mode for each one.
- **Telegram inbox:** review mentions, replies, all new messages from selected chats, or messages added manually before turning them into tasks.
- **Source and media:** tasks preserve the original chat, author, date, message link, and media metadata; files are downloaded only on demand.
- **Focused editor:** Markdown, formatting, links, images, and local attachments.
- **Safe changes:** atomic writes, stable IDs, conflict detection, backups, and trash.
- **Agent-ready:** the bundled local MCP server uses the same task files.
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

The installer includes `flood-mcp.exe`, a local stdio MCP server with project, task, source, state, move, trash, and permanent-delete operations. It can also list and read Telegram inbox candidates, dismiss or restore them, and create an idempotent task with its source snapshot. Copy its configuration from **Settings → Integrations**. Desktop and MCP operations share validation, locking, and conflict rules.

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
