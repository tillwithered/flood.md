# Installation · 0.2.9

The commands below target version 0.2.9. Verify registry availability before installation; for local source evaluation, see the tarball instructions at the end of this guide.

Use Node.js 22.12 or newer and an existing npm-based React/Next.js project.
React 18.3/19 is supported; React 19 and Next.js App Router are integration targets.

## Connect once, import by name

The base set ships in one package. Set it up once for your project, then use
named imports such as `import { Button, Input } from "@flood-md/react"`.
There is no per-component `add` command or source-copy registry. You do not
repeat installation when you start using another component.

## Connect with the CLI

```sh
npx @flood-md/cli@0.2.9 init --dry-run
npx @flood-md/cli@0.2.9 init
```

The installer adds exact matching tokens, React and agent packages. It creates
`flood.json`, `flood/DESIGN.md` and `.agents/skills/flood-ui/SKILL.md`, preserves
host instructions and refuses existing files or linked destinations. It does
not modify application source. Import CSS once in the React entry or Next
`app/layout.tsx`, then wrap new UI in `FloodRoot`:

```tsx
import "@flood-md/react/styles.css";
import { Button, FloodRoot } from "@flood-md/react";

export function App() {
  return <FloodRoot><Button>Start something</Button></FloodRoot>;
}
```

Use a client component for callbacks, state or Field's function child. See
[components](components.md) and the [base inventory](base-components.md).
No Tailwind configuration or font CDN is needed. The foundations profile is dark
only; legacy theme behavior remains available outside `FloodRoot`.

```sh
npx @flood-md/cli@0.2.9 doctor
```

Doctor checks package versions and guide presence, not stylesheet imports or
application behavior. If your agent does not discover the installed skill,
reference `flood/DESIGN.md` from its existing instructions.

## Manual package installation

```sh
npm install --save-exact @flood-md/tokens@0.2.9 @flood-md/react@0.2.9 @flood-md/agent@0.2.9
```

Import the stylesheet and use `FloodRoot` as above. Manual installation does not
create the CLI's project configuration or copied instruction files; read the
matching agent package's guides directly or use CLI init in an unconfigured
project. All components ship together and are imported by name.

## Updates from 0.1.1

Upgrade tokens, React and agent together to the same exact version. Existing
controls outside `FloodRoot` retain their earlier theme behavior. Adopt the new
dark recipes explicitly by adding `FloodRoot`; move customization to scoped
`--flood-sys-*` roles instead of assuming old variables change the new profile.

Compare the new package's agent guides with customized local copies before
updating them. Update `flood.json` after a successful migration and run the
matching CLI doctor. Do not rerun init to overwrite existing instructions.
Run the host build/tests and browser checks after upgrading.

## Evaluate repository changes locally

For source development, run `npm ci` and `npm run build:packages`, then
`npm pack --workspace=@flood-md/tokens` (and likewise React/agent). Install the
three generated tarballs together using their local paths with
`npm install --save-exact`. This evaluates local source without implying that a
future version is already available from the registry.
