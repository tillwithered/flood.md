# RadioCard

A native radio input presented as a selectable card. Give exclusive alternatives
the same `name` and an enclosing Fieldset.

```tsx
<Fieldset legend="Plan">
  <Stack gap="2">
    <RadioCard name="plan" value="starter" label="Starter"
      description="For personal projects." metadata="Free" defaultChecked />
    <RadioCard name="plan" value="team" label="Team"
      description="For shared projects." metadata="$12 / month" />
  </Stack>
</Fieldset>
```

Import the composed components from `@flood-md/react` and shared styles once.
Native arrow navigation, mutual exclusion, checked/defaultChecked, onChange,
required validation and form reset remain available. Refs point to the real
input. Controlled groups must update all checked props from one host value.

Description, icon and metadata are optional noninteractive content. The visible
label names the input; supporting text describes it. Do not nest links or actions
inside the label. Keep external help or pricing links outside the choice card.

`readOnly` blocks changes while keeping the accepted selection in form data;
apply it consistently to every card in the group. Required validation is bypassed
for read-only cards. A disabled card is excluded from form data and navigation.
Compact/comfortable density changes padding without changing the choice model.
