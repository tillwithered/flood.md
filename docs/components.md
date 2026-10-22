# Components

Import controls from `@flood-md/react` and import `@flood-md/react/styles.css`
once at the application root. Components forward native HTML props and refs,
except Field, which provides associations through its function child.

| Component | Flood-specific props | Notes |
| --- | --- | --- |
| Button | `variant`: solid / outline / ghost; `size`: sm / md; `loading` | Defaults to `type="button"`; loading disables activation |
| Input | `invalid` | Native input props such as name, type, required and autoComplete |
| Textarea | `invalid` | Native textarea props such as rows and maxLength |
| Checkbox | required `label` | Native checkbox with its visible label |
| Radio | required `label` | Use a shared name and a fieldset/legend for a group |
| Switch | required `label` | Native checkbox with switch semantics |
| Field | `label`, `hint`, `error`, `id`, function child | Pass the supplied props to one Input or Textarea |
| Link | native anchor props | Use for navigation; Button is for actions |

## A form field

This example belongs in a Next.js client component because Field takes a function
child. Server components may render Flood components with serializable props.

```tsx
"use client";
import { Button, Field, Input } from "@flood-md/react";

export function ProfileForm() {
  return (
    <form>
      <Field label="Name" hint="Shown on your profile">
        {(control) => (
          <Input {...control} name="name" autoComplete="name" required />
        )}
      </Field>
      <Button type="submit">Save</Button>
    </form>
  );
}
```

Supply `error` on Field when validation fails. It connects the error text and
invalid state to the control. Flood does not submit data or perform validation
requests: your application owns those behaviors. A controlled input should use
React's normal value/onChange or checked/onChange pair.

The shipped [TypeScript interfaces](../packages/react/src/index.tsx) are the full
API reference. See the [Next.js example](../examples/next/app/profile-form.tsx)
for client interaction. Automated accessibility checks cover the fixtures; check
keyboard use, labels, focus and contrast in your actual composition as well.
