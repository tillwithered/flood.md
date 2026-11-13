# Author a component that belongs to Flood

Use when adding a reusable primitive, extending its visual contract or composing
a new shared component. This applies inside Flood itself and to project-owned
composites. Keep the installed/source distinction: a consumer cannot invent a new
package export or edit an installed dependency to implement these decisions.

## Choose the family before choosing values

Identify the component's role and compare the closest existing owners in their
rendered states. A new name is not a reason for a new visual recipe. Record the
chosen siblings and intentional differences in development notes, outside the UI.

| Relationship | What should be shared |
| --- | --- |
| Action and icon action | Button/IconButton height, text, icon scale, insets and focus treatment |
| Text/selection/number field | Field label relationship, control height and field-state semantics |
| Command collection | Toolbar/Menu owners, action sizes and keyboard ownership |
| Floating surface | Existing overlay material, layer placement, inset and focus restoration |
| Named content or record | Typography, hierarchy and metadata owners, not a new title scale |
| Data visualization | LineChart data-mark stroke weight, quiet plot grid, exact-value inspection and stable geometry |

Reuse these owners inside the new component. Extend the smallest missing owner
before adding a composite override. For example, the Toolbar that draws an
OverflowActions background owns its shape; a playground-only border-radius does
not establish that capability for other consumers.

## Define the visual and behavioral contract together

- Use matching semantic token roles. Equal-looking values are not necessarily
  interchangeable roles; a field radius and an action radius can evolve separately.
- Derive sizes from the family's controls. Label line height, explicit icon box,
  interactive height and optical insets must still agree at every exposed size.
- Name variants by a meaningful role or shape. Keep appearance separate from
  state: selected, read-only, disabled, invalid and focus are not interchangeable.
- Make the outer geometry deliberate. A single-row capsule action rail can use
  a pill shape; a wrapping or vertical group may need rounded geometry. Do not
  blindly apply a pill to a multi-row surface. Use the spacing workflow to assess
  nested radii and the actual inset; independently interactive neighbours need
  not share a concentric-radius formula.
- Account for padding and stroke in the space available to children. Overflow
  calculations use the content box, not the outer border rectangle. Check the
  threshold at which an item moves into the overflow owner.
- Keep behaviour in the component that owns it. A focusable read-only text field
  still needs a visible focus indicator and selection/copy. It blocks edits and
  its chooser; disabled has a different native contract. Do not erase focus to
  make a state look quieter or add helper copy merely to explain that contract.

## Compare the family in one scene

Repeated navigation/record rows share columns, not just height and font. Before
accepting a composition, compare glyph centers, label starts and trailing action
centers between header, groups, iconless/icon-bearing rows and footer. Define the
indent of descendants deliberately and reserve missing peer anatomy. Scrollbar
visibility must not silently change only the middle pane's content tracks.

NavigationItem owns shared row geometry for native Link destinations, Button
commands and disclosure. A branch without a destination uses a full-row toggle;
a destination with children has distinct sibling link and disclosure targets,
never nested controls or a link click that also toggles. The complete row owns
its current/hover surface, so selection does not end at an unrelated shorter pill
before the chevron. Budget real trailing anatomy once. NavigationTree composes
these rows and manages hierarchy rather than supplying a parallel visual recipe.

NavigationGroup owns optional label/action/separator and independent group
disclosure. Its compact presentation reveals destinations without discarding the
accepted expanded choice. Hiding a title cannot remove a needed accessible name
or make a command unreachable. Compare headed/unheaded groups and all optional
anatomy; an available slot is not a reason to populate it.

Sidebar reuses NavigationGroup and NavigationTree. Its compact branches reuse
Popover; full destinations retain Link and normal Tab behavior. Header/footer
adapt through slots, with opt-in shell separators. The actual brand, toggle,
destination and account hit areas share the full compact rail axis; a centered
wrapper around a start-aligned Menu trigger is insufficient. Expanded slots share
icon/text tracks. Its ScrollArea uses the existing edge lane for clearance. Keep
material at the sidebar owner, without another material behind each group.
Separate route identity, group/branch expansion and sidebar width; compare both
profiles beside the small owners at the same size, with long text and bounded
height. The 0.2.11 candidate's APIs require matching installed declarations.
Disclosure artwork stays subordinate to destination icons without reducing hit
areas; IconButton.iconSize separates these responsibilities. Compact hints reuse
Tooltip on the actual Link/button, preserve refs and event handlers, and disappear
when a branch flyout opens. Pane-toggle glyphs change with accepted visibility.

Material context is part of the family contract. Compare actions, fields,
choices, selection and supporting elements on the same material. A shared
semantic context should correct the family together; a descendant-only button
override leaves fields and composed controls inconsistent. Keep absolute
material colors separate from contextual control roles and verify the nearest
nested owner resets those roles. Preserve accent focus and destructive meaning.

Vertical pill Toolbar keeps one column on a shared center axis. Use named
icon-only actions and a consistent control size for a compact rail. Use a
rounded vertical Toolbar with consistently labeled controls when text is needed.

BulkActionBar is a one-row capsule for a small set of selection commands. Keep
one to three visible commands, prefer two, and disclose the remainder through
its overflow owner. Do not wrap this floating rail into a second row or use it
as another general toolbar. The host owns selected IDs, confirmation, accepted
updates, positioning and scroll clearance.
BulkActionBar counter can be label, number or none. Visible counters reserve
their width across count changes; choose counterWidth for the expected localized
summary rather than sizing it from each current count. Hiding it removes its slot.

CollectionToolbar composes the search, Tag, Button and Popover families without
adding a surface. Use normal Tab navigation for this mixed input/action group.
Compare SearchInput and existing collection controls at the same controlSize;
preserve the end anchor, reserved reset space and contextual action colors.
Keep saved views and query execution in the host; filterContent supplies its draft.

CollectionViewSwitcher composes Select and existing action owners on a separate
saved-view row. One command uses Button; multiple commands use OverflowActions.
Use its plain container variant beside peer fields so another material/inset does
not enlarge the command group. Contained remains appropriate for standalone rails.
Use the same controlSize and keep Select and action hit areas coherent. Queries,
dirty-state policy, permissions, dialogs and persistence belong to the host.

FilterGroup composes FilterCondition and existing matching/actions. Preserve
stable row IDs and accepted controlled state. Addition/removal focus belongs to
the group after acceptance; Apply/Cancel, validation and query evaluation remain
host-owned. Do not add a nested material or empty-state narration just because
the flat group has its own component name.

Render the new control beside its nearest sibling, with the same label/content,
size, surface and root text scale. Review rest, hover, keyboard focus and the
states the component actually supports. Include long content, empty/optional
slots, narrow tracks and enlarged text. The scene is verification tooling, not a
new runtime wrapper or a mandatory product screen.

Measure what looked wrong: glyph/text centres, visible insets, nested curves,
focus bounds and overflow thresholds. Exercise resize while an action or popup
has focus. After a shared-owner correction, inspect another consumer. A green
build or token reuse alone does not establish visual kinship.

Check the same component in a real host composition. Record the geometry that
should remain stable as state changes. For example, a table cell editor may
open over its cell, but entering edit mode should keep the row height and
column widths stable. Then exercise commit and cancel with a long value. If
the failure repeats, fix the first owner that can enforce the relationship: a
semantic token for a shared role, the primitive for its own states, or the
composite for how siblings fit. Add guidance when callers can already choose
the right behavior through the public API.

## Keep the contract discoverable

In Flood source, update declarations, component examples, applicable guidance
and the version decision together; regenerate the existing knowledge catalog.
In a host, document the project-owned composite and its actual dependencies.
Do not add unsupported props to examples or a parallel handwritten API index.
Report executed behavioural/visual checks separately from guidance that was
merely read. Record deliberate family exceptions instead of making an isolated
fix the next component's accidental default.

Track actual consumers and interactions for a proposed atom. Demonstrate a shared
responsibility in different compositions before promoting a recipe helper into
the package. Do not insert an owner merely to increase its usage count: one
command can remain Button while a constrained command collection uses
OverflowActions. Reuse is judged by correct roles and reachable behaviour, not
the length of an import list.
