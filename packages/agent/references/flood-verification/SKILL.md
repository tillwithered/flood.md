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

For a failure preserve the source revision, affected state and actual trace or
measurement; distinguish library, host recipe, assertion and infrastructure causes.
Correct the responsible owner without weakening a meaningful assertion to get
green. Add regression coverage for demonstrated risks rather than mirroring CSS.

State what ran, results, manual observations and remaining limits. A source scan,
agent instruction, screenshot or accessibility scanner cannot independently prove
all behavior or certify conformance. A local build does not prove registry
publication, website deployment or a host backend save. Keep installation upgrades
deliberate and preserve customized/linked destination protections.
