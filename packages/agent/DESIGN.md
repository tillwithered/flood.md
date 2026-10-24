# Flood design system · 0.2.2

Read project-root flood.json and installed declarations with this contract.
The source bundle's SKILL.md routes to focused composition, accessibility,
customization and verification references. Its routing matrix names prerequisites
and sources of truth; flood/rules.json indexes observable checks. Read only the
relevant reference. This expanded bundle is unreleased beyond published 0.2.2;
existing installations keep their matching guide set.

React + TypeScript and Next.js App Router. Use this guide with matching installed
Flood packages and flood.json. The source repository's release status does not
grant permission to publish or assume a version is available on npm.

Repository-source note: this guide also marks the unreleased Select/ScrollArea
additions and layout refinements. Published 0.2.2 exports neither. Confirm
the matching installed declarations before using source-only additions.

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
- Use source ScrollArea for deliberately constrained overflow, with a named
  viewport and explicit height/maxHeight for vertical content. Ref/style/native
  div props target the native viewport. Overlay rails sit above content without
  a gutter; default contentInset="scrollbar" protects text with inner padding.
  Use explicit "none" only with adequate host padding or intentional overlap.
  Keep wheel/touch/keyboard behavior and native
  forced-colors fallback. Confirm this export exists in installed declarations.
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
- Input/Textarea and source Select use controlSize sm/md/lg/xl. Preserve native
  numeric size props. Select accepts native option/optgroup children and an
  HTMLSelectElement ref. Single selection uses Flood's custom trigger/listbox,
  with a native select form-value/ref bridge; never replace it with the OS popup.
  Multiple or size>1 remains an inline native listbox, without a dropdown arrow.
  For single selection, arrows/Home/End highlight, Enter/Space/Tab commits, and
  Escape cancels; typeahead matches option labels. Preserve trigger focus and
  aria-activedescendant rather than moving focus into each option. The ref remains
  HTMLSelectElement; its focus() targets the trigger. In onChange, read the event's
  currentTarget as the native select; retain name/required/defaultValue/form reset.
  Supply ordinary text-labeled options/optgroups, not interactive option content.
  Field required forwards native required and adds a visible marker. Spread all
  callback props to preserve id, aria-describedby and aria-invalid. describedBy
  merges external description IDs with hint/error IDs.
- Checkbox, Radio and Switch require visible labels and preserve native forms.
  Radio groups share a name and belong in a host fieldset/legend. Readonly and
  disabled are different states; explain unavailability outside disabled controls.
  Select has no native readOnly state. Do not block its keyboard events to fake one.
- IconSlot adapts host SVG artwork; without label it is decorative. IconButton
  requires a nonempty action label. Retain the external icon pack's license.
- Surface elevation overlay is visual only: no portal, focus trap, dismissal or
  dialog semantics are implied. Layer tokens do not implement an overlay manager.

## Layout rules

- Keep Button width intrinsic to its content. Use Inline for sibling actions;
  opt into full width only for a deliberate host layout with inlineSize:100%.
  Do not stretch every action because its parent is a grid or vertical stack.
- Inside a choice, keep the indicator a non-shrinking 1.125rem square and its
  visible label .5rem away (8px at the reference root). Custom Checkbox/Radio
  appearance still uses real native inputs; forced colors restores native marks.
- Separate independent choices with Inline gap="4" (1rem/16px at the reference
  root). Inline's default gap="2" remains unchanged. Internal label gap and
  parent group gap are separate decisions; do not conflate them.
- Center-align choice rows; keep each label close to its indicator. Do not use
  space-between inside a Checkbox/Radio/Switch to push the label to the other edge.
- Give form/Field parents a responsive width such as min(100%,26rem), with
  min-inline-size:0 in grid/flex contexts. Input/Textarea/Select fill that width.
  Check the actual wrapper tree after adding FloodRoot or Surface; do not leave
  fields trapped in an intrinsic-width wrapper.
- Build hierarchy with Heading, body/compact text, Field labels and supporting
  helper text. Use gap4 within groups, gap6 between related groups, and wrap
  action rows. Add surfaces for meaningful grouping, not around every control.
- Keep geometry in rem, line-height unitless and tracking em; preserve the host
  root size. Check320px widths, enlarged text and user text-spacing overrides
  instead of shrinking type or clipping labels to make the layout fit.

For inset shapes that share a contour (Select popup and highlighted rows),
derive inner radius as max(0, outer radius - padding - border width). Keep this
local to the composition; independent nested actions keep their own radii.

## Tokens and accessibility

Use semantic --flood-sys-* roles inside FloodRoot; values are authored only in
the tokens package. Apply overrides on the scope element after the stylesheet.
Nested token scopes repeat both data-flood-foundations=neutral and
data-flood-theme=dark attributes. Preserve independent surface, content, boundary,
selection, feedback and focus roles rather than hardcoding component colors.

Default controls use the quiet field.border role, without a second bottom edge or
inset shadow. Keep field.boundary as an explicit stronger alternative; do not apply
it to every ordinary control. Quiet defaults do not establish 3:1 non-text
contrast. Focus is 2px
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
