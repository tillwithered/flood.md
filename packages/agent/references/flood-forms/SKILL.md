---
name: flood-forms
description: Compose and verify Flood form ownership, labels, values, validation and reset. Use for fields, selection controls or composed form inputs.
---

# Preserve the form contract

Use MeetingAvailability near scheduling controls to review a proposed slot.
Keep unknown availability distinct from free time and time outside working
hours. Show the attendee’s local date when it differs from the organizer's.
Fetch availability and resolve calendar permissions in the host.

Use SpendLimitForm when a resource has both a spending notification and an
enforced limit. Describe the consequence next to the enforced threshold.
Keep unset separate from zero, and ask for confirmation when a newly saved
limit would interrupt a running service. Use UsageLimit for current usage.

Use SharingPanel when the user needs to see direct grants and change general
access for a resource. Describe who can open or discover it in each scope.
Keep the selected draft distinct from what the server enforces and supply a
copyable link only for the effective scope. Preserve the proposal on failure.

Use AccessInviteForm to invite one person to a known workspace, project, or
team. Show the resource and the selected role's practical effect. Require an
explicit role choice unless a host policy deliberately provides one. Reset
or revalidate the role when the resource changes and preserve the email on
request failure. The host authorizes the role and resource together and
announces success after it accepts the request.

Use AccessRequestForm when someone hits a known restricted resource. Name
the signed-in account and only the resource details it may discover. Add a
message input when it can help the reviewer. If policy blocks requests,
explain the available next step. A submitted request is still awaiting a
decision, so the host continues to enforce the existing access.

Use PendingInvitationList after sending to show invitations awaiting acceptance,
expired invitations, and delivery failures. Render the actions allowed for each
invitation. If revocation removes a row, restore focus to a remaining action
or a stable control near the list.

Use VariableReferencePicker for a single configuration reference. Supply only
display-safe source names and keys. Keep the stable reference ID in form data.
Resolve the value and validate the source in the host when saving the draft.

Use ColorFilter beside search to stage and apply a single color criterion.
Keep the text query independent. The host determines matching and updates the
results only after the color filter is applied or cleared.

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

Use RelativeTimeRangePicker for a filter that can follow a relative window
such as the last 24 hours or use fixed calendar bounds. Preserve both drafts
when switching modes. Keep time zone conversion, the meaning of day-based
intervals, and applying or submitting the filter in the host. Check a preset,
an absolute edit, and a mode switch at the narrowest supported width.

Use RestartPolicyEditor in a service’s runtime settings to configure automatic
recovery after a stop. Explain the consequence of the selected mode. Keep the
failure-only limit in the draft across mode switches and include it in the
saved policy only when it applies. Read allowed modes and limits from the host.

Use EstimateMenu beside a task or work item when estimates come from the
team’s discrete scale. Use a short visible value with a full label. Keep a
known zero distinct from an unestimated task. Retain the accepted estimate
when the team changes its scale and let the host resolve existing values.

Use DatabaseWebhookForm to configure delivery of row changes from one table.
Require explicit events and a destination. Disambiguate tables by schema
where needed and let the server enforce permissions and outbound URL policy.
Keep the draft in place on rejection.

Use EnvironmentCreationForm when a new environment can start empty or copy an
existing one. Show which configuration or data will carry over for the selected
source. Check source eligibility and name conflicts in the host. Keep the draft
available after rejection.

Use LogExportForm to export the current log query with an explicit format
and row limit. Show its fixed time range or ask how far back to retrieve.
Keep all existing source and filter constraints in the host request.
Preserve selections if the download fails.

Use TemplatePicker beside a record draft when a template fills several fields.
Show the actual proposed values and identify any existing fields that will be
replaced. Selecting a template changes the preview. Apply the changes only
after the explicit apply action and preserve the user's draft if it fails.

Use ModelPicker in a run or workflow that can use multiple inference models.
Show one decision-relevant capability or the reason a model is unavailable.
Keep the provider visible with the committed name and use a stable host ID
when passing the choice into the request.

Use ContentLanguagePicker to record the languages of an item separately from
the interface locale. Provide the host’s accepted language tags. Give authors
the chance to correct a detected draft, including adding another language to
multilingual content. The picker submits the accepted tags.

Use HandleField for a public account address. Pass a fixed domain when the user
edits only their name, or accept the full address for a custom domain. Key each
availability result by the exact address. Use DomainVerification for the separate
step that proves ownership of a custom domain.

Use CronScheduleField when a scheduler requires a cron expression. Validate
using the service’s grammar and return a preview for the exact draft and zone.
Show the zone beside upcoming runs, and keep unavailable previews separate
from a known empty preview window.

Use TimeZoneSelect when a user searches a named zone rather than choosing
from a short fixed list. Pass the instant for display, preserve the named
identifier, and resolve ambiguous civil times in the host. Use
RecurrenceEditor for daily or weekly schedules. Keep inactive end drafts
when switching modes and validate the active rule before generating dates.
Use QuietHoursEditor for one weekly notification pause window in the host's
time zone. Days select where the window starts. An end before the start
falls on the following day. Validate the complete draft and apply the host's
daylight-saving policy before saving.

## Assign ownership

Use RecordRelationForm when the user needs to create a direct link between
records. Name the direction from the source record's viewpoint and keep the
draft when the host rejects it. Render accepted relationships with RecordRelations.

Use ReplicaAllocation to edit planned counts across deployable regions.
Keep the service-wide budget visible and include assignable regions with zero
replicas. Use StagedChanges to review the plan and keep applying it in the host.
Use DeploymentRegionPicker for a single location choice.

Use ContentReportForm for a moderation report about an identified subject.
Show the applicable reasons and require supporting details only when the
chosen reason needs them. Keep the draft on failure and acknowledge success
after the moderation service accepts it. Show the recipient when the app
supports routing reports to multiple services.

Use ModerationAppealForm to request reconsideration of one published decision.
Keep the reason visible and bind the draft to that decision's ID. Preserve the
explanation on refusal. Show the updated state in ModerationNotice once the
service accepts the appeal.

Use ContentLabelSettings when viewers choose how one provider's labels affect
their feed. Name the provider and identify choices fixed by policy. Keep the
last accepted visibility if the host refuses a request. Use ContentAdvisory
at the point where a label permits deliberate reveal.

Use MutedWordForm to draft a viewer's content mute before adding it to
MutedWordList. Keep the word, match scope, duration and exception editable
after rejection. Resolve expiry and duplicates when the host saves, and
update the active list after acceptance.

Use NotificationChannelSettings for a delivery channel with individual event
preferences. Keep those choices intact when the channel is paused and show
the source of any fixed choice on its row. Keep required alerts that bypass
the pause outside the group. The host owns acceptance and delivery.

Use PermissionEditor for one role's grouped permission draft. Show the named
source of inherited permissions, preserve their resolved state, and let
the host validate and commit editable grants together. Check one inherited
grant, one inherited restriction and one editable permission by keyboard.

Use ShortcutRecorder to capture an editable keyboard chord. Show conflicts
from the host's actual bindings and persist only after explicit confirmation.
Choose logical key or physical code matching for the host action and expose
the accepted binding in KeyboardShortcut or ShortcutReference. Preserve Tab
navigation and verify Escape leaves the saved binding unchanged.

Use Calendar with selectionMode="multiple" for independent days. Use
RangeCalendar for a continuous interval and DatePicker for a date field that
people can type into. Keep date IDs in ISO form and check removal, clearing,
and keyboard focus across month navigation.

Use MoneyField for a named currency and UnitNumberField for a number with a
measurement unit. Keep money as a decimal string. Changing a measurement unit
leaves the quantity intact, so make conversion explicit in the host.
Use PaymentMethodPicker when comparing payment methods by delivery and fee.
Show an explicit zero fee for a fee-free quote and keep unknown estimates
distinct. Recheck the selected method and its quote in the host before
accepting a payment.

Use ExpenseAllocationForm to reconcile one expense across named destinations
in the original currency. Retain amounts when the authoritative total changes
or saving fails. Apply destination rules and persist the accepted split in the host.
Use KeyValueEditor for editable collections of pairs and key errors by stable
row ID. Preserve the focused field when a key changes.

Use the typed mode of FilterCondition or FilterGroup when a query accepts text,
numeric or calendar-date operands. Changing which property is filtered resets
the operand. Changing its operator preserves the entered value. The host
decides when to apply the draft and how to interpret a missing value.

Use SuggestionTextarea or the suggestions prop on MessageComposer for
in-draft mentions and slash commands. The host owns the available entries and
what a selected ID means. Check insertion after existing text with the
keyboard and confirm the same Enter press does not also submit the message.

Use QueryInput when advanced search combines free text or an exact identifier
with field constraints. Keep query grammar, suggestions and execution with
the host. Supply only the range being completed and keep committed conditions
as individually removable tokens. Check the caret and untouched text after
completion or removal. For plain text search, use SearchInput.
Use VisualSearchForm when an image and text can describe the same query.
Keep the selected image identified beside the query and preserve the text
when changing or removing the image. The host owns the chooser and results.

Use NumberRangeField for exact lower and upper bounds, with the unit in the
group legend and a clear name on each endpoint. A Slider suits approximate
adjustment across a known scale. Preserve partially entered or reversed numeric
endpoints until the host validates the pair, and attach one shared error when
the user needs to correct it. For a narrow standalone numeric field, use
NumberInput appearance="plain" to keep numeric and keyboard behavior with
more room for the value. Use the stepper when incrementing is a common task.

Use RolloutAllocation for two variants sharing the same eligible audience.
Choose a step that matches the release policy. The displayed shares must
always total 100 percent. Keep publication and cohort assignment in the host.

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
Use DeploymentRegionPicker in setup or migration when placement choices need
geography and eligibility details. Distinguish automatic placement from a
specific location, and keep the current deployment separate from the draft.
Show the host's migration impact and apply the draft in a separate action.
Use CidrField for an IP address with a required prefix length. Keep the draft
text intact while users correct it. The host validates range semantics and
eligibility before saving. Use NetworkAllowlist beside the field to show
which ranges already belong to the draft or applied policy.

In a multi-step form, use Steps to show the whole sequence or StepProgress in
a narrow panel that only needs the current stage. The host owns which steps
can be visited, validation before continuing, and focus when the stage changes.
Keep the current step title from repeating an adjacent heading.

When users jump between answered, unanswered and flagged sections, use
recipe:checkpoint-navigator. Preserve answers while navigating and keep
the flag as an independent action. Verify that answering a section retains
its flag.

- Field supplies label/description/error associations through its render props;
  spread those props onto the actual Flood control. Fieldset groups related
  controls with a legend; each choice still needs its own meaningful label.
  Put an optional HelpTip in labelAside so native label activation still
  focuses the input. The hint and error remain associated with the field.
- Decide controlled value/onValueChange versus uncontrolled defaultValue. A
  default initializes; changing it is not an update contract. Handle host refusal
  of a requested value without reporting that it was saved or losing focus.
- For filter choices that constrain each other, use recipe:dependent-filters.
  Invalidate the incompatible child when the parent changes, apply the pair as
  one query change and keep unrelated constraints. A late child-option response
  belongs to the parent that requested it.
- Set native name/form/required and submit/reset button types deliberately.
  Inspect FormData, including repeated checkbox names with getAll and the
  component's documented submission shape. Visible prefixes are not submitted
  values; Token/Tag/Toggle actions are not automatically native form inputs.
- For fixed single selection, use Select. Choose `presentation="native"` when
  the browser or operating system should handle the picker. Verify the label,
  value, required constraint and native reset on the visible control.
- Read-only and disabled are different. Use readOnly only where the installed
  API supports it; retain copy/focus/submission as documented. Disabled values
  are excluded from native submission. Do not synthesize read-only behavior by
  disabling unrelated controls or hiding a field's value.
- Error is invalid; warning/success/info are advisory, not validation algorithms.
  Host validation decides the error and useful message. Keep native constraints,
  invalid focus and the accessible message association coherent.
- Use FindBar to move among matches in an open document. The host owns matches,
  editor selection and replacements. Check empty results, invalid expressions and
  Enter or Shift+Enter in the query field.
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
Choose SettingGroup layout=aligned when direct adaptive fields and command
rows should share columns and stack at the same width. Check the transition
with a field hint and a row that has both a value and an action. Row-layout
switches remain on their trailing edge as the group narrows.
Use whitespace between rows and enable dividers only for dense peers that are
hard to distinguish. Use Fieldset when the controls need a native form legend.

## Group before laying out fields

For settings with one Save action, keep a draft and the last saved values
separate. Group related fields under named sections, validate the complete
draft, and keep entered values available after a refused save. Reset returns
to the latest saved values. Confirm a successful save only after the host
accepts it. See `recipe:settings-workspace` for a working local example.

Use FormActions to keep the primary and secondary buttons together at the end
of a short form. Use SaveBar when a long settings form needs save and discard
within reach throughout editing. Bind it to the native form and the actual
draft, verify viewport placement does not shift the form, and test discard,
failed save and focus after the bar disappears.

Use SaveStatus for brief feedback beside form actions or in an
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
Use the compact layout when the draft and actions usually fit side by side.
The actions flow below the editor when they need more space. Check the
composer in its narrowest host with the actual localized send label and
attachment action, and confirm that the draft and focus survive reflow.

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

Use Select for a short fixed list. For a fixed list that people search, start
with Combobox for one selection or MultiSelect for several. Autocomplete suits
fields that accept text outside the suggestions, such as a title.

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
