# Installation

Use Node.js 22.12 or newer and an existing npm-based React/Next.js project.
React 18.3/19 is accepted; React 19 and Next.js App Router are CI targets.

## Source candidate 0.2.0

The current source is a **0.2.0 release candidate, not a verified npm release**.
Use repository-built tarballs to evaluate it. From a checked-out candidate:

```sh
npm ci
npm run build:packages
npm pack --workspace=@flood-md/tokens
npm pack --workspace=@flood-md/react
npm pack --workspace=@flood-md/agent
```

Install all three generated tarballs into a test project with npm install
--save-exact, using their local paths. Install them together so the exact internal
package dependency resolves locally. Do not substitute registry 0.2.0 commands
until that version's publication has been verified.

Import @flood-md/react/styles.css once in the React entry or Next app/layout.tsx.
Wrap new UI in FloodRoot for explicit neutral/dark foundations:

```tsx
import "@flood-md/react/styles.css";
import { Button, FloodRoot } from "@flood-md/react";

export function App() {
  return <FloodRoot><Button>Start something</Button></FloodRoot>;
}
```

Use a client component for callbacks, state or Field's function child. See
[components](components.md). No Tailwind configuration or external font CDN is
needed. The new foundations profile is dark only.

## Last verified public release: 0.1.1

For the earlier published API, use exact 0.1.1 versions and its matching guide:

```sh
npx @flood-md/cli@0.1.1 init --dry-run
npx @flood-md/cli@0.1.1 init
```

Those commands install 0.1.1, which does not include FloodRoot or the new
foundations profile. The installer creates flood.json, flood/DESIGN.md and
.agents/skills/flood-ui/SKILL.md while preserving existing host instructions.
Read the installed guide; reference it from your agent instructions when skills
are not discovered automatically. Existing AGENTS.md is never replaced.

## Updates

Choose a verified published target and upgrade tokens, React and agent together
to the same exact version. Use the matching CLI for doctor. Compare the new
package's agent guides with customized local copies before applying updates;
update flood.json only after a successful migration. Doctor checks versions
and guide presence, not stylesheet imports or application behavior.

All components ship in the React package and are imported by name. No add command
or destructive update command is needed. Do not rerun init to overwrite existing
instructions. Run the host build/tests and browser checks after upgrading.
