# Flood design system · 0.1.1

React + TypeScript. Next.js App Router is supported. Flood owns its components,
tokens, CSS and installer. Do not introduce another UI library or copy external components.

## Connect

Import `@flood-md/react/styles.css` once in the application entry or Next root layout.
Use `Button, Input, Textarea, Checkbox, Radio, Switch, Field, Link` from `@flood-md/react`.
Add `"use client"` to Next components that pass callbacks or use state. Flood's React
entry already has a client boundary. Keep server data fetching in server components.

## Compose

- Read installed `flood.json`; use docs matching its version. Run `flood doctor` if uncertain.
- Use semantic `--flood-*` tokens. Primitive values are authored in the tokens package.
- Parent layout owns gaps: 4/8 for controls, 12/16 within groups, 24 between groups,
  32/48 between sections. Avoid redundant cards and containers.
- One clear primary action per task. Use solid, outline and ghost button variants.
- Use a real link for navigation, a button for actions. Button defaults to type=button;
  set type=submit deliberately in forms.
- Labels are visible. Use Field's render callback to pass id, aria-describedby and
  aria-invalid to Input/Textarea. Checkbox, Radio and Switch require their label prop.
- Field takes a function child, so compose it inside a client component in Next.
- Radio groups share a name and have a fieldset/legend. Native inputs keep form semantics.
- Use `data-flood-theme="dark"` or `"light"` on the root; default follows system theme.
- Preserve focus, long content, native form submission and disabled behavior.
- Loading buttons keep meaningful text; loading disables the action and sets aria-busy.
- Never use color alone for state. Include an error message and a recovery action.
- Theme-specific customization uses semantic CSS variable overrides after the Flood import.

## Verify

Check keyboard use, labels, focus, empty/loading/error/disabled states, narrow screens,
light/dark themes and reduced motion. Do not fabricate a working command or release.
Never overwrite existing project instructions. Keep application data and side effects
in the host project; Flood provides UI only.

## Example (client component)

```tsx
"use client";
import { Button, Field, Input } from "@flood-md/react";

export function Profile() {
  return (
    <form onSubmit={(event) => event.preventDefault()}>
      <Field label="Name" hint="Shown on your profile">
        {(props) => (
          <Input {...props} name="name" autoComplete="name" required />
        )}
      </Field>
      <Button type="submit">Save changes</Button>
    </form>
  );
}
```
