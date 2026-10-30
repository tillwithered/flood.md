---
name: flood-forms
description: Compose and verify Flood form ownership, labels, values, validation and reset. Use for fields, selection controls or composed form inputs.
---

# Preserve the form contract

Consult installed declarations and the matching component guide before choosing
props. The [composition reference](../composition.md) documents selection and file
ownership. Read the matching DateField/DateTimePicker component guide for its
specific civil-value and draft contract; [accessibility](../accessibility.md)
documents associations and feedback.

## Assign ownership

- Field supplies label/description/error associations through its render props;
  spread those props onto the actual Flood control. Fieldset groups related
  controls with a legend; each choice still needs its own meaningful label.
- Decide controlled value/onValueChange versus uncontrolled defaultValue. A
  default initializes; changing it is not an update contract. Handle host refusal
  of a requested value without reporting that it was saved or losing focus.
- Set native name/form/required and submit/reset button types deliberately.
  Inspect FormData, including repeated checkbox names with getAll and the
  component's documented submission shape. Visible prefixes are not submitted
  values; Token/Tag/Toggle actions are not automatically native form inputs.
- Read-only and disabled are different. Use readOnly only where the installed
  API supports it; retain copy/focus/submission as documented. Disabled values
  are excluded from native submission. Do not synthesize read-only behavior by
  disabling unrelated controls or hiding a field's value.
- Error is invalid; warning/success/info are advisory, not validation algorithms.
  Host validation decides the error and useful message. Keep native constraints,
  invalid focus and the accessible message association coherent.

## Group before laying out fields

Choose the form's reading order and semantic groups before placing controls in
columns. Establish shared outer tracks, gap and group padding. Related groups
should share those tracks: do not independently choose a four-column grid above
two columns below and assume their edges align. A group may span the whole layout
when its content needs it; not every field should have the same width.

For Flood record/settings forms without a denser host requirement, start with
at most two field tracks per semantic group. Four metadata fields become two
pairs rather than an automatic four-field strip. Use one track for a narrow group
or long field. A denser table editor, filter toolbar or explicit host design is
a different context; record why its structure needs more tracks.

For two peer groups, use two equal outer tracks and subdivide each consistently
when a group contains short related fields. A pair of two-field groups can read
more clearly than four unrelated columns. This is a pattern to evaluate, not a
rule that every form has two columns or an invoice-specific template.

Keep a group's title, controls and supporting message together in reading and DOM
order. Distinguish page, group and field roles without adding headings merely to
fill containers. Compare shared leading/trailing edges and gutters in the rendered
form, including absent descriptions, long labels and changed field values.

For a concrete starting structure, discover recipe:grouped-form in the installed
catalog. It demonstrates shared tracks and two-field peer groups in a workspace
form. Adapt its grouping to the host; do not copy its business content or add
unrequested sample records.

## Exercise transitions, not just props

Check entry, clear, incomplete drafts, invalid input, accepted/refused controlled
updates, submit and normal/cancelled reset where supported. Match date/time
default values to the selected precision and remount only the demo when a changed
representation genuinely requires it. Do not silently replace user edits.

FileInput cannot receive a fabricated FileList or ordinary controlled text value.
Separate selection from upload transport and progress. Calendar/date/time controls
represent their documented civil values; do not infer a timezone or server save.
Show a real success only after the host operation succeeds. Explain consequential
storage limits once where they matter; a local example does not require a banner
or repeated captions about its implementation. Follow the interface-content
workflow for placement and wording.
