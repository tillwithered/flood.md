---
name: flood-forms
description: Compose and verify Flood form ownership, labels, values, validation and reset. Use for fields, selection controls or composed form inputs.
---

# Preserve the form contract

For a message composer in a narrow panel, use `maxVisibleAttachments` if the
file list can crowd the draft. Check that expanding the list preserves the draft
and that a hidden file still goes with the message.

Consult installed declarations and the matching component guide before choosing
props. The [composition reference](../composition.md) documents selection and file
ownership. Read the matching DateField/DateTimePicker component guide for its
specific civil-value and draft contract; [accessibility](../accessibility.md)
documents associations and feedback.

For an ordinary business date field, prefer DatePicker so users can both type and
choose visually. DateField is the lower-level segmented editor without a popup;
choose it for an explicit entry-only interaction or inside a composition that
already supplies Calendar. Do not silently omit the calendar just because the
brief did not enumerate every affordance of choosing a date.

## Assign ownership

Use NumberRangeField for exact lower and upper bounds, with the unit in the
group legend and a clear name on each endpoint. A Slider suits approximate
adjustment across a known scale. Preserve partially entered or reversed numeric
endpoints until the host validates the pair, and attach one shared error when
the user needs to correct it. For a narrow standalone numeric field, use
NumberInput appearance="plain" to keep numeric and keyboard behavior with
more room for the value. Use the stepper when incrementing is a common task.

Use ColorPalette for a defined set of colors and ColorPicker for custom hex
or RGB edits. Give each swatch a meaningful name, and show those names when
they clarify the choice. Use a perimeter and a pressed state to show which
color is accepted. Use Slider valuePlacement="inline" for a group of short
channel labels so their readouts share one trailing edge.

Use FieldChecklist for host-evaluated requirements beside a field. Show the
actual requirements and use pending until each is evaluated. For a new password,
PasswordStrength combines a host-provided rating with an optional checklist.
Keep assessment, validity and submission in the host. Use localized status
and value text and preserve one owner for any announcements.

Use RadioCard or CheckCard when a choice needs supporting details that help
people decide. Keep the title short and put the comparison fact, such as price
or frequency, in metadata. Narrow cards move metadata below the description.
Keep the same anatomy across options and verify selected, hover and keyboard
focus on the full card.
Use RadioCardGroup for exclusive choices and CheckCardGroup for independent
choices when each card needs comparison details. Set minItemWidth against the
longest meaningful copy, then verify the same group after the grid reflows.
Use a shared indicatorPlacement across peer cards. Check logical start and
end in both writing directions, including the selected and disabled states.

In a multi-step form, use Steps to show the whole sequence or StepProgress in
a narrow panel that only needs the current stage. The host owns which steps
can be visited, validation before continuing, and focus when the stage changes.
Keep the current step title from repeating an adjacent heading.

- Field supplies label/description/error associations through its render props;
  spread those props onto the actual Flood control. Fieldset groups related
  controls with a legend; each choice still needs its own meaningful label.
  Put an optional HelpTip in labelAside so native label activation still
  focuses the input. The hint and error remain associated with the field.
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
- Use ErrorSummary for multiple errors after a submission attempt. The links
  belong to errors with a real field target. Put form-wide validation messages
  without a control in formErrors. Check that autoFocus brings the summary into
  view and that clicking a field link takes the user to a visible inline error.
- For a validation message users need while correcting a value, render it with
  the associated Field. An application-specific error should remain visible
  during correction. Preserve the native form constraint and focus on the first
  invalid field, then check the message and nearby controls after the failed
  submission. Native validity by itself does not verify the error presentation.

For visual roles and rhythm, read the [hierarchy skill](../flood-hierarchy/SKILL.md).
Fieldset legendSize="section" is for an independent section; a short form may
need no inner heading. Field labels and values keep their documented sizes.
In an inspector or settings form, Fieldset layout="aligned" gives direct Field
children the same label and control tracks. Labels return above the fields when
the group itself is narrow. Use it for short controls and retain the default
layout for long-form editors and mixed content.

Use Switch layout="row" for an on/off preference with a trailing switch.
Use SwitchGroup when related preferences share a form legend or availability.
Lock a single accepted value with Switch readOnly. The switch remains focusable
and keeps its native form value while pointer and keyboard changes are blocked.
Use SettingRow for a setting that opens a page or triggers a command. Name the
action for what it does and give the setting an explanation when scope or
consequences would otherwise be unclear.
Use SettingGroup for independently actionable settings. Keep switches and
commands on the same start and end edges at normal widths. Let a long
SettingRow value and action flow together below its label and description on
a narrow panel. Use CopyableValue when the value's action is to copy the exact
string. Give that action a name such as “Copy server URL”.
For an editable value inside the same group, use Field layout=adaptive and
spread the supplied control props. Keep the restriction or consequence with
the label, and put validation feedback below the control. Narrow the actual
panel and verify that fields stack in order without losing their draft values.
Use whitespace between rows and enable dividers only for dense peers that are
hard to distinguish. Use Fieldset when the controls need a native form legend.

## Group before laying out fields

For settings with one Save action, keep a draft and the last saved values
separate. Group related fields under named sections, validate the complete
draft, and keep entered values available after a refused save. Reset returns
to the latest saved values. Confirm a successful save only after the host
accepts it. See `recipe:settings-workspace` for a working local example.

Use FormActions to keep the primary and secondary buttons together at the end
of the form. Use SaveStatus for brief feedback beside those actions or in an
autosave header. Keep a failed save's recovery guidance above the action row
and announce each outcome once. Check button position and reading order at
the width where the status wraps.
Use FormActions layout=status-below when brief feedback needs a dedicated
line. Use stacked for long commands in a narrow form when each button needs
the full width. Preserve cancel-before-submit reading and focus order.

Choose the form's reading order and semantic groups before placing controls in
columns. Establish shared outer tracks, gap and group padding. Use a single Grid for
related rows; do not narrow one numeric field in only one row merely because its
value is short. Preserve corresponding vertical edges before optimizing widths. Related groups
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

Measure the controls' content edges, not only the Grid boxes. A full-width padded
Surface containing two tracks and two separately padded Surfaces can use identical
Grid props while their actual controls differ by one surface inset. Nested padding
must participate in the same track budget. Compare corresponding first/second
control starts and widths across those groups; matching outer containers is not
sufficient. Do not insert an empty grid child merely to occupy an unexplained gap.
For a concrete starting structure, discover recipe:grouped-form in the installed
catalog. It demonstrates shared tracks and two-field peer groups in a workspace
form. Adapt its grouping to the host; do not copy its business content or add
unrequested sample records.

Choose the number of field tracks from the width available to the form. A wide
viewport can still contain a narrow drawer or a form squeezed by a sidebar.
Verify the same field group in wide and narrow hosts at the same viewport width.
Check reading order, control widths and labels after the group wraps.

## Exercise transitions, not just props

Use MessageComposer for a chat draft with send, optional file selection and stop.
Keep the draft, pending files and request lifecycle in the host. Clear them only
after accepting the send. Keep the draft available after failure and keep the
stop action in the send slot during a response. Exercise bare Enter, Shift+Enter,
IME confirmation, attachment removal and sending a file with no text.
Keep an embedded draft editor on its composer's surface. Use the caret and
the existing border for focus feedback and keep hover feedback on the actions.

Check entry, clear, incomplete drafts, invalid input, accepted/refused controlled
updates, submit and normal/cancelled reset where supported. Match date/time
default values to the selected precision and remount only the demo when a changed
representation genuinely requires it. Do not silently replace user edits.

FileInput cannot receive a fabricated FileList or ordinary controlled text value.
Use FileTrigger when a compact action hands each new pick to a host-owned queue
or import operation. Use FileInput when the browser must keep the selection for
FormData. AvatarPicker combines an existing profile image with a FileTrigger
and an optional remove action. Keep the previous image during a rejected attempt
and keep the selection local until the host accepts and saves it.
Separate selection from upload transport and progress. Calendar/date/time controls
represent their documented civil values; do not infer a timezone or server save.
Show a real success only after the host operation succeeds. Explain consequential
storage limits once where they matter; a local example does not require a banner
or repeated captions about its implementation. Follow the interface-content
workflow for placement and wording.

## Search values and remote collections

Selected chips supply a MultiSelect's visible context. Its empty query should
not reserve a redundant placeholder row; account for actual action/caret space
and let real search or overflowing chip content grow. Do not hide the combobox
or its keyboard entry to force a fixed-height appearance.
For selections with many tags, use maxVisibleTags on MultiSelect or TagInput.
Keep the overflow action keyboard-accessible and the full selection submitted.
Backspace acts on visible tags. Expand the summary before targeting a hidden tag.

Combobox/MultiSelect submit selected IDs. When choosing people, pass avatar
data on the options and keep names as labels. The single Combobox shows an
avatar for a committed value and a search glyph while editing the query.
Autocomplete accepts arbitrary text and
submits that text; choosing a suggestion does not turn it into an ID field.
Do not weaken a fixed-choice requirement merely to accept a failed search.
Manual filtering requires controlled query (Autocomplete: value), optionsQuery
identifying the accepted result and explicit loadState. Keep selectedOptions
while result pages change. The host owns fetching, cancellation and stale response
rejection; the control also prevents choosing options for another query.

Use an option's avatar when the person or team benefits from visual recognition.
Keep the displayed name in label and use description only to distinguish
similar options. Keep the same avatar and name in accepted values when remote
results change. Let one shared text axis align options with and without artwork.
Use ListBox when the same set of options should stay visible. Its surface
appearance owns scrolling through Flood ScrollArea. Choose plain when the
parent panel already scrolls.

Keep errors/loading distinct from zero matches and provide onRetry when useful.
Test Enter, Escape, blur, native reset, controlled refusal, IME, disabled/readonly
and actual FormData. Query completion, selection and text editing are separate
events. Do not announce success merely because a fetch callback fired.
