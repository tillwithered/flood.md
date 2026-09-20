---
name: flood-ui-interactions
description: "Use for Flood menus, selects, comboboxes, dialogs, source-picking flows and operation feedback. Distinguish commands, values and committed operations; preserve the approved monochrome UI."
---

# Flood interaction components

Read `docs/ui/README.md` and `docs/ui/decisions.md`, then only the relevant section of `docs/ui/interaction-components.md`.
For repository binding also read `docs/ui/github-repository-picker.md`. `docs/ui/coverage.md` distinguishes approved visual decisions from unimplemented components.

Use the approved 0.4 palette and geometry. M-01/V-01/D-01/F-01 are candidates until the owner explicitly approves them. Do not promote a candidate because files are in main.
Separate query/active option/selection/committed binding. Preserve stable IDs and drafts. Reconcile an unknown outcome before retrying mutations; never derive permissions from UI state.
Choose menu for commands, combobox for a searchable value, dialog for a bounded workflow. Implement the chosen keyboard/focus contract.
`docs/ui/recipes/flows.*` are local simulations. Do not copy fixture data, mock success, timers or a second token system into production. Extract one real component with existing typed APIs, not the entire lab.
Run relevant checks; report missing Tauri, assistive and real-backend coverage. Do not load the entire handbook for a local control edit.
