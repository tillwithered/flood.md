# MaskedInput

Use MaskedInput for a short value with a stable character layout. Use PhoneInput
for phone formats that depend on the chosen country or on an international
calling code. Use Input and host validation when a fixed character layout
would reject legitimate values.

```tsx
import {Field, MaskedInput} from "@flood-md/react";

export function MemberCode() {
  return <Field label="Member code" required>
    {field => <MaskedInput {...field} name="memberCode" mask="AAA-9999" />}
  </Field>;
}
```

A mask contains one or more slots. `9` accepts an ASCII digit, `A` an ASCII
letter, and `*` either. Other characters are literals. Escape a slot character
or an actual backslash with a backslash. Supply unformatted values to
`value`, `defaultValue` and `onValueChange`. The named form value is also
unformatted. The forwarded ref targets the editable native input.

A partial nonempty entry fails native validation by default. Allow partial
submission with `allowPartial`. The `required` attribute owns the empty-state
constraint. An uncontrolled field restores its initial value on a native form
reset. A controlled field displays the value accepted by the host.
