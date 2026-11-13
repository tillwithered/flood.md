# Changelog

## Unreleased

## 0.2.13 — Charts and discovery

- Add optional focus recovery to Menu and Dialog-family overlays when their
  opener disappears or can no longer receive focus.

- Add LineChart for interactive trends, BarChart for grouped comparisons and BarList for compact rankings.
  BarChart also supports signed stacked columns for additive series.
  Its percent layout compares shares of each category total.
  LineChart and BarChart show series names during inspection, with a persistent key available through `showLegend`.
- Add DonutChart for part-to-whole comparisons with exact values in the center of the ring.
- Add Heatmap for comparing intensity across two labelled axes.
- Add ScatterChart, RangeChart, BulletChart, WaterfallChart, Histogram, BoxPlot and DumbbellChart with shared data-mark styling.
- Keep LineChart inspection anchored at the last hovered position during exit.
- Group charts in the component and agent catalogs. Add category filtering to
  the component sidebar and a chart selection guide with a live latency example.
- Simplify the homepage installation control. Add a compact category picker to
  the mobile catalog and a share card for the chart guide.
- Use Flood's overlay scrollbars for the site and the component canvas to
  preserve content width as overflow changes.
- Give CodeSnippet an optional shell prompt and support icon-only CopyButton
  actions with accessible copy feedback.

- Add optional end alignment to CollectionToolbar for search and filters sharing
  a row with a view or status selector.
- Flag document scrolling in full-window record workspaces during agent review,
  including when the operating system hides its scrollbar.
- Export a workspace scroll assertion from `@flood-md/agent/inspect` for browser
  tests that fail on document overflow, reserved gutter or missing Flood scroll.
- Keep the scrollbar clearance in bounded tables stable when filtering changes
  whether the table overflows.

## 0.2.12 — Data tables and Studio

- Add DataTable column visibility and layout reset, pointer and keyboard resizing,
  logical edge pinning, and expandable row details. Keep constrained headers
  on one line and support unit badges and full-label tooltips.
- Add bounded table scrolling with optional sticky headers. Place Columns
  beside search and filters through CollectionToolbar.actions.
- Add Sparkline for compact trends with an optional shared scale and an area
  gradient. Use a compact floating Editable field for budget edits so the
  table keeps its geometry during editing.
- Add Sheet for touch-friendly choices and short tasks. Improve the mobile
  Studio catalog and reference panels, and restore the home wordmark.
- Refine vertical toolbars, disclosure spacing, surface feedback and collection
  layout guidance. Extend the shipped agent rules and component references.

## 0.2.11 — Studio, navigation and motion

- Open every component in the full-window Studio with a searchable catalog,
  inline properties, canvas drag and fit controls, and a reference drawer.
  The AppShell preview composes a Flood workspace with navigation, metrics,
  and project statuses.

- Add AppShell and AppTopBar for reusable application chrome, named regions,
  a keyboard skip target, and page or bounded content scrolling.

- Add PageHeader for page titles, optional descriptions and wrapping actions.
  Use it across the documentation and component catalog.

- Add optional counts to SegmentedControl choices for switching views of a
  shared collection. Counts join the visible choice label and preserve form values.
- Add opt-in numeric columns to DataTable. Headers and values share logical
  alignment and tabular digits while explicit alignment stays available.
- Allow DataTable to omit redundant result ranges independently of selection
  feedback and pagination.
- Route collection controls to the records workflow in agent knowledge. Add
  rendered review checks for repeated copy across the list and selected record,
  including competing counts and receipt summaries.
- Clarify the landing-page description and link directly to agent setup.

- Add independent trailing navigation actions and optional tree branch guides,
  including per-group guides in Sidebar. Keep the current row's surface intact
  on hover and press.

- Add Flood motion roles and a versioned agent workflow. Apply shared motion
  to controls, disclosure, native layer entrances, and feedback. Add a preview
  with a scoped reduced-motion setting.

- Add CommandPalette for modal page and command search, with compact and
  comfortable density, grouped results and loading and empty states. Use it in
  the navigation workspace.

- Add NavigationItem as the shared destination/command/disclosure row and
  NavigationGroup for configurable section headings, actions, separators and
  independent group collapse. Recompose NavigationTree and Sidebar from these
  owners; a branch-only row is one full-width toggle, while a destination keeps
  a native link and separate disclosure within a coherent row surface. Compact
  groups retain destinations and their saved expanded choice; fixed Sidebar
  regions share the actual rail axis, including account controls. Header/footer
  separators are opt-in. Collapsible gains a sibling headerAction slot.

- Add independent IconButton iconSize and native link-safe Tooltip trigger props.
  Compact navigation uses hover/focus hints without replacing links; disclosure
  glyphs stay smaller than destination icons and pane toggles show distinct states.
  Sidebar uses its existing edge spacing for overlay scrollbars without an extra
  reserved column. Remove the unused document scrollbar strip in the website.

- Add a full-width navigation workspace comparing standalone Sidebar and
  GlobalRail/ContextBar profiles. Quiet Sidebar styling becomes the candidate
  default; standard preserves the stronger pill recipe. Support hidden group
  captions and page/location current semantics without routing or storage.

- Add Sidebar with controlled/uncontrolled compact mode, grouped destinations,
  fixed slots and one bounded navigation scroll owner. Extend NavigationTree
  with compact branch flyouts and trailing metadata; retain native links,
  disabled/current semantics and independent accepted expansion state.

- Let DataTable compose EmptyState through emptyContent while preserving its
  headers and loading/error owners. Keep the Projects table mounted for an empty
  filter result and provide an actual query reset with persistent focus.

- Add a plain Toolbar container variant, forwarded by OverflowActions, and use
  it beside the view selector to align control heights without nested chrome.

- Add CollectionViewSwitcher for controlled saved/preset view choice and
  adaptive commands. Reuse it in both collection consumers while keeping query,
  naming, persistence, confirmation and recovery in the host.

- Add CollectionToolbar for search, accepted filter summaries, reserved reset
  and end-aligned filter disclosure. Reuse it in both collection consumers;
  keep draft application, saved views and query execution in the host.

- Add FilterGroup composed from FilterCondition and existing matching/action
  owners, with stable IDs, controlled row management and acceptance-aware focus.
  Use it in the collection recipe without moving Apply/Cancel or query execution
  into the component.

- Add FilterCondition for controlled finite-choice property/operator/value rows;
  reuse it in the collection recipe's advanced editor. Keep query application,
  validation and removal-focus ownership in the host. Align selected MultiSelect
  tag and nested icon-action insets with the existing control height, including
  compact controls.
  Keep a selected MultiSelect's empty query editor compact instead of reserving
  another row for a redundant placeholder; actual search still expands normally.

- Add BulkActionBar: a single-row selection capsule with a small visible command
  budget, adaptive overflow, a localized count and a separate clear action.
  Offer label/numeric/hidden counter modes and stable configurable counter space.
- Establish nearest-surface neutral control contexts across actions, fields,
  choices, selection and supporting elements. Filled surfaces use translucent
  state overlays, with opaque/reduced-transparency and forced-color fallbacks.
  Keep focus, primary and feedback roles independent. Update author/agent rules
  and surface comparison tooling with the shared contracts.

- Add a typed collection-views recipe with shared filters/saved definitions for
  DataTable and FileList. Reuse existing atoms; keep persistence/query ownership
  in the host. Let OverflowActions fit its actual commands within available space.
- Add an opt-in line variant to Tabs for page-level panels.

- Add shared Toolbar shape control and use pill geometry for OverflowActions;
  route component authors and downstream composites to the same family guide.

- Add Autocomplete for free text, OverflowActions for priority-based command
  overflow and Menubar for coordinated desktop command menus, composed from
  existing Flood owners. Add semantic danger tone to Button/IconButton.
- Extend Combobox/MultiSelect with controlled/manual search, result identity,
  loading/error/retry, option grouping and retained selected record presentation.
- Add opt-in server DataTable pagination with controlled page/sort and explicit
  page/dataset selection scope. Existing client mode keeps its defaults.
- Forward Calendar view labels and date/time segment/message options through
  composed pickers; use the existing minimal Popover anatomy for calendar panels.
- Keep NumberInput actions/value on one row in dense enlarged-text tracks.
- Replace generic filler in canonical examples and align routed guidance with
  real content, workspace anchors and persistence recovery.

These compatible pre-1.0 additions follow the 0.2 stabilization patch policy.
All four packages remain aligned; source availability does not establish npm
publication. Animation/theme expansion is outside this candidate.


## 0.2.10 · 2026-10-31 — agent knowledge and form hierarchy

- Separate dialog-title, group-title and field-label token roles. Give named fields
  a .25rem inner gap; strengthen modal task titles and body spacing without enlarging
  compact popup captions. Add opt-in Fieldset legendSize="section" and routed
  hierarchy guidance for shared tracks and deliberate row/group rhythm.
- Keep DatePicker calendars readable with a preferred 20rem minimum bounded by
  available viewport width; retain selection/time-list sizing contracts.
- Clarify prototype provenance: no automatic permanent demo badge; keep contextual
  distinctions and accurate state/action/media wording where they affect decisions.
- Add routed record-composition guidance and decision examples for list/detail
  metadata, stable scan positions, category/state/priority semantics, dates and
  collection states; discover and install it through the existing knowledge bundle.
- Add Table cellVerticalAlign and make middle alignment the shared default for record/action rows; align
  mixed sortable DataTable headers. Add opt-in rendered DOM observations through
  @flood-md/agent/inspect, separate from semantic/editorial review.
- Compare actual field tracks across nested Surface padding and require review
  of initial, populated, editor, preview and error states in task scope.
- Add optional bounded host-source observations for native dialogs/controls and
  custom layout owners, with explicit text-matching limits and archive smoke checks.
- Preserve word-based table/status widths so long adjacent records do not force
  single-letter fragments; retain explicit technical-identifier wrapping. Let List
  items shrink inside their grid so long error links wrap in Firefox and WebKit.

- Add routed interface-content guidance with contextual editorial decisions,
  reference adaptation and examples that preserve necessary constraints and recovery.

- Add a provider-neutral, read-only knowledge reader and CLI info/catalog/read commands.
- Compile grouped skills, references, components, recipes and semantic token records from their canonical sources.
- Bound discovery and selected reads; refuse version drift, stale cursors, invalid relationships and changed package content.
- Preserve host instructions and customized guide copies; keep unsupported motion/theme capabilities explicit.
- This compatible additive release requires all four packages at 0.2.10. Publication is verified separately.

## 0.2.9 · 2026-10-30 — dark-base stabilization

- Route ten task-focused skills through the version-matched agent entry, including
  forms, overlays, navigation, feedback, data display and verification. Ship a
  component-family workflow index and observable rules with the existing safe CLI
  installation boundary; applicability is not a completed audit.
- Generate the website Skills guide from those package sources and provide a
  typed Workspace review recipe using native form values, reset and a file drawer.
- Keep file metadata, status, progress and actions readable inside constrained
  FileList/UploadList hosts with enlarged text, without replacing their primitives.
- Preserve a useful Drawer reading area at enlarged narrow sizes with responsive
  padding, full-width descriptions and reachable whole-panel overflow fallback.
- Focus the Select combobox on pointer activation before host click callbacks,
  including browsers that do not mouse-focus native buttons, preserving keyboard
  callbacks and nested Escape ownership.
- No public React signatures or token values change. This compatible source
  candidate targets aligned patch 0.2.9; publication is verified separately.

## 0.2.8 · 2026-10-27

- Complete ListBox native required validation, feedback/status and accessible descriptions while retaining selection and reset contracts.

- Unify Calendar day/month/year views without nested overlays; fold the unpublished MonthYearPicker into Calendar.
- Refine time selection and reduce repeated labels in date/time ranges.
- Add minimal Popover chrome, plain ListBox appearance and DateTimePicker field-label visibility for library compositions.

- Add TimePicker and DateTimeRangePicker from existing primitives.
- Add manual ListBox selection and a TimeField end slot; enable quick Calendar month/year navigation.

- Add the primitives-first composition skill to the versioned agent bundle; preserve StatusIndicator in upload rows.

- Add HoverCard, ColorSwatch, ColorPicker, TreeSelect and DateTimePicker.
- Add native DataList/DataListItem rows and CheckCard/RadioCard choices.
- Add file and upload rows/lists with a Dialog-based ImagePreview.
- Add FileMeta for a compact format/size chip beside the filename.
- Add client-side DataTable sorting, selection, paging and feedback states, plus a Filter bar recipe.
- Add recipes for aggregate selection, split actions and form submission.
- Keep opaque RGB colors, single tree selection and civil date/time contracts explicit.
- Registry publication and deployment are verified separately.

### Base controls included from the 0.2.7 development candidate

- Keep Tree's readonly explanation associated with the relevant control without exposing it as unrelated reading content.

- Enable removal of unused React component factories from named-import bundles; guard the installed single-Button bundle size.

- Preserve readonly date/time form values under constraints and keep submenu hover intent across equivalent host rerenders.

- Preserve cancelled selection resets, clear obsolete validation after external corrections and recognize reordered controlled tag acceptance.

- Add Tree for hierarchical selection and NavigationTree for nested native destinations.

- Add nested Menu items and ContextMenu with shared native layers, hover intent and scoped keyboard navigation.

- Add continuous date ranges, ResizablePanels and ErrorSummary; document the CommandList/Dialog palette recipe.

- Add TimeField, Calendar and composed DatePicker; refine segmented field click targets and placeholder geometry.

- Add grouped CommandList and segmented DateField with canonical form contracts.

- Add original Editable and TagInput with catalog examples and declarations.
- Add controlled checkbox/radio preferences to Menu.


## 0.2.6 · 2026-10-26

- Let Breadcrumb separators use their intrinsic flex width in Firefox/Zen, preventing the last character of fitting labels from wrapping. Preserve normal item wrapping, long-label reflow, spacing and existing API/token values.
- Cover Grid and Stack alongside Pagination in Chromium, Firefox and WebKit, including constrained widths, enlarged text and RTL.

## 0.2.5 · 2026-10-26

- Add 20 original content, form, navigation, layout and feedback components, with generated documentation and live recipes: AvatarGroup, StatusIndicator, Figure, Blockquote, InlineCode, Metric, Timeline, NavigationList, Steps, Section, Split, Center, SkipLink, ListBox, PinInput, Rating, Dropzone, CharacterCount, CopyButton and ToastRegion.
- Add SearchInput, PasswordInput and FileInput with appendable multiple selection and individual removal; add AlertDialog and edge Drawer with contained scrolling.
- Separate floating material from modal fills with quiet translucency, light shadows and opaque/system-color fallbacks; keep existing token values and aligned package versions.
- Preserve touch activation of searchable selection options in WebKit without blocking native touch scrolling; keep read-only MultiSelect Backspace from navigating browser history.
- Keep component preview canvases quiet and consistent across the catalog. Fix PinInput deletion, clarify semantic heading controls and balance CopyButton feedback geometry.

- Add Tag with a named removal action and MultiSelect with shared search/layer behavior, removable selections, repeated form values, required validation and token-aware wrapping.

- Add original NumberInput with native form validation and step actions, and a horizontal Slider supporting one value or an ordered range. Reuse Flood field geometry, labels, feedback and focus.
- Keep exact internal versions aligned across tokens, React, agent guides and CLI.
- Add editable Combobox selection with local search, explicit option IDs, forms/reset, layered listbox, protected scrolling and translated action/message labels.

## 0.2.4 · 2026-10-26

- Keep rectangular Avatar sources fitted to their full container after Image composition.

- Keep hidden fieldset legends out of layout across repeated state changes, enlarged text and RTL; reveal rich external labels while a descendant has focus and preserve pointer activation as they collapse.

- Add Container, Grid, AspectRatio, Image, List, VisuallyHidden and EmptyState; expose native Checkbox mixed state.
- Reuse shared atoms in navigation/disclosure/feedback/media and protected ScrollArea in composed controls.
- Preserve modified/IME keys, nested layer Escape, cross-document/native focus targets and RTL switch geometry.
- Keep connected actions readable at narrow widths; fix enlarged documentation wrapping and missing-slot spacing.
- Bundle the matching italic Inter font; reject linked project manifests/directories in the CLI and isolate token diagnostic property paths.

- Add structured Card surfaces with optional header actions, footer and compact/comfortable density.

- Add Toolbar directional action navigation and native Kbd key hints; Menu shortcuts reuse Kbd.

- Distinguish native Table footers with a quiet tint and medium-weight summary cells.

- Keep Breadcrumb items at their natural width before wrapping the trail; only
  labels longer than the available row may break within words.

0.2.4: add original Badge, Spinner, Skeleton, Avatar, Progress, Meter, Alert, DescriptionList, Table and Menu, generated component documentation and live previews. Button loading reuses Spinner without changing its public API. Add independent accent-content, loading-placeholder and indicator semantic roles (184 roles). Exact package versions are aligned.

## 0.2.3 · 2026-10-25

- Expand the base library to 37 original components: Select, ScrollArea, Label,
  Fieldset, RadioGroup, CheckboxGroup, ButtonGroup, InputGroup, Toggle, ToggleGroup,
  SegmentedControl, Collapsible, Accordion, Tooltip, Popover, Dialog, Tabs,
  Breadcrumb and Pagination join the existing primitives.
- Add consistent field feedback and read-only presentation, hidden-label options,
  quiet control boundaries, coherent nested corners and protected scroll rails.
- Add native Link button appearances/sizes while retaining ordinary anchor behavior.
- Deliver a versioned agent router, observable rules and focused references,
  including portable spacing, density and nested-geometry guidance.
- Organize docs and the searchable component catalog around shared source-derived
  API contracts, live recipes, matching TSX and canonical Markdown endpoints.
- Stabilize playground geometry, use Flood components across the website shell
  and reader, and theme native document scrolling from foundation tokens.
- Verify isolated website artifacts and deployed source metadata alongside
  React 18/19 packages, Next.js integration and desktop/mobile browser behavior.

## 0.2.2 — Marketing composition

- Add opt-in display typography and a selectable CodeSnippet primitive with a
  host-owned action slot. Preserve existing heading metrics and component APIs.
- Add display and monospace semantic roles to the single token source.
- Compose the one-page website from actual Flood components with an editable
  workspace form and interactive ideas list. Keep all demo data local.

## 0.2.1 — Icon geometry

- Center contents inside IconSlot without changing public APIs or token values.
- Replace the website's text plus with a Lucide SVG that fills the existing
  relative icon geometry. The icon package belongs to the website, not the Flood
  runtime; its license is retained in the deployed assets.
- Verify SVG sizing and centering at root font sizes 16, 20 and 24px.

## 0.2.0 — Base dark DS

- Add the opt-in dark foundations profile with
  154 semantic roles, bundled Inter with its OFL license, rem-based geometry,
  typography, actions, feedback, focus, motion and layering tokens.
- Add FloodRoot, Text, Heading, Stack, Inline, Surface, Divider, IconSlot and
  IconButton; expand Button sizing and native form recipes inside FloodRoot.
  Preserve legacy theme behavior outside the opt-in root. Add a Next.js
  foundations example and browser checks for forms, scaling and system modes.
- Add a functional team settings example in two compositions, covering native
  local form state/reset, member roles, validation and responsive layout.
- Make dark foundations the primary installer and agent-guide example. Align
  all package/workspace versions and keep the website installation disabled
  until publication of all four packages is verified.

- Add an experimental, opt-in foundations token profile with typed aliases,
  CSS/JSON generation, a public catalog and TypeScript names. Existing token
  imports retain their contract. The new exports belong to the aligned 0.2.0
  release and are absent from 0.1.1.
- Add component, theme, agent and FAQ guides with a documentation index.
- Add contribution and private vulnerability reporting guidance.
- Move account-specific hosting configuration and operational journals outside
  the public repository; use npm trusted publishing without a token fallback.

## 0.1.1 — Reproducible release

- Publish all four packages from Linux GitHub Actions with provenance.
- Preserve executable permissions for the CLI entry in the release archive.
- Align installer, agent guides and website with the automated release.

## 0.1.0 — First foundations

- New independent React/TypeScript design-system monorepo.
- Eight original components, semantic tokens and light/dark themes.
- npm installer with dry run, file preservation and version diagnostics.
- Versioned agent instructions, plain-text endpoints and configuration schema.
- One-screen landing page and Railway container configuration.
- Package-consumer tests and Next.js App Router integration fixture.

Published versions are listed in GitHub Releases and npm. Documentation on main
may include unreleased changes; use the matching release tag for stable guidance.
