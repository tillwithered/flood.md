---
name: flood-records
description: Compose record lists and detail views with a clear metadata hierarchy. Use for crowded status/category/priority/date rows, drifting scan positions or deciding between a list and a comparison table.
---

# Select information for the current decision

Read the task and installed DataListItem, Table/DataTable, DescriptionList and
feedback contracts relevant to it. Start with what the user needs to recognize,
compare or act on before opening a record. A record's available schema is not the
content specification for every surface. Use the
[interface-content workflow](../flood-interface-content/SKILL.md) for wording and
[hierarchy workflow](../flood-hierarchy/SKILL.md) for visual relationships.

Before JSX, make a short field -> decision -> list/detail placement record in
development notes. Include the reason for an omitted field; do not place this
planning text in the interface. Read the
[decision examples](../record-decisions.md) when meanings or placement are unclear.

## Choose the record structure

- Use DataList/DataListItem when identity, a useful summary and opening the record
  are primary. Keep the title and summary as one readable unit. Give secondary
  attributes a subordinate relationship rather than filling every trailing slot.
- If users compare several independent attributes across records, use Table or
  DataTable with actual named columns. A long Inline of unrelated values at each
  row end is not a substitute for comparison columns.
- Use DescriptionList for named values in details. A detail view can expose more
  information than a list; it does not need to repeat the list's chip arrangement.
- Selection is not navigation. A record list does not become ListBox merely
  because users click its entries. Retain a real Link and independent actions.

When a scan signal is useful at the trailing edge, keep its position stable
across sibling records. Test the longest and missing values, not only equal sample
strings. Multiple right-justified values with variable lengths produce shifting
pseudo-columns even when their gaps match. Use an explicit common comparison
structure or move secondary attributes into the copy area.

## Distinguish metadata roles before styling

| Meaning | Existing owner / treatment |
| --- | --- |
| Lifecycle or operation state | StatusIndicator with accurate text; color is supplementary |
| Category, type or membership | Badge when a tag-shaped marker helps recognition; otherwise named/subordinate text |
| Priority or urgency | Keep visible when it drives triage/comparison; use an explicit column or named value if needed |
| Creation, update, due or event time | Identify the event and appropriate precision; do not treat every date as a status |
| An available operation | Button/IconButton/Menu; do not make an informational badge look actionable |

A category named Error is not necessarily a failed operation. Do not choose
error styling or an announcement from that word alone. Use clear labels in
ambiguous contexts, especially details with several similar-looking values.
A priority is not a second lifecycle status. Do not make all attributes colorful
chips or interchangeable status dots. Keep StatusIndicator rather than hand-drawing
its state text/dot to fit a preferred arrangement.

There is no universal badge limit. For a browsing list, start with identity and
one useful scan signal; admit further visible metadata when it changes selection
or action. For triage, priority may be essential even when every item is normal.
Do not hide necessary comparisons just to make a screenshot quieter. Conversely,
a default low/medium priority does not automatically need a separate visual accent.

## Distribute information between list and details

Protect enough width for the identity and useful summary. Category and recency
can read as secondary information near the title; status may stay in a stable
trailing position. This is one pattern, not a required arrangement. DataListItem
slots accept composition from supported Flood primitives; check their actual
content types before using them. Do not override private slot layout or wrap
ordinary metadata in invented semantics merely to silence an inspector.

In details, group named attributes by purpose. Place the principal state where it
informs action; avoid an unlabeled strip of state, category and priority that asks
the user to infer their meanings. User descriptions remain content, not interface
copy to shorten. A heading or Surface around a description must earn its role;
it is not mandatory for every text field.

Creation and modification describe different events. Keep both when history or
recency matters. If displayed values repeat and the distinction adds no current
value, one visible date may suffice; if exact time matters, use adequate precision
instead of suppressing the distinction based only on equal formatted dates.

## Compose collection states deliberately

First-use empty, filtered no-results, loading and read failure are different
states. Keep a relevant reset/action and meaningful feedback. A result count can
help filtering or pagination; do not automatically add Found: 0 beside an empty
collection message that already establishes there are no records. Never remove
an accessible update announcement merely to remove a duplicate visible sentence;
check announcement ownership in the feedback workflow.

A product header, page title and section heading must answer different questions.
Do not add a generic product/category eyebrow plus a title plus a sentence restating
it just because the shell has slots. Real branding and navigation context can
justify persistent chrome; preserve that purpose rather than applying a text ban.

## Verify across several records and states

Use isolated fixtures, not fictional records persisted into the user's app. Check
several short and long titles, every meaningful state, differing category/priority
lengths, missing metadata and long dates. Inspect scan positions and copy width
at normal and enlarged text, including 1280px/root24px for the desktop baseline.
No page overflow alone does not prove that the title has readable width.

Open details and return; exercise filters, no-results/reset and row actions.
Check reading order, Link names and action focus separately from visual alignment.
Review each visible attribute's decision value outside the product UI. An optional
observer may flag useful metadata or miss a crowded row; record the contextual
keep/move/name/omit decision rather than treating its output as editorial approval.
