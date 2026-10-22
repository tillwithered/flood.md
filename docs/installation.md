# Installation

Use Node.js 22.12 or newer and an existing React or Next.js npm project. React
18.3/19 is accepted by peer dependencies; React 19 and Next.js App Router are
the current CI integration targets.

```sh
npx @flood-md/cli@0.1.1 init --dry-run
npx @flood-md/cli@0.1.1 init
```

Import `@flood-md/react/styles.css` once at the application root. For Next.js use
`app/layout.tsx` (or `src/app/layout.tsx`). No Tailwind configuration is needed.

Read `flood/DESIGN.md`; add its path to your agent's entry instructions if the
client does not discover `.agents/skills`. Existing AGENTS.md is never replaced.

## Manual

```sh
npm install --save-exact @flood-md/tokens@0.1.1 @flood-md/react@0.1.1 @flood-md/agent@0.1.1
```

Use guide files from the installed agent package. `flood doctor` requires the CLI
generated configuration, and does not inspect your stylesheet imports.

## Updates

Read the changelog and choose a published target version. Upgrade tokens, React
and agent to that same exact version with npm install --save-exact. Use the CLI
for that target version when running doctor. Compare the installed agent package's
DESIGN.md and SKILL.md with your customized copies, apply relevant changes, and
update flood.json's version after a successful migration. Keep existing framework,
paths and project-specific instruction changes.
The CLI deliberately has no destructive `update` command in v0.1. Major changes
need explicit migration notes. `add` is unnecessary: all eight core components
ship in the React package and are imported by name. Run doctor and your project's
build/tests after upgrading. Do not rerun init to replace existing instructions.
