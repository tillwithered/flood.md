# UploadList

A named native list for UploadItem rows, using the same geometry as FileList.

```tsx
<UploadList label="Uploads">
  {uploads.map(upload => <UploadItem key={upload.id} name={upload.name}
    size={upload.size} state={upload.state} progress={upload.progress}
    error={upload.error} onCancel={() => cancel(upload.id)}
    onRetry={() => retry(upload.id)} onRemove={() => remove(upload.id)} />)}
</UploadList>
```

Import UploadList and UploadItem from `@flood-md/react`. Each row keeps its own
stable ID and state. The ref points to `ul`; density/dividers match FileList.
Do not add a blanket live region around a list of frequently changing progress
bars. Summarize completion and failure at the host boundary instead.

The list does not create a queue, manage concurrency, fetch, retry or cancel
requests. Permissions, credentials, storage and object URL lifetime remain in the
application. Display an empty state outside the list when there are no uploads.
