# Flood design system · 0.2.2

React + TypeScript and Next.js App Router. Use this guide with matching installed
Flood packages and flood.json. The source repository's release status does not
grant permission to publish or assume a version is available on npm.

## Connect

Import @flood-md/react/styles.css once in the application entry or Next root
layout. Wrap new interfaces in FloodRoot, which explicitly selects neutral/dark.
FloodRoot does not mutate the document theme. This foundations profile is dark
only. Legacy controls outside FloodRoot retain their earlier light/dark behavior.
Add "use client" to host components using callbacks, state or Field's function
child. Keep server data fetching in server components.

## Compose

- Use Text sizes lead/body/compact/label/helper and Heading sizes display/large/page/section.
  Heading level 1–6 sets semantics independently of visual size. Text label size
  does not associate a form control; use Field.
- Reserve display for a marketing headline; preserve normal page/section sizes
  inside product UI. Hosts own responsive composition.
- Use CodeSnippet with a code string and optional action slot for commands or
  short examples. The host owns clipboard permission, feedback and errors;
  selectable wrapped code remains available when copying fails.
- Use Stack and wrapping Inline. Gap and Surface padding keys are strings
  0/1/2/3/4/6/8/12. Parent layout owns spacing; avoid redundant cards and borders.
- Sizes use rem, line heights ratios, tracking em. Do not impose a fixed root
  font size or a global letter-spacing override. Inter is bundled locally with
  its original OFL license; preserve the notice when distributing it.
- Use solid for the main action and subtle for standalone secondary actions.
  Ghost requires a clear parent context such as a toolbar. Button sizes are
  2xs/xs/sm/md/lg/xl/2xl; md is default. Small sizes need contextual touch checks.
- Use Link for navigation and Button for actions. Button defaults to type=button;
  set type=submit deliberately. Loading disables activation and sets aria-busy;
  retain meaningful visible text and let the host announce completion.
- Input/Textarea use controlSize sm/md/lg/xl. Preserve Input's native size prop.
  Field required forwards native required and adds a visible marker. Spread all
  callback props to preserve id, aria-describedby and aria-invalid. describedBy
  merges external description IDs with hint/error IDs.
- Checkbox, Radio and Switch require visible labels and preserve native forms.
  Radio groups share a name and belong in a host fieldset/legend. Readonly and
  disabled are different states; explain unavailability outside disabled controls.
- IconSlot adapts host SVG artwork; without label it is decorative. IconButton
  requires a nonempty action label. Retain the external icon pack's license.
- Surface elevation overlay is visual only: no portal, focus trap, dismissal or
  dialog semantics are implied. Layer tokens do not implement an overlay manager.

## Tokens and accessibility

Use semantic --flood-sys-* roles inside FloodRoot; values are authored only in
the tokens package. Apply overrides on the scope element after the stylesheet.
Nested token scopes repeat both data-flood-foundations=neutral and
data-flood-theme=dark attributes. Preserve independent surface, content, boundary,
selection, feedback and focus roles rather than hardcoding component colors.

The quiet field outline needs its stronger necessary boundary. Focus is 2px
without offset; the configurable pink default is provisional. Keep focus visible
with invalid and selected states. Do not mute a whole component through opacity
to reduce one border. Never convey error, selection or status by color alone.

Evaluate text using actual size, weight, font and neighboring surface: WCAG plus
supplementary APCA guidance. Do not apply text thresholds to decorative lines or
claim full WCAG/APCA certification from a color-pair calculation. Small helper
text is supporting content, not the sole presentation of required instructions.

## Verify

Check keyboard, labels, focus/invalid combinations, required fields, native form
submission, loading/disabled/readonly, root scaling, text-spacing overrides,
narrow screens, long content, forced colors and reduced motion. Keep application
data and side effects in the host project. Flood owns UI only.

Read flood.json and use the matching CLI when running doctor. Doctor checks
versions/instruction files, not CSS imports or completed UI behavior. Do not
overwrite host instructions or fabricate installation/publication success.

## Example

```tsx
"use client";
import { Button, Field, FloodRoot, Heading, Input, Stack } from "@flood-md/react";

export function Profile() {
  return (
    <FloodRoot>
      <Stack gap="6">
        <Heading level={1}>Profile</Heading>
        <form onSubmit={(event) => event.preventDefault()}>
          <Stack gap="4">
            <Field label="Name" required hint="Shown on your profile">
              {(props) => <Input {...props} name="name" autoComplete="name" />}
            </Field>
            <Button type="submit">Save changes</Button>
          </Stack>
        </form>
      </Stack>
    </FloodRoot>
  );
}
```
