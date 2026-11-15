# Working on Flood

Flood is an independent React/TypeScript design system. This repository contains
the public product, website, documentation, examples and verification tooling.

- Read `docs/architecture.md` and the relevant package README before editing.
- Author original UI; no shadcn, Radix, Base UI or other component library.
- Compose UI from Flood's existing primitives, including inside library components,
  website and playgrounds. Never replace one with custom markup to fix appearance.
  Improve a missing capability in the small primitive first, then compose it.
  Follow [the composition skill](packages/agent/references/flood-composition/SKILL.md)
  when building or reviewing UI.
- For new components or visual API changes, apply the same
  [component-family contract](packages/agent/references/component-families.md)
  shipped to consumers; compare the closest rendered siblings before adding a recipe.
- Use the contract's anatomy review for a new component and for affected parts
  of existing components. Inspect both the detail and its surrounding scene.
- Route the actual task through [the agent entry](packages/agent/SKILL.md) and
  read the relevant workflow, not every skill. Stabilize behavior and update its
  matching guidance together. The workflow/rules indexes identify applicable
  checks; they do not prove those checks passed.
- Size skills by the decisions they teach. Keep the starting point, conditions
  that change it, a representative example for ambiguous choices and the way
  to verify the result in the main guide. Link specialized detail from the step
  that needs it. Review ambiguous guidance on realistic clean-agent cases with
  the expected outcomes withheld from the agent.
- For a recurring UI failure, identify the component or composition that owns
  the decision. Record what a reviewer can observe in the affected state and
  where the recommendation changes with context. Use a browser assertion when
  the failure has a stable measurable condition.
- For visible UI changes and visual bug reports, use the [visual review skill](packages/agent/references/flood-visual-review/SKILL.md).
  Reproduce the relevant states in the browser, inspect the captured images and
  link the evidence. Check the same state after a fix and another consumer for a
  shared component change.
- Keep knowledge metadata tied to canonical sources. New components, workflows,
  guides and token roles must regenerate the installed-version catalog. Preserve
  public material IDs and run the knowledge growth/CLI checks; do not hand-edit
  generated catalog bodies or introduce a second instruction index.
- Tokens are authored only in `packages/tokens/src/tokens.json`.
- Preserve React 18/19 APIs and the React entry's `"use client"` directive.
- Public API changes need docs, declaration output and a version decision.
- Keep exact internal package versions aligned. Do not claim npm or website
  publication until verified on the actual service.
- CLI must not overwrite existing project files or follow linked destinations.
- Never print credentials or commit account state, backups or generated artifacts.
- Keep account-specific infrastructure, operational journals and internal plans
  outside this repository. See CONTRIBUTING.md for the public boundary.
- Use topic branches and pull requests; main requires the verify check before merge.
- Name branches by purpose: feat/<topic>, fix/<topic>, docs/<topic>,
  chore/<topic>, or release/<version>-<topic>. Use lowercase hyphenated topics.
  Branches, commits and PR titles describe the change, never its authoring tool.
- Keep user docs in docs/ and version-specific agent sources in packages/agent/.
- Validate with `npm run verify`; run browser tests for behavior/style changes.
- Release and deployment process lives in `docs/releases.md` and `docs/deployment.md`.
