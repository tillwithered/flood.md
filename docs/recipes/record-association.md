# Associate a record

Use the existing manual mode of Combobox to select a related record by ID. Keep the accepted option's label when results change. The application owns queries, cancellation, same-query retry, permissions and creating records.

Show a create action only if people have permission to create that record. After creation, select the new record by ID and keep the relationship draft open. For applications with an optional primary relationship, include that question only after the user chooses a record.

```tsx
"use client";

import { Button, Checkbox, Combobox, Field, FormActions, Select, Stack, type ComboboxOption } from "@flood-md/react";

type Relationship = {
  record?: ComboboxOption;
  role: "customer" | "partner";
  primary: boolean;
};
type Results = {
  query: string;
  state: "ready" | "loading" | "error";
  options: readonly ComboboxOption[];
};

export function LinkCompany({
  draft, query, results, onQueryChange, onChange, onRetry, onCreate, onLink,
}: {
  draft: Relationship;
  query: string;
  results: Results;
  onQueryChange: (query: string) => void;
  onChange: (draft: Relationship) => void;
  onRetry: () => void;
  onCreate?: () => void;
  onLink: (draft: Relationship & { record: ComboboxOption }) => void;
}) {
  return <form onSubmit={event => {
    event.preventDefault();
    if (draft.record) onLink({ ...draft, record: draft.record });
  }}>
    <Stack gap="4">
      <Field label="Company" required
        labelAside={onCreate && <Button type="button" size="sm" variant="ghost" onClick={onCreate}>Create company</Button>}>
        {field => <Combobox {...field} filtering="manual" query={query} optionsQuery={results.query}
          options={results.options} selectedOptions={draft.record ? [draft.record] : []}
          value={draft.record?.value ?? ""} clearable loadState={results.state}
          onQueryChange={onQueryChange} onRetry={onRetry}
          onValueChange={key => {
            const record = results.options.find(option => option.value === key);
            if (!key) onChange({ ...draft, record: undefined, primary: false });
            else if (record) onChange({ ...draft, record });
          }} />}
      </Field>
      {draft.record && <>
        <Field label="Relationship">
          {field => <Select {...field} value={draft.role}
            onChange={event => {
              const role = event.currentTarget.value;
              if (role === "customer" || role === "partner") onChange({ ...draft, role });
            }}>
            <option value="customer">Customer</option>
            <option value="partner">Partner</option>
          </Select>}
        </Field>
        <Checkbox label="Primary company" checked={draft.primary}
          onChange={event => onChange({ ...draft, primary: event.currentTarget.checked })} />
      </>}
      <FormActions primary={<Button type="submit" disabled={!draft.record}>Link company</Button>} />
    </Stack>
  </form>;
}
```

Test typing a second query while the first request is pending. The previous results must stay unavailable as choices. Test retry, creating a record outside the current result set, and retaining the relationship role while the list changes.
