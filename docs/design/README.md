# flood.md design contract

**Desktop scope amendment, 2026-09-22:** the user explicitly prioritizes the normal desktop experience. Do not spend current implementation or verification work on mobile, narrow or minimum window sizes. Those cases are deferred until a separate request; normal desktop verification remains required.

**First-release amendment, 2026-09-22:** the user selected dark-only UI and Codex as the sole initial agent integration. Read [Codex dock and release scope](codex-dock.md) before applying older theme, provider or buddy directions. These constraints are approved; the dock interaction details are a proposal, not implemented/native-accepted behavior. Live MCP publication remains separate.

Repository target: 1.4.0 · Live MCP entry: 1.3.1 · Updated: 2026-09-20 · Language: English; product copy: Russian.

**Direction: Quiet Workbench — utilitarian minimalism with the original flood brand.** The user requested a reconsideration of the current visual direction while retaining the existing blobs. The user selected concept 1 and requested a lightweight architecture and uncluttered interfaces. Read the [selected direction and scope](quiet-workbench.md). Soft Utility is historical input. Direction approval is recorded; implementation acceptance remains separate.

This is the **normative design contract and operating package for the next agent**. Use its rules to make and review design decisions; do not infer the rules from the current UI. The specification is ready for handoff. The existing implementation is partial and has not passed Quiet Workbench native acceptance. See the [handoff](handoff.md) for the starting prompt and the [implementation record](implementation.md) for code status.

## Start here

**Working through flood.md MCP:** after obtaining current context, read project item `67WD59TTX6CS9NKF66904XVWSY`, **Design contract v1.3.1 - complete MCP entry**. The [MCP entry mirror](mcp-entry.md) maps all published chapters and workflows to readable item IDs. Repository target 1.4.0 adds the user-selected [flood buddy companion](buddy.md); it is not live guidance until a versioned MCP update is applied and read back. The brief may truncate content; targeted reads remain mandatory. [Publication/readback evidence](publication-mcp-complete.json) records the current live package. Actual implementation still needs the code checkout and assets.

1. Obtain current Project Work Context through MCP. Read every enabled rule, including truncated rules through targeted reads. Read `AGENTS.md`, `Design.md` and `Stack.md`.
2. Read [the agent contract](agent-contract.md). It defines authority, task routing and deliverables.
3. Select the relevant rows in [the rule matrix](rule-matrix.md), then load only their referenced chapters.
4. Read the [project skill entry](skills/flood-design-contract/SKILL.md), then choose the workflow below. A documentation request ends with documentation; it does not start implementation.

## Agent skills

These are complete project-owned `SKILL.md` files. An agent can read them directly from this repository; global installation is not required. They are not automatically discovered merely because they exist under `docs/`. The entry prompt and MCP materials explicitly route to them. Live skill names/IDs and publication status are recorded in [the handoff](handoff.md).

| Work | Skill | Required result |
| --- | --- | --- |
| Start and keep scope | [flood-design-contract](skills/flood-design-contract/SKILL.md) | Correct context, mode, rules and next workflow |
| Shared foundations, tokens, components or brand | [flood-design-system](skills/flood-design-system/SKILL.md) | One coherent system change and migration criteria |
| Screen hierarchy, navigation and progressive disclosure | [flood-screen-design](skills/flood-screen-design/SKILL.md) | Owner, surface, visible/on-demand decisions, states and focus |
| Build an approved design in Svelte/Tauri | [flood-ui-implementation](skills/flood-ui-implementation/SKILL.md) | Scoped implementation preserving data and interaction contracts |
| Review or verify UI | [flood-ui-review](skills/flood-ui-review/SKILL.md) | Evidence, reproducible findings and an honest acceptance decision |
| Write or correct interface text | [flood-ui-copy](skills/flood-ui-copy/SKILL.md) | Contextual Russian copy, including failure and permission states |
| Agent runs, results, permissions and automation | [flood-agent-interaction](skills/flood-agent-interaction/SKILL.md) | Explicit authority, state transitions, review and recovery |

## System map

| Layer | Owned artifact | What it decides |
| --- | --- | --- |
| Agent entry | [Agent contract](agent-contract.md) | Context, scope, sequence, uncertainty and completion |
| Selected direction | [Quiet Workbench](quiet-workbench.md) | Approved composition, scope and pending implementation evidence |
| Product | [Principles and ownership](principles.md) | User jobs, navigation, domain vocabulary and direction |
| Rule matrix | [Rules](rule-matrix.md) | Stable rule IDs, applicability, severity and evidence |
| Foundations | [Foundations](foundations.md) | Typography, color, space, geometry, density, layers, motion and accessibility |
| Runtime tokens | [Authored token source](../../src/design/tokens.json) | Exact shared values; one authored source for application and specimen |
| Generated token views | [Token reference](generated/token-reference.md), [runtime CSS](../../src/design/tokens.css), [specimen CSS](generated/tokens.css) | Derived outputs; runtime CSS is imported by the application |
| Components | [Component contracts](components.md) | Anatomy, state, semantics and interaction |
| Composition | [Screens and flows](flows.md) | Ownership, transitions, recovery and focus |
| Companion | [Flood buddy](buddy.md) | Bounded global assistance, history, routing and trust boundary |
| Brand | [Brand language](brand.md) | Blob identity, scales, meaning, restraint and evolution |
| Content | [Russian interface writing](content.md) | Labels, terminology, errors and progressive disclosure |
| Verification | [Acceptance and evidence](verification.md) | Test matrix, fixtures and honest maturity |
| Research | [Sources and Mobbin](research.md) | Evidence, transferable reasoning and research boundaries |
| Migration | [Audit and adoption](adoption.md) | Current gaps, replacement map and staged integration |
| Implementation | [First UI-kit and anchor slice](implementation.md) | Code ownership, current migration scope and evidence status |
| Review | [Interactive specimen](preview.html), [verification record](review-report.md) | Synthetic examples and the checks actually performed |

## Status and authority

- **Normative:** requirements in the rule matrix, foundations, components and flows apply to new or changed UI within the requested scope. `Must` and `must not` are requirements; `should` allows a documented reason; examples are illustrative. A rule's provenance is not its optionality.
- **Specified / implementation target:** behavior the implementation must meet. It is not an unresolved visual choice and is not evidence that current code meets it. Scope-conditional contracts apply only if that capability exists or is requested; they do not authorize new features.
- **Selected direction:** Quiet Workbench was chosen by the user. Do not reopen that choice or copy the previous Soft Utility direction.
- **Implemented:** code exists in the current slice; coverage and remaining exceptions are listed in the implementation record. This status alone does not establish visual or interaction quality.
- **Verified:** reserved for a specific implementation revision and recorded acceptance evidence. Browser, native and user acceptance are recorded separately.

Live MCP project rules remain the active project instruction store. `.flood/manifest.json` identifies the exported snapshot; it is not an automatic synchronizer. Direction amendments are published through versioned MCP preview/apply; [adoption](adoption.md) and publication receipts record the actual outcome. Repository target 1.4.0 is therefore not the live MCP contract yet. Never infer synchronization from a local snapshot or promote a document into a rule. The current user direction supersedes the old art-direction preference; it does not waive file safety, accessibility or real desktop verification.

## Maintenance

Edit `src/design/tokens.json`, then run `node scripts/design-contract.mjs --write` from the repository root. This generates runtime CSS, specimen CSS, the token reference and the former `tokens.target.json` path as a compatibility pointer without copied values. `src/styles.css` imports the generated runtime file and no longer owns palette or foundation values.

Run `node scripts/design-contract.mjs --check` to check generated drift, matching themes, aliases, declared contrast pairs, duplicate foundation declarations and local document links. Static checks do not establish native appearance or interaction acceptance. Do not hand-edit generated outputs or reintroduce token values into the compatibility pointer.

Changes must name affected rule IDs, components, flows and evidence. Edit the owning chapter, not an accumulating appendix. Preserve scoped user decisions and reconcile corresponding live materials with version checks. Do not add a second theme source or runtime component framework. Research sources, historical evidence and implementation notes are supporting material, not competing rule sets.
