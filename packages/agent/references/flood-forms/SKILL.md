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

## Exercise transitions, not just props

Check entry, clear, incomplete drafts, invalid input, accepted/refused controlled
updates, submit and normal/cancelled reset where supported. Match date/time
default values to the selected precision and remount only the demo when a changed
representation genuinely requires it. Do not silently replace user edits.

FileInput cannot receive a fabricated FileList or ordinary controlled text value.
Separate selection from upload transport and progress. Calendar/date/time controls
represent their documented civil values; do not infer a timezone or server save.
Show a real success only after the host operation succeeds. In a local example,
state explicitly that changes are local.
