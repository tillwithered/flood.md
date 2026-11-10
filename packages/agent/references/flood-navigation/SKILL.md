---
name: flood-navigation
description: Choose and verify Flood links, tabs, disclosure and hierarchical navigation. Use when destination, selection and expansion semantics can be confused.
---

# Separate destination, selection and disclosure

Use installed declarations and the [composition reference](../composition.md).
Choose Link/NavigationList/NavigationTree for destinations; Tree for application
object selection; Tabs for associated panels; Accordion/Collapsible for disclosure.
SegmentedControl selects one value and is not a tab panel controller. Do not use
Menu just because links appear vertically.

For the 0.2.11 source candidate, NavigationItem is the shared small row owner and
NavigationGroup owns an optional section heading/action, separator and independent
group disclosure. NavigationTree composes rows into a hierarchy; Sidebar owns
fixed regions and bounded scrolling. Consumers must discover these APIs in their
installed version before using them. Atomic composition separates responsibilities;
it does not require a new export for every wrapper or spacing token.

## Preserve browser and keyboard behavior

- Links retain real href, modifier/open-in-new-tab behavior and current-page
  indication. A route change and a selection change are not interchangeable.
- Hierarchical items need stable unique values and readable labels. Expansion,
  current destination, selection and keyboard focus have separate owners. Do not
  infer cascading selection, automatic fetching or ancestor expansion.
- Apply each component's keyboard contract. ButtonGroup keeps ordinary Tab
  navigation; Toolbar, Tabs and selection widgets have their own focus models.
  Avoid adding generic arrow-key handlers around nested interactive content.
- Disclosure state must match its trigger and panel. Check whether content remains
  mounted, and preserve any native form/focus consequences of the installed API.
- A branch with no destination can use one full-row disclosure button. A branch
  with a destination uses a real link plus a separate sibling disclosure action.
  Do not nest the toggle inside the link or make a normal link click also toggle
  expansion. Command rows retain Button semantics; vertical navigation is not
  automatically an application Menu.

## Shared rows and configurable groups

Use AppShell for workspace regions and AppTopBar for shared application
context and actions. PageHeader belongs inside the main region. Sidebar and
NavigationTree own the destinations and expanded branches. Keep the selected
route, responsive presentation and a mobile Drawer's open state separate.
Use AppShell navigationDrawer for a single dock that needs to switch based on
container width. Verify the switch inside a narrow parent at a wide viewport,
including resizing while a navigation link or the Drawer has focus.

Hide the visible caption of a single group when its title repeats the app or
workspace context. Keep the group's accessible name with `hideLabel`. Align
visible captions with destination labels, and check both settled sidebar widths.

NavigationItem owns the complete row surface, including the visual relationship
between its primary control and disclosure. A shorter selected background behind
only the label/link makes the trailing action look unrelated. Keep distinct click
and focus targets within a coherent current/hover surface; current destination,
ancestor-current, expansion and focus remain separate. Budget actual trailing
anatomy once rather than adding another empty inset or column in the shell.
Align disclosure and badge centers on the trailing track. The disclosure target
already contributes half its width as clearance, so use the compact edge inset
there and preserve the full target.
Use trailing for noninteractive metadata and trailingAction for an independent
named action. Keep both visible on the trailing track at rest and during
interaction. On an already filled row, use a glyph-level hover response for a
ghost accessory and keep its keyboard focus visible. Use branchGuides for dense hierarchies where
indentation alone is hard to follow. Keep section separators optional and
distinct from branch guides.
Use Sidebar headerLayout inline when the expanded identity and toggle should
share a row. Use the stacked recipe when the toggle must stay on the same axis
through collapse and expansion.

NavigationGroup starts with optional presentation empty. Add a heading to name a
real group, headingAction for a real command, and separator for a relationship
that needs one. Do not fill every slot to make a demo look complete. A collapsible
group requires a label; hiding its visual label does not remove the disclosure's
accessible name. collapseDisabled disables that disclosure, not its child links.
Group expansion is not NavigationTree expandedValues and is not Sidebar compact
state. A proposal callback does not prove the host accepted the change.

Compact groups keep destinations available without requiring an invisible group
toggle. Preserve the accepted expanded choice for the return to expanded mode;
do not overwrite it merely to reveal compact destinations. Meaningful heading
actions remain available. Test headed/unheaded groups, actions present/absent,
separator on/off, accepted/refused collapse and compact transitions separately.

## Evidence

Exercise forward/back navigation, current state, disabled/empty items, long labels,
both orientations when supported and keyboard entry/exit. For breadcrumbs, check
intrinsic text width and wrapping in each supported browser: a final letter on a
new line can indicate a sizing error rather than a legitimate responsive layout.
For sidebar navigation, scroll/focus the final item and keep its selected surface
clear of the scrollbar. Verify the actual navigation composition at narrow width
and enlarged text; an isolated item's screenshot is insufficient.
Verify shared inline tracks from header through footer: leading glyph center,
text start and trailing badge/disclosure center. Group labels inherit the chosen
text track. Missing peer icons reserve their column; iconless nested links use
an intentional parent-text indent. Sidebar places its scrollbar in existing edge
spacing, without a permanent extra column or a shift when overflow appears.
Other scroll surfaces must still protect content that reaches their tracks.
In compact mode compare the actual brand, pane-toggle, destination and account
control centers against the full rail center. A balanced body or centered footer
container does not prove its Menu trigger is on the same axis. Adapt the fixed
identity/utility slots through the accepted compact state instead of inserting
an unrelated small button and assuming inherited alignment will fix it.

Use Sidebar for bounded workspace navigation: NavigationTree owns the destinations
and disclosure, ScrollArea owns the middle scroll viewport, and fixed header/footer
slots adapt through the collapsed render state. Give the host a meaningful height;
do not add several competing scroll owners. Route/current value, compact width and
branch expansion are independent controlled states. A callback is a proposal,
not acceptance. Keep groups and item IDs stable; item values are globally unique.
Collapsed branches open a full NavigationTree in Popover, not an application Menu.
Leaf links preserve href and modifier behavior. Do not claim an active ancestor
is the current page. Count metadata uses trailing with Badge; icons retain explicit
IconSlot sizing. Compact destinations use Flood Tooltip on hover and keyboard
focus while keeping their actual Link or disclosure button. Do not layer a
native title with the same text over the tooltip. Suppress the branch hint while
its flyout is open; tooltip behavior must not replace navigation or steal focus.
Sidebar owns no routing, preference persistence, mobile drawer or keyboard shortcut.
Add those in the host only for an explicit requirement. On a programmatic width
change, keep surviving focus or restore it within the navigation; do not move
unrelated outside focus. Verify footer reachability and flyout text at both widths.

## Compose global and contextual navigation

For a multi-domain application, distinguish global module choice, contextual
page destination, branch expansion and context-pane visibility. A GlobalRail
profile can compose a flat, permanently compact Sidebar; the adjacent ContextBar
profile composes another Sidebar for the accepted module. Use distinct landmark
names and keep global utilities separate from contextual destinations.

Do not duplicate the context list in both an open ContextBar and a rail flyout.
Re-clicking the active module does not implicitly hide its context: give that
pane an explicit visibility control. Use currentKind="location" for a current
global module and the default page kind for an actual contextual destination.
Keep genuine hrefs and derive accepted routes from the host router. Modifier
clicks/open-in-new-tab must not change the current tab's accepted module.

Read recipe:navigation-workspace from the installed catalog for the full host
composition. Keep filters/search scoped to the accepted module; resetting one
module must not change another module's query. Validate complete route identities
before deriving titles and current state. If a focused row/pane/action disappears,
restore a stable host destination only after the previous focus was disconnected
and focus fell to the document body. Do not reset surviving focus on every render.
Include dialog-close after its original trigger disappeared in that check.

SidebarGroup.hideLabel omits a redundant visual heading while retaining the
named nav landmark. Start optional headings, captions, counters and helper slots
empty; add them only for information needed for recognition or a decision.
Group headingAction, separator and collapse configuration belong to the section;
Sidebar headerSeparator/footerSeparator are independent opt-in shell choices.
Do not equate every group boundary with a visible line.
Use the live workspace composition before introducing separate public aliases:
an identical wrapper name is not a new component responsibility.

Keep a shared top reading anchor across composed panes. A header without a
collapse action still needs the family header height; removing an optional button
must not shift its entire navigation above the neighboring rail.

Evaluate the navigation with its main workspace at real desktop width and height,
not only as a centered object in a docs column. Keep visible chrome subdued
relative to task content, expose current destinations clearly, and budget badges.
Record deliberate scoped semantic theme overrides rather than styling around
the reused primitives. Evidence from another product informs a decision; it does
not authorize copying implementation or presenting an undated page as a new release.

## Give navigation a deliberate visual grammar

NavigationItem owns a row, not a hidden hierarchy. For a compact row that has
both a destination and children, use NavigationTree's branch composition: its
flyout retains the parent destination and the children. Do not hide one of two
actions merely to fit an icon target. Keep Tooltip mounted and disable its hint
while the interactive flyout is open; replacing that wrapper can remount the
trigger and break focus return.

Separate destination artwork from supporting disclosure. Use the IconButton
iconSize capability to reduce a chevron independently of its size/hit area;
never shrink the clickable target just to make the glyph quieter. Compare the
actual artwork, not merely its SVG box. Sidebar's sm/md disclosure uses 2xs
artwork, lg uses xs; these are the current family recipe, not universal pixel
requirements for every action. Keep the shared trailing action center.

A pane toggle depicts the pane, with distinct open/close directional states.
A multi-panel layout icon is not automatically a recognizable visibility action.
Keep its accessible name and aria-expanded synchronized with the accepted state;
resolve side and RTL before choosing the arrow direction. Check inherited
direction changes after mount too: panel edge, arrow and flyout side must update
together without requiring an unrelated interaction to refresh them.

Do not make every relationship a new pill, divider or group title. Peer items,
children, separate groups and fixed footer actions need distinct parent-owned
spacing. Start optional captions, counters and descriptions empty. Give each
visible addition a recognition, navigation or task purpose; remove decorative
status claims and labels that repeat their inherited context. Apply the content
workflow to the actual rendered navigation, including hidden and empty states.

A professional result requires both a coherent family and a working interaction.
Review expanded/compact side by side with real short/long labels and a populated
workspace. Check whether a user can identify destinations, discover hidden labels,
change the current route and reopen a pane. A generic "anti-slop" checklist or
passing build is not evidence that these rendered checks passed. Learn from
references without importing another product's branding or taste bans wholesale.

## Coordinate actions and workspace anchors

For a persistent pane toggle, keep its viewport position while its pane changes
width or visibility and test consecutive clicks at the same coordinates. If a
compact rail swaps the service mark for the toggle, keep both in the same slot
and reveal the toggle on hover and keyboard focus. Keep the toggle visible on
devices without hover. When context is hidden, a rail module can open its
destinations in a compact NavigationTree flyout. Keep links and expansion state
shared with the docked context. Escape dismisses the flyout without changing the
route or pinning the pane.

For a rail hover preview, use the compact item's flyout options. Opening from
hover preserves focus and allows the pointer to cross the gap into the panel.
Explicit activation still opens the same destinations on keyboard and touch.
Anchor a tall context flyout to the rail so it shares the workspace top edge.

Menubar coordinates desktop commands and one open menu, not website destinations.
Reuse Menu for its child menus; native links still own destinations. OverflowActions
composes Toolbar/Button/Menu. Preserve command identity, disabled state and danger
tone when moving into More. Choose priorities by task, not label length. Exercise
focus when resize hides an action or removes the More trigger.

Keep a common top reading anchor across short/long workspace pages. Use logical
inline centering for content width: margin:auto on a grid child can also center
a short page vertically. Name each pane's scroll owner. Check short/long lists,
detail and editor at the same viewport; a Drawer/table cannot fix its parent.
