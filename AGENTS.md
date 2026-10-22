# Working on Flood

Flood is now an independent React/TypeScript design system, not the former desktop
task manager. Current source is this repository. Do not import old Tauri/Rust,
Svelte or desktop agent-runtime constraints into this product.

- Read `docs/architecture.md` and the relevant package README before editing.
- Author original UI; no shadcn, Radix, Base UI or other component library.
- Tokens are authored only in `packages/tokens/src/tokens.json`.
- Preserve React 18/19 APIs and the React entry's `"use client"` directive.
- Public API changes need docs, declaration output and a version decision.
- Keep exact internal package versions aligned. Do not claim npm or website
  publication until verified on the actual service.
- CLI must not overwrite existing project files or follow linked destinations.
- Never print credentials or commit account state, backups or generated artifacts.
- Validate with `npm run verify`; run browser tests for behavior/style changes.
- Release and deployment process lives in `docs/releases.md` and `docs/deployment.md`.
