# Collaborative save

Use AvatarGroup to show who is editing when the host has presence information. SaveStatus reports the outcome of the current user's save. Another person being present does not tell you whether the record changed or grant authority to override a version.

<!-- flood:collaborative-save -->

Send the revision used to start the draft with each save. A conflicting response includes the latest accepted snapshot. Keep the draft editable and offer review near Save. Compare against the latest values using ChangeList. If someone changed a field the user left untouched, carry that update forward. Keeping edits prepares a rebased draft and still requires an explicit save. Discarding edits adopts the latest snapshot. For rich text or fields modified by several people, use the host's merge strategy and show the actual proposed result before overwriting.

The host supplies presence, permissions, the conditional mutation, and the latest revision. Mount the recipe per record and treat the initial snapshot as a baseline. The server must verify the expected revision again after each review. For network failure, keep the draft and retry from the same revision. Check a delayed conflict and a second write before the rebased save, disjoint changes, closing the comparison, focus after resolution, and an ordinary save with other editors present.
