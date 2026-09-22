---
name: flood-design-system
description: Maintain flood.md foundations, semantic tokens, shared component contracts and original blob usage. Use when a change affects a reusable visual or interaction rule; routine implementation of an existing recipe uses flood-ui-implementation.
---

# Flood design system

Complete the [project bootstrap](../../agent-contract.md#bootstrap). Read [foundations](../../foundations.md), the relevant [component family](../../components.md), and [brand](../../brand.md) only when imagery changes. Use the selected [direction](../../quiet-workbench.md).

## Resolve the system decision

1. Locate the owning rule, token, component and actual consumers. Distinguish a shared defect from a local composition mistake. Inspect the existing asset manifest before changing brand usage.
2. State the semantic need and why an existing role cannot express it. Reuse a valid role; introduce a new one only for demonstrated reuse or a named optical exception. Define its theme values, variants, supported states and replacement path.
3. Keep primitive value → semantic role → component use. Author token values only in `src/design/tokens.json`. Components consume generated variables. No copied palette, second theme provider or per-screen scale.
4. For a changed component define anatomy, semantics, keyboard/focus, state transitions, long-content/compact behavior and owner of data/side effects. Use the component contract format; do not solve behavior with styling alone.
5. Apply [progressive disclosure](../../principles.md#progressive-disclosure-matrix). Removing repetition is preferable to shrinking type or hiding consequences. A rounded panel, shadow or additional section needs a concrete purpose.

## Research only the unresolved part

Routine use of an established pattern needs no fresh research. For a genuinely new compound pattern or anchor composition, follow [the Mobbin procedure](../../research.md): examine 3–5 relevant products with dated official sources, inspect actual returned screens/flows, record canonical links and unknown capture dates, derive a Flood-specific decision and explicitly reject unsuitable details. The existing Quiet Workbench study already supports the selected composition; do not repeat it solely to begin implementation.

Use generic English queries and a consistent task intent. Do not send private project/task/chat content. External references inform the decision; they do not import product scope, tokens, assets, dependencies or another design system's authority. If Mobbin is unavailable, disclose it and use verified project evidence for the bounded work; never fabricate visual inspection.

## Deliver by mode

- **Specification:** update the owning chapter, affected rule IDs, token decision and component/flow acceptance criteria. Publish authorized live amendments with preview, unchanged apply payload, expected version and readback. Preserve access settings. Stop after documentation validation.
- **Implementation:** use [the implementation skill](../flood-ui-implementation/SKILL.md). Run `node scripts/design-contract.mjs --write` after changing authored tokens, then `--check`. A shared visual change must be proved on project overview, task editor and project context before wider migration.

Do not add dependencies, generic schema-driven UI, domain entities or new architecture layers merely for a restyle. Original blobs remain identity material, not row decoration. Record [migration and evidence](../../adoption.md); never equate generated tokens or a screenshot with native acceptance.
