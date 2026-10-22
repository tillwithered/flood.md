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
