# Agent handoff

**Latest user scope, 2026-09-22:** dark-only first release, Codex-only agent integration. [Codex dock](codex-dock.md) records the replacement for the earlier buddy direction, the verified external-send experiment and the unverified capabilities. Apply this scoped amendment before the historical starting prompt below; it does not authorize a broad implementation or assert MCP synchronization.

Repository target 1.4.0, live routed MCP contract 1.3.1, 2026-09-20. **Published rules and skills are ready through flood.md MCP. The standalone flood-buddy document exists as `05Q568560ZFK3CF9NTVQ64X880`, while updates to the entry/rules/skills remain pending human review. Quiet Workbench implementation is partial and not accepted.** This documentation delivery does not authorize UI implementation.

For a flood.md agent, start with `get_project_brief` or `get_task_work_context`, then read project document **Design contract v1.3.1 - complete MCP entry**, ID `67WD59TTX6CS9NKF66904XVWSY`, through `get_project_workspace_item`. It lists exact IDs for the published contract chapters and workflows. See [the MCP entry mirror](mcp-entry.md). Repository access is not required for published 1.3.1 instructions; it is required to use the pending 1.4.0 companion amendment before publication.

## Starting prompt

Give the next agent this text together with your concrete implementation task:

```text
Work on flood.md using its project-owned design contract.

First obtain current Project Work Context for project
01M29A0ADWQN3G8XARF1RC1MXS through MCP. Read all enabled rules in full,
including targeted reads for truncations. Follow AGENTS.md and Design.md.

Read project document 67WD59TTX6CS9NKF66904XVWSY through
get_project_workspace_item. Follow its item-ID map to the operating
contract, bootstrap workflow and relevant specialized skills/chapters.
Read truncated mandatory rules in full; summaries are not the contract.
Repository mirrors start at docs/design/README.md.

Quiet Workbench is already selected: lightweight architecture, projects-only
sidebar, one dominant task list, separate task/context pages, one primary
action, rare actions in overflow, monochrome controls and sparse original
flood blobs. Keep Russian UI copy and English design instructions.

Repository target 1.4.0 additionally specifies flood buddy as a transient,
application-owned companion panel (C25/R14), never a permanent chat column or
an agent embedded into tasks. Until its MCP amendment is applied and read back,
use docs/design/buddy.md only when repository access and the concrete task allow it.

Treat docs/design/rule-matrix.md as requirements for changed UI, and
src/design/tokens.json as the only authored token source. Current UI code
and historical screenshots are not the design authority. Read
docs/design/implementation.md before relying on existing work.

Stay within my concrete task. Reuse Tauri 2, Rust, Svelte 5, TypeScript,
Vite and shared persistence rules. Do not introduce product features,
frameworks or architecture layers just to restyle the interface. Preserve
drafts, stable IDs, expected versions and external file changes.

For implementation, apply flood-ui-implementation and flood-ui-review.
Verify the affected real Tauri scenarios; report specification, code,
browser checks and native evidence separately. For a rules/specification
request, deliver documents and stop before implementation.
```

The prompt does not start a background job, install a global skill, grant external access or authorize the whole backlog. Your concrete task determines the slice.

## What the agent can rely on

| Decision area | Owning source |
| --- | --- |
| Authority, requested mode, context freshness | [Agent contract](agent-contract.md) |
| Mandatory, traceable requirements | [Rule matrix](rule-matrix.md) |
| Approved visual composition | [Quiet Workbench](quiet-workbench.md) and [selected concept](references/quiet-workbench.png) |
| What to show, defer or omit | [Progressive disclosure matrix](principles.md#progressive-disclosure-matrix) |
| Colors, typography, spacing, sizes, geometry, focus, layers, motion | [Foundations](foundations.md), [authored tokens](../../src/design/tokens.json), [generated values](generated/token-reference.md) |
| 25 component families | [Component contracts](components.md) |
| 14 screen recipes, file/save/conflict, companion and agent state transitions | [Flows](flows.md) |
| Flood-buddy boundary, routing, history and acceptance | [Buddy companion](buddy.md) and [selected concept](references/flood-buddy-companion.png) |
| Blob provenance and permitted use | [Brand](brand.md) |
| Russian terminology and consequential copy | [Content](content.md) |
| Checks and evidence required for each kind of change | [Verification](verification.md) |
| Mobbin, OA and Linear references and when research is necessary | [Research](research.md) |

The selected image demonstrates composition. Exact measurements and behavior come from the contract; it is not a screenshot of shipped UI. The other two exploratory concepts are historical alternatives, not competing instructions.

## Skill availability and live mapping

All seven local skills are linked from the [skill directory](README.md#agent-skills). Read them directly; repository files under `docs/` are not implicitly installed as global skills. Existing enabled MCP skills provide the corresponding English workflows without creating additional project permissions.

| Live project item | Stable ID | Repository workflow |
| --- | --- | --- |
| Дизайн-система flood.md | `5GYP0WCTRTHE89CHGAHWQTK0S8` | [Design system](skills/flood-design-system/SKILL.md) |
| Композиция экранов и UI-паттерны | `0S756Q34A489FS33RKXN16Q1SZ` | [Screen design](skills/flood-screen-design/SKILL.md) |
| Реализация UI flood.md | `0T4GYGK13FD478KNB2W53MQJ2B` | [Implementation](skills/flood-ui-implementation/SKILL.md), followed by [review](skills/flood-ui-review/SKILL.md) |
| Контекстная редактура UI | `6SCGSSP63KGXBBPKA9J50XQ279` | [UI copy](skills/flood-ui-copy/SKILL.md) |
| Human–agent interaction | `2Z88329MMK92VEBTBRAMFQVPJA` | [Agent interaction](skills/flood-agent-interaction/SKILL.md) |
| Информационная архитектура и владение | `4YQT4JP3E1B3RSM4N1MBNDT7EB` | [Ownership](principles.md) and [screen design](skills/flood-screen-design/SKILL.md) |

The bootstrap and review workflows are also available in full as agent-readable MCP documents, linked by the current entry document; they are not newly enabled standalone MCP skills. [The original publication receipts](publication-handoff.json) record the six live skill updates; [the complete MCP publication](publication-mcp-complete.json) records 12 additional full documents and the new entry map. The `.flood` directory is an exported snapshot, never a replacement for obtaining current live context.

Mobbin is a research dependency only when an unresolved new pattern requires it. Use the official connected tools if available and the project research procedure. Ordinary implementation of the selected recipe can use its existing recorded study; it does not require another moodboard or plugin installation.

## Starting code state

There are pre-existing uncommitted application and backend changes. Inspect and preserve them; this handoff does not authorize a broad reset. Shared tokens and an initial kit exist, but the Quiet Workbench integration was interrupted before final native acceptance. A prior pass, build or image does not establish the current tree's correctness.

The implementation agent must particularly check draft preservation when asynchronous reads finish, overlapping task open/completion operations, and return/focus behavior. These are verification priorities, not claims that a current defect has been reproduced. Consult the implementation record and inspect current code before deciding what to change.

This contract does not mark the larger redesign task complete. Do not change task status or launch implementation just because the handoff document exists.
