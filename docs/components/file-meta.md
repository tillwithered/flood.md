# FileMeta

A compact neutral Badge composition that keeps file format and size in one chip.

```tsx
<FileMeta format="PDF" size={2400000} />
```

Import FileMeta and the shared stylesheet from `@flood-md/react`; use inside
FloodRoot. `format` is a nonempty display label. `size` is a finite nonnegative
byte count, formatted with SI units and the optional native `lang` attribute.
`formatSize` customizes the size text. Refs point to the span.

Either format or size may be omitted. The separator appears only when both are
present; neither value means no chip is rendered. It is static metadata, not a
button. FileItem and UploadItem reuse it beside their filename and allow the
heading to wrap when necessary. The chip remains one semantic Badge, but its
format/size content can wrap within a constrained width instead of clipping.

A format label does not prove MIME type, file validity or safety. The application
supplies trusted metadata. FileItem may use a filename extension as a display hint
when no explicit format was supplied; this component itself performs no detection.
