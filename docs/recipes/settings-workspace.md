# Settings workspace

[Open the working composition](/playground/settings).

Use a settings page when a person needs to review and change several related
preferences together. This example groups workspace details and notifications
in one form with a single save boundary. Fieldset names the groups, Field
associates labels and errors, and Grid lets related fields share tracks when
there is room. Use a standalone form control for a preference that should
apply immediately and has no shared save boundary.

## Save and discard

The host keeps a draft and the last accepted snapshot. Save validates the
workspace name, focuses its input if invalid and writes the full proposal
before announcing success. A write failure leaves the draft available for
retry. Discard restores the accepted snapshot and moves focus back to the first
field. Keep the save control available after success so a focused submit
button stays in the tab order.

This playground uses a dedicated browser storage key. The first visit starts
with defaults. If a saved snapshot cannot be read or parsed, show a retry
action and leave that snapshot intact. Use the host's actual persistence and
permission model when adapting the recipe.

## Source

<!-- flood:settings-workspace -->

<!-- flood:settings-workspace-styles -->

## Review

Check empty-name validation and its focus target, changes across sections,
discard, persistence after reload and read/write failure. Confirm the form
stacks at narrow widths and the labels remain readable with enlarged text.

Compare the legend with the first switch label, then compare the spacing
between the two switch labels. The row target already creates pitch. Align
the tracks at the end of a bounded column and verify that each label still
pairs clearly with its switch. See [visible weight](../layout.md#review-visible-weight).
