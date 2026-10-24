# Customization · 0.2.3

Start with the neutral dark foundations profile. `FloodRoot` selects it locally;
version 0.2.3 does not provide a light foundations profile or a theme editor.
Use component props for everyday variations and semantic CSS roles for project
styling. Keep typography, spacing and finite geometry in relative units.

## Scope your overrides

Import Flood before your own stylesheet and put a class on the same root:

```tsx
import "@flood-md/react/styles.css";
import "./theme.css";
import { FloodRoot, Input, Field } from "@flood-md/react";

export function App() {
  return (
    <FloodRoot className="my-app">
      <Field label="Workspace name">
        {(props) => <Input {...props} />}
      </Field>
    </FloodRoot>
  );
}
```

This example uses Field's function child; in Next.js put it in a client component.
Import global styles once from the root layout.

```css
/* theme.css: an opt-in project override, not a new Flood default. */
.my-app[data-flood-foundations="neutral"][data-flood-theme="dark"] {
  --flood-sys-radius-field: 1.25rem;
  --flood-sys-type-body-size: 1rem;
}
```

The selector targets the same scope and has enough specificity to override the
profile declarations. A custom property set on an ancestor may be replaced by a
profile declaration on FloodRoot. Inspect computed values in the actual host app.

## Choose semantic roles

Use public `sys.*` roles, exposed in CSS as `--flood-sys-*`. Families include
surface, content, actions, fields, feedback, focus, typography, spacing, radii,
control sizes and motion. The [foundations guide](foundations.md) explains the
typed lookup, manifest and scope rules.

Reference (`ref.*`) values are internal building blocks. Their IDs are not a
public customization contract. Existing props such as Button size/variant,
Input controlSize and Surface elevation handle many variations without overrides.

## Preserve useful distinctions

Keep primary text readable, secondary text appropriate for its size, and necessary
field boundaries distinct from quiet decorative borders. Preserve visible keyboard
focus and native control behavior. Check text with WCAG and APCA guidance in the
actual composition; a token name or a screenshot does not certify accessibility.
Test narrow layouts, increased root text size, forced colors and reduced motion.

## Legacy themes outside FloodRoot

Earlier controls outside FloodRoot retain the legacy `--flood-*` variables and
OS-following light/dark behavior. Explicit `data-flood-theme="light"` or `"dark"`
selects that legacy theme. These variables do not configure the new foundations
profile, and changing FloodRoot's theme attribute does not create a supported
light foundations theme.

For an existing 0.1.x project, follow its installed guide and compare the
[migration instructions](installation.md#updates-from-011) before adopting
FloodRoot. Keep the exact Flood package versions aligned and verify your app
after changing CSS scope or customization.
