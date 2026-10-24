# Changelog

## Unreleased

- Refine InputGroup nested action insets, sizing and radii; soften filled ButtonGroup separators.

- Add ButtonGroup for connected independent actions and InputGroup for a native
  text field with logical start/end adornments and one shared field perimeter.

- Include portable spacing/density guidance in the versioned agent bundle, with
  task routing, a stable rule and the same safe CLI/website delivery contract.

- Add RadioGroup and CheckboxGroup composed from Fieldset and native choice
  controls, with controlled/uncontrolled values, reset and form association.

- Add native Label and Fieldset foundations, reuse Label inside Field and share
  description handling; document and preview their association and group behavior.

- Group the component catalog by purpose, add category navigation and component
  search, and generate the same taxonomy in the catalog Markdown.

- Add consistent error/warning/success/info field status and associated Field
  messages; retain invalid/error precedence. Make text-field readOnly visually
  distinct and demonstrate its native editing behavior in the playground.

- Stabilize playground scene dimensions and action feedback, simplify its header
  and settings, and document third-party font/icon assets with full notices.

- Keep ScrollArea rails clear of rounded clipping corners automatically; add
  default contentInset="scrollbar" safety padding. Explicit none allows host-managed
  padding; code blocks retain their existing inner spacing.

- Add native ScrollArea with inset overlay rails, orientation choices, touch/wheel/
  keyboard scrolling, drag/track interactions and forced-colors fallback; use
  the same engine in Select, documentation code, tables and navigation.
- Add five semantic scrollbar roles and refine constrained layout, Field
  description associations and CodeSnippet action overflow.
- Ship a focused agent skill, source/rule matrix and references through one
  manifest shared by npm, safe CLI provisioning and website endpoints.
- Simplify component pages to contextual Copy for agent beside Reset and separate
  Copy code; Markdown transports the actual example and governing rules.
- Verify runtime-only website artifacts in CI, stamp source metadata and probe
  the matching deployed commit after main CI.

- Use the quiet field.border role for default control outlines, matching the
  container tone; retain field.boundary as an explicit stronger alternative.
- Derive Select option corners from the popup radius minus its padding and
  stroke. Keep independent nested actions on their own radius recipes.

- Add Select with a custom Flood single-choice trigger/listbox popup, styled
  dark geometry and a native form-value/ref bridge. Multiple/size listboxes
  remain inline native controls without an operating-system dropdown.
- Custom checkbox/radio visuals retain native inputs, keyboard behavior and refs.
- Actions use intrinsic widths, choice glyphs keep fixed dimensions, and playground
  controls use the DS with close labels and separated groups. Layout guidance
  documents these contracts for people and agents.

- Local component playgrounds use shared recipes for real previews and matching
  TSX, with controls for supported props, state and native focus.
- Documentation adds local syntax highlighting, a Markdown reader, copy/download
  and canonical `.md` files. Setup is explained once; component pages show imports.
- API tables and declared defaults are generated from TypeScript source during
  every build; missing documentation/preview coverage blocks verification.
- Project UI examples support optional semantic imports such as `@/ui/button`
  with explicit adapter and alias setup, alongside direct package imports.
- Dark Input/Textarea use one uniform quiet contour instead of an emphasized
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
