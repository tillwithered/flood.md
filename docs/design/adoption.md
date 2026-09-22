# Audit, reconciliation and adoption

Prepared 2026-09-20 against repository HEAD `be15f35eb6ef1a56ddf26ec1f58694915297a4c1` plus the existing working tree. Audit is **static source/rule review**, not a visual audit of the current desktop window. Existing unrelated changes to core/MCP/baseline work were not part of this package.

The user selected [Quiet Workbench](quiet-workbench.md) on 2026-09-20 after reviewing the first slice. Direction amendments may be recorded now under that authorization; native implementation acceptance and broad propagation remain pending. The audit below records the pre-migration baseline. The user subsequently approved a first UI-kit and three-anchor implementation slice. Its current changes and evidence belong to the [implementation record](implementation.md); baseline counts and findings must not be mistaken for a fresh audit of that slice.

## Live context provenance

Project ID: `01M29A0ADWQN3G8XARF1RC1MXS`. Context was obtained through the local stdio MCP binary; all enabled rules and relevant project skills/foundation documents were read in full. Receipt was `current`, with no pending rule IDs, at revision `5b9e939a7f3fafef917347c97c110b4390cd5c93876112c72cdf907bc846eb83`. This is historical provenance; fetch a fresh receipt before the next mutation.

The repository export matches the five live rules and five of the six live skills at that observation. The exported design-system skill is older: live version `cbf88ed755e2c422cdc92e80289a568a9dcb1951bc5f6c7f6fc9b2c637f3c0cf` contains an additional reference-research route. Do not overwrite it from the old snapshot.

The first implementation slice obtained a fresh current context at revision `03b707fa09d7cb24465dc114df31f091384e0820b1df5206004b1799a33a4257`. The five rules and relevant design-system/implementation skill bodies were unchanged from the fully read baseline; the published design-contract document was also available. This is provenance for that work, not a reusable receipt for a later mutation.

## Historical contradiction ledger and selected resolution

2026-09-22 scoped release amendment: [Codex dock](codex-dock.md) supersedes light/system-theme delivery, multi-provider release requirements and the separate buddy conversation for the first release. The user retained the central task workspace with header project selection and a bottom dock. Existing runtime adapters/tokens are not deleted by this decision. Other theme/provider work is deferred; data integrity, accessible dark UI and native release gates remain. Local specification and GitHub planning are updated separately from live MCP rules, whose versioned publication has not occurred for this amendment.

| ID | Existing conflict | Target resolution | Adoption action |
| --- | --- | --- | --- |
| D01 | Soft Utility quality bar #11 requests a blue-violet interactive accent; its appended monochrome section and Visual foundations #11 forbid it. | Ordinary controls monochrome; brand/status exceptions explicit. | Remove the superseded accent sentence through a versioned live update; do not add another appendix. |
| D02 | Design.md says system font 14–16; older Soft Utility says 14–15 / page 24–28; foundations give Golos and a semantic ramp. | One baseline Golos ramp and separate documented prose mapping. Font reconsideration remains possible through evidence. | Consolidate descriptions and values after anchor evaluation. |
| D03 | Skills/foundations say tab `border-block`; newer visual rule specifies one bottom divider. | Open strip, one bottom boundary, no duplicated adjacent line. | Update older text and shared implementation together. |
| D04 | Blanket gradient/glass prohibition coexists with brand-gradient and local-glass exceptions. | Flat working surfaces; retained raster brand material; no blur requirement. | Replace blanket statements with scoped material rules. |
| D05 | Blobs serve urgency/completion/connection in Design.md, while Soft Utility calls them identity rather than state. | Brand/agent identity, legacy semantic glyphs and textual operation state have separate roles. | Inventory each asset use; preserve meaning during migration, then choose a consistent family. |
| D06 | All full-row actions must be separated rounded controls, but the system also requires compact rows and no card stacks. | Distinct navigation row, task/data row and independent action-row contracts. | Adopt the narrowed rule explicitly; do not restyle every task as a floating card. |
| D07 | Research route requires 3–5 products for every new compound UI. | Target conditional research for an unresolved pattern; reuse approved recipes for routine work. | Preserve live requirement until a versioned amendment is adopted. |
| D08 | Agent result review can be mistaken for task completion; current `accept_agent_run` actually completes the task. | State concepts remain distinct; compound acceptance clearly says “Принять и завершить” when using that endpoint. | Keep API behavior and expose its consequence; do not invent separate completion silently. |
| D09 | A useful companion can drift into a permanent agent chat, duplicate history and hidden authority. | One application-owned transient C25/R14 panel with bounded separate local history and existing versioned mutation paths. | Publish repository target 1.4.0 through MCP, then implement shell → local retrieval → routing → one reviewed reversible mutation. |

The user's new utilitarian direction supersedes the older art-direction preference. It does not by itself mean a new implementation is verified, or allow bypassing current project access/version controls.

## Published Quiet Workbench amendments

On 2026-09-20, ten existing materials were updated through MCP preview/apply with expected versions, original IDs and unchanged Agent access. Exact content/title/access readback passed for each. The final receipt is `current`, ready, with no pending rules, revision `07a81a7b3a799c5104f8b25706833364f57b2c1e100627e7283640f3c9341bf9`. Fetch a fresh receipt for future work. [publication.json](publication.json) contains the version and hash trail.

The later flood-buddy decision is recorded as repository target 1.4.0 in [buddy.md](buddy.md), C25, R14, PRD-05 and AGT-05. Its standalone MCP document was created as `05Q568560ZFK3CF9NTVQ64X880`; updates to the existing entry, chapters, rules and skills are pending human-review proposals because direct MCP apply is intentionally blocked. It is not present in the `.flood` export. Live routed guidance therefore remains 1.3.1 until those proposals are applied and read back.

Resolved in the selected direction: monochrome controls, Golos roles, one tab divider, flat working surfaces, sparse original brand usage, distinct task/navigation/action rows, projects-only sidebar, list/reader widths and rare actions in overflow. D07 remains unchanged: new unresolved compound patterns still follow the live 3–5-product research route. Existing route/trust rules, data states and access controls were preserved. The `.flood` export was not regenerated and must not be treated as current. Native acceptance and broad propagation remain pending.

## Measured gaps before the first implementation slice

| Priority | Finding and source | Consequence | First correction |
| --- | --- | --- | --- |
| P1 | `src/styles.css` danger ink `#d92f55` on danger surface `#fff0f3` is about 4.24:1; `.data-error` uses 12px text. | Small error copy fails the project's 4.5:1 target. | Adopt a tested semantic pair, verify real consumers in both themes. |
| P1 | `--line` on `--field` is about 1.18:1. | A decorative divider cannot also be the sole identifying field boundary. | Add/use a meaningful strong-boundary role where needed; do not darken every divider. |
| P1 | Urgency menu and some MCP/inbox tab roles lack the corresponding keyboard handling in inspected markup; modal reverse-Tab from the dialog element is a risk. | Keyboard behavior may not match announced semantics. | Verify actual keyboard paths, then fix shared menu/tab/dialog behavior. Static risk is not a proven runtime failure. |
| P1 | Source edit is a multi-field popover with a nested date picker in `src/App.svelte`. | Workflow complexity exceeds the project's compact popover contract. | Move that workflow to the appropriate existing modal/dialog pattern when touched. |
| P2 | Root palette/spacing exist but type, line-height, shape, control height, motion and layer roles are incomplete. Static count: 225 literal font-size declarations, 13 sizes, 123 hex occurrences including legitimate brand/palette values. | Independent local choices drift. Counts are indicators, not counts of defects. | Candidate semantic token set, then replace consumers incrementally. |
| P2 | Unequal RGB channels in nominal neutral tokens. | Values diverge from the explicit neutral palette intention; visible cast is not established by this audit. | Evaluate equal-channel candidate neutrals on native anchors. |
| P2 | App.svelte has about 6,520 lines and styles.css about 1,877; only six extracted components. | Shared behaviors are hard to change consistently. Size alone is not a reason for a rewrite. | Extract a repeated behavior only as its contract migrates. |
| P2 | Context overview uses four count cards; route/scroll/focus behavior is locally assembled. | Counts compete with useful project context and complicate navigation ownership. | R06 content-first overview, stable navigation and material index. |
| P2 | Several nested radii are independent numbers. | Visual geometry drifts between similar compounds. | Apply measured concentric geometry only where the contours are actually related. |

Existing positive foundations to retain: shared Rust storage, stable IDs/version checks, task/artifact conflict UI, focus-trap/restoration helpers, local fonts/assets, reduced-motion handling and the font-floor check. The redesign should strengthen them, not discard them.

The first token migration has replaced duplicated root palette values with the authored `src/design/tokens.json`. Its neutral values use equal RGB channels; declared error/neutral/focus/boundary pairs pass the static contrast check. `--line-strong` and the type, geometry, motion and layer roles now exist at runtime. The original danger-pair finding is corrected at token level; rendered consumer states, residual literals and interaction defects still require their respective checks. No historical count above is presented as a post-migration measurement.

## Source and publication ownership

| Store | Current role | Change policy |
| --- | --- | --- |
| Live MCP project rules/skills | Active agent guidance and access controls | Preview/apply using latest expected version; preserve access; read back result |
| Live MCP documents | Reference/specification context | Versioned project-owned documents; a document is not an always-on rule |
| `.flood/manifest.json` and exported items | Versioned repository snapshot | Export verified live versions; never fabricate version hashes or imply bidirectional sync |
| `Design.md` | Selected direction and established design reference | Record explicitly user-approved direction amendments now; claim verified implementation only after native evidence |
| `docs/design/` | English specification, historical audit, specimen and implementation record | Maintain coherent cross-links; distinguish targets, implemented code and verification evidence |
| `src/design/tokens.json` | Single authored runtime foundation source | Change values/notes/contrast requirements here; regenerate all outputs |
| `src/design/tokens.css` | Generated application foundation CSS | Imported by `src/styles.css`; never hand-edit |
| `src/styles.css` | Application styling and foundation import | Consume shared roles; do not redeclare authored foundation values |
| `docs/design/generated/` | Derived specimen CSS and token reference | Regenerate from the runtime source; no independent theme values |
| `tokens.target.json` | Generated compatibility/provenance pointer | Retain old links without duplicating token values |

## Live material replacement map

The map below records the original reconciliation plan. Actual selected-direction publications, retained IDs, expected/read-back versions and content hashes are recorded in publication.json. Project route, trust, IA, copy and human–agent rules are unchanged unless a receipt explicitly lists them.

| Existing live item | ID | Replacement/consolidation |
| --- | --- | --- |
| Project agent route v1 | `4QFGED9H6928STGPBRYJQDF5AS` | Compact English bootstrap and routing from agent-contract; keep context enforcement |
| Visual foundations v1 | `7JJ4KYNDGA1AV92PBBR9GH9MXN` | Always-on essentials from rule matrix/foundations; detailed values remain on demand |
| Soft Utility quality bar v1 | `7HMA95E9E9H5BSC3VMKVM1XXE5` | Utilitarian direction and scoped brand/material rules; remove conflicting old taste rules |
| UI acceptance gate v1 | `2QFDS93B1B878PDQECJQCZW47Y` | Verification contract and exact evidence milestones |
| Human–agent trust contract v1 | `7JX2T0NH6GKBZS347S8QKCK7GS` | Retain permission/provenance guarantees; link concrete review/file state contracts |
| Design system skill | `5GYP0WCTRTHE89CHGAHWQTK0S8` | English project design skill and routed chapters, including deliberate research trigger |
| UI implementation skill | `0T4GYGK13FD478KNB2W53MQJ2B` | Implementation route, component contracts and verification |
| Screen composition skill | `0S756Q34A489FS33RKXN16Q1SZ` | Principles and R01–R13 recipes |
| Information architecture skill | `4YQT4JP3E1B3RSM4N1MBNDT7EB` | Owner matrix and navigation rules |
| Contextual copy skill | `6SCGSSP63KGXBBPKA9J50XQ279` | Russian content chapter |
| Human–agent interaction skill | `2Z88329MMK92VEBTBRAMFQVPJA` | Agent/run/result components and flow matrix |

Do not paste the whole package into always-on rules. Keep a small entry/essential rule set and discover details by surface/component. MCP can truncate documents and defer skills; a short entry point must identify the correct targeted reads. Preserve IDs for existing materials when updating rather than creating duplicate active rules.

## Migration slices and exit criteria

1. **Specification package:** English route, matrix, foundations, token candidate, components, flows, content, brand, research, checks and specimen. Delivered as a specification; later implementation does not retroactively turn specimen checks into native evidence.
2. **Shared foundation slice:** semantic roles now come from one runtime source; a representative control family and three anchors are the current implementation scope. Exit: real light/dark/native focus and text checks; no unrelated screen restyle. See the implementation record for progress.
3. **Project overview anchor:** content-first layout, stable actions, compact task anatomy and deliberate brand use. Exit: populated/empty/error/compact native review.
4. **Task editor anchor:** stable actions, readable editing, source access and preserved drafts across save/conflict. Exit: UI/MCP external-edit and keyboard scenarios verified.
5. **Project context anchor:** one page owner, consistent navigation and artifact interaction, useful content before counters. Exit: material edit/access/history and narrow-window focus verified.
6. **Selected direction and implementation acceptance:** Quiet Workbench was selected on 2026-09-20. Reconcile its direction amendments through versioned live preview/apply and readback; keep Design.md and English docs aligned. Show comparable native anchor evidence before broader propagation. Do not re-request the selected direction, treat it as native acceptance or silently export stale snapshots.
7. **Remaining surfaces:** settings, integrations, MCP, overlays, trash and advanced agent views in small coherent groups. Exit: affected verification rows, no regression of local/offline behavior.

After each migration record the implementation revision, replaced tokens/patterns, verified scenarios and residual exceptions. Remove obsolete local overrides after their final consumer moves. No scope slice introduces a new domain feature merely because a reference app has one.

## Publication status

The subsequent 1.3.1 completion closes a distribution gap: 12 full contract/workflow documents are now readable through flood.md MCP, and the existing entry document maps them by stable ID. [publication-mcp-complete.json](publication-mcp-complete.json) records exact readback and a current context receipt. Existing rule/skill access is unchanged; the new documents are intentionally agent-readable. This publication does not push uncommitted files to GitHub or make local binary assets remotely available.

The initial specification and subsequent Quiet Workbench direction amendments are recorded in [publication.json](publication.json). The documentation-only 1.3 handoff is recorded in [publication-handoff.json](publication-handoff.json): 14 existing live materials updated/read back, six existing enabled skill workflows in English, and all 11 existing `.flood` snapshot entries refreshed with live versions. No access flag or task status changed. Snapshot filenames containing `v1` or `soft-utility` are retained compatibility paths; their title/content/version now reflect the live item. No automatic bidirectional sync is implied.

The user stopped implementation and requested finished rules and skills for a different agent. The current deliverable is the normative English contract, seven repository skill files, a portable selected concept and [the starting prompt](handoff.md). Earlier code remains partial. None of these publications establishes native acceptance or completes the wider application migration. [Handoff validation](handoff-validation.md) records the checks appropriate to this documentation delivery.

The current checkout excludes `AGENTS.md` and `Design.md` through `.git/info/exclude`; their local amendments will not travel with an ordinary commit. The equivalent selected-direction contract is tracked through the docs/design package and the published live MCP items. The tracked root `README.md` also links this package, and the MCP document provides the project-context entry. No ignore setting was changed or ignored file force-added.
