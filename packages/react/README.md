# @flood-md/react

Original Flood components for React 18.3/19 and Next.js.

```tsx
import "@flood-md/react/styles.css";
import { Button, Field, Input } from "@flood-md/react";
```

Exports: Button, Input, Textarea, Checkbox, Radio, Switch, Field, Link and their
TypeScript prop types. Button variants: solid/outline/ghost; sizes: sm/md.
Loading buttons disable activation. Choice components require a visible label.
Field uses a function child: `{props => <Input {...props} />}` to wire label and
description associations. Compose Field in a client component in Next.js.

Import CSS once in Next app/layout.tsx. Add `"use client"` to host components with
callbacks/state. Override semantic --flood-* variables after the CSS import.
Native HTML props and refs are forwarded. No Tailwind or third-party UI dependency.

## Unreleased next minor: dark foundations

The following source additions target the next aligned `0.2.0` release.
Manifests remain `0.1.1`; these additions have not been published to npm.
The API described above remains the published 0.1.1 contract.

```tsx
import "@flood-md/react/styles.css";
import { Button, FloodRoot, Heading, Stack, Text } from "@flood-md/react";

export function Welcome() {
  return (
    <FloodRoot>
      <Stack gap="4">
        <Heading level={1}>Welcome</Heading>
        <Text as="p" size="compact" tone="subtle">Your workspace is ready.</Text>
        <Button>Open workspace</Button>
      </Stack>
    </FloodRoot>
  );
}
```

FloodRoot explicitly selects neutral/dark. The new profile bundles local Inter
with its original SIL OFL license, uses rem geometry and supplies semantic colors,
typography, spacing, radii and control/icon sizes. It has no new light variant;
existing controls outside FloodRoot retain legacy theme behavior.

New exports: FloodRoot, Text, Heading, Stack, Inline, Surface, Divider, IconSlot
and IconButton. Button adds subtle and seven sizes 2xs/xs/sm/md/lg/xl/2xl.
Inputs/Textareas add controlSize sm/md/lg/xl without replacing Input's native size.
Field required forwards native required and adds a marker; describedBy merges
external IDs with the generated hint/error associations. Keep spreading the
function-child props. IconSlot adapts host SVG icons without a glyph dependency.

See [component usage and accessibility constraints](../../docs/components.md),
[architecture](../../docs/architecture.md) and [Inter provenance](src/fonts/README.md).
The focus accent is provisional and configurable. Verify field boundaries,
text contrast, touch targets and keyboard behavior in actual host layouts.
