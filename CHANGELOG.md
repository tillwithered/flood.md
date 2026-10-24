# Changelog

## Unreleased

- Target the next aligned minor, 0.2.0, for the dark foundations profile. Add
  154 semantic roles, bundled Inter with its OFL license, rem-based geometry,
  typography, actions, feedback, focus, motion and layering tokens.
- Add FloodRoot, Text, Heading, Stack, Inline, Surface, Divider, IconSlot and
  IconButton; expand Button sizing and native form recipes inside FloodRoot.
  Preserve legacy theme behavior outside the opt-in root. Add a Next.js
  foundations example and browser checks for forms, scaling and system modes.

- Add an experimental, opt-in foundations token profile with typed aliases,
  CSS/JSON generation, a public catalog and TypeScript names. Existing token
  imports retain their contract. The new exports require the next aligned minor
  release; they are not published as part of npm 0.1.1.
- Add component, theme, agent and FAQ guides with a documentation index.
- Add contribution and private vulnerability reporting guidance.
- Move account-specific hosting configuration and operational journals outside
  the public repository; use npm trusted publishing without a token fallback.

## 0.1.1 — Reproducible release

- Publish all four packages from Linux GitHub Actions with provenance.
- Preserve executable permissions for the CLI entry in the release archive.
- Align installer, agent guides and website with the automated release.

## 0.1.0 — First foundations

- New independent React/TypeScript design-system monorepo.
- Eight original components, semantic tokens and light/dark themes.
- npm installer with dry run, file preservation and version diagnostics.
- Versioned agent instructions, plain-text endpoints and configuration schema.
- One-screen landing page and Railway container configuration.
- Package-consumer tests and Next.js App Router integration fixture.

Published versions are listed in GitHub Releases and npm. Documentation on main
may include unreleased changes; use the matching release tag for stable guidance.
