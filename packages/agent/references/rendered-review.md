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

Inspect representative pages and actual interaction states, including a populated
editable row and an open date/selection popup. Set rootSelector only when that
scope is intended; a popup portalled elsewhere will then be excluded. The function
does not open controls or wait for layout on your behalf. It traverses the current
document, not iframes or shadow roots. It performs no network requests or writes.
Keep reports local: labels and copy inventories may contain the host's user data.

Observations include likely text glyphs used as button icons, unslotted SVGs,
single-line numeric cells offset from neighbouring input centres, a copy inventory
and field/group rectangles. They are review findings with selectors/labels and
measured offsets, not proof of a defect in every context. Arithmetic labels or
custom artwork can be intentional; explain exceptions rather than deleting data
to obtain an empty report. maxElements bounds each selected category (default 500,
maximum 2000); truncated means coverage is incomplete.

For icon actions use real artwork in IconSlot and an accessible name on the
action. For editable tables use Table cellVerticalAlign="middle" where appropriate;
keep default top for multiline record tables when it serves the content.

An empty issues array does not pass the interface. Separately review necessary
copy using the interface-content workflow and coherent grouping using the forms
workflow. Inspect copy in screen order and field edges against common layout
tracks. Check populated, empty, error and changed-content states in task scope.
Record actual decisions and remaining limits; a successful screenshot capture
does not mean its contents were reviewed successfully.
