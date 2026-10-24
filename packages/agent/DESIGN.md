# Flood design system · 0.1.1

This header describes the published 0.1.1 contract. The final section documents
unreleased next-minor source additions; do not assume they exist in 0.1.1 installs.

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

## Unreleased next minor: dark foundations

These source additions target the next aligned 0.2.0 release. Package manifests
still read 0.1.1. Do not install or advertise 0.2.0 until publication is verified.
Keep the preceding legacy API for projects using published 0.1.1.

- Import the same styles.css and wrap new compositions in FloodRoot for explicit
  neutral/dark scope. No new light foundations profile exists in this slice.
- Use Text sizes body/compact/label/helper and Heading sizes large/page/section.
  Choose semantic heading level independently of visual size. Text's label size
  does not create a form association; use Field for labeled inputs.
- Stack/Inline gap and Surface padding accept string keys 0/1/2/3/4/6/8/12.
  These are rem values; never impose a fixed root font size. Inline wraps.
- The dark profile uses locally bundled Inter with its original OFL notice.
  Preserve the license. Tracking and line-height follow typographic roles;
  do not tighten every element through a global letter-spacing override.
- Button adds subtle and sizes 2xs/xs/sm/md/lg/xl/2xl. Standalone secondary
  actions normally use subtle; reserve ghost for an evident parent context.
- Input/Textarea use controlSize sm/md/lg/xl. Preserve Input's native size prop.
  Field required forwards required and adds a marker; describedBy merges external
  IDs with hint/error associations. Spread all function-child control props.
- IconSlot is a host SVG adapter, decorative without label. IconButton requires
  a nonempty action label. Retain any external icon pack's license separately.
- Surface overlay is visual elevation only; it does not provide modal semantics,
  portals, keyboard dismissal or focus trapping.
- Preserve the quiet field outline plus its stronger necessary boundary. Focus
  is 2px without offset; its pink default is provisional and configurable.
  Do not remove focus when invalid or reduce entire component opacity.
- Decorative dividers, necessary boundaries and text have different contrast
  roles. Evaluate text with WCAG and supplementary APCA size/weight guidance;
  never treat APCA as full certification or apply text thresholds to borders.
- Verify root scaling, text-spacing overrides, narrow layouts, keyboard,
  forced-colors, reduced motion and focus/invalid combinations in the host app.
  Existing Checkbox/Radio/Switch keep native form semantics and visible labels.
