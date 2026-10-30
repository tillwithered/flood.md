# Review the rendered interface

The optional `@flood-md/agent/inspect` export provides a self-contained, read-only
DOM observer for local browser tooling. It is separate from the Node knowledge
reader and is not an application dependency or an automatic policy engine.

With Playwright running against your local host:

```js
import {inspectRenderedUI} from '@flood-md/agent/inspect';
await page.evaluate(() => document.fonts.ready);
const observations = await page.evaluate(inspectRenderedUI, {});
```

Before accepting owner selection, also review host-owned source with
`inspectSourceUI` from the same entry:

```js
import {inspectSourceUI} from '@flood-md/agent/inspect';
const jsxReview = inspectSourceUI(jsxText);
const cssReview = inspectSourceUI(cssText, {format: 'css'});
```

The caller supplies local text; the function performs no file access, execution
or network requests. It points at native dialog calls, selected raw JSX controls
and custom grid/flex layout declarations for owner review. Read each source
location: comments, strings, examples and legitimate shell CSS can match, while
aliases, dynamic types and indirect calls can be missed. This is not an AST,
import audit or automatic ban. Use it on host source, not the implementation of
Flood itself. Inputs are limited to 500000 UTF-16 units and maxFindings defaults
to 50 (maximum 500); split larger files deliberately. Retain contextual decisions
outside the product. An empty result does not establish component reuse.

Inspect representative pages and actual interaction states, including a populated
editable row and an open date/selection popup. Set rootSelector only when that
scope is intended; a popup portalled elsewhere will then be excluded. The function
does not open controls or wait for layout on your behalf. It traverses the current
document, not iframes or shadow roots. It performs no network requests or writes.
Keep reports local: labels and copy inventories may contain the host's user data.

Observations include likely text glyphs used as button icons, unslotted SVGs,
passive cells offset from neighbouring input centres and complete cell blocks in
record/action rows, supporting copy echoing a visible action label, a copy inventory
and field/group rectangles. They are review findings with selectors/labels and
measured offsets, not proof of a defect in every context. Arithmetic labels or
custom artwork can be intentional; explain exceptions rather than deleting data
to obtain an empty report. maxElements bounds each selected category (default 500,
maximum 2000) and the total findings list; truncated means coverage is incomplete.

forms.track-drift compares stacked multi-column form grids with the same outer
frame. Different gutters or track counts need review against the grouping plan;
some different contexts can legitimately use different tracks. Tables and nested
ancestor/descendant grids are excluded. It is an observable geometry check, not
an automatic judgement of semantic hierarchy.

forms.content-track-drift compares actual Flood field-owner rectangles across
stacked grids in the same form, even when nested Surface padding makes their
outer Grid frames differ. It requires matching overall content edges and one
consistent field width per track. Tables, ancestor/descendant grids and ambiguous
spanning arrangements are excluded; this is selected coverage, not proof that
all form alignment is correct. Review the reported offset in context.

copy.unowned-support asks for review of supporting text outside a field, actual
operation state, navigation or structured document. This intentionally includes
free-standing implementation captions. Potential usefulness is not a reason to
keep one: name the user's current decision or recovery need. Actual storage errors
and deletion confirmations are different contexts from a static storage footer.
Contextual exceptions are possible. Never change font size, ARIA roles or wrapper
markup just to hide a finding; review the information itself.

table.word-fragment uses Intl.Segmenter and rendered text ranges to identify
words split across table lines. It is bounded by maxElements word segments,
skips words longer than 200 UTF-16 units, code/pre and cells explicitly marked
data-wrap="anywhere". If Intl.Segmenter is unavailable, that coverage is reported
as absent. Localized line-breaking conventions can justify an exception. Preserve
meaningful intrinsic column widths and use local scrolling before accepting
single-letter fragments in statuses or dates.

For icon actions use real artwork in IconSlot and an accessible name on the
action. Table now centres cells by default; use cellVerticalAlign="top" only for
a deliberate prose-table layout. Action-echo findings need contextual review:
a necessary instruction can legitimately repeat a button label.

An empty issues array does not pass the interface. Separately review necessary
copy using the interface-content workflow and coherent grouping using the forms
workflow. Inspect copy in screen order and field edges against common layout
tracks. Check populated, empty, error and changed-content states in task scope.
Record actual decisions and remaining limits; a successful screenshot capture
does not mean its contents were reviewed successfully.
