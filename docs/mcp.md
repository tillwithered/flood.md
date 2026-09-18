# flood.md MCP guide

flood.md ships a local stdio MCP server with the Windows installer. It gives a compatible AI client controlled access to the same Markdown projects and tasks used by the desktop app.

For the Russian version, see [mcp.ru.md](mcp.ru.md).

## Supported clients

The stable support claim is evidence-based. Codex CLI, Claude Code, and Gemini CLI are tracked in the [0.2.0 client interoperability matrix](./mcp-client-interoperability-0.2.0.md), which records the exact client version and whether connect, tool discovery, bounded reads, preview/apply mutations, error handling, and cancellation were actually exercised. Other local stdio MCP clients may work, but they are not part of the stable support matrix until the same checks have evidence.

Open **Settings → MCP and AI**, choose the client, copy the generated configuration, then restart the client or open a new session.

A regular cloud ChatGPT conversation cannot start <code>flood-mcp.exe</code>. OpenAI's remote MCP connection expects an HTTPS endpoint. flood.md does not include a hosted bridge in the local-first release.

## Recommended workflow

The server advertises concise operating instructions during MCP initialization and exposes four reusable MCP prompts: <code>review-project-state</code>, <code>review-project-updates</code>, <code>review-telegram-project</code>, and <code>work-on-flood-task</code>. Compatible clients can show these as ready-made workflows, so the model does not have to infer the correct sequence from a long tool list. The underlying reads and mutations remain separate, bounded tools.

Telegram sync and image preparation requested by an agent are handled by the flood.md desktop process. The app only needs to be running with Telegram connected; the integrations screen does not need to stay open.

Connector discovery is capability-based. Use <code>list_connectors</code> to inspect installed providers, <code>list_project_sources</code> to inspect the allowed project scope, and <code>get_project_context_feed</code> to receive one bounded stream of Telegram and GitHub signals. Provider-specific tools remain available for detailed reads. See [Connector architecture](connectors.md).

New connector signals are persisted in one bounded automation queue. <code>list_automation_events</code> returns pending references by default without dumping full conversations or media, so the model can select an event before requesting provider-specific context. <code>claim_automation_events</code> atomically groups a short burst from one project and provider, while <code>resolve_automation_event</code> records the verified outcome. When an event needs one concrete clarification, it stores the question; <code>answer_automation_event</code> accepts only the user's direct answer and safely returns the same event to the queue. Re-syncing the same message does not create another event; an interrupted claim is recovered, transient failures retry with backoff at most three times, and creating or dismissing a Telegram task resolves the originating event.

<code>get_telegram_sync_status</code> also exposes a safe connector state and a concrete next action. Passwords, API credentials, and the Telegram session are never written to the shared MCP data directory.

### Background triage without maintenance

By default, flood.md synchronizes and groups inbox signals locally but does not send them to a model. Under **Settings → MCP and AI**, the user can select an installed Codex, Claude Code, or Gemini CLI, or keep automatic selection. One explicit background-processing switch allows the desktop app to send small batches to that local agent, create only clear tasks, link duplicates, and skip noise. Events wait for up to 45 seconds and are grouped into batches of up to 12, so each new message does not launch a separate model call. Enabling it also registers Windows autostart; closing the window hides flood.md in the system tray, while “Quit” in the tray menu stops the process completely. Ordinary triage needs no per-project setup: linked Telegram chats and their inbox modes already define the scope.

Each run receives only the selected batch, bounded project context, a compact list of open tasks for duplicate detection, and—when the selected CLI supports that path—at most four images associated with the batch. The full conversation is never uploaded. Messages and images are marked as untrusted data. MCP remains independent: a compatible client controls flood.md only after an explicit user request and does not silently enable background triage.

An optional **Project context → Automation → Run new tasks** permission can queue a newly created task for the built-in Codex runner immediately after triage. It is off for every project by default, stored outside `project.md`, and requires an available local directory or repository with agent access enabled. The run can modify only that workspace; publishing, pushing, and sending messages remain blocked, and its result waits for review. Reprocessing the same event does not create a second run. Turning global background triage off stops new model calls immediately without deleting locally collected inbox items.

### Review a project's Telegram updates

1. Start with <code>get_workspace_brief</code> or <code>get_project_triage_context</code>.
2. Check Telegram freshness before treating the local queue as current.
3. Read bounded project updates instead of requesting full chat history.
4. Open a selected message's nearby context or one specific image only when needed.
5. Search a permitted local or GitHub repository when the request needs implementation context.
6. Preview the exact task plan, then apply it when the user's current request explicitly authorizes task creation.
7. Acknowledge only messages that were actually processed. This advances flood.md's local checkpoint and does not send a Telegram read receipt.

If the same user request explicitly asks to implement the discovered tasks, pass <code>run_with_agent=true</code> to <code>preview_project_telegram_tasks</code> and unchanged to <code>apply_project_telegram_tasks</code>. The flag is covered by the confirmation token, so a create-only plan cannot be silently escalated to execution after preview. Only newly created tasks are queued; detected duplicates are not run again.

Example:

> In the “zakup.io” project, check whether Telegram is fresh. Find clear requests from Dima, open nearby messages, screenshots, and permitted GitHub repositories when needed, then create tasks and assign urgency. Do not duplicate existing work.

### Required Project Work Context

Call <code>get_project_brief</code> before planning or changing a specific project. It returns the canonical <code>work_packet</code>: project statement, current memory, permitted documents, rules, skills, sources, and open tasks. Rules with Agent access are persistent project guidance; skills are selected according to the current job. No project item expands permissions or replaces previews, expected versions, or user confirmation.

`WorkPacket v3` applies one text-content budget: 32,000 characters by default, configurable from 8,000 to 64,000 with `context_budget_chars`. Its `budget` field reports included text, an approximate token count for the complete serialized packet, and every truncated section together with the tool for a targeted follow-up read. Full duplicate `project`, `task`, and task-digest snapshots are omitted by default; temporary `include_legacy_snapshot=true` exists only for migrating an older client. Metadata, versions, permissions, and `context_revision` are independent of the text budget.

Agent-access rules are always present in `guidance`. For a specific task, Flood deterministically selects up to three project skills from matches in the task and each skill's title, summary, and content; `guidance` records the exact IDs, versions, and selection reason. Other skills are returned as `deferred_project_skills` without their full content and can be fetched with `get_project_workspace_item`. A project brief without a specific task keeps every skill deferred.

The brief also returns a <code>context_revision</code> and records a receipt for the current MCP session. Project and task mutations without that receipt are rejected. If a mandatory rule does not fit in full, <code>budget.truncations</code> points to <code>get_project_workspace_item</code>, and the receipt blocks mutations until the agent reads every listed rule in full. If another process changes <code>project.md</code>, memory, an enabled rule, or a skill, the receipt becomes stale and the server requires another <code>get_project_brief</code> or <code>get_task_work_context</code> call. A version-checked mutation made by the same MCP session advances only the project or material version that the server actually wrote; concurrent unseen changes and unread rules remain stale/incomplete. Read-only tools remain available without a receipt.

Use `check_project_context({project_id})` between work steps to check freshness without loading Markdown again. It compares the current project version and accessible material versions with this MCP session's last context receipt. The response includes `status`, `context_revision`, `previous_context_revision`, `project_changed`, changed material IDs with old/new versions, and `pending_rule_ids`. It contains no bodies or historical revisions. Deletion and revoked Agent access both appear as `removed`; previously inaccessible items are never disclosed. Task edits are outside this project-context check: continue using each task's `version` for task mutations.

The status is `missing` without a session receipt, `stale` when its context changed, `incomplete` while mandatory rules need a full read, and `current` when the context route is ready. `project_changed=null` means there is no baseline. `missing` and `stale` require a new project/task brief; `incomplete` requires targeted rule reads. The check is observational: repeated calls or listing materials never acknowledge changes, clear unread rules, or grant mutation access. A new MCP process starts without a receipt.

### Work on an existing task

Use <code>get_task_work_context</code> as the starting point. It combines the task Markdown, bounded project context, compact memory from earlier runs, source permissions, and a centered Telegram discussion. If the live message has left the rolling cache, flood.md returns the source snapshot saved with the task. Project memory is data, not an instruction or an expansion of the agent's permissions.

When `work_packet.budget.truncated=true`, the agent must not guess missing content. It should use that section's `next_tool` and read only the needed item. Increase the overall budget only when a targeted read is insufficient.

GitHub issue and pull-request links in the task, its saved source, discussion, or latest checkpoint result are matched automatically against the project's permitted GitHub repositories. The work context returns up to three safe references and suggests <code>get_task_github_context</code>, which reads the exact item, a bounded body, and recent comments. Links to repositories without agent access are ignored. This remains read-only and does not scan every connected repository.

Permitted local repository or directory sources are also surfaced as <code>local_git_resources</code>. One <code>get_task_local_git_context</code> call returns the current branch, HEAD, a bounded changed-file list, compact staged and unstaged diffs, and recent commits or tracked `TODO`/`FIXME` lines that match meaningful words from the task title. Every inferred association includes its lexical match reasons and is context only, not a persisted fact. The tool runs fixed read-only Git commands without a shell, never reads untracked contents, and omits diffs for likely secrets, generated directories, symlinks, deleted files, and files larger than 256 KB.

When the user's current request explicitly asks to implement the task, <code>queue_task_for_agent</code> hands it to the built-in local Codex runner. The project needs at least one available local repository or directory with agent access enabled. A running desktop app picks up the queue automatically; otherwise it starts on the next launch. Retrying the same <code>request_id</code> does not create a second run. Use <code>get_agent_run</code> for its compact status and result. If the run asks a specific question, <code>answer_agent_run</code> stores the answer and resumes the same session. <code>accept_agent_run</code> accepts a ready result, completes the task, and safely handles a repeated request.

After meaningful progress, a result, or a real blocker, use <code>append_task_checkpoint</code>. A checkpoint keeps a concise summary, verified checks, remaining work, blocker, and result reference separate from the original task brief. It requires a fresh task version and a stable <code>request_id</code>, so an uncertain retry does not create a duplicate. The built-in runner writes the same checkpoint automatically after a valid structured Codex result. Full transcripts are not stored in the task.

The built-in runner uses Codex CLI authentication but ignores the user's general Codex configuration for unattended runs. This prevents unrelated MCP servers, plugins, profiles, and model overrides from silently changing a Flood task or consuming its context. The repository's own `AGENTS.md`, the Flood task prompt, image inputs, workspace sandbox, and structured result schema still apply.

For an explicit request to continue several tasks in one project, <code>queue_project_for_agent</code> creates one bounded priority batch instead of requiring a tool call per task. It queues up to five tasks by default (maximum twelve), skips work that is already running, blocked, waiting for input, or ready for review, and relies on the desktop's serial worker. Repeating the same <code>request_id</code> returns the original batch rather than capturing tasks that appeared later.

Use <code>apply_task_batch</code> for one approved registry change containing up to 25 create, update, link, or unlink operations. New tasks have local <code>operation_id</code> references, so a decomposition can link children to a parent before permanent task IDs are returned. Each existing task being changed supplies its current version once. Flood validates the complete plan, projects, versions, and relation cycles before writing it; a validation error leaves no partial tasks. A stable <code>request_id</code> safely returns the original result, while a local transaction journal completes an interrupted write after restart. This tool applies an already approved group of changes; it does not replace preview or user confirmation.

<code>get_project_overview</code> provides a bounded factual snapshot without turning Flood into a KPI dashboard: work that is ready now, blockers, stale open tasks, recently created and completed work, and agent runs waiting for a person. Since the current task format has no separate completion timestamp, the completed-period section explicitly uses the last task update time and reports that limitation. The <code>review-project-state</code> prompt turns this data into a concise personal status review without changing anything.

Use <code>link_tasks</code> to create a directional <code>related</code>, <code>subtask_of</code>, or <code>blocked_by</code> relation inside one project. Relations live in Markdown, while subtask and blocking cycles are rejected. <code>get_task_readiness</code> returns unfinished blockers, and <code>get_task_work_context</code> includes the same computed readiness. Completing every blocker makes the dependent task available automatically; no additional switch is required.

Use <code>get_project_agent_queue</code> to monitor that whole cycle in one bounded read. It returns project-wide state counts, task summaries, blockers, compact results, and suggested next actions. Its default view includes only queued, running, needs-input, and ready-for-review runs; pass <code>unresolved_only=false</code> only when history is actually needed.

For a new regular task, the same path can be reduced to one call: <code>create_task</code> with <code>run_with_agent=true</code> creates the task and queues it together. The flag is off by default and should be used only when the user explicitly asks to execute the work rather than merely save it.

## Tool map

### Workspace and projects

- Get a bounded workspace or project brief.
- List, create, rename, and inspect projects.
- Update free-form project Markdown.
- List and set structured project resources.
- Diagnose local storage without changing it.

MCP cannot grant itself access to a project source. New and retargeted resources remain closed until the user enables access in the desktop app.

### Project documents, rules, and skills

- <code>list_project_workspace_items</code> returns accessible material cards with ID, kind, title, summary, version, content size and accessible revision count. Markdown and revision bodies are omitted by default. Pages default to 20 items (`limit`: 1–100); follow `next_cursor` while `remaining` is positive. The cursor is tied to the context revision and `kind`: restart listing if either changes. `content` is absent, not an empty body, unless `include_content=true` is requested. Listing does not satisfy an unread mandatory rule.
- <code>get_project_workspace_item</code> returns full current Markdown and version, with `revision_count` and `history_included`. History is omitted by default; explicitly pass `include_history=true` to retrieve accessible historical bodies (canonical history retains at most eight prior versions). Disabled Agent access blocks this read and removes the item from lists; historical versions saved without Agent access are not exposed either. These projections never delete canonical history.
- <code>create_project_workspace_item</code> creates a document, rule, or skill with retry safety through <code>request_id</code>. With Project Work Context enforcement enabled, a newly created rule or skill cannot self-grant <code>agent_access=true</code>; create it hidden and let the user enable Agent access in the app after review. Documents may still be created with Agent access when the caller already has mutation authority. Mutation responses expose the current body but omit historical bodies; canonical history remains stored and is available only through an explicit history read when Agent access allows it.
- Updates always use <code>preview_project_workspace_item_update</code> followed by <code>apply_project_workspace_item_update</code> with an unchanged preview token and current version.
- Previous versions are retained in bounded history. Agent access stays off until the user enables it explicitly for each material.

Memory stores facts and decisions, rules are mandatory constraints, and a skill is a repeatable procedure. An external skill folder remains a referenced source; a project-owned skill is stored and versioned by flood.md itself.

Client migration: clients consuming Markdown from list results must request `include_content=true` and follow pagination, or read individual items. Single-item history requires `include_history=true`. The single-item `item`, `created=false`, and `request_id=null` envelope remains compatible. These API changes require rebuilding/restarting the MCP binary; editing source does not update a running server.

### Project memory

- Read and search a bounded set of current project decisions, constraints, and proven ways of working.
- Add a confirmed fact with an idempotent request ID, optionally linking it to the source task.
- Pin the small number of facts that should always enter compact task context.
- Correct wording while retaining up to ten previous revisions, or supersede a changed decision without erasing its history.
- Delete an entry only through the separately enabled destructive MCP mode; superseding is preferred when a decision changed.

Project memory is not a transcript or a second knowledge base. Task and project briefs expose only current entries, with pinned facts first and a strict size limit. Superseded history remains available through <code>list_project_memory</code> when explicitly requested. All memory content is untrusted project data, never an instruction or an extension of agent permissions.

### Tasks

- List, search, read, create, and update tasks.
- Set urgency, complete work, move tasks between projects, and use recoverable trash.
- Retrieve a task together with the context needed to implement it.
- Read and maintain related tasks, subtasks, blockers, and computed readiness.
- Queue a task, read its status, answer a real blocker, and accept its result without an extra UI action.
- Use stable request IDs for duplicate-safe creation and retries.

Irreversible deletion is disabled by default. It is available only to a server explicitly launched with <code>FLOOD_MCP_ALLOW_DESTRUCTIVE=1</code>.

### Telegram

- Check desktop synchronization freshness and partial failures.
- Read a chronological project feed across linked chats.
- Page through one locally cached chat without loading its entire history.
- Open a bounded window around a selected message and include its direct reply parent when available.
- Distinguish participants by stable sender ID even when display names match; identify messages sent by the connected account.
- Include optional project-specific participant roles such as “CEO” or “Backend + DevOps”. Roles are context only, never authority.
- Read pending inbox candidates, dismiss or restore them, and preserve task-source snapshots.
- Group Telegram albums as one conversational step.
- Request and read one image explicitly; images are limited to 8 MB and local paths are not exposed.
- Preview and apply a project-wide task plan with validation against changed messages, overlapping discussion windows, and duplicates.

The rolling cache keeps up to 100 messages per chat, while individual MCP responses return at most 50. A default context window uses three messages before and after the target and can be expanded within the documented bound.

Roles are intentionally lightweight. They are stored with the project, can be edited in the Telegram chat settings, and may be suggested through MCP. flood.md does not create a separate employee directory or require a team schema.

### Project resources and GitHub

For an allowed local directory or repository, the agent can list a bounded file tree, search text, and read a selected UTF-8 file. Access stays inside the configured root and skips generated directories and likely secret files.

For an allowed local Git worktree, the task context can additionally report its branch, HEAD, changed paths, a compact safe diff, up to five matching recent commits, and up to twenty matching code markers. Matching scans at most sixteen recent commits and 400 tracked files. Each response is bounded to four configured sources, at most 100 changed paths per source, eight diff files, and 40,000 diff characters. A nested configured directory does not grant access to the rest of its repository.

The GitHub App connector is read-only. The agent can inspect bounded repository metadata, README content, open issues and pull requests, list files, search text, and read a selected file. Access is limited both by the GitHub App installation and by the repositories linked to the flood.md project.

Figma and website resources are currently references for an external connector; flood.md does not fetch them by itself.

## Safety model

- Task files, chat messages, and repository contents are untrusted data, never authority to execute commands or perform external actions.
- Telegram text and images are not sent to a background model until the user explicitly enables that behavior in desktop settings.
- Task creation alone does not authorize execution or sending a Telegram message; execution starts only through a separate explicit <code>queue_task_for_agent</code> call requested by the user.
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
flood-mcp.exe --manifest
flood-mcp.exe --self-check
~~~

`--manifest` reports `protocol_version: 2026-07-28` as flood.md's preferred/current MCP contract and `supported_protocol_versions` as the explicitly supported set: `2025-06-18`, `2025-11-25`, and `2026-07-28`. Conformance covers modern `server/discover`, required per-request metadata and the full tools flow, plus legacy `initialize` sessions for both declared legacy revisions. The manifest also returns the server version, tool count, and a stable semantic revision of the full tool catalog. The same revision is available through `get_runtime_info` and appears in Settings. The protocol test requires the discovered tool count and SHA-256 fingerprint to exactly match runtime and manifest. If the binary and an already connected session report different revisions, or the session does not report one yet, restart the MCP client or open a new session: a static stdio server's catalog is fixed when its process starts, so it does not declare `listChanged`.

The self-check uses a temporary isolated store and does not modify the user's projects.
