# Product principles and ownership

## Direction

flood.md is a local desktop workspace for personal tasks organized by project. Its core promise is quick capture, clear next action, durable readable files and trustworthy assistance. The user-selected direction is [Quiet Workbench](quiet-workbench.md), **utilitarian minimalism**: useful information, quiet structure, predictable actions and deliberate density. It is not achieved by shrinking text, hiding controls or painting every surface gray.

The blobs remain a distinctive brand asset. Their evolution belongs to [brand language](brand.md); they must not compensate for weak information architecture. Retain Golos Text as the available Cyrillic-capable baseline while the new direction is tested. A new font requires an explicit comparison and decision; it is not necessary to make the interface useful.

## Decision order

1. Preserve data and explain the operation.
2. Make the next action and current location apparent.
3. Make content readable and interaction accessible.
4. Reuse an established component and composition.
5. Add brand expression only where it serves identity or feedback.

If decoration competes with the task title, source, error or next action, remove the decoration. If minimalism removes essential meaning, restore the meaning.

## Ownership matrix

| Owner | Belongs here | Does not belong here |
| --- | --- | --- |
| Application | Window controls, storage location, appearance, global integration account, MCP readiness, transient flood-buddy companion | Per-project source selection or task-specific editing |
| Project | Task overview, project statement, context documents/rules/skills, selected sources and access | Credentials, global account login, team hierarchy |
| Task | Description, urgency, open/completed state, creation date, source snapshot, task-related run/result | New required priority systems, arbitrary workflow statuses |
| Agent run | Agent/provider identity, progress, question, result, changes, stop/retry/review | Authority over other projects or task completion inferred from progress |
| Source | Provenance, permission, connection/freshness state | Permission to execute its content as instructions |

Global account connection is different from granting access to a project source. Read permission differs from mutation permission. Store these distinctions in behavior and show them at the decision point.

## Primary journeys

- Open a project and identify the next task without opening every row.
- Capture a task with a project and description; date is automatic, urgency defaults to normal.
- Open, edit and complete a task without a wizard.
- Return to the same useful list position after editing.
- Recover from a failed save or external file change without losing a draft.
- Read the source snapshot even when Telegram is unavailable.
- Optionally delegate work, inspect its result and decide what to apply.

Task states remain **open/completed**. Urgency remains **normal/important/urgent**. “Мой фокус”, “Делегировано” and “Требует решения”, when used, are derived views of work, never new persisted task statuses. Existing advanced integrations remain secondary capabilities; this contract does not authorize expansion of the first-version scope.

## Navigation and hierarchy

Keep projects in the sidebar and project tasks in the working area. `Главная` summarizes work as vertical project shelves with horizontal task strips; it does not replace each project's canonical task list. A project label opens its task list. Do not render task trees or duplicate the current task index in the sidebar. `Настройки проекта` is a full page owned by that project with exactly two top-level destinations: `Контекст` and `Интеграции`. Global settings own application-wide concerns.

Use four distinct zones: window chrome; view title/actions; working content; temporary detail/review layer where needed. Each action has one primary location. Keep task operations in the established top action area; metadata above the editor is descriptive. Do not add a permanent agent chat column. The approved flood-buddy is a dismissible application-owned companion layer and never reserves workspace width.

One clear heading and one primary action per active local workflow; a destructive confirmation can temporarily own its own primary action. Do not repeat the same explanatory title in every nested group. Project lists use a bounded 880–960px role; R02 Home may use up to 1040px for its horizontal shelves. Readers and project/application settings retain 720px. The expanded sidebar targets approximately 224px. Independent settings tabs span the workspace.

The compact project header has one count, primary `Новая задача`, quiet `Настройки проекта` and overflow for rare actions. No hero header, permanent edit/delete strip, repeated ordinary-urgency badges or blob-per-row treatment. Keep task titles dominant; show important/urgent labels explicitly and preserve ordinary urgency in the editor.

## Progressive disclosure matrix

Use this matrix before adding an element. **Always visible** means present when its stated condition exists, not an empty placeholder on every screen. **On demand** requires a visible, named, keyboard-accessible entry point. An overflow menu must not hide failed persistence, conflict, an agent question or a consequential pending decision.

| Concern | Default surface | On demand | Omit from the resting surface |
| --- | --- | --- | --- |
| Location | Current project/page title and selected project | Search and other project destinations | Task tree duplicating the working list |
| Task index | Completion, dominant title, important/urgent label when applicable | Full task and optional source details | Normal-urgency badges, repeated project/open labels, uniform age labels |
| Project actions | One New task action and quiet Context link | Rename/delete in a named overflow menu | Persistent management strip or another competing Create button |
| Completed work | A collapsible Completed group when it has content | Its rows after expansion | Empty group headings and completed work before open work |
| Task editing | Description, project context, save/pending/conflict feedback | Rare move/delete, detailed source inspection | A permanent formatting sidebar or fields with no current use |
| Project materials | Named index entries and useful summaries/access signals | One shared artifact editor; history/preview within it | Multiple open editors in the index or a card per metadata field |
| Agent work | Actual question, running work or review decision near its task | Provenance, detailed diff and logs | Empty agent sections, an always-on chat panel, speculative progress |
| Companion | One small global trigger; current scope when open | Bounded recent history, suggestions and explicit proposals | Permanent chat column, hidden mutation, duplicate task/run history |
| Errors | Cause, preserved state and one available next action | Technical diagnostic details | Raw stack traces as primary copy or an error hidden behind overflow |
| Settings | Group label and related controls in one neutral surface | Advanced diagnostic/configuration detail | Explanatory paragraphs repeating labels and unrelated setup banners |
| Brand | Small original product identity; agent identity where relevant | A meaningful onboarding/empty-state moment | Per-row blobs, decorative project heroes or working-surface wallpaper |

For each new panel/control answer: which user decision needs it, why at this moment, what established element it replaces, and how it behaves when empty. If no present user job needs it, leave it out. Simplify the resting surface by removing repetition and deferring rare operations; retain discoverability and recovery.

## Restraint with completeness

Keep ordinary controls monochrome. Use semantic color for urgency/status and the documented brand exceptions. Keep important actions available by keyboard and discoverable without hover. Collapse technical diagnostics, not actionable errors or failed saves. Local readiness must not depend on Telegram, MCP, a network connection or a cloud model.

Keep implementation lightweight: reuse the current stack, shared kit and Rust data paths. Do not add frameworks, dependencies, abstraction layers or modules without a demonstrated need in the authorized slice.

Exclude unrequested kanban, KPI dashboards, roles, sprints, additional project containers, required dates and generic database builders. Flood-buddy is approved only within the bounded [companion contract](buddy.md): transient, application-owned and non-canonical. This design specification does not grant permission to implement it.
