# Quiet Workbench: selected direction

Decision date: **2026-09-20**. Status: **user-selected direction; implementation and native acceptance tracked separately**.

The user selected concept 1, Quiet Workbench, then clarified: “нужна легкая архитектура приложения. не перегруженные интерфейсы” — a lightweight application architecture and uncluttered interfaces. This authorizes the composition amendments below for the current slice. It does not certify the implementation or authorize broad propagation before verification.

The [selected concept image](references/quiet-workbench.png) is included in the repository for portable handoff. It is a generated composition reference, not a pixel specification or an application screenshot. The [Mobbin registry](research/mobbin-composition-reset.md) records the inspected sources and rejected details.

## Composition contract

1. **Projects in the sidebar; tasks in the workspace.** Keep Search, `Главная`, project destinations and Settings. `Главная` is the cross-project overview for all tasks and the project index; do not add a separate `Все задачи` destination. Remove expandable task trees and duplicate task indices from the sidebar. Selecting a project opens its task list. Do not add a second navigation system.
2. **One dominant work hierarchy per surface.** A project page keeps its compact heading and one flat dominant task list. `Главная` is the scoped exception: a vertical sequence of project shelves, each with its own heading/actions and one horizontal strip of compact open-task cards ordered urgent → important → normal. It is not kanban and must not introduce status columns or another task state. Completed tasks remain a secondary collapsible group. Optional agent/decision content appears only for real actionable work.
3. **One creation entry in global navigation.** A separate `+` beside `Главная` opens one centered create modal. Its first decision is `Задача` or `Проект`; subsequent steps collect only the fields required for that object. In a project, contextual task creation may remain available when it avoids asking for the project again. `Контекст проекта` is a quiet navigation action. Rename, move and delete belong in an accessible overflow menu where applicable. No duplicate global create button or permanent pencil/trash strip.
4. **Rows prioritize task titles.** Completion and opening are separate controls. Important and urgent tasks have compact explicit `Важная` / `Срочная` text, with a small semantic icon if useful. Ordinary urgency has no repeated visible badge or blob; its value remains available in the task editor. Omit redundant open-state labels, identical ages and repeated project names from a project list. Preserve useful source/due information only when present and relevant; no new deadline field is implied.
5. **Separate working pages.** The task editor remains its own page with a predictable return to the originating list. Project context remains its own page; documents/rules/skills keep the existing artifact editor contract. No permanent task-detail, agent-chat or formatting column.
6. **Sparse original brand material.** Keep the supplied flood product mark and meaningful agent identity. Do not place a blob on every task, project heading or metadata row. Existing assets retain provenance and semantic meaning; this slice changes usage, not the asset family.
7. **Compact hierarchy.** Use the established semantic page heading rather than a hero banner. A useful row may wrap; avoid forced two-line rows for redundant metadata. Neutral hover/current/focus feedback remains distinct and keyboard-visible.

## Layout and implementation scope

- Sidebar target: approximately **224 px** expanded; preserve accessible collapse and narrow behavior.
- Project task list: a dedicated bounded list width, initially about **880 px**, adjustable up to **960 px** when justified by real title/action fit. R02 Home may use up to **1040 px** for horizontal project shelves; each shelf owns its overflow and the page itself never scrolls horizontally. These are distinct from the reader role.
- Task/document reader and standard settings/context content: **720 px** maximum. Existing independent navigation strips and overlays retain their own contracts.
- Navigation rows and task data rows use a coherent compact list, without a floating card and 8–12 px external gap for every item. Independent artifact/action/disclosure rows retain their rounded-control contract and peer gaps. No decorative divider is required between task rows.
- Use the existing Svelte kit, semantic tokens and shared Rust paths. No extra framework, dependency, domain entity, process, architecture layer or module is required by this direction. Extract code only for a demonstrated repeated behavior.

The parent layout owns space. Text, focus targets and long Russian names remain usable at the configured 760 × 560 minimum and 200% text enlargement. A concept's apparent spacing or text size never overrides contrast, typography or accessibility requirements.

## Adoption and evidence

The user approval above is sufficient for recording these direction amendments now. [Design.md](../../Design.md), the English contract and applicable live MCP materials must say the same thing. [Publication receipts](publication.json) distinguish planned amendments from versioned, read-back updates; exported `.flood` snapshots are not silently current.

The implementation must pass the affected [verification matrix](verification.md) in the three anchors before broader migration. Record actual light/dark, populated/empty/recovery, narrow, keyboard/focus, text-resize and Tauri evidence for this revision. Earlier UI-kit screenshots do not verify Quiet Workbench. The broader product redesign task remains open; this direction decision does not change task status, permissions or data behavior.
