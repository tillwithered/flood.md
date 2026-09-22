---
name: flood-design-contract
description: Start flood.md design work with current project context, the approved Quiet Workbench contract and the appropriate project workflow. Use for UI specifications, design-system changes, implementation or review in this repository.
---

# Flood design contract

Read [the contract entry](../../README.md) and [the agent operating contract](../../agent-contract.md). They define authority and scope. Read every enabled live MCP rule, then only the applicable skills and references. A local snapshot is evidence of an export, not a fresh MCP context receipt.

## Route the actual request

1. Identify the requested deliverable: specification, exploration, implementation or review. Preserve the current user's scope and collaboration preferences. A request for rules/skills ends with those artifacts; it does not authorize UI implementation.
2. Obtain `get_project_brief` or `get_task_work_context` in the current MCP session. Check truncations and finish all mandatory rule reads. Read repository `AGENTS.md`, `Design.md` and, for implementation, `Stack.md`. Follow exact current tool schemas.
3. Write a short brief: user job, owner, surface, primary action, affected [rule IDs](../../rule-matrix.md), states and exclusions. Read the owning component/flow contract, not every chapter.
4. Select the workflow below. After context/material changes refresh the work packet; before mutation check context freshness and entity expected versions independently.

| Work | Read next |
| --- | --- |
| Foundations, shared components, tokens or blob language | [flood-design-system](../flood-design-system/SKILL.md) |
| Screen hierarchy, surfaces or navigation | [flood-screen-design](../flood-screen-design/SKILL.md) |
| Authorized Svelte/Tauri implementation | [flood-ui-implementation](../flood-ui-implementation/SKILL.md) |
| Audit, critique or acceptance | [flood-ui-review](../flood-ui-review/SKILL.md) |
| Russian interface copy | [flood-ui-copy](../flood-ui-copy/SKILL.md) |
| Agent runs, permissions, review or automation | [flood-agent-interaction](../flood-agent-interaction/SKILL.md) |

## Settled decisions

Use the selected [Quiet Workbench](../../quiet-workbench.md): projects-only sidebar, one dominant task list, separate task/context pages, one primary action, rare operations in overflow, quiet normal urgency and explicit important/urgent text. Retain the original blobs sparsely. The selected direction is not an invitation to generate more alternatives.

Keep Tauri 2, Rust, Svelte 5, TypeScript and Vite. The shared Rust core and readable local Markdown remain the data contract. The single authored token source is `src/design/tokens.json`; generated files are outputs. Do not use the unfinished current UI or historical specimen as the design authority.

Finish in the requested mode. Report specified behavior, code and actual verification separately. [The handoff](../../handoff.md) explains the current starting point and live skill mapping.
