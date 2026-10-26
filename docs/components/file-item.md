# FileItem

A display row with a file name, optional byte size, type, thumbnail and actions.
Render inside FileList or another native list. The ref points to the real `li`.

```tsx
<FileList label="Attachments">
  <FileItem name="Brand guidelines.pdf" size={2400000} mimeType="PDF"
    onPreview={() => openPreview()} onRemove={() => removeAttachment()} />
</FileList>
```

Import the components from `@flood-md/react`, shared styles once and render inside
FloodRoot. `size` is a finite nonnegative byte count; default formatting uses SI
units and `lang`. `formatSize` overrides the visible text. `mimeType` is supplied
by the host, not inferred or verified. `thumbnail` is decorative noninteractive
React content; an existing Image with empty alt is suitable.

`href` makes the name a native Link; `download` requests a download using the file
name. Browser origin and response headers still govern download behavior.
`onPreview` and `onRemove` expose independent icon actions only when supplied.
`disabled` blocks those actions and suppresses the name link. `labels` localizes
action prefixes; accessible names include the file name. `description` supplies
optional supporting content without reserving an empty row.

The host owns file identity, permissions, reading, removal, URLs and storage.
No File object, fetch, object URL, MIME inspection or native form value is created.
Use FileInput for native file submission. After removing a focused row, move focus
to a surviving action or the file picker at the host boundary.
