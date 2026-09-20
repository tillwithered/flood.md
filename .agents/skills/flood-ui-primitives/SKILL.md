---
name: flood-ui-primitives
description: Refine Flood primitive controls, Heroicons Solid iconography, complete state matrices, and measurable nested corner geometry before composing screens.
---

# Flood primitives

Read `docs/ui/README.md`, then the relevant section of `docs/ui/primitives-refinement.md`. For checkbox/radio/switch details still under review, use `docs/ui/primitive-controls.md`. Current evidence: `docs/ui/recipes/primitives-refined-checks.md`.

The owner chose Heroicons Solid and B geometry: inner radius = max(0, outer radius - visible inset). Do not reopen the Phosphor comparison as the default. Preserve accepted clean light/dark, neutral controls and pink-red Danger. Exact new field/popup styles remain candidates; do not infer blanket approval for all primitives.

No hard bottom shadow, inset underline or bevel on current tabs/buttons/fields/review controls. Keep keyboard focus independent. A popup may use one diffuse elevation; do not give its child controls their own shadows. Required boundaries and state marks remain distinguishable; never replace every boundary token with a faint decorative edge.

Use pinned original Heroicons paths and MIT notices, not filled outline SVGs. Do not remove production dependencies or rewrite the app as part of a specimen. Measure gap6, popup R14/B7/r7 and field clear R10/B3/r7 from actual boxes, not only Markdown arithmetic.

Return one working standalone desktop HTML for review; no separate mobile variants unless requested. Keep reflow/accessibility requirements. Report tests and limits. Update decisions/coverage, preserve historical comparisons as history, and do not import demo timers, fixtures or global specimen CSS into the app. Workspace compounds remain deferred.
