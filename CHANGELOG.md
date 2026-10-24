# Changelog

## Unreleased

- Local component playgrounds use shared recipes for real previews and matching
  TSX, with controls for supported props, state and native focus.
- Documentation adds local syntax highlighting, a Markdown reader, copy/download
  and canonical `.md` files. Setup is explained once; component pages show imports.
- API tables and declared defaults are generated from TypeScript source during
  every build; missing documentation/preview coverage blocks verification.
- Project UI examples support optional semantic imports such as `@/ui/button`
  with explicit adapter and alias setup, alongside direct package imports.
- Dark Input/Textarea use one uniform necessary contour instead of an emphasized
  bottom edge. Textarea scrolls without a default native resize grip; hosts can
  opt into resizing with CSS. Focus stays 2px and does not shift layout.

These changes are unreleased. The planned correction release is 0.2.3; align
package versions and verify publication before enabling a new installation command.

## 0.2.2 — Marketing composition

- Add opt-in display typography and a selectable CodeSnippet primitive with a
  host-owned action slot. Preserve existing heading metrics and component APIs.
- Add display and monospace semantic roles to the single token source.
- Compose the one-page website from actual Flood components with an editable
  workspace form and interactive ideas list. Keep all demo data local.

## 0.2.1 — Icon geometry

- Center contents inside IconSlot without changing public APIs or token values.
- Replace the website's text plus with a Lucide SVG that fills the existing
  relative icon geometry. The icon package belongs to the website, not the Flood
  runtime; its license is retained in the deployed assets.
- Verify SVG sizing and centering at root font sizes 16, 20 and 24px.

## 0.2.0 — Base dark DS

- Add the opt-in dark foundations profile with
  154 semantic roles, bundled Inter with its OFL license, rem-based geometry,
  typography, actions, feedback, focus, motion and layering tokens.
- Add FloodRoot, Text, Heading, Stack, Inline, Surface, Divider, IconSlot and
  IconButton; expand Button sizing and native form recipes inside FloodRoot.
  Preserve legacy theme behavior outside the opt-in root. Add a Next.js
  foundations example and browser checks for forms, scaling and system modes.
- Add a functional team settings example in two compositions, covering native
  local form state/reset, member roles, validation and responsive layout.
- Make dark foundations the primary installer and agent-guide example. Align
  all package/workspace versions and keep the website installation disabled
  until publication of all four packages is verified.

- Add an experimental, opt-in foundations token profile with typed aliases,
  CSS/JSON generation, a public catalog and TypeScript names. Existing token
  imports retain their contract. The new exports belong to the aligned 0.2.0
  release and are absent from 0.1.1.
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
