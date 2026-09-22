# Visual foundations v2

Apply to new or changed Flood surfaces. The user selected Quiet Workbench on 2026-09-20; docs/design/quiet-workbench.md defines its composition scope. Implementation is not accepted merely because the direction is selected.

1. Read the project Visual foundations document and docs/design/foundations.md. Use semantic roles and the single authored src/design/tokens.json source; generated CSS/reference files are outputs, not new sources.
2. Use bundled Golos Text. Type roles: caption 12/16, compact 13/18, body 14/20, lead 16/24, section 20/26, page 24/32, project title 28/34, rare display 32/40. Task-list titles use lead 16/24; project title is reserved for the single project heading. No arbitrary intermediate role without a foundations amendment.
3. Visible text is at least 12 px. Required actions/information cannot exist only as faint captions. Long Russian text and 200% text enlargement must preserve content and function.
4. Normal text contrast is at least 4.5:1, qualifying large text 3:1, meaningful boundaries/focus/graphics 3:1. Never rely on color alone. Test actual composited pairs and forced colors.
5. Use spacing roles: control 4–8, construct 12–16, cluster 24, section 32, region 48 px; 64 only for a named macro recipe. Parent layout owns peer gaps, inner relations are tighter than outer ones, and unnecessary hierarchy levels are omitted.
6. Colors use semantic tokens; literal hex is permitted only for a unique illustrative asset, not a repeated UI role. Neutrals have no perceptible color cast. Light/dark are separately calibrated roles.
7. Ordinary controls and hover/current/selected/focus are monochrome. Explicit status/urgency, destructive confirmation, supplied flood identity and live progress are exceptions. A connector logo does not color its action surface.
8. Original blobs carry sparse product/agent identity. No blob-per-task, decorative project hero or wallpaper. Ordinary urgency stays quiet in lists; important/urgent use explicit compact text. Legacy asset meanings are preserved until their individual consumers migrate; no asset family is replaced by this amendment.
9. Rounded geometry does not require another container. Navigation and task data rows form compact coherent lists. Independent artifact/action/disclosure rows retain persistent 8–10 px radius and 8–12 px peer gaps, with no permanent separators between separate controls. All hover/focus hit areas match their targets.
10. List layout has an approximately 880 px maximum, tunable up to 960 px for demonstrated fit. Reader/context/settings content retains 720 px; expanded sidebar targets approximately 224 px. Keep the existing native minimum and verify narrow layouts without squeezed parallel panes.
11. A semantic status surface is one material: children inherit it and use spacing/dividers/transparent tone changes, without contrasting nested cards or counts. Flat working surfaces have no blur or gradient background; shadows identify real overlays.
12. Horizontal navigation uses one bottom divider, no duplicate header line, no outer capsule/shadow, neutral rounded active item and internally scrolling narrow behavior without a page-wide scrollbar.
13. Scrollbars are neutral, stable-gutter controls without system arrows. Motion is short and functional; reduced motion removes nonessential movement. Do not run decorative idle loops.
14. Verify foundations and shared contracts on project overview, task editor and project context before broad migration. Cover both themes, narrow windows, long data, 200% text and reduced motion in actual Tauri. Keep direction approval separate from implementation evidence.

## Nested geometry

For genuinely parallel nested contours use inner radius C = max(0, A − B), where A is the outer radius and B is the measured visible inset, including relevant border geometry. Values come from related tokens or CSS calc(), not independent magic numbers. Example: panel 16 px, inset 6 px, inner 10 px. Pills, circles, nonparallel/asymmetric shapes and focus rings have their own contracts. Normal border-radius is a complete fallback for optional corner smoothing.
