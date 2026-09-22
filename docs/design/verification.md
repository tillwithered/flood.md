# Verification and acceptance

**User scope amendment, 2026-09-22:** target the normal desktop window for the current release work. Mobile, narrow and minimum-window adaptation/testing are deferred until explicitly requested. Older minimum-window requirements below do not gate this slice. Keep normal desktop visual, interaction and data-integrity verification.

Acceptance is evidence, not an aesthetic adjective. Use the relevant [rule IDs](rule-matrix.md), [component IDs](components.md) and [recipes](flows.md). A specification can be complete while its runtime implementation is still missing.

## Maturity

Track each changed component/recipe as: **specified / direction selected / implemented / verified in browser / verified in Tauri / implementation accepted**, with revision/date/evidence. These are evidence milestones, not task statuses. Browser verification is optional as a separate milestone if the flow was directly verified in Tauri. No stage automatically proves another.

Quiet Workbench was selected by the user on 2026-09-20. That direction decision precedes the current implementation slice and does not establish native or final visual acceptance. Earlier UI-kit evidence belongs to its own revision. The [preview](preview.html) is a synthetic interactive specimen, not a working desktop app or proof of the storage flows.

## Required matrix

| Axis | Cases | Acceptance |
| --- | --- | --- |
| Theme | Light, dark, system theme switch | No unreadable text, stale theme islands or colored ordinary chrome |
| Window | Configured default 1180×760; 1280×800; 1024×768; configured minimum 760×560 | Main action, context and recovery accessible; no unexplained horizontal page scroll |
| Text | 200% text enlargement; long Cyrillic; duplicate names | Text/targets expand, controls do not clip essential content |
| Spacing overrides | Line height 1.5×; paragraph spacing 2×; letter spacing .12em; word spacing .16em | Content and function remain available |
| Input | Mouse, keyboard forward/reverse Tab, Enter/Space, relevant arrows, Escape | Predictable operation, visible focus, no traps outside active modal |
| Accessibility | Windows forced colors; relevant screen-reader smoke test | Named controls, selection/state announcement, usable boundaries |
| Motion | OS reduced motion and app reduced-motion setting | Static understandable feedback; no motion-dependent completion |
| Contents | Empty, one item, 15 populated tasks, 200-task stress fixture | Clear hierarchy, stable identity/selection and usable scrolling |
| Async | Loading, slow response, duplicate click, failure, retry | Truthful pending state, no duplicate mutation or cleared draft |
| Files | External update while clean/dirty/saving; missing file; malformed front matter | Preserve original/draft; detect versions; scoped failure |
| Sources | Offline original, absent snapshot, missing local media | Task remains readable and editable |
| Agent | Queued/running/question/review/accepted/failed/cancelled/interrupted | Actual backend state, scope and available human action |

Use the current Tauri configuration if dimensions change. The 200-task fixture is a test case, not a new guaranteed performance budget. Text resize is distinct from OS DPI scaling; record which was tested. Do not claim automated browser resizing tested native window minimums.

## Synthetic fixture

Create an isolated data directory, never alter the user's real tasks for testing. Use `FLOOD_DATA_DIR` for a controlled desktop/MCP fixture when supported by the launch path.

- Project “Запуск продукта”; another project with the same name; a long project name of about 90 Cyrillic characters.
- Fifteen tasks: all three urgencies; open/completed; one long multiline description; one missing optional source; one Markdown code block and long URL.
- One running agent, one concrete question, one ready result and one recoverable error where the test harness supports those states.
- One accessible rule, one access-disabled material, a long source identity and a missing media reference.
- A deterministic external writer changes the same file between read and write; a second conflict occurs during recovery.

Do not invent product controls solely to expose fixtures. A development harness can inject states, but native acceptance must identify injected versus real backend behavior.

## Check selection

| Change | Automated checks | Manual/runtime evidence |
| --- | --- | --- |
| Contract/docs/tokens only | `node scripts/design-contract.mjs --check`; skill validation; changed links/diff | Readability and coherent contracts; specimen inspection if changed |
| CSS/component visuals | `npm run check`; `npm run build`; token generator/checker if relevant | Both themes, long content, focus, compact and zoom in Tauri |
| Keyboard/overlay/editor | Above plus focused interaction tests when meaningful | Reverse Tab, initial/return focus, Escape, dirty close, no background activation |
| Shared Rust mutation/storage | Targeted relevant Rust tests plus UI checks | UI/MCP concurrent edit, atomic save, retry and reopen actual file |
| Release readiness | Repository-required build/tests | Real release launch; hardware/build/dataset; startup, app+WebView memory, idle CPU, responsiveness |

`npm run check` already includes `check-font-size-floor.mjs`; do not repeatedly run identical checks without reason. Use `npm run tauri dev` for a real development window when that flow is configured and available; release readiness requires the release build, not that development run alone. Native tooling availability varies—report an unavailable check rather than substituting browser output silently.

No component/library is declared accessible because it uses ARIA. Test the relevant pattern in the actual Windows WebView and assistive-technology combination. For a documentation-only package, do not claim WCAG conformance of the product.

## Evidence record

Use one short record per coherent slice:

```text
Change / implementation revision:
Rule IDs / component IDs / recipes:
Status: specified | implemented | browser-verified | Tauri-verified | accepted
Build / platform / WebView / window dimensions:
Fixtures and entry path:
Scenarios observed:
Screenshots or interaction trace:
Commands and results:
Untested / failed cases:
User direction decision, if this is a new shared direction:
```

Before/after images must use comparable fixtures, theme and dimensions. Record the capture date; an old concept image is not a current application screenshot. Keyboard traces and actual file checks supplement images for invisible behavior.

## Acceptance decisions

Block delivery of a changed flow for lost drafts, overwritten external edits, unusable keyboard interaction, inaccessible essential text/actions, undisclosed external effects or a misleading saved/completed state. Fix systemic major issues at their shared owner before propagating the pattern. Record minor issues with exact scope; do not use an arbitrary score to average away a blocker.

The final report says what changed, which evidence supports it and what remains. “Looks modern”, “pixel-perfect” and “all states covered” are not evidence.
