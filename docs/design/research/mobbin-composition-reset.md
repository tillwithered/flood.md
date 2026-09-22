# Mobbin research: composition reset

Status: **research complete for the current comparison; the user selected concept 1 Quiet Workbench on 2026-09-20. Native implementation acceptance remains pending.** Accessed and reviewed: **2026-09-20**.

This study supports a new composition review after the user found the first UI-kit slice visually weak. The requested direction remains utilitarian minimalism with the existing flood blobs retained and developed. It supplements the [research procedure](../research.md). The later [Quiet Workbench decision](../quiet-workbench.md) authorizes the corresponding direction amendments; this research record itself does not claim implementation or native acceptance.

## Question and Flood scenario

How can project navigation recede while the current task list or document becomes the clear working surface? The current synthetic [project](../evidence/native-project-dark.png) and [task](../evidence/native-task-dark.png) captures show a task index repeated in the sidebar and main area, repeated priority signals, and a crowded project header above comparatively loose rows. These are observations of saved evidence, not a new native verification run.

Compare concepts using the same synthetic project, “Домашняя студия”, eight open tasks and a collapsed group of two completed tasks. The alternatives explore a project list, a list with an adjacent task document, and a project page with inline task expansion. Preserve local Markdown ownership, the existing open/completed states, three urgency values, accessible text and explicit agent control. Populated lists, long titles, agent activity, pending results and recoverable errors belong to the subsequent implementation validation; these concepts do not demonstrate those states.

## Evidence boundaries

The three high-resolution Mobbin images below were visually inspected. Each image includes a product-identifying Mobbin footer. Canonical screen URLs were retained from the research session. Local review copies are under `C:/Users/xClean/.codex/artifacts/flood-design-v2/references/`; they are reference evidence, not Flood assets or distributable UI dependencies.

**Capture date is unknown for every screen.** A dated product update establishes a recent primary source, not the screenshot's date or version. The image observations do not establish keyboard behavior, responsiveness, contrast compliance or the current behavior of those products. Dates visible inside sample content are not capture dates.

## Reference registry

### 1. Linear: project navigation and a dominant list

- **Primary source / update date:** [A calmer interface for a product in motion](https://linear.app/now/behind-the-latest-design-refresh), **2026-03-12**. The article describes consistent action locations, quieter navigation, fewer competing icons and iterative testing of theme tokens inside the app.
- **Canonical Mobbin screen:** [Linear issue list](https://mobbin.com/screens/fd1b4d88-f021-49a3-98af-4cd3a87e1d29).
- **Reviewed image:** `linear-list.webp`. **Capture date:** unknown. **Access date:** 2026-09-20.
- **Observed:** a muted sidebar contains destinations and team navigation; the main region owns the issue list. A location row and view controls precede one group heading. Four issue titles align on the left; secondary properties occupy consistent positions on the right. Individual issue titles are not repeated in the sidebar in this image.
- **Transfer:** give navigation, view controls and task content distinct jobs. Reserve the strongest reading path for task titles and avoid a second simultaneous task index.
- **Reject:** teams, cycles, initiatives, issue identifiers and repeated property pills as default Flood requirements; the exact capsule tabs, inset shell, palette and unmeasured density.
- **Flood scenario:** opening a project with many personal tasks and finding the next task without competing sidebar content. List composition is the useful evidence; the image's four rows do not prove a populated Flood screen.

### 2. Superlist: selection connected to a task document

- **Primary source / update date:** [Superlist updates, version 1.57.0](https://www.superlist.com/updates), **2026-08-14**. The release describes a task Activity Log, more specific recurrence and expanded multiselect operations. This establishes recent task-product context; it does not date the inspected screen.
- **Canonical Mobbin screen:** [Superlist task detail](https://mobbin.com/screens/06b73426-c2d1-4d45-a3e4-7a797cacf91d).
- **Reviewed image:** `superlist-detail.webp`. **Capture date:** unknown. **Access date:** 2026-09-20.
- **Observed:** navigation lists destinations and lists on the left. A selected task in the middle corresponds to the detail title on the right. Completion is explicit through text and strike-through. The detail contains two checklist items, lower provenance and a message field. The screenshot contains only one task row.
- **Transfer:** make the relationship between an opened task and its parent list clear. Give the task title, content and completion state separate, predictable positions.
- **Reject:** adopting three columns as a universal layout merely because the reference uses them; lavender surfaces, oversized headers, messaging as the default task workflow, and recurrence or collaboration features outside Flood's scope. The sparse screenshot is not evidence of high-density usability.
- **Flood scenario:** move from project list to a task document and return predictably. A list/detail composition is one explicit concept under comparison, requiring narrow-window and focus testing before implementation becomes an accepted pattern.

### 3. Craft: readable document hierarchy

- **Primary source / update date:** [Craft update 3.5.0](https://www.craft.do/blog/craft-update-3-5-0), **2026-07-07**. The announcement covers a consolidated All Tasks view, task interaction improvements and navigation refinements. It explicitly says task-management changes would reach Web and Windows later, so this study makes no platform-parity claim.
- **Canonical Mobbin screen:** [Craft document editor](https://mobbin.com/screens/f19df619-ca6e-4757-8866-fabe606c16a3).
- **Reviewed image:** `craft-document.webp`. **Capture date:** unknown. **Access date:** 2026-09-20.
- **Observed:** a central document owns the reading area; a left outline reflects its sections, and a right inspector exposes formatting controls. Heading levels, paragraph rhythm and lists distinguish content structure. Colored blocks, page-like nested surfaces and the inspector also consume substantial attention and width.
- **Transfer:** let title, section headings and body establish the document hierarchy before adding containers. Keep editing tools spatially distinct from the material being read.
- **Reject:** the permanent formatting inspector, nested page/card shell, arbitrary text colors, decorative heading backgrounds, alternate fonts and document-builder scope.
- **Flood scenario:** reading or editing task Markdown and project artifacts. An outline is only a possible response to demonstrably long material; it does not justify another permanent navigation column.

## Selected Flood composition rule

The user selected this Flood synthesis through concept 1 Quiet Workbench, with lightweight architecture and uncluttered interfaces as explicit constraints. It is an original Flood decision, not a rule attributed to any reference product:

1. **Projects-only object navigation:** the sidebar contains projects, alongside compact global utility destinations. Task titles live in the current working list, without an expanded duplicate task tree.
2. **Dominant task list:** project identity and lightweight view controls lead directly into tasks. Useful metadata shares a stable alignment; an extra line earns its space through useful content or a long title.
3. **One primary action:** each working surface has one visually primary next action. Context navigation and rare management actions have lower emphasis; repeated equally prominent create actions do not compete.
4. **Rare identity blob:** preserve existing flood material at a meaningful identity or agent moment. Repeating the same object across navigation and content must not create a second trail of colored glyphs.
5. **Explicit priority text:** urgency remains understandable through labels such as “Важная” and “Срочная”. A blob's shape or color cannot carry priority or agent run state alone.

Three independent generated concepts were displayed in the following order on 2026-09-20. The user selected **1 · Quiet Workbench** and requested lightweight architecture and uncluttered interfaces. These images remain composition studies, not running UI or measured token specifications.

| Display order | Direction | Main structural change | Local generated image |
| --- | --- | --- | --- |
| 1 | Quiet Workbench | Project navigation and one dominant task list | `C:/Users/xClean/.codex/generated_images/01a0bda4-faac-7631-bb96-1e0a611a7662/exec-5bd71f5c-bb65-4bc6-b857-e2c0ab70a713.png` |
| 2 | List and Document | Project navigation, persistent task list and selected task document | `C:/Users/xClean/.codex/generated_images/01a0bda4-faac-7631-bb96-1e0a611a7662/exec-426ce9c6-d08e-4472-9122-3106034da2e4.png` |
| 3 | Project Notebook | Project selector in top navigation and inline task expansion | `C:/Users/xClean/.codex/generated_images/01a0bda4-faac-7631-bb96-1e0a611a7662/exec-d8f045dc-61ea-4dfb-8c4c-4edbc502f079.png` |

All three use the same synthetic project and existing brand blob. Candidate 1 also uses an inspected Todoist project screen as structural inspiration: [canonical Mobbin screen](https://mobbin.com/screens/46dab991-e521-44bc-984a-c936e31610a8), capture date unknown, access date 2026-09-20. The sidebar lists projects while task content occupies the main region; the Insights panel and collaboration features were deliberately excluded. Todoist is supplementary visual evidence, not one of the three dated primary-source entries above. Implementation must resolve responsive transitions, focus and selection behavior, exact typography, contrast and disclosure-state details independently; raster concepts do not verify them.

## Direction amendments and preserved constraints

The independent MCP review returned revision `03b707fa09d7cb24465dc114df31f091384e0820b1df5206004b1799a33a4257`, `status=current`, no pending rules. The following conflicts motivated the versioned amendments recorded in [adoption](../adoption.md) and [publication receipts](../publication.json):

| Existing requirement or conflict | Consequence for this exploration |
| --- | --- |
| Design.md explicitly provides a project arrow that expands quick tasks in the sidebar. | Projects-only navigation changes the previous contract. The subsequent explicit user selection authorizes the projects-only amendment for this slice. |
| Design.md sets a centered 720 px working column; live rules prescribe rounded full-row controls with 8–12 px gaps and Settings-style open tabs. | The selected amendment separates bounded 880–960px task lists from 720px readers and compact task/navigation rows from independent action rows. Tabs keep one bottom divider. |
| Soft Utility rule item 11 specifies a blue-violet interactive accent, while its later additions and Visual foundations require monochrome controls. | The selected monochrome direction removes the stale interactive-accent clause; semantic/brand exceptions remain explicit. |
| Agent art direction assigns blobs to identity; Design.md and foundations also define priority glyphs and gradient priority signals. | Preserve original asset provenance while removing repetitive task-priority blobs in this slice. Ordinary urgency remains accessible in the editor; important/urgent use explicit compact text. Unmigrated legacy roles remain scoped. |

The user-selected direction supersedes the historical art-direction preference, but accessibility, data safety, trust and native acceptance requirements remain. Versioned live updates are recorded through the [adoption process](../adoption.md); private data, permissions and native acceptance remain unchanged.

## Acceptance still pending

The live design skill `5GYP0WCTRTHE89CHGAHWQTK0S8` requires a scenario-specific reference registry before production anchor recomposition. This local document records the three inspected candidates; publication of the live registry `18MJPE1VNWR9J8Z1H8AKJVBN4E` is recorded in the publication receipt.

The user selected Quiet Workbench; implementation and evidence are the next step. Before broad propagation, apply the [verification contract](../verification.md) to one complete scenario: both themes, normal and narrow windows, realistic populated and recovery states, long Russian text, keyboard and focus, 200% text zoom and reduced motion, then actual Tauri/WebView evidence. Live acceptance rule `2QFDS93B1B878PDQECJQCZW47Y` requires this gate and user confirmation before broad propagation. Research completion, a concept image and a static token check each establish different evidence; none establish accepted production design.
