# Collection filters and saved views

[Open Projects and Files](/playground/collections).

One set of controls serves a DataTable and a FileList. It demonstrates search,
quick filters, staged conditions, applied tags, saved definitions and sorting from existing
Flood primitives. CollectionViewControls is project-owned recipe code, not an
export from @flood-md/react. The installed catalog contains these same typed
sources. Keep model and controls together; adapt datasets and shell to the host.

## Query ownership

The wide layout has two control rows. View selection and its actions share the
first row. Search and filter/reset actions share the second row. At most two
secondary filter properties appear inline. With three or more properties, one
Filters panel contains the choices, including currently inactive properties.
Applied conditions remain visible with property names and remove actions.
Groups wrap as space becomes constrained. Test both empty filters and longer
selected values before adopting the host layout.

Filters anchors to the inline end of the control row. A reserved Clear filters
slot precedes it, so applying or clearing conditions does not shift the trigger.
The inactive reset is visually hidden, disabled and absent from accessibility
navigation. Applied chips stay in the search area and can wrap independently.

A query contains search, a flat all/any group, enum conditions and sort. Search
combines with the group using AND. Values within one condition mean any matching
value; is-not excludes all of them. Missing record values do not match is and do
match is-not. The host defines properties, values and record meaning.

For inline simple filters, a named Menu applies one value per property immediately.
The adjacent Tag shows the selected value and gets its property context from
the menu beside it. Choose All or remove the Tag to clear that property. The Tag returns
focus to its menu when removed. Projects and Files use the same controls with
their own properties. Search and sort retain their current values.

The collapsed panel stages its labelled choices until Apply filters. Cancel
discards the changes. Advanced conditions switches the same panel to the full
condition editor when exclusions, multiple values or Any logic are needed.

Use the Filters editor for exclusion, multiple values per property or Any across
properties. It has a separate draft. Apply validates and commits, while Cancel or
outside dismissal discards it. Advanced conditions are summarized by removable
tags with their All/Any logic visible when relevant. Clear filters removes search
and conditions, retaining sort. Unknown properties, values, operators, sort
columns and schema versions fail explicitly rather than silently broadening a view.

An applied query change outside the editor closes its obsolete draft. Applying
conditions never restores an old search/sort value from when the editor opened.

DataTable receives the full locally filtered collection. The example resets page
and selection on query/preset/sort changes. Saving or renaming a definition does
not change the query or selection. FileList has its own host sort. Remote requests,
permissions and server-wide selection remain host responsibilities.

Table selection serves real status and archive commands for the chosen projects.
Hosts without a selection operation should omit selectable rather than display
checkboxes with no resulting action.

## Selected records

Selecting projects reveals one shared action bar floating at the viewport bottom. It shows the
selected count, changes status, confirms archiving and clears the
selection. Selection spans the filtered client collection across its pages.
Changing the query resets it. Archiving captures IDs and names before opening
the confirmation. Cancel keeps the selection and records intact.

The host owns the update and accepted records. This example changes its in-memory
records after the optional onUpdateStatus callback accepts the whole operation.
Reload returns to the declared fixtures. A rejection keeps accepted records and
selection intact. Retry uses the failed operation's captured IDs and status.
Dismiss or a deliberate query/selection change abandons its feedback.

Only one update can run at a time. Pending actions are disabled. If the user
changes the query or selection while an update is pending, its result still
belongs to the captured IDs. Success removes those IDs from current selection,
preserving newly selected records, and returns pagination to the first page.
The host callback must accept/reject atomically. A service allowing partial
success needs a per-record result and reconciliation contract.

Clear selection returns focus to the collection. A successful update moves focus
there if the disappearing action bar held it. Confirmation renders outside the
roving Toolbar so the dialog retains its own focus model.

<!-- flood:project-selection-actions -->

The panel uses the existing floating-surface tokens and a viewport-safe inset.
It leaves normal document flow and stays centered when the document scrolls.
BulkActionBar keeps a single pill-shaped row with at most two visible commands
by default. Lower-priority commands move into More as space shrinks; the host
does not add a second row of commands. ResizeObserver measures its actual height, and the
collection reserves enough bottom space for the final rows and pagination to
scroll above the panel. Keep this measured clearance with the host styles.

<!-- flood:collection-views-styles -->

## Working state and saved definitions

Built-in presets are read-only. A saved view stores the query and supported sort,
not record IDs or cached results. Dirty views offer Update and Reset. Save as new
captures the current query; Rename changes only its name, even while filters are
dirty. Deleting a definition leaves collection records unchanged.

Working changes stay transient until saved. Reload starts at the default preset;
saved definitions remain selectable. Choosing another view replaces the working
query. URL sharing, remembered active views, nested groups, date/number operators,
collaboration and cross-tab synchronization are not implemented here.

Names are trimmed, at most 80 UTF-16 code units and unique after NFC/case
normalization, including preset names. Equality ignores condition UI IDs, condition
order and selected-value order; it is not general boolean equivalence.

## Persistence and focus

Two keys keep project/file definitions separate. Read occurs after mount to retain
consistent initial server/client markup. Mount a separate keyed instance when
changing collection schema. Browser storage is an example adapter, not production
durability. A missing key means no custom definitions; malformed/refused reads
preserve the available raw snapshot and block writes to that store. Independently
loaded records remain usable. Retry/export/explicit replacement address the actual
preferences failure; exported bytes do not guarantee automatic restoration.

Refused writes retain accepted definitions and entered names. Cancel ends a name
draft's error; Reset ends a failed update of the discarded query. Read failures
have a separate lifetime. A real remote adapter needs pending/result ownership,
reconciliation and migrations rather than this synchronous example.

Existing overlay owners retain nested behaviour. Naming/deletion actions focus
the persistent view selector before opening a modal so it remains a useful return
target when an action disappears. Escape closes the value picker before the outer
condition editor; closing the editor returns to Filters.

## Reused owners

FilterGroup composes FilterCondition rows for the flat advanced draft. It owns
row addition/removal, duplicate-property choice policy, the all/any switch and
accepted focus transitions. FilterCondition keeps equal control sizing and
container-based reflow. Changing a property clears incompatible values only in
the proposed draft. The collection form retains Apply/Cancel and query validation,
so creating an incomplete row never changes accepted results.

CollectionToolbar owns the shared query layout: search, accepted summaries,
reserved Clear filters and end-aligned Filters. Its fieldset uses normal Tab
navigation because it includes editable text. Keep saved-view controls outside
this row. Supply the staged editor through filterContent; opening it copies the
accepted query, Apply accepts it and Cancel abandons it. Reset and removal return
focus to the persistent Filters trigger (search when no panel exists). The host
defines reset scope and supplies canClear for any state held by quickFilters.
At most two task-important quick properties remain inline; additional properties
belong inside Filters. Summaries outside the panel name the property and preserve
any-match meaning. Container width, rather than viewport size, governs reflow.

CollectionViewSwitcher owns the separate accepted-view choice and adaptive
commands. It reuses Field/Select and Button/OverflowActions with the same size.
The recipe supplies applicable actions and retains all persistence, name-only
rename, dirty query reset, confirmation and failure recovery. selectRef preserves
the existing naming/deletion dialog return target; saving a definition does not
reset result selection.

SearchInput, Select, Menu, MultiSelect and SegmentedControl own input/choice behaviour;
Popover contains the condition draft and Tag removes applied conditions. Button
and IconButton perform actions. Several view commands use OverflowActions; a
single command uses Button directly. Field/Fieldset, Grid/Stack/Inline, Dialog,
AlertDialog and Alert retain their own roles. DataTable/StatusIndicator and
FileList/FileItem/FileMeta demonstrate two result structures. No owner is inserted
merely to increase its usage count, and no new package atom is needed for layout.

For a few mutually exclusive views of the same result table, use SegmentedControl
with a controlled value. An option's `count` can show workload, such as pending
items. Leave it unset when it repeats a total already visible beside the results.
Use Tabs when each choice opens its own associated content panel.

## Model

<!-- flood:collection-views-model -->

## Shared controls

<!-- flood:collection-views-controls -->

## Two consumers

Projects keeps DataTable mounted when an accepted filter finds no rows. Its
emptyContent composes EmptyState and Reset filters; the host clears search and
conditions, retains sort, resets page/selection and returns focus to search.
This is distinct from a read failure or loading state, which remain DataTable's
Alert/retry and Spinner owners. Files uses EmptyState outside its native FileList.

The last export is the website-only shell. Hosts need the model, controls and their
chosen consumer with actual data and their own chrome.

<!-- flood:collection-views-examples -->

## Verification

Exercise all/any, exclusion, incomplete drafts, Cancel/Escape, removal and no-results.
Verify page/selection changes; save, rename while dirty, update, reset, delete and
reload. Refuse reads/writes and preserve bytes/names. Check both consumers, nested
focus, narrow/enlarged geometry and final scroll actions. These checks do not
establish full UX, performance or assistive-technology certification.
