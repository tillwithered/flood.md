---
name: flood-ui-precision
description: "Polish Flood typography, metadata density, control alignment and monochrome selection/focus states. Use for visual hierarchy, noisy lists, mismatched controls or optical alignment; not for backend work."
---

# Flood UI precision

Read `docs/ui/decisions.md`, then only the relevant section of `docs/ui/precision.md` (T-01, L-01, C-01 or S-01).
Preserve the approved clean light base and existing dark/status palette. T-01/L-01/C-01/S-01 were explicitly approved after preview on 2026-09-19; use their clean variants for scoped implementation. Noisy A/B variants are not approved designs. Both density variants remain scenario-specific, not a mandated preference or global default.
Use `docs/ui/recipes/precision.html` to compare identical content. Its preserved proposal labels are historical; current approval is recorded in decisions.md. Do not copy the entire lab stylesheet into the application.
Keep meaningful metadata, necessary control boundaries, keyboard focus and source/permission distinctions. Density changes spacing, not data or readability.
Inspect one affected component and nearby callers, implement a narrow change, then run relevant acceptance. Do not rescan the whole monolith for polish.
For specimen edits run `node docs/ui/recipes/check-precision.mjs`; optional browser runner is documented in `docs/ui/recipes/precision-checks.md`.
Report actual checks and visual-review status separately. Approved direction does not certify production readiness. Do not promote future candidates or update live .flood permissions from local review JSON.
