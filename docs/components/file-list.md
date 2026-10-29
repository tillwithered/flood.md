# FileList

A named native list of FileItem rows. It reuses DataList density and separators
inside a quiet file surface. This React component is distinct from the browser's
FileList returned by an input element.

```tsx
<FileList label="Attachments" density="compact">
  {attachments.map(file => <FileItem key={file.id} name={file.name}
    size={file.size} onRemove={() => remove(file.id)} />)}
</FileList>
```

Import FileList and FileItem from `@flood-md/react`. Keep `label` nonempty; the ref
points to `ul`. Render only FileItem or other native list items as direct children.
The host owns an empty-state message outside the list and determines when to hide
the empty list. `density`, `dividers` and native DOM attributes are inherited from
DataList. Use stable IDs rather than names as React keys: two files may share a
name. Sorting, drag/reorder, file selection and virtualized lists are not included.

Rows adapt to the list's available width, including inside a narrow card or
drawer on a wide screen. When space is constrained, media, copy and actions
stack in their native order; metadata and upload feedback can wrap. This preserves
readable content and reachable actions at enlarged text sizes without hiding a
primitive. Normal-width rows retain the compact inline presentation.

When composing FileInput, track the input's actual selection rather than assuming
that removing a display row also updates its native FileList. The input owns form
submission. Revoke any host-created object URLs when they are no longer needed.
