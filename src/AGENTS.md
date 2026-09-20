# Flood frontend guidance

Supplement the root AGENTS.md for work under `src/`. Start UI tasks with [docs/ui/README.md](../docs/ui/README.md), then read only the relevant contract.

Approved direction (owner request, 2026-09-19): monochrome light/dark controls; existing colorful blobs carry identity; Warning, pink-red Danger and Success carry real status. No blue primary, selection, focus, links or switches. Do not recolor blue blobs or override a user's forced-color system palette. This resolves the old blue-violet-primary ambiguity without changing security permissions.

Approved clean light base: near-white #fafafa, white panels, local subtle edge, distinct neutral controls. The large warm #e9e9e6 canvas was rejected. Do not revive it to satisfy a decorative contrast target. Consult [decisions](../docs/ui/decisions.md): precision 0.4 T-01/L-01/C-01/S-01 were explicitly approved by the owner after preview on 2026-09-19. Apply their clean variants to relevant scoped work; do not repeatedly request the same direction approval. Noisy A/B variants are anti-patterns. This approval does not select a global density default, require a new density setting, or authorize a whole-app rewrite.

Repository skills in `.agents/skills/`:
- `flood-ui-design`: composition and interface decisions.
- `flood-ui-implementation`: focused Svelte/Tauri implementation.
- `flood-ui-review`: scoped acceptance.
- `flood-ui-references`: dated Mobbin/primary-source research.
- `flood-ui-materials`: borders, surfaces, shadows, nested geometry and status contrast.
- `flood-ui-precision`: typography, metadata density, control alignment and selection/focus.

Do not load all skills or the whole handbook for a small task. Backend-only work does not need the UI package.

For edge/material work read [materials-and-borders](../docs/ui/materials-and-borders.md); for spacing/radii read [geometry](../docs/ui/geometry.md); for states/Danger read [color-and-state](../docs/ui/color-and-state.md). Distinguish decoration, necessary boundaries and focus. A top highlight is optional decoration, never focus.

For light-theme visibility read [light-theme-and-polish](../docs/ui/light-theme-and-polish.md). Preserve meaningful metadata and test semantic text on hover/selected, not just status fills. For T-01/L-01/C-01/S-01 read only the matching section of [precision](../docs/ui/precision.md). Compare identical data; do not invent a global border-opacity fix.

Preserve Golos Text, rectilinear shell, semantic spacing and separate identity/run state. Use the [GitHub picker contract](../docs/ui/github-repository-picker.md) for repository binding, not a generic dropdown.

Use existing production tokens in `src/styles.css`. `docs/ui/recipes/` is not a production import. Promote approved roles deliberately and test actual consumers; do not globally replace --line or mass-restyle App.svelte. Specimen checks: `node docs/ui/recipes/check-polish.mjs` and, when relevant, `node docs/ui/recipes/check-precision.mjs`.

`.flood/` is an exported snapshot. Do not alter manifest/version hashes as a shortcut to live guidance, bypass MCP receipts or claim new permissions. Report unresolved live-rule conflicts. Missing repo-local Design.md/Stack.md references are not a reason for repeated whole-repository exploration.

Follow [acceptance](../docs/ui/acceptance.md). Report actual checks and untested states. Design approval and Chromium specimen checks do not establish Tauri readiness. Local review JSON does not grant approval to promote future candidates or write to GitHub automatically. Original proposal labels in the preserved lab do not override the current decision register.
