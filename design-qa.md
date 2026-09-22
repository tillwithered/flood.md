# Quiet Workbench design QA

Date: 2026-09-20
Implementation base: `be15f35` plus the current working tree
Source visual truth: `docs/design/references/quiet-workbench.png`
Implementation: `http://127.0.0.1:1421/?preview=agent-queue&theme=light&locale=ru`

## Comparison setup

- Source pixels: 1488 × 1059.
- Implementation capture: Codex in-app browser session capture at a 1488 × 1059 CSS viewport, light theme, Russian locale, device density managed by the browser. The browser tool does not expose a durable local screenshot path; the capture is retained in the task evidence rather than the repository.
- Comparable state: populated project overview with project navigation, one primary create action, project context entry, agent work, open tasks and semantic urgency.
- Additional captures: project context and task editor in light/dark at 1488 × 1059 and at the configured 760 × 560 minimum.
- Focused regions: header/action ownership, task-row anatomy, context navigation/material rows and the task editor/result stack were inspected separately because their type, spacing and state details are not reliably judged from the full view alone.

## Findings

No actionable P0, P1 or P2 visual mismatch remains in the implemented anchor slice.

- The implementation intentionally uses the contract-selected 224 px project sidebar rather than the wider exploratory sidebar in the source image.
- The implementation includes a real agent-run summary absent from the source fixture. It is a single neutral independent action row, not a nested dashboard card.
- Task names use the 16/24 lead role at medium weight; headings use the 600 strong role. Unsupported local 550–680 weight values were removed from the runtime stylesheet.
- Task rows form a coherent flat list with independent completion and open controls. Normal urgency is omitted; important and urgent remain explicit text signals.
- Project context uses a workspace-wide navigation strip with one lower divider while section content remains a 720 px reader. The redundant lower Back action and repeated overview introduction were removed.
- Attention feedback is one tonal material; its item and count no longer create darker nested cards.
- Controls are neutral in both themes; semantic color remains limited to urgency, status, danger and live work.
- Task/file conflicts, agent questions/failures and trash/project destructive confirmations now use the shared notice, notice-action, text-area and button contracts. The command palette and remaining large overlays share the semantic scrim, boundary, elevation and motion roles.
- Integration setup, account management, project resources/skills, automation access and Telegram triage now use the same shared controls. The production route has no remaining native select and no old `primary-button` call site; an invalid `--space-5` reference that suppressed Home/project spacing was replaced with the semantic cluster role.
- Settings language/theme/motion, storage cleanup and backup controls now use the same shared components as the rest of the product. Project memory creation/editing uses the shared textarea, segmented and danger contracts, while Telegram inbox entries are separated rounded materials rather than touching divider rows.
- Long task checkpoints now form one quiet top-level material instead of visually merging into editable Markdown. Project history revisions use independent rounded rows and the shared quiet restore control; the legacy bordered button and permanent table dividers are gone. Project-context save footers inherit the workspace surface, removing the darker square visible in the installed build.

## Interaction and runtime evidence

- Project task opens into the canonical task editor and the top Back action returns to the project.
- Project context opens from the project header; the exact `Skills` section control switches the section.
- Browser console: no warnings or errors during the checked flows.
- Additional dark-theme browser checks covered populated project context overview/memory, the memory creation editor, Settings General/Integrations, Telegram inbox and Trash after the shared-control migration.
- Focused remediation checks covered task review in both themes, task conflict in dark, project context overview/Documents and a newly populated History fixture in dark. The fixture now carries three synthetic revisions so the actual populated pattern remains reproducible.
- `npm run check`: passed, including 60 declared contrast pairs, 249 local Markdown links, the 12 px font floor and zero Svelte diagnostics.
- `npm run build`: passed.
- `npm run tauri build -- --debug`: compiled `target/debug/flood-desktop.exe` and produced `target/debug/bundle/nsis/flood.md_0.1.6_x64-setup.exe`. The rebuilt executable launched and remained responsive. Packaging cannot complete the updater-signature step without the intentionally absent `TAURI_SIGNING_PRIVATE_KEY`; native screenshot automation was unavailable in the current computer surface, so this is startup evidence, not native visual acceptance.

## Comparison history

1. Initial pass found three P2 system drifts: unsupported ad-hoc weights, context navigation constrained to the reader column, and a tonal attention card containing a second dark card/count pill.
2. The runtime was changed to the 400/500/600 weight scale, full-width context navigation with aligned 720 px content, and one-material attention feedback. Task titles were set to the medium role.
3. Post-fix captures at 1488 × 1059 and 760 × 560 showed no remaining P0/P1/P2 visual issue on R03, R04 or R06.

## Follow-up polish

- P3: run the same anchor comparison inside the native WebView once native screenshot/control access is available.
- P3: finish light/narrow and native checks for integration, Telegram and artifact overlays. Their large-surface geometry is migrated, but complete keyboard/focus and real persistence acceptance is still outstanding.

final result: passed
