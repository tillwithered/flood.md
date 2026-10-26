# Editable

Editable presents committed text as a compact edit action. Activation opens a
private draft with a native text input. Enter or Save commits; Escape or Cancel
restores the latest committed value. IME composition does not interpret Enter or
Escape as editor commands.

```tsx
<Editable label="Project name" name="projectName" defaultValue="Flood" />
```

`value` / `onValueChange` own committed text; the callback only runs for a changed
commit. `editing` / `onEditingChange` independently own whether editing is open.
Uncontrolled equivalents are `defaultValue` and `defaultEditing`. An externally
changed value does not overwrite an active draft. Cancel reads the latest host
value, and a controlled host may refuse a value or editing request. `onCommit`
runs for a deliberate commit (including unchanged text); `onCancel` runs for user
cancellation. Async saving, failure messages and validation belong to the host;
these callbacks are not awaited.

`blurAction` is `commit` by default, or `cancel` / `none`. Moving between the input
and its action buttons is internal focus movement, not an outside blur. Outside
blur does not steal focus back. Enter/Escape and explicit action buttons restore
the preview when editing actually closes. Set `showActions={false}` when keyboard
and blur policies are enough for the intended interaction.

`label` names the active input; `hideLabel` preserves that name. Translate
`editLabel`, `saveLabel`, `cancelLabel` and `placeholder`. `readOnly` shows a native
read-only field so users can focus/select/copy; `disabled` blocks activation.
`controlSize` uses the existing sm/md/lg/xl field geometry and semantic roles.
The root ref targets its native div. `inputRef` targets the input while editing
(or read-only), and is null while only the preview is rendered. Native root props
such as id, dir, lang, hidden and ARIA descriptions remain available.

With `name` / `form`, one hidden native form field submits committed text, never
an uncommitted draft. Uncontrolled form reset restores the initial value and
requests editing to close without emitting commit/cancel/value callbacks. The host
owns required/validation rules and form submission. This is single-line editing,
not a contenteditable rich editor, autosaving service or an authentication field.

Compatible source addition intended for the next aligned release after 0.2.6;
registry availability is verified separately. No new tokens, themes, animation
system or component-library dependencies are introduced.
