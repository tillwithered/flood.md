# Layout and composition

Flood provides controls and small layout primitives. The application owns page
width, grouping and responsive composition. Use the rules below inside
`FloodRoot` instead of fixing each screen with unrelated spacing values.

## Separate the three kinds of size

A control's `size` or `controlSize` selects its minimum height, typography and
internal padding. Its width is a separate layout decision. The root font size
is a user or host preference, not a density setting.

- Buttons normally fit their content. Put sibling actions in `Inline`; do not
  make every action fill a form or grid cell. Current source styles keep Button
  width intrinsic and cap it at the available width.
- Input, Textarea and Select fill the width their parent assigns. Give their
  form or Field a responsive width; do not size each field independently.
- Checkbox and Radio indicators keep a `1.125rem` square footprint and do not
  shrink in a flex row. A long label wraps beside the indicator rather than
  compressing it. Switch has its own track geometry.

For a deliberate full-width action, opt in at the application boundary:

```tsx
<Button style={{ inlineSize: "100%" }}>Continue</Button>
```

Use this for a specific layout, not as a global rule for all buttons. A long
translation may increase a control's height; do not hide overflowing labels.

## Keep labels close and groups distinct

The indicator and its visible label are one choice control: their gap is
`.5rem` (8px at the reference root). Do not add `justify-content: space-between`
or a large spacer between a checkbox/radio/switch and its own label.

The gap between separate choices should usually be `1rem` (16px at the reference
root). These two gaps serve different purposes. Preserve `Inline`'s default
`gap="2"` for compatibility; choose `gap="4"` explicitly for a choice group:

```tsx
<Inline gap="4" align="center">
  <Checkbox label="Product updates" name="updates" value="yes" />
  <Checkbox label="Weekly summary" name="summary" value="yes" />
</Inline>
```

Keep row alignment centered. Do not align native indicators to the font baseline
or allow grid stretch to change their shape. A choice's complete label row is a
click target; its visible glyph and its target area are different dimensions.
Compact neighboring targets must remain distinct and usable.

For a radio group, the host provides a real fieldset, legend and shared name:

```tsx
<fieldset className="preference-group">
  <legend>Visibility</legend>
  <Inline gap="4" align="center">
    <Radio label="Private" name="visibility" value="private" defaultChecked />
    <Radio label="Public" name="visibility" value="public" />
  </Inline>
</fieldset>
```

```css
.preference-group {
  min-inline-size: 0;
  margin: 0;
  padding: 0;
  border: 0;
}
.preference-group legend {
  margin-block-end: var(--flood-sys-space-2);
}
```

## Give forms a responsive parent width

Use rem for the preferred width and percentages for the available space. A
`26rem` form can become narrower on a small viewport and follows root scaling:

```css
.profile-form {
  inline-size: min(100%, 26rem);
  min-inline-size: 0;
}
```

Keep the width on the actual form/field container. Adding a wrapper changes
which element a direct-child selector reaches; check the rendered field after
introducing a scope, Surface or grid cell. Avoid a narrow intrinsic wrapper
around a full-width textarea.

```tsx
"use client";

import { Button, Field, FloodRoot, Heading, Inline, Input, Stack, Text } from "@flood-md/react";

export function ProfileForm() {
  return (
    <FloodRoot>
      <form className="profile-form" onSubmit={(event) => event.preventDefault()}>
        <Stack gap="6">
          <Stack gap="2">
            <Heading level={1}>Profile</Heading>
            <Text as="p" size="compact" tone="subtle">How your team sees you.</Text>
          </Stack>
          <Field label="Display name" hint="Visible to your team" required>
            {(control) => <Input {...control} name="displayName" autoComplete="name" />}
          </Field>
          <Inline gap="2" align="center">
            <Button type="submit">Save changes</Button>
            <Button type="reset" variant="subtle">Reset</Button>
          </Inline>
        </Stack>
      </form>
    </FloodRoot>
  );
}
```

Import the package stylesheet once at the application entry. In Next.js, keep
Field's function child and event handlers in a client component. See
[Installation](installation.md) and [Components](components.md).

## Establish hierarchy before adding containers

Use Heading for section semantics, compact body text for supporting explanations,
Field for the visible label and associations, and helper text for supplementary
details. Text's label appearance alone does not create a form label.

Start with `Stack gap="4"` within a group and `gap="6"` between related groups;
increase separation for independent sections. Use `Inline` with wrapping for
actions. Add Surface for an actual surface boundary, not around every field.
Prominence comes from solid/subtle variants, not from stretching one button.

For a responsive form grid, let CSS determine how many columns fit:

```css
.profile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: var(--flood-sys-space-4);
}
```

Do not impose `html { font-size: 16px }`, shrink type to hide overflow, or stretch
the indicator to make a row fit. Check narrow widths, root text scaling, user
text-spacing overrides and long translations. Preserve visible focus, native
form semantics, forced colors and reduced motion while changing composition.

## Source additions and compatibility

Select's custom single-choice popup and the refined intrinsic sizing/custom choice appearance are
current repository source changes, not a claim that published npm `0.2.2` was
modified. Use the guide matching your installed declarations. The examples with
Input, Button, Inline and native form props also work without Select; wrapping
actions in Inline provides an explicit composition boundary for earlier installs.
