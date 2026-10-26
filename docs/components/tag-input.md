# TagInput

A free-form text editor that commits strings as removable tags. Use MultiSelect
when users choose IDs from a known option list; TagInput creates new values and
has no suggestion popup.

This API is part of the unpublished 0.2.7 source candidate. Package publication
and the website installation gate are verified separately.

```tsx
import { FloodRoot, TagInput } from "@flood-md/react";

export function Topics() {
  return <FloodRoot>
    <TagInput label="Topics" name="topics" defaultValue={["Design"]}
      delimiters={[",", ";"]} placeholder="Add a topic" />
  </FloodRoot>;
}
```

## Values and editing

`value` / `defaultValue` are string arrays; `onValueChange` receives a new array.
Values are trimmed, empty entries removed and exact case-sensitive duplicates
collapsed in first-occurrence order. `Design` and `design` are distinct values.
Controlled values remain host-owned; a refused addition leaves the text draft
available for correction/retry. Reset does not replace controlled values.

Enter commits a nonempty draft. A configured single-character delimiter commits
completed fragments; the default is a comma. `delimiters={[]}` uses Enter only.
Pasting a list containing delimiters or line breaks commits its nonempty parts,
including the final part. A plain-text paste without separators remains ordinary
text editing. No delimiter commit is performed while composing with an IME.
Blur does not commit a draft. No CSV quoting or application validation is implied;
use a host parser/validation flow for quoted values, email rules or domain IDs.

## Keyboard and accessibility

- The input is the regular Tab stop. An empty-input Backspace removes the last tag.
- Left Arrow at the start of the editor focuses the last tag's remove button
  (Right Arrow in RTL). Arrows traverse remove buttons and return to the input.
- A focused remove button supports native Enter/Space, Delete and Backspace.
  Escape returns to the editor. Modifier shortcuts and composition are preserved.
- `label` is required even with `hideLabel`. Label and editor remain associated;
  committed values are included in the editor's accessible description.
- `removeLabel` localizes the removal action prefix. `requiredMessage` localizes
  the native validation message. Both must be nonempty.

## Forms and states

`name` submits one repeated hidden field per committed tag, in order. The unnamed
visible editor does not submit an uncommitted draft. `form` associates editor and
values with an external form. An ordinary native reset restores initial tags and
clears the draft for uncontrolled usage; a cancelled reset changes nothing.

`required` means at least one **committed** tag, not merely typed draft text. Native
validation focuses the editor and exposes the validation message. `readOnly`
prevents additions/removals and hides removal actions, while retaining values for
submission. `disabled` and inherited disabled fieldsets prevent editing and native
submission. Existing `status`, `invalid`, `aria-describedby`, `controlSize` and
input focus/paste/key handlers remain available; a host-cancelled event is respected.

The first version intentionally excludes server saving, suggestions, drag reorder,
CSV parsing, async tag validation and a generic clear-all action. Geometry reuses
Flood Tag, Input and field tokens, including nested radii and touch targets.

Controlled acceptance may reorder the requested tags: once every requested value
is present, the matching submitted draft clears. A refused or incomplete response
retains the draft, and delayed acceptance never replaces text entered since that
request. The host owns tag order; Flood does not sort it.
