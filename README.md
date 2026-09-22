<p align="center"><img src="docs/assets/flood-mark.png" width="96" alt="flood.md" /></p>
<h1 align="center">flood.md</h1>
<p align="center"><strong>Your tasks, your files, your agent.</strong></p>
<p align="center">A quiet desktop workspace for projects and tasks. Keep work in local Markdown and let your agent work with the same context.</p>
<p align="center"><a href="README.md">English</a> · <a href="README.ru.md">Русский</a></p>
<p align="center"><a href="https://github.com/tillwithered/flood.md/releases/latest"><strong>Download for Windows</strong></a> · <a href="CHANGELOG.md">What's new</a> · <a href="docs/mcp.md">MCP guide</a></p>

## Less managing. More doing.

Open a project, see what needs attention, and get back to work. flood.md keeps the everyday interface small: a project switcher, task cards, and a command dock. No dashboard to maintain.

Use the app to capture and review work, or stay in your agent and manage projects and tasks through MCP. Both use the same local Markdown files.

- **A focused workspace.** Dark theme, open/urgent/closed task filters, and a task editor with subtasks and dependency context.
- **A command dock.** Open it with `Ctrl+K`, use `/` for quick actions, or attach a task and send a message to your selected agent conversation.
- **Context that stays with the project.** Add notes and optional sources; choose what the agent can read.
- **Files you own.** Readable Markdown, stable IDs, conflict detection, atomic writes, and recoverable trash. Core task management works offline.
- **English and Russian.** English is the default for new installations; change it in settings.

## Get started

1. Install the [latest Windows release](https://github.com/tillwithered/flood.md/releases/latest).
2. Create a project with a name and add your first task. No agent or external account is required.
3. To work with an agent, open **Settings → Agent** and connect Codex. flood.md detects the installed executable; you can select it manually if needed. Sign in when prompted.
4. Start a conversation in Codex, then select it in flood.md. The project remembers your choice. Open the dock with `Ctrl+K`, attach task context if useful, and send your request.

**Current desktop integration: ChatGPT / Codex.** Other built-in agent connections are not included yet. Automatic creation of Codex conversations is not supported: create the conversation in Codex first. Agent requests use your account's limits and require a connection.

## Work from your agent

The Windows installer includes a local MCP server, `flood-mcp.exe`. It gives compatible clients access to projects, tasks, and explicitly permitted project context. The Codex connection flow registers flood.md MCP; other local stdio clients require their own configuration.

For example:

> Show the urgent tasks in my website project. Read the context of the first one and suggest the next step.

MCP is the integration surface for external agents; the dock's built-in connection currently targets Codex. See the [MCP guide](docs/mcp.md) for protocol details and client setup.

## Optional sources

Telegram discussions, read-only GitHub repositories, local folders, and project notes can provide extra context. They are optional: you can use flood.md entirely as a local project and task workspace. Adding a source does not automatically grant the agent access to it.

## Your data

Projects and tasks are stored as Markdown with explicit YAML metadata:

```text
projects/<project-id>/project.md
projects/<project-id>/tasks/<task-id>.md
```

The default Windows data directory is `%APPDATA%\io.flood.desktop`; `FLOOD_DATA_DIR` can override it. flood.md does not require its own account or cloud backend. Sending a request or granting access to a connected agent can share the selected context with that provider. Local storage does not make cloud agent processing offline.

See [SECURITY.md](SECURITY.md) for credential handling and the trust model.

## Development


Requirements: Node.js 22, stable Rust, and the [Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/).

~~~powershell
npm install
npm run tauri dev
~~~

Official releases receive protected Telegram and updater credentials through GitHub Actions. Independent builds can leave <code>TG_API_ID</code> and <code>TG_API_HASH</code> unset and enter developer-owned values in the app.

~~~powershell
npm run check
cargo test --workspace
npm run tauri build
~~~

## Stack

Tauri 2 · Rust · Svelte 5 · TypeScript · Vite · TDLib · MCP · Markdown

## License

Source is available under the [PolyForm Noncommercial 1.0.0](LICENSE.md) license. Personal and other noncommercial use is permitted; commercial use requires separate permission from the copyright holder.
