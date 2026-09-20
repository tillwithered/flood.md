---
name: flood-ui-materials
description: Refine Flood borders, dividers, surfaces, shadows, top-edge highlights, spacing, nested radii, monochrome light/dark controls and semantic status colors. Use for visual chrome/material work, not unrelated backend tasks.
---

# Flood UI materials

1. Read `docs/ui/README.md`, then only the relevant section of `materials-and-borders.md`, `geometry.md` or `color-and-state.md` in that directory.
2. Inspect the affected runtime selectors and their actual parent surfaces; do not dump App.svelte/styles.css or load unrelated design skills.
3. Classify each edge as divider, decorative surface edge, required control boundary or focus/state. Remove redundant edges before reducing contrast.
4. Pick one material role. Reserve top-light for a small number of floating surfaces; no glossy treatment for ordinary rows/inputs.
5. Preserve monochrome controls and pink-red Danger. Blue is allowed inside existing brand assets, not as action styling. Respect forced colors.
6. Compute visible nested inset including border width. Keep layout stable between rest/hover/focus/selected/error.
7. Read `docs/ui/recipes/README.md` when code is needed. The CSS specimen is not a runtime dependency or a second global token source.
8. Check affected colors, themes, focus, clipping and narrow layout via `docs/ui/acceptance.md`. Report what was actually tested.

Output a scoped implementation/review: affected surface, chosen material, removed noise, token mapping, contrast/state evidence and remaining limitations. Do not create a new theme/framework or rewrite the whole frontend for a border change.
