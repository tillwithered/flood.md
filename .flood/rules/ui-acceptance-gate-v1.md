# UI acceptance gate v1

For implemented UI, follow docs/design/verification.md and docs/design/skills/flood-ui-review/SKILL.md. Verify the affected scope with realistic content; mark inapplicable cases with a reason.

- Light and dark themes; normal and minimum desktop windows.
- Populated, empty, loading, pending, recoverable error, conflict and disabled states where applicable.
- Long Russian text, duplicate names, missing optional data, 200% text enlargement and text-spacing overrides.
- Logical forward/reverse keyboard order, visible focus, Enter/Space, pattern-appropriate arrows, Escape and return focus.
- Reduced motion and relevant forced-color behavior. No text below 12px, color-only meaning, unexplained layout shift or page-wide horizontal scrolling.
- Draft preservation through slow save, failure, retry, external change and stale asynchronous reads. Success requires persistence acknowledgement.
- Comparable before/after evidence and actual visual/interaction inspection in a Tauri window. A browser preview or successful build alone is not desktop acceptance.

The selected Quiet Workbench direction is already approved. New shared patterns are verified on a full user scenario and the populated project overview, task editor and project context before broader migration. Broad propagation follows this gate and the user's implementation review. Direction selection does not prove implementation quality.

For navigation/task rows inspect a compact coherent list, separate completion/open actions, and distinct unclipped focus/current/hover. For independent artifact/action/disclosure rows inspect persistent rounded geometry, matching hit areas, peer gaps, no permanent dividers and expanded content within the same owning container.

Inspect control/construct/section/page spacing relationships, parent-owned gaps, open horizontal navigation with one bottom divider and a rounded active item. On narrow windows its internal scrolling must not create page overflow. For genuinely parallel nested rounded contours verify inner radius = max(0, outer radius minus actual visible inset); circles, pills, unrelated contours and focus rings have their own contracts.

For a documentation-only request, validate rule consistency, skill format, references and any generated token outputs. Do not launch the application or require native UI acceptance to deliver rules. Label specification, implementation, browser verification, Tauri verification and user implementation acceptance separately.
