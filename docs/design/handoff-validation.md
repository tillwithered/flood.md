# Contract handoff validation

Date: 2026-09-20. Scope: English rules, project skills, handoff, live publication and snapshot coherence. This record is separate from historical specimen checks and native UI verification. No subagents were used for this finalization.

## Performed checks

- All seven repository skills passed the bundled Skill Creator `quick_validate.py` frontmatter/name/scaffold validation. Folder names match skill names; all descriptions specify a relevant trigger and distinguish implementation from specification/review.
- `node scripts/design-contract.mjs --check` passed: 48 declared light/dark contrast pairs, generated-output consistency and local document path checks. This measures the declared token pairs, not composited runtime surfaces or WCAG conformance.
- Fourteen existing project materials were updated through versioned MCP preview/apply and read back with exact title/content/access matches. The final receipt was current with no unread mandatory rule. [The publication record](publication-handoff.json) contains IDs, versions, hashes and the receipt.
- All 11 entries already present in `.flood/manifest.json` were refreshed from live reads. The export is a snapshot, not a context receipt for a future MCP session. Agent-access flags and task statuses were preserved.
- The selected concept is included at [references/quiet-workbench.png](references/quiet-workbench.png); another agent need not access a user-specific image-generation directory.

## Manual routing review

This is a direct reasoning review of the written workflows, not an independent agent execution or a runtime test.

| Example request | Applicable route | Scope and decision checked |
| --- | --- | --- |
| “Finish the rules and skills; another agent will build” | Contract → design system, specification mode | Complete documents and publication; no UI code, app launch or inferred implementation |
| “Build the approved project task list” | Contract → implementation → review | Reuse selected composition and existing reference study; no new moodboard, task tree, ordinary badges or framework |
| “Choose project sources with search and multiple selection” | Screen design → R10 and relevant selectors | Focused dialog, project ownership and retained selection; no overloaded small popover |
| “Audit the task editor” | Review → R04, C11/C22 | Reproducible findings including dirty/pending/conflict; a review alone does not authorize fixes |
| “The result is ready; show the accept action” | Agent interaction → R12/C24 + UI copy | Review state does not complete the task; the current compound endpoint is labeled `Принять и завершить` |
| “A new pattern needs a Mobbin reference, but the connector is unavailable” | Design system → research | Report unavailable access; use verified existing evidence for bounded specification; no invented image observations or private-data queries |

## Limits

This delivery verifies the instruction package, not the current application. Native Quiet Workbench appearance, keyboard behavior, async persistence and visual acceptance remain implementation work. No claim is made that the interrupted UI code passes these contracts. The local `AGENTS.md` and `Design.md` are ignored in this checkout; the ordinary repository handoff is carried by `README.md`, `docs/design/` and the live MCP entry.
