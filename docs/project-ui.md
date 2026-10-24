# Project UI imports

Flood works with direct named package imports. If you prefer project-owned paths,
add a thin UI boundary such as `@/ui/button`:

```tsx
import { Button } from "@/ui/button";
```

The file name describes the UI responsibility. The package implementation remains
behind that boundary, so most application files do not need its vendor name.
This is optional. Both import styles use the same Flood component and receive
the same installed package updates.

## Connect the package once

Follow [Installation](installation.md) for your React/TypeScript or Next.js project.
All base components ship together in `@flood-md/react`; there is no per-component
add command or component source-copy registry. Importing another component does
not require another installation.

The CLI creates package configuration and agent instructions. It does not create
these adapters, rewrite application imports or overwrite existing source files.
Create and review the small files below in your own project. Preserve any existing
UI wrappers and aliases instead of replacing them blindly.

## Configure the project alias

For the `src/` structure used in this guide, merge the following into your existing
`tsconfig.json`. Keep the other compiler options and existing path mappings.

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Configure the same `@` alias in your bundler if it does not read TypeScript paths.
Next.js supports [TypeScript import aliases](https://nextjs.org/docs/app/getting-started/installation).
If your application uses another source folder or an existing alias, use the
matching paths consistently; adding this snippet alone does not move files.

## Add thin adapters

Create `src/ui/button.ts`:

```ts
export { Button } from "@flood-md/react";
```

The value re-export already preserves the component's inferred props and ref
types. If your application also imports the named public props type, expose it
explicitly from the same file:

```ts
export { Button } from "@flood-md/react";
export type { ButtonProps } from "@flood-md/react";
```

Create `src/ui/flood-root.ts` for the scope used by this example:

```ts
export { FloodRoot } from "@flood-md/react";
```

Other adapters follow the explicit component name and slug shown in the catalog:
`Input` uses `src/ui/input.ts`, `IconButton` uses `src/ui/icon-button.ts`.
Create only the files your application uses. Adapters contain re-exports; they
do not copy Flood's component implementation into your project.

## Import styles once

Create `src/ui/styles.css`:

```css
@import "@flood-md/react/styles.css";
```

Import that file once at the React application entry. In Next.js App Router, place
the import in `src/app/layout.tsx` (or `app/layout.tsx` if that is your structure):

```tsx
import "@/ui/styles.css";
```

Do not import both the adapter stylesheet and the package stylesheet throughout
individual component files. `FloodRoot` still explicitly selects neutral/dark;
the path name does not change the theme or styling contract.

## Use the project imports

```tsx
"use client";

import { Button } from "@/ui/button";
import { FloodRoot } from "@/ui/flood-root";

export function SaveAction() {
  return (
    <FloodRoot>
      <Button onClick={() => console.log("Saved locally")}>Save</Button>
    </FloodRoot>
  );
}
```

Use a client host component for state, callbacks or Field's function child.
The wrappers do not replace React, remove Next.js client boundaries or make the
components framework-independent. React 18.3/19 and Next.js support remain as
described in [Architecture](architecture.md).

## Updates and customization

Keep the installed Flood packages on the same exact version and follow their
matching release guidance. A re-export automatically uses the installed version;
upgrades still require application builds and behavior checks. The adapter path
does not automatically update packages, migrate renamed props or repair breaking
changes.

Add project defaults in the adapter later if needed, while preserving accessible
names, native props and refs. This creates a deliberate application policy layer;
it should not become a second copy of the design system. Keep styles and component
API expectations aligned with the package version your project actually installs.
