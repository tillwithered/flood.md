# ImagePreview

A single-image viewer composed from Dialog, Image, Spinner, Text and Link.

```tsx
<ImagePreview title="Cover image" src={previewUrl} alt="Project cover artwork"
  caption="Cover for the project." downloadHref={downloadUrl}
  trigger={props => <Button {...props} variant="subtle">Preview image</Button>} />
```

Import the composed components and stylesheet from `@flood-md/react`. The ref is
the real dialog. Open/defaultOpen/onOpenChange, trigger, closeLabel and outside
dismissal follow Dialog. Native modal focus containment, Escape and trigger focus
restoration are reused. Content mounts only while open, so no image request is
started by this component while closed. Closing unmounts content; the browser may
reuse its image cache on reopening.

Provide explicit alt text (empty only for decorative imagery). The image fits
inside the viewport without cropping. Spinner indicates loading and errorLabel
replaces a failed image. Changing src resets the loading state. Optional caption
and native download link remain separate from the image. Loading, error and
download labels are localizable. This first version has no zoom, pan or gallery.

The host supplies trusted image/download URLs and controls their permissions and
lifetime. This viewer does not create object URLs, read File contents, generate
thumbnails or issue upload requests. Keep a blob URL alive while the viewer uses
it, then revoke it at the owning application boundary.
