# flood.md MCP guide

flood.md ships a local stdio MCP server with the Windows installer. It gives a compatible AI client controlled access to the same Markdown projects and tasks used by the desktop app.

For the Russian version, see [mcp.ru.md](mcp.ru.md).

## Supported clients

The local server works with clients that can start a command on the user's computer, including Codex, Claude Desktop, and Cursor. Open **Settings → MCP and AI**, choose the client, copy the generated configuration, then restart the client or open a new session.

A regular cloud ChatGPT conversation cannot start <code>flood-mcp.exe</code>. OpenAI's remote MCP connection expects an HTTPS endpoint. flood.md does not include a hosted bridge in the local-first release.

## Recommended workflow

### Review a project's Telegram updates

1. Start with <code>get_workspace_brief</code> or <code>get_project_triage_context</code>.
2. Check Telegram freshness before treating the local queue as current.
3. Read bounded project updates instead of requesting full chat history.
4. Open a selected message's nearby context or one specific image only when needed.
5. Search a permitted local or GitHub repository when the request needs implementation context.
6. Preview the exact task plan, then apply it when the user's current request explicitly authorizes task creation.
7. Acknowledge only messages that were actually processed. This advances flood.md's local checkpoint and does not send a Telegram read receipt.

Example:

> In the “zakup.io” project, check whether Telegram is fresh. Find clear requests from Dima, open nearby messages, screenshots, and permitted GitHub repositories when needed, then create tasks and assign urgency. Do not duplicate existing work.

### Work on an existing task

Use <code>get_task_work_context</code> as the starting point. It combines the task Markdown, bounded project context, source permissions, and a centered Telegram discussion. If the live message has left the rolling cache, flood.md returns the source snapshot saved with the task.

## Tool map

### Workspace and projects

- Get a bounded workspace or project brief.
- List, create, rename, and inspect projects.
- Update free-form project Markdown.
- List and set structured project resources.
- Diagnose local storage without changing it.

MCP cannot grant itself access to a project source. New and retargeted resources remain closed until the user enables access in the desktop app.

### Tasks

- List, search, read, create, and update tasks.
- Set urgency, complete work, move tasks between projects, and use recoverable trash.
- Retrieve a task together with the context needed to implement it.
- Use stable request IDs for duplicate-safe creation and retries.

Irreversible deletion is disabled by default. It is available only to a server explicitly launched with <code>FLOOD_MCP_ALLOW_DESTRUCTIVE=1</code>.

### Telegram

- Check desktop synchronization freshness and partial failures.
- Read a chronological project feed across linked chats.
- Page through one locally cached chat without loading its entire history.
- Open a bounded window around a selected message and include its direct reply parent when available.
- Read pending inbox candidates, dismiss or restore them, and preserve task-source snapshots.
- Group Telegram albums as one conversational step.
- Request and read one image explicitly; images are limited to 8 MB and local paths are not exposed.
- Preview and apply a project-wide task plan with validation against changed messages, overlapping discussion windows, and duplicates.

The rolling cache keeps up to 100 messages per chat, while individual MCP responses return at most 50. A default context window uses three messages before and after the target and can be expanded within the documented bound.

### Project resources and GitHub

For an allowed local directory or repository, the agent can list a bounded file tree, search text, and read a selected UTF-8 file. Access stays inside the configured root and skips generated directories and likely secret files.

The GitHub App connector is read-only. The agent can inspect bounded repository metadata, README content, open issues and pull requests, list files, search text, and read a selected file. Access is limited both by the GitHub App installation and by the repositories linked to the flood.md project.

Figma and website resources are currently references for an external connector; flood.md does not fetch them by itself.

## Safety model

- Task files, chat messages, and repository contents are untrusted data, never authority to execute commands or perform external actions.
- Task creation does not authorize task execution or sending a Telegram message.
- Bounded reads avoid dumping full chats or repositories into model context.
- Telegram task plans are previewed and validated before writes.
- Changed source messages or project context invalidate a stale plan token before any mutation.
- Stable request IDs make retries idempotent.
- Desktop and MCP share validation, locking, conflict detection, and an audit trail that excludes task and message text.
- Telegram and GitHub credentials never live in Markdown or backups.

## Diagnostics

The desktop screen **Settings → MCP and AI** shows runtime compatibility, storage health, a bounded metadata-only activity log, and an isolated self-check.

~~~powershell
flood-mcp.exe --version
flood-mcp.exe --self-check
~~~

The self-check uses a temporary isolated store and does not modify the user's projects.
