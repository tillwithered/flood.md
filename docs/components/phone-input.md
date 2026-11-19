# PhoneInput

Use PhoneInput to enter a phone number with a country chooser and live
formatting. Use `defaultCountry` or `country` to interpret a national number.
A leading plus switches to international format and can update the chooser
when its country resolves. `countries` limits the chooser options.

```tsx
import {Field, PhoneInput} from "@flood-md/react";

export function ContactPhone() {
  return <Field label="Phone number" required>
    {field => <PhoneInput {...field} name="phone" defaultCountry="GB"
      countries={["GB", "KZ", "US"]} autoComplete="tel" />}
  </Field>;
}
```

Supply dialable digits to the controlled value, including a leading plus
when applicable. `onValueChange` reports the editable draft and any valid
`details.e164`. A named native form submits the accepted E.164 value.
Incomplete numbers remain available for correction and fail native validation.
The forwarded ref targets the editable number input. Localize the chooser
names with `locale` and its labels with `labels`.

Formatting and numbering-plan validation use local metadata. The result does
not establish that a number exists, belongs to the person, or can receive a
message. Account verification remains an application workflow.
