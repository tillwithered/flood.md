# Visual and interaction foundations

These specifications define the user-selected [Quiet Workbench](quiet-workbench.md) direction. The inherited 12px floor, monochrome controls, accessible states, local assets and shared architecture remain requirements. The first implementation slice adopts the shared token foundation; remaining consumer migration and native verification are tracked in the [implementation record](implementation.md). Its direction and scoped geometry amendments are approved; runtime geometry still requires anchor verification.

## Token ownership

The single authored source is [src/design/tokens.json](../../src/design/tokens.json). Its generator produces [runtime CSS](../../src/design/tokens.css), imported at the start of `src/styles.css`, and identical [specimen CSS](generated/tokens.css). The former [candidate path](tokens.target.json) is a generated provenance/compatibility pointer and contains no token values. The [reference tables](generated/token-reference.md) are derived from the same source. Never hand-edit these outputs.

Use three conceptual levels: primitive value → semantic role → component use. A component consumes meaning (`--ink`, `--space-construct`), not a new local gray or spacing number. Reuse existing names where their meaning remains sound. The runtime source now includes strong-boundary, typography, geometry, interaction, motion and layer roles. Token availability does not mean every legacy consumer has migrated. This local schema is not a claim of DTCG compliance; future interchange can use a converter without maintaining parallel authored values.

The `brand` group registers the three pre-existing gradient values as documented legacy exceptions. It preserves unmigrated consumers without making gradients ordinary control roles or replacing raster blobs. New brand uses must follow the [brand contract](brand.md). Every brand exception requires a provenance and usage note.

Add a token only for a demonstrated reusable role or a named optical exception. Its change record includes name, meaning, values in both themes, consumers, contrast pairs and replacement/deprecation. Do not add per-screen copies of shared values. Remove a deprecated token only after all consumers migrate.

## Typography

| Role | Size/line at a 16px root | Weight | Use |
| --- | --- | --- | --- |
| Caption | 12/16 | 400–500 | Optional metadata, key hints |
| Compact | 13/18 | 400–500 | Secondary dense labels |
| Body | 14/20 | 400 | Ordinary UI and document text |
| Body strong | 14/20 | 500–600 | Actions and important labels |
| Lead | 16/24 | 400–500 | Task-list titles, short introduction, editing when beneficial |
| Section | 20/26 | 600 | Independent section |
| Page | 24/32 | 600 | Main page heading |
| Project title | 28/34 | 600 | The single project heading in Quiet Workbench; not section or card titles |
| Display | 32/40 | 600 | Rare onboarding moment |

Use bundled Golos Text with local system fallbacks; no remote font request. Use the code stack only for code, paths or IDs that need it. CSS sizes use rem and must not reduce the root size to evade the 12px floor. Document prose can use body/lead and heading roles; preserve Markdown heading meaning without introducing an unrelated type system. Text wrapping and content growth take priority over fixed row height.

Keep working copy concise and sentence case. Avoid all-caps headings, decorative tracking and local weights such as 620/650. Use a bounded reading width, normally the inherited 720px column, and evaluate actual Cyrillic text rather than assuming a character count from width.

## Color and material

Neutral runtime token colors have equal RGB channels. Light and dark are separately calibrated roles, not automated inversions. Use `--ink` for essential text, `--muted` for secondary text and `--faint` only for optional detail. All visible normal text, including placeholders and help, must meet 4.5:1; aim for 7:1 on primary text. Large text may use the applicable 3:1 threshold, but this is not permission to lower ordinary headings unnecessarily.

`--line` and `--soft-line` are low-emphasis structural roles and may be subtle. Filled, persistently labeled text fields use `--field` plus a resting `--line` boundary; focus, invalid state, label and layout carry the interaction hierarchy without a dark box around every input. Use `--line-strong` only when the boundary itself is necessary to identify a control or state. Meaningful graphics, necessary boundaries and focus must meet 3:1 against adjacent colors. Check composited colors, not only raw tokens. The generator verifies listed opaque pairs; alpha, gradients, images and actual focus geometry need visual verification.

Ordinary hover, selected, pressed and focus use neutral roles. A primary button uses ink/on-ink; secondary uses a subtle neutral fill; quiet actions use an unfilled surface. Destructive controls own distinct danger resting, hover, pressed and focus roles; hover changes the surface and never adds link underlining. Do not combine a persistent button fill with a decorative outline. A focus outline is an accessibility state, not a violation of that rule.

Urgency/status may use attention, danger or success ink with explicit text/icon meaning. Semantic surfaces are optional and small. A notice action belongs to that notice material and uses the matching info/success/attention/danger action role, including its own hover, pressed and focus treatment; it is not an ordinary neutral button placed inside a tinted banner. Do not tint whole task lists. In task indices, ordinary urgency is quiet and has no repeated badge/blob; important and urgent values use compact explicit text. Avoid identical age labels and duplicate project/open-state metadata. An error and an urgent task can share a red family, but their icon and wording must distinguish the meanings. Brand imagery is governed separately; no colored connector buttons.

## Space, size and density

| Relationship | Target | Ownership |
| --- | --- | --- |
| Within a control | 4–8px | Control |
| Within a compound element | 12–16px | Component |
| Related peer constructs | 24px | Parent layout |
| Independent sections | 32px | Page composition |
| Major regions | 48px | Shell/page composition |
| Rare macro separation | 64px | Explicit spacious/empty recipe |

Compactness is local: short gaps inside a task row; larger gaps between sections. Do not spread every row apart like a dashboard card, or use the same 16px gap at all levels. Parent layout owns gaps; children do not impose arbitrary external margins.

The minimum hit area is 24×24px, with runtime roles for 32/36/40px desktop control heights. Treat those heights as minimums: labels and 200% text zoom can expand them. A 16px icon does not imply a 16px target. Prefer comfortable targets for frequent or dangerous actions.

Use a single default density. A compact variant is allowed for sidebar/secondary lists when text, target size and focus remain sound. Do not add a density preference merely to avoid resolving the design.

## Geometry and composition

The native window boundary stays rectilinear. Inside it, the shell may separate quiet chrome from one inset dominant work surface; this is spatial hierarchy, not a card around page content. Use 8px for controls, 10px for independent action rows and up to 16px for actual compound panels or the inset work surface. A radius is not a reason to introduce a container. Data rows, navigation rows and independent action rows are different components; do not force all of them into floating cards. The selected direction narrows the previous blanket rounded-row rule: compact navigation/task rows use a coherent list; independent artifact/action rows retain peer gaps and persistent rounded geometry.

For genuinely parallel nested rounded contours: inner radius = max(0, outer radius − measured visible inset). The target panel 16px/inset 6px/inner 10px is one named recipe. Border thickness contributes to the actual visible inset. Do not apply this formula to circles, pills, nonparallel shapes, focus rings or independent items merely near a panel.

Every rounded UI contour uses the shared `--corner-shape-rounded` smoothing role when the WebView supports `corner-shape`; `border-radius` remains the complete fallback and owns layout, clipping and hit geometry. Apply smoothing consistently to controls, rows, fields, panels, overlays and the inset work surface instead of maintaining selector allowlists. True circles, radio marks and source artwork retain their native geometry. No layout, focus, contrast or minimum-target behavior may depend on smoothing support.

Keep flat surfaces flat; shadows only explain overlap. No glass, blur or gradients on ordinary working surfaces in the new target. Existing raster blobs keep their own depth and color. Horizontal navigation uses an open strip with one bottom separator; the active item can have a neutral rounded background. Do not duplicate the adjacent header boundary.

The outer application chrome may use one restrained neutral vertical depth gradient: it begins at `--canvas` and ends at the slightly darker `--canvas-depth`. A low-opacity monochrome grain may sit on that chrome to prevent a sterile flat fill; it must not reduce text contrast, enter the inset work surface, become a visible pattern, or replace semantic state. The gradient must remain subtle, contain no hue or highlight bloom, and never continue into pages, fields, panels or status surfaces.

## Windows, scrolling and layers

Quiet Workbench uses a dedicated project/all-task list width of approximately 880px, adjustable up to 960px after content-fit checks; readers and standard context/settings content retain 720px. The expanded sidebar targets approximately 224px; collapse remains accessible. These selected roles supersede the initial 304px sidebar/all-pages-720px composition. Existing gutters adapt to the smaller shell, and the legacy 1160px role does not authorize a dashboard. Validate at 1280×800, 1024×768 and the actual configured minimum window size. Inspect `tauri.conf.json` before choosing a minimum. At compact width collapse secondary navigation and open task detail as its own view; never squeeze two unusable panes together.

One intentional scroll owner per region; avoid a scroll box inside another for ordinary prose. Use stable scrollbar gutters where a bar can appear. Visible scrollbar thumbs are neutral and draggable; hiding a scrollbar is limited to the horizontal navigation strip, whose focus/scroll affordance still works. Long URLs/paths wrap or have an explicit bounded code-scroll area, without horizontal page scrolling.

Layer order is content → sticky region → popover → modal → notification → tooltip, but use DOM ownership/top-layer semantics correctly. A popover belonging to a modal remains in that modal's interaction scope. A tooltip never pierces an unrelated modal, and no notification covers its focused action. Avoid giant arbitrary z-index values.

## Motion and loading

Use 100ms for local feedback, 140ms for routine transitions and at most 180ms for entry; exit can be immediate. Animate opacity/transform when motion explains a transition. Do not animate layout continuously, delay acknowledgement for a flourish, or run decorative idle loops. Pending UI keeps its geometry and operation label; a loading spinner alone is insufficient for a long action.

Honor both OS reduced motion and the app setting. Disable spatial/brand motion and smooth scrolling; keep static state feedback. Provide deterministic non-animation completion logic. A progress percentage is shown only when the process measures it.

## Semantics and accessibility

Native HTML semantics first: button for action, link for navigation, input/textarea for entry, checkbox for a persistent boolean. The product's custom appearance rule does not prohibit these elements. A custom combobox/menu must implement its keyboard/focus contract; adding an ARIA role does not create behavior. Never use positive tabindex, nested buttons or a listbox for a task row containing arbitrary actions.

Keyboard focus is distinct from selection, hover, active route and completion. Buttons use a visible neutral 2px outline with 2px offset by default. Text inputs use a two-layer treatment: decisive inner boundary plus a softer outer halo; invalid fields and danger controls use the corresponding danger boundary and halo rather than a black ring. Restore focus meaningfully after close, deletion, completion or reordering. On Windows high contrast, allow system colors and visible outlines; do not suppress forced colors globally. Use polite status announcements for save/progress outcomes and assertive alerts only when interruption is warranted.

Test text resize, text-spacing overrides and actual keyboard behavior according to [verification](verification.md). Automated checks do not prove screen-reader usability.
