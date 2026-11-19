# Review staged changes

Show pending values in their editing context. Use ChangeList in a review panel to compare accepted and proposed values. Keep a way to exclude individual changes and show the scope of the final action. The application owns commits, errors, retries and any environment affected by the operation.

This example gives each staged change an independent checkbox. Excluding a candidate removes it from the submission while preserving it for review. The application should pass a unique revision and verify it when applying the selected IDs.

```tsx
"use client";

import { Alert, Button, ChangeList, Checkbox, FormActions, Stack, type ChangeListItem } from "@flood-md/react";

export function StagedChanges({
  items, included, onToggle, onApply, pending, revision, error,
}: {
  items: readonly ChangeListItem[];
  included: readonly string[];
  onToggle: (id: string, included: boolean) => void;
  onApply: (revision: string, ids: string[]) => void;
  pending?: boolean;
  revision: string;
  error?: string;
}) {
  const accepted = items.filter(item => included.includes(item.id)).map(item => item.id);
  return <Stack gap="4">
    {items.map(item => <Stack key={item.id} gap="2">
      <Checkbox label={`Include ${item.label}`} checked={included.includes(item.id)}
        disabled={pending} onChange={event => onToggle(item.id,event.currentTarget.checked)} />
      <ChangeList items={[item]} valueLayout="adaptive" />
    </Stack>)}
    {error && <Alert tone="error" announcement="polite">{error}</Alert>}
    <FormActions primary={<Button disabled={!accepted.length} loading={pending ? "retain-focus" : false}
      onClick={() => onApply(revision,accepted)}>
      Apply selected changes
    </Button>} />
  </Stack>;
}
```

For write-only values, use a named state such as “Secret stored” and an explicit Replace action. Keep the replacement input separate from the read view. In the comparison, use only display-safe facts such as “Stored” and “Replacement staged”. Keep the actual secret outside the prepared change, review event and copyable values. Use PasswordInput in the protected replacement form. RevealValue is appropriate only when the host permits retrieving the saved value.

This setting receives only a stored flag and a write callback. It clears the replacement when canceled or saved and retains the entered value after a rejected write so it can be retried. The host updates the stored flag after the server accepts the write.

<!-- flood:write-only-secret -->

Check exclusion of the last item, an apply conflict and an unsuccessful replacement. In each case, preserve the user's review state and show the next action near the operation.
