# Workspace review

[Try the local example](/playground/content#workspace-review). This composition
uses the same source for the live view and the example below. Import the Flood
stylesheet once and render it inside FloodRoot. No network, upload, authorization
or persistent save is implemented: acceptance captures native FormData in memory.

## Choose the owner

Section supplies the heading and supporting content. Field owns the Input/Select
associations; Checkbox owns its label and native form value. Button supplies submit
and reset actions. StatusIndicator describes draft/snapshot state without a
handmade dot. Alert announces local acceptance, and DescriptionList shows the
accepted values separately from the current draft.

Drawer owns modal focus, scroll locking and dismissal. Its FileList/FileItem rows
reuse FileMeta and StatusIndicator. The English example supplies an explicit
locale for file metadata, keeping server and browser formatting consistent.
No parallel popup, field or file chip is
implemented in this recipe. Stack, Inline and Surface own the composition's gaps
and containment. An unstyled section wrapper provides the demonstration anchor.

## Apply relevant skills

Read [composition](/agent/references/flood-composition/SKILL.md),
[forms](/agent/references/flood-forms/SKILL.md),
[spacing](/agent/references/flood-spacing/SKILL.md),
[overlays](/agent/references/flood-overlays/SKILL.md) and
[feedback](/agent/references/flood-feedback/SKILL.md) as those tasks arise.
The [skills index](/docs/skills) routes other work without loading every guide.

Controlled values are reset explicitly after checking that native reset was not
cancelled. Browser validity blocks an empty or whitespace-only name before
submission. Unchecked updates are absent from FormData. Changing a draft keeps
the accepted snapshot intact and marks it stale. Closing the drawer never resets
the form. The status uses text as well as color.

## Source

<!-- flood:workspace-review -->

## Verify in the host

Exercise invalid submit and focus, corrected submit, unchecked values, dirty
drafts, normal/cancelled reset and the accepted snapshot. Open the drawer by
keyboard, dismiss it and verify focus returns to the trigger. Inspect its long
file names and metadata with enlarged text and RTL at a narrow width; local
scrolling must keep all content reachable without page overflow. These checks
support this recipe; they do not certify every possible host composition.
