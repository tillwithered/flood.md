---
name: flood-verification
description: Verify Flood component or composed-interface changes against applicable contracts and actual evidence. Use for stabilization, regression or completion review.
---

# Turn a rule into an observation

Read [verification](../verification.md), the host's scripts and the changed
component's contract. Use project-root flood/rules.json to identify applicable
rule IDs; it is an index of guidance, not an automatic pass/fail policy engine.

## Bound the coverage

Record the affected primitive, its real consumers, supported states and ownership.
Mark an inapplicable check with a reason rather than forcing keyboard behavior
onto decoration or readOnly onto every control. Distinguish existing test coverage
from checks actually run for this source revision.

Honor the task's declared evaluation scope. A desktop-only test host does not
require new mobile product work. Record excluded targets instead of quietly
expanding the task. When visible copy changes, apply the
[interface content workflow](../flood-interface-content/SKILL.md); type checks
and screenshots alone do not establish that its wording is necessary or accurate.
Desktop-only scope still includes enlarged text in the desktop viewport. Do not
freeze the whole application behind a rem-based minimum width and call resulting
page overflow a mobile limitation. Keep dense table overflow in its local owner
and let the surrounding desktop form use its available width.

Check the public contract at the boundary: installed exports/types, actual form
values, controlled acceptance/refusal, reset, names/focus and semantic state. For
visual changes inspect rendered geometry, long/optional content, narrow/wide,
enlarged text and the relevant pointer/RTL/forced-color modes. A CSS declaration
or component count is not evidence that the user-visible relationship works.

For geometry and screenshots, wait for fonts, pending animations and a settled
rendering frame. A zero running-animation count alone may precede final
presentation. Preserve real motion and strict geometry tolerances; distinguish
an entry frame from the final layout rather than accepting either as proof.

During local iteration run focused checks and show the result promptly. A shared
primitive correction also checks its consumers. At a consolidated Flood source
candidate run npm run verify and the required applicable browser matrix; use the
host's equivalent gates in a consuming app. Do not continually repeat a full
release gate for every reversible visual adjustment.

## Report a usable result

Use the [rendered review observer](../rendered-review.md) when local browser
tooling is available. Inspect findings and exceptions, then review hierarchy and
copy separately; no findings is not an editorial or visual-quality pass.
Review host JSX/CSS with inspectSourceUI from that entry too, then resolve the
actual owner at each candidate location. Include layout and cancel/confirmation
paths, not just fields. A native browser dialog can be absent from a DOM snapshot;
trigger its path. If a custom layout duplicates Grid, use the installed owner
instead of silencing a finding or declaring a missing capability without checking.

Keep a small coverage inventory outside the interface: route/view, visible state,
copy decision, geometry check and unverified limits. Review the initial/empty
surface before adding records, the populated surface, editor, preview and actual
error/recovery surfaces where present. Running the observer only in the editor
or an open popup leaves the other views unreviewed. Never extend a zero-findings
claim to states that were not inspected. Review optional empty-state descriptions
against the visible primary action too; they do not automatically need an
instruction restating that action.
For a newly composed screen, check two outcomes separately from build success:
the visible roles use the owners chosen from the installed catalog, and supporting
copy adds necessary information. Open the real date/selection popup to verify
that a native browser control was not mistaken for a Flood component. Inspect
mixed editable table rows, not only overflow. Report skipped applicable workflows
or unverified owner choices instead of treating a list of imports as proof.

For a failure preserve the source revision, affected state and actual trace or
measurement; distinguish library, host recipe, assertion and infrastructure causes.
Correct the responsible owner without weakening a meaningful assertion to get
green. Add regression coverage for demonstrated risks rather than mirroring CSS.

State what ran, results, manual observations and remaining limits. A source scan,
agent instruction, screenshot or accessibility scanner cannot independently prove
all behavior or certify conformance. A local build does not prove registry
publication, website deployment or a host backend save. Keep installation upgrades
deliberate and preserve customized/linked destination protections.
