---
name: flood-ui-implementation
description: Implement or fix approved flood.md UI in Svelte 5 and Tauri 2 while preserving shared Rust persistence and interaction contracts. Use only when the user requests UI code changes.
---

# Flood UI implementation

Complete [the bootstrap](../../agent-contract.md#bootstrap), read `Stack.md`, the matching [recipe](../../flows.md) and [component contract](../../components.md). Read [implementation status](../../implementation.md) as a record of unfinished work, not an approved visual reference. Inspect the actual working tree and one comparable neighboring use before editing.

## Build the requested slice

1. State the user job, affected rule/component/recipe IDs and exact scope. Apply [screen design](../flood-screen-design/SKILL.md) when composition is unresolved; use [design-system maintenance](../flood-design-system/SKILL.md) when shared roles change. Do not reopen Quiet Workbench.
2. Reuse `src/components/ui/index.ts`, the existing navigation model and shared core API. Parent surfaces own loading, drafts, expected versions and mutations; presentation components emit intents. Extract repeated behavior when demonstrated, without a new framework, state library, module hierarchy or generic configuration engine for styling.
3. Consume semantic CSS variables from the single authored `src/design/tokens.json`. Do not edit generated CSS. Keep controls neutral, original blobs sparse and task rows free of normal-urgency badges and redundant metadata.
4. Use native semantics with the contracted keyboard behavior. Separate task completion from opening; do not nest interactive controls. A named overflow trigger remains discoverable. Keep focus visible through menus, dialogs, navigation, completion and deletion.
5. Keep loading/error/empty distinct. Block duplicate non-idempotent activation while pending and communicate the operation. Show success only after the shared core acknowledges persistence.

## Preserve the local file contract

Use the shared Rust validation/mutation path with stable IDs, expected versions, atomic writes and existing recovery behavior. Do not write a second frontend persistence path or store an independent copy as truth.

Check async results against the current object, request and draft state **when they resolve**. A pre-request dirty check is insufficient if the user types during an await. A stale list refresh/open response must not overwrite a newer draft, change the selected object or undo an acknowledged completion. Cancel/ignore stale reads; reconcile the latest state by the owning flow contract.

On save failure retain the draft. On conflict retain draft plus base version, show the disk change and require an explicit resolution. Do not retry a stale mutation blindly, silently merge unknown changes or navigate away as if a failed save succeeded. Source snapshots remain readable offline.

If agent controls change, apply [agent interaction](../flood-agent-interaction/SKILL.md). Never infer task completion from a run becoming ready for review. Match operation labels to actual backend effects.

## Verify and hand off

Run the change-appropriate checks in [verification](../../verification.md): Svelte/type check, build and font-floor check for UI; token generation/drift check when relevant; focused core tests when persistence changes. Then use [UI review](../flood-ui-review/SKILL.md) for actual affected scenarios in Tauri.

Use isolated synthetic data for destructive/conflict fixtures. Record themes, viewport, dataset, keyboard route, recovery and implementation revision. Do not repeat unrelated tests after passing checks without a new concern. A browser specimen, successful build or earlier screenshot is not current native evidence.

Deliver the requested slice, checks and remaining limitations. Preserve unrelated working-tree changes. Do not complete the wider redesign or migrate every screen after proving only one component.
