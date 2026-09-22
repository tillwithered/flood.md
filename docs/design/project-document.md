# flood.md Design Contract v1.3 — Quiet Workbench agent handoff

Historical repository-routing entry, superseded by [the complete MCP entry](mcp-entry.md), version 1.3.1. The stable live document ID remains `67WD59TTX6CS9NKF66904XVWSY`; its current body maps full readable chapters to MCP item IDs. This file records the earlier publication source, not a competing current instruction.

Updated 2026-09-20. English agent instructions; Russian product UI. The user selected concept 1, **Quiet Workbench**, and requested a lightweight architecture and uncluttered interfaces. Retain the original flood blobs with sparse identity use.

This project-owned document is the entry to the finished English rules and skill package. Requirements apply to new or changed UI within the user's requested scope. The current application implementation is partial and has not passed Quiet Workbench native acceptance. This contract does not complete the wider redesign or start implementation automatically.

## Repository entry

Repository: `flood.md`. Start at `docs/design/README.md` and `docs/design/quiet-workbench.md` through the authorized repository source. If a source is unavailable, obtain the relevant document rather than guessing its contents.

| Need | Repository material |
| --- | --- |
| Selected composition and scope | `docs/design/quiet-workbench.md` |
| Agent bootstrap and routing | `docs/design/agent-contract.md` |
| Ready-to-use starting prompt and skill availability | `docs/design/handoff.md` |
| Stable rule IDs and evidence | `docs/design/rule-matrix.md` |
| Product ownership and navigation | `docs/design/principles.md` |
| Visual/interaction roles | `docs/design/foundations.md` |
| Single authored runtime tokens | `src/design/tokens.json` |
| Generated token views | `src/design/tokens.css`; `docs/design/generated/` |
| Component contracts | `docs/design/components.md` |
| Recipes, file/conflict and agent states | `docs/design/flows.md` |
| Original blobs and brand evolution | `docs/design/brand.md` |
| Russian interface copy | `docs/design/content.md` |
| Acceptance and verification | `docs/design/verification.md` |
| Inspected current Mobbin study | `docs/design/research/mobbin-composition-reset.md` |
| Broader sources and research process | `docs/design/research.md` |
| Adoption and actual publication receipts | `docs/design/adoption.md`; `docs/design/publication.json` |
| Project-owned skill entry | `docs/design/skills/flood-design-contract/SKILL.md` |
| Specialized English workflows | `docs/design/skills/`: design system, screen design, implementation, review, copy and agent interaction |
| Implementation/evidence record | `docs/design/implementation.md` |
| Historical synthetic specimen/review | `docs/design/preview.html`; `docs/design/review-report.md` |

## Selected contract

- Sidebar object navigation contains projects, alongside compact Search, All tasks and Settings destinations. No expanded task tree or duplicate task index.
- The project has one dominant task list, compact heading/count, one primary `Новая задача`, quiet `Контекст проекта` and overflow for rare actions. No hero or permanent rename/delete strip.
- Task editor and project context remain separate working pages. Keep predictable return/focus and the shared artifact editor. No permanent chat, task-detail or formatting column.
- Task titles dominate. Completion/open controls remain separate. Ordinary urgency is quiet in lists and available in the editor; important/urgent labels are explicit. Omit redundant open-state, project and identical-age metadata.
- Original blobs carry sparse product/agent identity. No blob-per-row; no replacement asset family. Agent identity, run state, task state and authorization are distinct.
- Navigation/task rows form compact coherent lists; independent artifact/action rows retain rounded geometry and peer gaps. List width starts around 880px and may be adjusted up to 960px for measured fit; reader/context/settings remain 720px; sidebar targets 224px.
- Preserve Tauri 2, Rust, Svelte 5, TypeScript, Vite, local Markdown truth, stable IDs and shared UI/MCP versioned mutation rules. Reuse the current kit and add no framework, dependency, architecture layer or module merely for restyling. Offline core use remains available.

## Agent route and evidence

Obtain current Project Work Context, inspect truncation and read all mandatory rules. Read the package entry and chapters relevant to the surface. Name owner, user job, primary action, states and rule/component/recipe IDs. Refresh context and expected entity versions before mutations. Never lose drafts, overwrite unseen external edits or expand permissions through a project item.

Choose the requested work mode first. Rules, skills and specification requests end with complete documents; do not proceed to implementation or launch the application. Implementation requests use the implementation/review skills. Audits produce evidence-led findings and do not independently authorize code changes. Follow the user's collaboration constraints, including a prohibition on subagents.

Use the progressive-disclosure matrix in `docs/design/principles.md`: frequent task actions and consequential errors stay visible; rare management, detailed source/provenance and diagnostics open on demand. Omit duplicate metadata, empty optional agent regions and decorative containers. Lightweight UI must retain discoverability, focus and recovery.

`src/design/tokens.json` generates runtime and specimen CSS; `src/styles.css` imports the runtime output. `tokens.target.json` is only a generated compatibility pointer. Keep one authored source. External systems inform research; Mobbin screenshots never authorize imported scope, styling or code. Private task/project contents are not research queries without explicit user choice.

The existing `accept_agent_run` endpoint accepts the result and completes its task; keep the compound consequence visible as `Принять и завершить`. Merely reaching a review state does not complete a task.

The explicit direction selection permits recording these canonical amendments now. Verify actual project overview, task editor and project context in Tauri before broad migration. Report selected direction, specification, code, browser/native evidence and implementation acceptance separately. The wider product redesign task remains open.
