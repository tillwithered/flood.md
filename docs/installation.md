# Installation

Before the initial npm publication, use a local checkout (`npm ci && npm run build`)
and `node packages/cli/bin/flood.mjs --help`. Public commands require published npm
packages; scope ownership must be confirmed on the npm account first.

After publication, in an existing React or Next.js npm project:

```sh
npx @flood-md/cli@0.1.0 init --dry-run
npx @flood-md/cli@0.1.0 init
```

Import `@flood-md/react/styles.css` once at the application root. For Next.js use
`app/layout.tsx` (or `src/app/layout.tsx`). No Tailwind configuration is needed.

Read `flood/DESIGN.md`; add its path to your agent's entry instructions if the
client does not discover `.agents/skills`. Existing AGENTS.md is never replaced.

## Manual

```sh
npm install --save-exact @flood-md/tokens@0.1.0 @flood-md/react@0.1.0 @flood-md/agent@0.1.0
```

Use guide files from the installed agent package. `flood doctor` requires the CLI
generated configuration, and does not inspect your stylesheet imports.

## Updates

Read the changelog, upgrade the three core packages to the same exact release,
review updated agent docs, and update `flood.json` after successful migration.
The CLI deliberately has no destructive `update` command in v0.1. Major changes
need explicit migration notes. `add` is unnecessary: all eight core components
ship in the React package and are imported by name.
