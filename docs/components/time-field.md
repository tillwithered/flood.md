# TimeField

A segmented **24-hour clock time** editor: Hour and Minute, optionally Second.
Values are plain strings, not dates or instants. It uses text spinbuttons rather
than the operating system's time picker. This is an unpublished source API.

```tsx
import { FloodRoot, TimeField } from "@flood-md/react";

export function MeetingTime() {
  return <FloodRoot>
    <TimeField label="Meeting time" name="meetingTime" defaultValue="09:30"
      min="09:00" max="18:00" step={300} description="24-hour clock, five-minute steps" />
  </FloodRoot>;
}
```

## Canonical values and precision

`precision="minute"` is the default: `HH:mm`, from `00:00` to `23:59`.
`precision="second"` requires `HH:mm:ss`, from `00:00:00` to `23:59:59`.
The empty string represents an empty editor. Props `value`, `defaultValue`, `min`
and `max` must use the exact declared precision and ASCII digits. Malformed prop
formats throw; an editable invalid/incomplete draft is preserved for correction.

The first version deliberately has no 12-hour/AM-PM mode, localized numeral system,
timezone, UTC conversion, daylight-saving rules or date-time composition. A time
such as `09:30` is not associated with a date or a zone. The host decides what it
means in its application. Changing precision requires matching values/bounds;
for an uncontrolled editor, remount when switching formats and initial values.

## Bounds and step

`min` and `max` are ordered, inclusive, same-day bounds. Overnight ranges such as
`min="22:00" max="02:00"` are not supported. Entering an out-of-range value creates
a correctable invalid draft; it does not silently clamp on text entry.

`step` is a positive safe integer **in seconds**, anchored to `min` if provided,
otherwise midnight. Default: 60 seconds for minute precision, 1 for second precision.
Minute precision requires steps divisible by 60. Typical examples are 60/300/900
for minutes and 1/15/30 for seconds. A value can match the format and bounds but
still be invalid because it is off the allowed step grid.

Arrow Up/Down moves by the focused segment's unit, or the configured step when
larger, and snaps in that direction to an allowed time. It clamps at the first/last
allowed value instead of wrapping through another day. Home/End moves the whole
time to the earliest/latest allowed value. For second precision, seconds can carry
into minutes and hours. The selected segment keeps focus during stepping.

## Controlled values, drafts and forms

`value` / `defaultValue` and `onValueChange` use canonical strings or `""`.
A complete allowed draft publishes its canonical time. An invalid, incomplete or
out-of-range/off-step draft publishes `""` and cannot submit the previous valid
value. Clearing all segments is distinct from an incomplete draft and is valid
only for an optional editor whose controlled host accepts the clear.

In controlled mode, a valid proposed time or empty value refused by the host
remains a native-invalid draft and submits an empty bridge value. On leaving the
field, such a refused complete/empty proposal reverts to the host-owned value.
Other incomplete drafts stay editable and invalid. This avoids displaying or
submitting a value that the host did not accept.

`name` submits one hidden canonical field. Visible segments are unnamed;
`form` associates all segments and the hidden value with an external native form.
Native reset restores the initial uncontrolled value, or the current controlled
value, after respecting a host-cancelled reset. No value-change callback is emitted
just because the host reset its form.

`required` means all visible segments form a complete allowed time. Native validity
is attached to Hour, so submitting invalid data focuses that editor. `messages`
can localize `required`, `invalid`, `outOfRange` and `stepMismatch`. A supplied
message must be nonempty. `readOnly` prevents editing while retaining form values;
`disabled` and inherited disabled fieldsets also exclude submission.

## Naming, keyboard and geometry

`label` is required even with `hideLabel`. `segmentLabels` localizes Hour, Minute
and Second; each segment name includes the field label. `description` and an exposed
validation message are associated with the group and each editor. `invalid`,
`status` and `aria-invalid` use existing Flood field semantics. The ref points to
the outer div; native div props and root handlers apply there.

Clicking the field padding/separators focuses the first empty segment, or the
last focused visible segment when complete. Readonly fields can still receive
focus; disabled fields cannot. Left/Right moves between visible segments with RTL-aware direction. A two-digit
entry advances to the next segment. Backspace on an empty segment moves to the
previous one. Modifier shortcuts and IME composition are preserved; host
`onKeyDown` runs before the segment model and can prevent default. A canonical time
pasted into any segment fills the entire field, using the declared precision;
host `onPaste` can cancel this first.

Field outlines, text, descriptions and radii use existing tokens. Focus uses the
same flush 2px accent perimeter. Coarse-pointer segment targets are at least the
shared touch size on both axes, without overlapping adjacent targets. Focus does
not change outer geometry. No new theme, motion system or dependency is involved.
