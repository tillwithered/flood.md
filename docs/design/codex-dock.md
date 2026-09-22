# Dock and optional Codex delivery — first-release interaction contract

Date: 2026-09-22. Status: user-approved release constraints; local dock implementation revised after feedback, not release-accepted in Tauri. This scoped amendment supersedes earlier multi-provider, light-theme and flood-buddy directions for the first release. Live MCP rules remain at their recorded versions; this document does not claim publication there.

GitHub decision and acceptance tracker: [flood-dev #136](https://github.com/tillwithered/flood-dev/issues/136), linked from the [release master #11](https://github.com/tillwithered/flood-dev/issues/11). Repository documents are local changes until separately committed/published.

## Release decision

### Current refinement — settings and concise commands

This refinement supersedes conflicting composition/binding details below. The Dock contains the neutral prompt, `/ Команды`, task attachment, a provider selector and send. There is no plus button, connection form, routine keyboard-help row, command description, or focus ring around the whole Dock. Individual keyboard controls retain focus indication. Provider setup and project conversation bindings live on the application settings page, under `Агенты`. A missing destination exposes a settings recovery action; unavailable delivery never looks ready.

Commands are `/task`, `/project`, `/attach`, `/settings`. `/task <title>` prefills the local creation form. Unknown slash commands never leave the app. The menu uses compact single-line rows and supports arrow keys, Enter and Escape. Settings return preserves the message draft and refreshes its configured conversation.

Settings and project-context section introductions and empty-description placeholders have been removed. Actual permissions, error recovery, data-loss confirmations and user-authored descriptions remain.

Browser verification covered the actual Dock and settings component, invalid/valid destination input, return with preserved draft, `/task <title>`, and the real application settings route. `npm run check` passed with zero errors/warnings; Vite build passed with its existing large-chunk advisory. Native Tauri acceptance remains open.

Automatic project creation and task-level conversation routing are research only: see [the App Server probe](agent-project-binding-probe.md). A server-side project identity is not yet evidence of desktop sidebar mirroring. Do not ship the probe as automatic routing.

Mobbin reference for the compact composer footer: [ChatGPT](https://mobbin.com/screens/b08b256c-07cf-474d-9dc1-14c5dc992c4f).

### Completion audit, continuation on 2026-09-22

- Implemented: concise Dock commands, no plus button, neutral prompt, provider picker, settings-owned connection form, no composer-wide focus ring; descriptive clutter removed from settings and project context. Error recovery and access consequences remain.
- Corrected after inspection: provider-picker toggle, stale saved feedback in settings, and cached destinations after another project's binding is edited. Draft content remains independent of routing refresh.
- Checks: `npm run check` passes with zero errors/warnings. `cargo build -p flood-desktop` succeeds with existing LNK4098 linker warnings. The resulting executable starts (observed PID 24268). Process startup is not visual acceptance.
- Still incomplete: one-time agent setup followed by automatic conversation routing. Current settings still require a conversation binding per project. The App Server probe is evidence for a future implementation, not that implementation.
- Still unverified: native Dock/settings/project-context appearance and interactions. Windows automation initialization fails before execution with a missing-path error; CUA exposes no native app surfaces even after the desktop process starts. Browser component screenshots cannot close this gate.

The user goal remains active. Do not mark it complete from passing static checks or the server experiment.

### Settings follow-up

**Latest dock ownership correction:** removed the project-conversation entry from global settings. The dock requests its conversation on first send if none is bound; its current project is supplied automatically, the stored binding is reused, and the agent menu permits changing that binding. Saving reloads the dock's routing without replacing its message draft. Automatic creation/routing of Codex conversations remains unverified and is not claimed. The settings back control sizes to its content instead of stretching across the grid.

**Latest refinement:** the user named OpenCode, ChatGPT, Anthropic/Claude, OpenRouter, Gemini and Cursor as references, explicitly retaining Codex as the only execution connection. The main agent page now has compact connection/status/action rows; MCP configuration and project conversation forms open shared modals. The journal stays on demand and automation is a directly available switch. Modal conversation drafts survive close/reopen within the session, while reopening refreshes delivery locks. The ordinary desktop window is the verification target.

Reference observations: [Claude connectors](https://mobbin.com/screens/e6ade293-ed67-4901-8d3c-4196c31b842e) pairs each application with a status and action; [Cursor settings](https://mobbin.com/screens/9aceddd3-c4e7-4dfe-9091-db34a68f8eaa) groups controls by purpose. These informed the composition; additional provider integrations were not added. Browser verification at 1180×760 covered modal opening, Escape/return focus, invalid conversation validation and draft retention with synthetic project data. Svelte checks pass; native acceptance remains unavailable due to the previously verified Windows automation initialization failure.

**Current user amendment:** settings navigation is `Приложение`, `Агенты и MCP`, `Интеграции`, `Данные`. The combined agent section owns connection, project conversations, copyable MCP configuration, an on-demand activity journal and optional automation. Remove readiness dashboards, example prompts and capability/safety inventories from settings rather than hiding them. Integrations contains actual connected applications (currently Telegram and GitHub), not agent onboarding. Earlier navigation inventories below are historical.

The subsequent user request targets Settings specifically. The navigation landing screen has been replaced with three persistent destinations: `Приложение` (motion, version, updates), `Агенты` (connection, optional manual routing and diagnostics), and `Данные` (storage, attachments, trash and backups). Desktop navigation is a compact left column; at narrow widths it becomes a wrapping row. Section selection resets content scroll. Agent status refreshes on entry and on explicit refresh. Existing destructive confirmations and backend operations are retained.

Verified in the actual browser-rendered application: navigation, appearance at 760×560, and motion preference persistence after reload. The displayed fallback version now comes from package metadata. Svelte checks and Vite build pass. Native file dialogs, agent setup and backup/restore remain unverified in this environment; no claim of native acceptance is made.

- Ship a dark-only application. No theme switch or automatic system-theme selection in the first release. Preserve accessible focus and forced-colors support.
- Support Codex desktop as the only agent integration initially, with the user's existing Codex account. The Dock is agent-neutral: `Что нужно сделать?`, `Сообщение агенту или команда`, `Подключить агента`. Codex names only the actual provider in destination/setup/delivery feedback. Sending to arbitrary ChatGPT conversations is not established.
- Stabilize and ship this workflow before adding other providers or agent clients. Existing adapters can remain internal; they are not exposed or required for release.
- Keep local projects/tasks and Markdown/MCP usable without Codex, a login or network. AI is optional.
- Preserve the current simplification: project selector in the page header, task filters All/Urgent/Closed, project settings and New task; application settings in the titlebar. No global search, all-project task page, or permanent chat column in this slice.

## Job and ownership

The dock is an application-owned entry to quick actions. The user can create a local task or project through dedicated modal forms, or open the message field directly by clicking the dock or pressing Ctrl/Cmd+K. The dock does not represent Codex itself. Destination, message draft and selected task context belong to the project. Codex owns execution, permissions and canonical conversation history. flood.md owns local tasks and their actual persisted state.

Affected contracts: C01/C02 shell/header, C23/C24 agent actions, C25/R14 companion entry and R12 run feedback. Rules: CTX-02/03, PRD-01/03/04/05, INT-01/02/03, DAT-01 and human–agent trust. This release replaces the buddy's separate conversation history with a bound Codex destination; it does not implement the previous buddy runtime.

## Dock composition

The composer is available immediately, with an explicit collapse action. Its collapsed capsule contains only the prompt/draft or unresolved-delivery indicator and Ctrl K. No plus button.

```text
╭──────────────────────────────────────────────────────────╮
│ Project                                          collapse │
│ [Selected task · remove]                                 │
│ What needs doing?                                        │
│ / Commands  [attach]             Provider · Chat ▾ [send] │
╰──────────────────────────────────────────────────────────╯
```

Product copy is Russian: `Что нужно сделать?`, `/ Команды`, `Подключить агента`. The actual destination still names Codex, currently the only supported adapter. Do not add fake provider choices.

- Expanded width up to 720px; collapsed width up to 520px; both bounded by viewport minus 32px. Neutral translucent surface, quiet border, no logo, gradient or opaque band under the dock.
- The apron owns project identity and an optional removable task chip. The project label identifies the current location; it does not mean the whole project is attached. Task payload preview remains explicit.
- Input focus is represented by the dock boundary, without an inner rectangular textarea outline. Other fields have a single focus border; buttons retain visible keyboard focus. Forced colors preserve explicit outlines.
- Input grows to a bounded height. Actual dock height drives task/editor bottom clearance. Only tasks scroll under the fixed page header.
- Context, binding and command panels share header/body/footer structure. Header/close and footer actions remain visible while only the body scrolls. In very short viewports panels cover the dock rather than extend beyond the window.
- Enter inserts a newline; Ctrl/Cmd+Enter sends. In the slash menu, arrows select and Enter executes a local action; Shift+Enter remains a newline. Escape closes the panel before collapsing the dock. Clicking outside dismisses panels but retains the composer.
- No progress state is inferred from queue acknowledgement. Unknown delivery stays unresolved until deliberately inspected; rebinding is blocked during uncertainty.

## Local commands

| Command | Effect |
| --- | --- |
| `/task` | Open the existing new-task form in the current project |
| `/project` | Open the existing project-creation form |
| `/attach` | Pick an existing project task as message context |
| `/connect` | Open conversation binding |

Typing `/` or activating `/ Команды` opens a searchable list. Filter by command or Russian title. These operations do not call a model or consume model usage. Menu actions preserve ordinary message drafts; choosing a typed slash command consumes only its command query. Unknown slash commands are never dispatched to the agent. Arguments such as `/task title` are not parsed in this slice.

## Reference and disclosure decisions

Reviewed through Mobbin on 2026-09-22: [Notion action search](https://mobbin.com/screens/a5f6de01-073b-4448-bc15-7203c9af6f8b) shows a compact searchable action list; [ChatGPT attachments](https://mobbin.com/screens/44b29d9d-a4dc-4a4b-aee3-520332c67284) shows removable context above the input. Flood borrows these relationships, not the products' branding, provider features or broad command catalogs. Capture dates are unknown.

Always visible: current project, input, commands, attachment entry and actual destination/connect control. On demand: local forms, task search/preview, connection details and diagnostics. Omitted: plus menu, fake agent transcript, voice, arbitrary file upload, shell commands and model settings. Sending a message does not create or complete a task automatically.

## Binding and context

1. With no binding, retain editable draft, show `Подключить агента` and omit the ordinary send action. The destination dialog accepts a copied conversation URL or UUID.
2. Bind an existing conversation deliberately. The user may enter a local title; stable conversation ID is the key. External listing, metadata and navigation still require capability verification before implementation.
3. One default conversation per project initially. Changing the selected project restores that project's own draft, attachment selection and destination. Never send an old project's draft into a new project's conversation.
4. Before dispatch, freeze destination/project IDs and the submitted text/context. Subsequent navigation cannot retarget an in-flight message.
5. Only explicit message text and selected task context leave flood.md. Do not silently attach all tasks, documents, source snapshots or memory. Attached task preview names the project and shows the payload; source snapshots are excluded unless deliberately included.
6. At first connection explain that messages/context go to Codex, execution uses its configured account and usage limits, and permissions are managed there. Do not request an API key or promise zero-cost inference. No repeated confirmation for ordinary sends to the selected destination.

## Honest states and recovery

| Observed condition | Copy and behavior |
| --- | --- |
| Missing Codex or incompatible CLI | `Codex недоступен` → `Настроить`; preserve draft; local tasks remain available |
| Bound, ready | Named destination and enabled send for nonempty text |
| Submitting | `Отправляем…`; block duplicate activation; preserve payload until acknowledgement |
| CLI acknowledges queue insertion | `Отправлено в Codex`; this alone proves neither execution nor completion |
| Queue state actually observed | `В очереди`; show cancellation only if a verified cancellation operation exists |
| Execution actually observed | `Codex работает`; stop/answer links route to Codex until external control is verified |
| Permission/question observed | `Нужен ответ в Codex` → `Открыть Codex`; do not approve automatically |
| Completion actually observed | `Ответ готов` → `Открыть Codex`; no automatic task completion |
| Explicit rejection before enqueue | `Не отправлено`; preserve text, show reason and deliberate retry |
| Timeout/crash with uncertain delivery | `Доставка не подтверждена`; inspect queue/conversation before retry; never resend silently |
| Readback unavailable | Retain last confirmed delivery state and say `Статус недоступен`; do not synthesize progress |
| Missing/archived destination | Preserve draft; offer destination repair; never silently pick a different conversation |

Persist a bounded local delivery receipt with request ID, destination, queue ID when returned and confirmed state. It is not a second transcript or an independent task store. Clear only the acknowledged submitted revision; preserve edits typed during the request. Durable drafts must survive restart before the product promises recovery. A local duplicate guard is not a claim that `codex queue` supports transport-level idempotency.

## Verified experiment and limits

On 2026-09-22 a disposable conversation was created with the Codex app tool. A separate CLI process ran `codex queue --thread <id> --message <test> --sandbox read-only`; it returned a queue message ID. A later Codex app read showed that exact user message and the completed response `FLOOD_EXTERNAL_OK_20260922` in the same conversation. No tools were used by the test agent.

This establishes external sending to an existing conversation on this installed version. It does **not** establish external conversation creation/listing, portable application discovery, live subscriptions, cancellation, automatic desktop launch, closed-app behavior or compatibility with other versions. Reading the result used a Codex-internal tool; flood.md still needs a supported external readback path. The initial shared-daemon version probe could not connect; it is not a verified transport for this design.

First integration slice: explicit existing-conversation binding → dispatch → honest delivery acknowledgement. Rich progress/result states are enabled only as external capabilities are verified. Do not ship decorative fake states.

## Acceptance and release gates

- Real Tauri send reaches the chosen Codex conversation; the same user message and answer are visible there.
- Switching projects, changing destination mid-request and typing during send never loses or misroutes text.
- Double-click, restart, timeout and lost acknowledgement do not silently duplicate execution.
- Codex closed, unavailable, signed out, usage-limited, archived destination and incompatible version preserve useful drafts and expose recovery. Establish actual behavior; do not infer it from the happy-path test.
- Verify external enumeration/readback/open/stop independently; keep unsupported controls absent or explicitly routed to Codex.
- Verify selected context payload and no unselected private content; no credentials in logs/Markdown.
- Dark-only UI, keyboard, minimum window, 200% text, contrast, blur fallback and last-task visibility pass native review.
- Offline local create/edit/complete and UI/MCP external-edit conflict scenarios still pass.
- Desktop/native acceptance and RC dogfood remain release requirements. This document and the CLI experiment are not native acceptance.

## Implementation progress — 22 September 2026

A first local implementation slice now fixes the application to dark theme, mounts a persistent Dock whose contents follow the active project, saves each project's message draft/binding/selected task locally, and queues an explicit message through the installed `codex queue` CLI. After feedback, the resting dock follows the wider glass reference: clicking it or pressing Ctrl/Cmd+K opens the input, while `+` opens real modal forms for local task/project creation. The expanded Dock is wider and available in project and task views. Its apron identifies the current view separately from the attached task. Binding accepts a copied link or ID of an existing conversation because external conversation listing remains unverified. The composer reports only CLI queue acknowledgement, rejection or unknown delivery; it does not infer execution or completion. An interrupted submission becomes unknown on restart and requires inspection in Codex before a deliberate retry. Selected task Markdown is previewed and sent only after explicit attachment. Returning from settings resets the project view before the dock is shown.

The changed code passes `npm run check`, `npm run build`, `cargo check -p flood-desktop` and the focused destination-validation test. The dock was visually inspected in a Tauri debug window with a synthetic 16-task project at 760×560; the final task scrolls above the dock and the project header remains visible. Evidence: [native capture](evidence/native-codex-dock-760.png). A real queue-to-conversation test from the Tauri dock, external readback, closed/signed-out/limit cases, restart delivery checks, 200% text and full keyboard review remain open. This section records implementation progress, not release acceptance or publication of the live MCP contract.

The subsequent `Dock.svelte` rename, 720px expanded layout, context apron and task-view placement pass `npm run check` and `npm run build`. The earlier capture predates these changes. This iteration has **not** been visually accepted in the native window; native narrow-window, keyboard, task-editor scroll and send checks remain open.

### Dock refinement — 22 September, follow-up

The latest component opens directly into the composer; explicit collapse remains available and clicking the workspace only dismisses auxiliary popovers. The apron shows the project and an optional removable task chip, with the exact outgoing task payload available on demand. The footer has local actions, attachment, destination and send/connect. The list/editor bottom clearance follows the actual dock height. Ctrl/Cmd+K works in project and task views; Escape inside Dock does not navigate the task editor away.

The inspected [ChatGPT Mobbin screen](https://mobbin.com/screens/44b29d9d-a4dc-4a4b-aee3-520332c67284) places removable attachments above the input. That relationship informs the task chip; its sidebar, voice and research features are not adopted. This is a reference observation, not native acceptance.

Delivery safeguards retain submitting state while a user types, reject an oversized composed payload before invoking the CLI, prevent rebinding during unknown delivery, and report local draft persistence failures. The existing CLI transport is unchanged. Browser checks use the real component with synthetic data at `.artifacts/dock-review.html`: per-project draft switching, reload recovery of draft/attachment, exact context preview, binding validation, menu keyboard activation and 760×560 layout. `npm run check` has no errors/warnings. Native inspection was blocked by the Windows computer-use kernel initialization failure; no new Tauri send, external history/listing or native acceptance is claimed. Manual conversation link/ID binding remains a known onboarding limitation.

### Slash-command refinement evidence

The user explicitly requested agent-neutral copy and removal of the confusing plus control. The updated Dock implements the local commands above, consistent popup geometry, one focus boundary per field and visible popup footer actions. Browser checks on the actual component verified command filtering, arrow/Enter execution, unknown-command non-dispatch, preservation of an ordinary draft through a local action, per-project separation, and layouts at 760×560 and a 380×280 stress viewport (not a claim of 200% native zoom acceptance). Svelte checks and production build pass; the bundle-size advisory remains. Native automation still fails to initialize its kernel, so new Tauri interaction/send acceptance remains unverified.

### Settings restoration — 22 September 2026

Settings now keep five visible destinations: Application, Agents, Integrations, MCP and Data. Telegram and GitHub retain their existing connection dialogs. MCP configuration supports Codex, Claude, Cursor and manual setup; this does not add execution adapters beyond Codex. System checks and the activity journal are directly accessible, with the long journal constrained to a scrolling region. Examples and capability documentation stay collapsed. Background automation is discoverable even when disabled, without changing its saved value. Data recovery, backups, storage and updates remain available. Dock settings opens Agents.

Browser verification on the real application at 1280×720 and 760×560 covered navigation, both integration dialogs without credential submission, MCP client switching and clipboard output, and the disabled automation setting. The GitHub mark is now readable on the dark surface; the duplicate empty-journal explanation was removed. Native authentication, filesystem operations and visual acceptance in Tauri are not claimed: the Windows native automation kernel is unavailable. This is an implemented, browser-verified slice, not release acceptance.

### Combined agent settings — subsequent user correction

Implemented the amendment above. Removed the readiness dashboard and its entry-time self-check invocation, example prompts and capabilities markup. Configuration no longer inherits a disclosure border crossing its heading. Automation uses the shared switch layout without the conflicting legacy row class; its cost consequence is one sentence. App integrations retain real actions/statuses and short descriptions. MCP client selection uses pressed buttons with visible focus; changing selection clears old copy acknowledgement.

References inspected: [Linear coding tools](https://mobbin.com/screens/332e33ea-6a11-476e-9442-06d1ec5a49bb) for compact application/status rows; [Mintlify MCP settings](https://mobbin.com/screens/ef5226b5-56b8-41c3-86ec-b6d62f0dffb0) for adjacent client selection and configuration; [OpenCode MCP documentation](https://opencode.ai/docs/mcp-servers/) for the distinction between a client configuration and provider connection. No new execution adapter or OpenCode compatibility is claimed.

Verification: Svelte/design/font-floor checks and production build pass. Actual browser application inspected at 986×914 and 760×560; combined navigation, configuration heading, integration cards, automation disclosure, Enter activation of client selection/journal and copied JSON verified. Native automation initialization was retried and failed before execution with Windows missing-path error. Tauri visual acceptance remains open.
