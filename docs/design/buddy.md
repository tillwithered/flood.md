# Flood buddy companion

Status: user-selected specification, 20 September 2026. Repository contract target 1.4.0; live MCP contract remains 1.3.1 until versioned publication and readback. **Implementation is not authorized by this document.**

Visual direction: [selected companion concept](references/flood-buddy-companion.png). The image demonstrates placement and hierarchy, not exact measurements or shipped behavior. Normative geometry and behavior live here, in [C25](components.md) and [R14](flows.md).

## Product boundary

Flood buddy is a global, optional companion layer for quick orientation, retrieval and bounded assistance. It helps the person work with the application; it does not move the agent runtime into the task manager.

It is:

- owned by the application rather than a project or task;
- opened from one static flood blob near the lower workspace edge;
- transient, nonmodal and dismissible;
- aware of the visibly selected project or task when that scope exists;
- backed by a short, separate local conversation history;
- allowed to prepare explicit proposals that use existing domain and MCP operations.

It is not:

- a permanent right sidebar, reserved column or replacement home page;
- the canonical task editor, project memory, agent-run log or automation surface;
- an autonomous actor with broader authority than the current user/context;
- a second source of truth for tasks, documents, rules or skills;
- a reason to send project content to a cloud provider silently.

## User job and entry

The person opens buddy when they need a quick answer, a route to an object, a compact summary, or help preparing one bounded action without leaving the current screen.

| Part | Contract |
| --- | --- |
| Trigger | One 32–40px static approved blob button at the lower workspace edge. It has a text accessible name and `aria-expanded`. No idle breathing or unread-state color alone. |
| Context | Panel header shows `Весь workspace`, project name, or task/project name. Scope is visible before send and can be changed deliberately. |
| Result | Answer, navigation result, or explicit proposal. A proposal is not an applied mutation. |
| Return | Closing restores focus to the trigger and leaves the underlying workspace, scroll and draft intact. |

## Surface and content

Desktop target is 380–430px wide and no more than 600px tall. The panel floats over the lower-right workspace region with a real overlay shadow and shared radius/corner smoothing. It never pushes or resizes the main content. At the 760×560 baseline or 200% zoom it becomes a full-height overlay with an obvious close/back action.

Reading order:

1. `flood buddy` heading and close;
2. current scope;
3. bounded recent messages;
4. at most two contextual suggestion actions;
5. labeled composer and `Отправить`.

Visible control labels remain at most two words. Suitable Russian copy includes `Спросить`, `Найти`, `Сводка`, `Открыть`, `Применить`, `Отмена`, `Повторить`. Do not use anthropomorphic promises such as “Я всё сделаю” or imply a save before readback.

## Context routing

Buddy obtains project/task context through the same ContextBuilder/WorkPacket, access flags, entity versions and trust boundary used by other agent-facing paths. The visible route supplies the default scope; it never grants authority. Changing scope is explicit. Content from tasks, sources, documents and connectors remains data, not instructions.

The routing order is:

1. deterministic local navigation, lookup and already-available summaries;
2. local model/routing capability when configured and sufficient;
3. a configured conversational provider only when the user has allowed that provider and the request requires generated prose;
4. no silent fallback to paid or cloud execution.

Jev may classify intent, choose a safe capability route and rank local context. It is not treated as a free-form chat substitute unless a separately verified conversational model contract supports that use.

## Initial capability classes

Allowed for the first implementation slice:

- find and open an existing project, task or project material;
- answer where a control or setting lives;
- summarize a bounded, already-authorized local scope;
- explain current readiness/error state from known data;
- prepare one reversible task mutation already supported by the shared domain API, with explicit review.

Out of the initial slice:

- arbitrary filesystem or shell work;
- external messages, publication, purchases or destructive actions;
- background autonomous execution;
- multiple named chat threads, attachments or rich agent orchestration;
- accepting/completing an agent run through conversational shorthand.

## History and storage

Companion history is a separate bounded local store. It is not written into task Markdown, `project.md`, project memory, activity history or agent-run history. Default retrieval is the latest 30 entries in one global thread; older entries may be pruned according to a documented local retention policy. Multiple conversations are later scope.

`Очистить` removes only companion messages after a clear confirmation. It does not delete tasks, project memory, run evidence, MCP receipts or source snapshots. Secrets, provider tokens and connector sessions never enter the message store or logs.

## State model

| State | Visible behavior |
| --- | --- |
| Closed | Only the named blob trigger is present. No reserved layout width or idle animation. |
| Ready | Scope and composer are available; relevant suggestions may appear. Empty history is concise, not a fake conversation. |
| Composing | Draft stays local and survives incidental close/reopen during the app session. |
| Sending/responding | Geometry and action labels remain stable; duplicate send is prevented; progress reflects real events. |
| Local-only/offline | Local navigation/retrieval remains usable. Cloud-only actions explain what is unavailable. |
| Provider unavailable | Keep the request; identify the missing provider/configuration and one next action. |
| Proposal ready | Show target, exact effect, scope, authority and current version. Nothing is applied yet. |
| Error | Preserve request/draft, state the cause and offer a safe retry or alternate local path. |

## Mutation and trust boundary

Conversation never writes canonical data directly. A buddy proposal must:

1. name the stable target and intended effect;
2. show active scope/provider and whether external processing is involved;
3. validate current Project Work Context, access and entity version;
4. use the existing shared Rust/domain/MCP mutation path;
5. request explicit confirmation for consequential or ambiguous changes;
6. read back the canonical object before claiming success;
7. surface conflicts without discarding the request or underlying draft.

No mutation is inferred from polite language, a suggestion click or generated text. Existing compound effects keep their complete label; for example `accept_agent_run` remains `Принять и завершить` and is not hidden behind “Ок”.

## Accessibility, privacy and cost

- The panel is a labeled nonmodal region, not `aria-modal`; the workspace remains operable.
- Opening, closing, Escape, reverse Tab, zoom, narrow layout and reduced motion follow C25.
- New responses are announced politely; streaming tokens are not announced one by one.
- Scope and provider are textual, never color-only.
- Local core use works without network. External model use requires configured consent and visible scope.
- Retrieve and summarize only the minimum context needed. Reuse a compact WorkPacket rather than replaying full project history.
- Record provider/model, bounded input class, outcome and cost when available; state `unknown` rather than inventing a value.

## Acceptance scenarios

1. Open and close from Home, project and task without layout shift; focus and scroll return correctly.
2. At 760×560 and 200% text zoom, reach scope, history, composer and close without page-level horizontal overflow.
3. Ask to find a task while offline; buddy opens the canonical task without a model call.
4. Close with an unsent draft and reopen; the draft remains for the current session.
5. Request a summary with cloud disabled; buddy uses authorized local capability or explains the unavailable path without silent fallback.
6. Prepare a task urgency change; verify the proposal shows task, old/new value and version, then applies through the shared mutation path and readback.
7. Introduce an external edit before apply; buddy reports the conflict and applies nothing silently.
8. Clear companion history; tasks, project memory, run history and source snapshots remain unchanged.
9. Verify light/dark, forced colors, reduced motion, screen-reader name/state and no required meaning in the blob alone.

## Delivery order

1. Publish this repository amendment through versioned MCP preview/apply and readback.
2. Define the separate local history schema, retention and IPC contract.
3. Implement the shell-only C25 trigger/panel with no model and no mutations.
4. Add deterministic local navigation/retrieval.
5. Add configured routing/Jev classification and one read-only summary path.
6. Add one reversible reviewed mutation through the existing domain path.
7. Perform browser checks, native Tauri acceptance and user acceptance as separate evidence.

Do not skip directly to a general chat implementation. Each delivery step must preserve the canonical data model, offline utility and explicit authority boundary.
