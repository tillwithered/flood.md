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
- Route the actual task through [the agent entry](packages/agent/SKILL.md) and
  read the relevant workflow, not every skill. Stabilize behavior and update its
  matching guidance together. The workflow/rules indexes identify applicable
  checks; they do not prove those checks passed.
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
