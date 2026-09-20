---
name: flood-ui-iconography
description: Refine Flood's Heroicons Solid semantic map, icon-only controls, tooltip behavior, optical sizing, and migration exceptions before compound UI work.
---

# Flood iconography

Start with `docs/ui/iconography.md` and the current decision registry. Use Heroicons Solid from the pinned upstream commit; do not mix outline/solid on one surface or fake filled Lucide.

Keep action icons at glyph16 inside target36/R10 unless the contract names another role. Preserve the two-layer neutral focus, transparent rest chrome, selected neutral fill, accessible names, and tooltip limits. Tooltips never contain required actions/errors.

Do not force Heroicons onto agent blobs, provider logos, typographic formatting controls, or geometric state marks. Before migrating a production surface, map every icon on that surface and report unresolved semantics. Do not remove the existing Lucide dependency until an explicit runtime migration task is approved.
