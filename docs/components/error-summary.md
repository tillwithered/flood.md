# ErrorSummary

ErrorSummary displays validation errors supplied by the host and links each
message to its related field. It composes Flood Alert, Text, List and Link; it
does not validate a form or invent error messages. Available in the unpublished
0.2.7 candidate.

```tsx
import {ErrorSummary, Field, Input} from "@flood-md/react";

<>
  <ErrorSummary
    title="Check these details"
    description="Correct the fields below before continuing."
    errors={[
      {id: "email-required", fieldId: "email", message: "Enter your email address."},
    ]}
    autoFocus
  />
  <Field label="Email" id="email" required>
    {props => <Input {...props} name="email" type="email" />}
  </Field>
</>
```

Each error has a unique nonempty `id`, an exact `fieldId` and a nonempty `message`.
Several errors may point to the same field. Labels, ordering and validation are
host-owned. An empty `errors` array renders nothing; the ref is null while absent.
The div ref targets the named summary region, not the form or a field.

Links are real same-document fragment anchors. Normal activation attempts focus
on the exact element returned by `getElementById(fieldId)` and scrolls the focused
control into view. This also respects a Flood control's native focus bridge.
Use the actual field/control ID, not a guessed suffix or a decorative wrapper.
Modified clicks retain browser navigation. Missing or unavailable targets remain
native links; ErrorSummary does not query unsafe selectors, invent IDs, add
temporary tabindex attributes or force focus onto hidden/disabled fields.

`onSelect(error, event)` runs before focus handling. Call `event.preventDefault()`
to replace activation with host behavior, for example opening a collapsed
section before focusing its field. ErrorSummary never expands sections, changes
field values, submits the form or sends data.

`autoFocus` defaults to false. Opting in focuses the summary without scrolling
on its first nonempty appearance, when reappearing after an empty error list, or
when autoFocus changes from false to true. Updating messages while errors remain
visible does not take focus away from typing. A host can use the ref for a
specific submission lifecycle instead. Error updates do not automatically scroll.

`announcement` is `off` by default; `polite` and `assertive` opt into a live region
for host-requested updates. When `autoFocus` is true, focus feedback takes priority
and the live channel is suppressed to avoid announcing the same summary twice.
The inner Alert has no separate live announcement. DOM/live-region assertions
do not establish what every screen reader will speak; verify the host flow with
its supported assistive technology.

The title stays compact; optional description uses a smaller related gap than
the error list. The summary does not replace per-field names, descriptions,
`aria-invalid` or error associations. Hidden visual labels on target fields keep
their accessible names. RTL and long messages retain list/link semantics.
