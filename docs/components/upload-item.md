# UploadItem

A FileItem composition that displays host-controlled upload state and progress.
The top row combines the name with FileMeta (format and size). Upload status and
its progress bar share one compact line beneath it. In a constrained FileList,
the status and progress can wrap onto separate lines to preserve readable text
and a usable progress track; they remain StatusIndicator and Progress primitives.

```tsx
<UploadList label="Uploads">
  <UploadItem name="Cover.png" size={850000} state="uploading" progress={45}
    onCancel={() => cancelUpload()} onRetry={() => retryUpload()}
    onRemove={() => removeUpload()} />
</UploadList>
```

`state` is queued, uploading, success, error or cancelled. `progress` is a finite
number from 0 to 100; omit it for unknown progress. Progress renders only during
uploading. `error` explains a failure; labels supplies localized state/action text.
Do not announce every percentage update as a live alert. The host should announce
important batch or completion changes deliberately.

Actions are available only where applicable:

- Queued/uploading: cancel, if onCancel exists.
- Error/cancelled: retry and remove, if supplied.
- Success: preview, name link and remove, if supplied.

Callbacks request an operation; they do not change state or perform requests.
The host must abort its actual request, reconcile late responses and update the
row. Never infer successful persistence from 100%: switch to success only after
the application confirms completion. All file metadata/thumbnail behavior is
shared with FileItem. Render in UploadList or another native list; ref is `li`.
