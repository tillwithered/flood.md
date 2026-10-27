# ListBox

Use ListBox for application option selection, with a visible or visually hidden
accessible label. Options retain their disabled state and optional descriptions.

```tsx
<ListBox label="Project tools" name="tools" multiple required
  description="Choose at least one tool."
  options={[{value: "design", label: "Design"}, {value: "code", label: "Code"}]} />
```

`required` participates in native form validation for single and multiple
selection. Empty selection is invalid; `requiredMessage` localizes its error.
Submission or leaving the list exposes the error and associates it with the list.
Native invalid reporting focuses the list, rather than a hidden proxy. Only
accepted option values are submitted, once per selected value. The validation
control has no submitted name. `form` supports an external owner form.

`description` provides stable supporting text. `message` supplies feedback, with
`status="error" | "warning" | "success" | "info"` controlling its tone and the
quiet field border. `invalid` or `aria-invalid` takes precedence over positive
status. These visual flags alone do not block native form submission; use
`validationMessage` for a host-owned blocking constraint and clear it in the host
when corrected. Native required feedback takes precedence over ordinary messages.

Readonly prevents edits and bypasses validation while preserving accepted values.
Disabled fields and disabled fieldsets exclude values from submission. Reset
restores uncontrolled defaults, preserves controlled ownership and respects a
cancelled native reset. Refused controlled changes do not become selected values.

`selectionBehavior="automatic"` keeps single selection following keyboard focus.
Use `selectionBehavior="manual"` when arrows should only move focus and Enter,
Space or a click should confirm. Multiple selection keeps its explicit behavior.
TimePicker composes the manual mode so navigation does not prematurely commit.

`appearance="plain"` removes the list's surface and internal scrolling when a
parent Popover/ScrollArea owns these roles. Options, selection indicators,
accessible naming and keyboard focus remain. The default `surface` appearance
preserves standalone styling and scrolling.
