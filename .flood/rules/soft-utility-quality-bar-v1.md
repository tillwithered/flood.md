# Quiet Workbench quality bar v2

Direction selected by the user on 2026-09-20: utilitarian minimalism, a lightweight application architecture and uncluttered interfaces. This approves the current composition amendments; native implementation acceptance remains pending. Read docs/design/quiet-workbench.md and Design.md.

1. Keep the rectilinear Tauri shell and quiet neutral structure. Existing Svelte 5, TypeScript, Rust and shared data paths remain; add no framework, dependency, module or abstraction layer merely for a restyle.
2. Sidebar object navigation contains projects only, alongside Search, All tasks and Settings. No expandable task trees or repeated global task index. Selecting a project opens its working list.
3. The project has one dominant task list, one compact heading/count and one primary New task action. Context is a quiet page link. Rename/delete and other rare actions live in an accessible overflow menu, never a permanent management strip.
4. Task editor and project context remain separate working pages. Preserve a predictable return to the originating list. No permanent agent chat, task detail or formatting column.
5. Task titles dominate rows. Completion and opening are distinct controls. Ordinary urgency has no repeated badge/blob in task lists; important/urgent use compact explicit Russian text. Omit redundant project/open-state/identical-age metadata. Keep all actual values available in the editor.
6. Keep original flood assets at sparse product/agent identity moments. Agent/provider name and the label Агент identify who acts. Run state is separate text; a blob never substitutes for state, priority or permission.
7. Show real actionable questions, running work and review results near their object. Focus/delegated/needs-decision may describe derived views; they never become persisted task states or mandatory empty sections.
8. Navigation and task data rows form coherent compact lists with neutral hover/current/focus feedback. Independent artifact/action/disclosure rows keep persistent 8–10 px rounded geometry and 8–12 px peer gaps, without permanent separators. Do not create a floating card per task.
9. List working width starts around 880 px and may be tuned up to 960 px for real title/action fit; task/document readers and standard context/settings retain 720 px. Expanded sidebar targets about 224 px. Preserve narrow/200% usability and existing native minimum.
10. Use Golos Text semantic roles: body 14/20, task-list title 16/24, page 24/32, project title 28/34, minimum visible text 12 px. Do not substitute a hero banner or oversized type for hierarchy.
11. Ordinary controls, selected, hover and focus are monochrome. Color belongs only to explicit semantic states/urgency, destructive confirmation, original identity material and real progress. Shadows explain actual overlays; working surfaces have no glass or gradient backgrounds.
12. Validate populated anchors with approximately 15 tasks, a running agent, a result for review, a recoverable error, long Russian titles and sources. Direction selection does not waive the UI acceptance gate; broader propagation follows verified anchors and user implementation review.

## Material and spacing

A status surface may have a subtle semantic tone when it communicates one actual state. Its children inherit the material; no contrasting nested card or dark count. Parent layout owns spacing: control 4–8, construct 12–16, cluster 24, section 32 and region 48 px, using only the levels the composition needs. Internal relationships remain tighter than external ones. Horizontal navigation is an open strip with one bottom divider and a neutral rounded active item, without an outer capsule or shadow.

Exclude KPI dashboards, default kanban, roles/sprints, decorative giant blobs, neon, jelly controls, persistent idle animation, nested card stacks, and new Atlas/Manuscript-style product navigation. Retain local/offline core usability, data safety, accessible controls and explicit human authority.

## Progressive disclosure

Apply docs/design/principles.md#progressive-disclosure-matrix: keep frequent actions and consequential errors/unsaved states/agent decisions visible when present; expose rare management, provenance and diagnostics through named accessible controls; omit duplicate metadata and empty optional regions. A new panel/control must answer a present user job, not merely occupy space. Minimalism cannot remove discoverability, focus or recovery.
