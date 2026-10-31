# Collection filters and saved views

[Open Projects and Files](/playground/collections).

One set of controls serves a DataTable and a FileList. It demonstrates search,
staged conditions, applied tags, saved definitions and sorting from existing
Flood primitives. CollectionViewControls is project-owned recipe code, not an
export from @flood-md/react. The installed catalog contains these same typed
sources. Keep model and controls together; adapt datasets and shell to the host.

## Query ownership

A query contains search, a flat all/any group, enum conditions and sort. Search
combines with the group using AND. Values within one condition mean any matching
value; is-not excludes all of them. Missing record values do not match is and do
match is-not. The host defines properties, values and record meaning.

The editor has a separate draft. Apply validates and commits; Cancel/outside
dismissal discard it. Removing an applied Tag commits immediately. Clear filters
removes search/conditions, retaining sort. All/Any remains visible outside the
editor. Unknown properties, values, operators, sort columns and schema versions
fail explicitly rather than silently broadening a view.

An applied query change outside the editor closes its obsolete draft. Applying
conditions never restores an old search/sort value from when the editor opened.

DataTable receives the full locally filtered collection. The example resets page
and selection on query/preset/sort changes. Saving or renaming a definition does
not change the query or selection. FileList has its own host sort. Remote requests,
permissions and server-wide selection remain host responsibilities.

Table selection serves a real CopyButton command for the chosen project names.
Hosts without a selection operation should omit selectable rather than display
checkboxes with no resulting action. Copied names remain ordinary text, not CSV.

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

SearchInput, Select, MultiSelect and SegmentedControl own input/choice behaviour;
Popover contains the condition draft and Tag removes applied conditions. Button
and IconButton perform actions. Several view commands use OverflowActions; a
single command uses Button directly. Field/Fieldset, Grid/Stack/Inline, Dialog,
AlertDialog and Alert retain their own roles. DataTable/StatusIndicator and
FileList/FileItem/FileMeta demonstrate two result structures. No owner is inserted
merely to increase its usage count, and no new package atom is needed for layout.

## Model

<!-- flood:collection-views-model -->

## Shared controls

<!-- flood:collection-views-controls -->

## Two consumers

The last export is the website-only shell. Hosts need the model, controls and their
chosen consumer with actual data and their own chrome.

<!-- flood:collection-views-examples -->

## Verification

Exercise all/any, exclusion, incomplete drafts, Cancel/Escape, removal and no-results.
Verify page/selection changes; save, rename while dirty, update, reset, delete and
reload. Refuse reads/writes and preserve bytes/names. Check both consumers, nested
focus, narrow/enlarged geometry and final scroll actions. These checks do not
establish full UX, performance or assistive-technology certification.
