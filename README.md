# flood.md

An independent design system for **React, TypeScript and Next.js**. Original
components, semantic tokens, a small installer, and versioned instructions for
coding agents. No third-party UI component library or Tailwind dependency.

## Base dark design system · 0.2.5

Flood 0.2.5 provides a dark foundations profile, 184 semantic token roles and
[Original primitives and controls](docs/base-components.md), including forms,
selection groups, disclosures, overlays and navigation. A versioned agent bundle
includes portable spacing and composition guidance. Use the matching installed
guide and declarations when upgrading.

```tsx
import "@flood-md/react/styles.css";
import { Button, FloodRoot, Heading, Stack } from "@flood-md/react";

export function Example() {
  return (
    <FloodRoot>
      <Stack gap="4">
        <Heading level={1}>Start something</Heading>
        <Button>Create workspace</Button>
      </Stack>
    </FloodRoot>
  );
}
```

FloodRoot explicitly selects neutral/dark, with local Inter, semantic tokens,
relative typography and layout, filled actions, native forms and keyboard focus.
Primitives include Text/Heading, Stack/Inline/Surface, CodeSnippet, IconSlot/IconButton
and Divider. The new foundations profile starts with dark only; the older theme
contract remains compatible outside FloodRoot.

## Connect

Use matching published Flood packages. Verify registry availability before running the versioned installation command.

```sh
npx @flood-md/cli@0.2.5 init
```

Run in an existing npm-based React or Next.js project. Use `init --dry-run` to see
the plan first. The installer adds exact matching package versions and creates
`flood.json`, `flood/DESIGN.md` and `.agents/skills/flood-ui/SKILL.md`. Existing
files and root agent instructions are never overwritten. Import the stylesheet
once in your React entry or Next.js `app/layout.tsx`:

```tsx
import "@flood-md/react/styles.css";
import { Button, FloodRoot } from "@flood-md/react";

export function Example() {
  return <FloodRoot><Button>Start something</Button></FloodRoot>;
}
```

Give an agent `https://flood.md/llms.txt`. The guide
uses the same CLI as a manual installation. `npx @flood-md/cli@0.2.5 doctor` checks
installed versions and owned instruction files.

## Documentation

Start with the [documentation index](docs/README.md):

- [Installation and updates](docs/installation.md)
- [Component API and examples](docs/components.md)
- [Base component inventory](docs/base-components.md)
- [Tokens and themes](docs/theming.md)
- [Agent setup](docs/agents.md)
- [Frequently asked questions](docs/faq.md)

## Components

Button, Input, Textarea, Checkbox, Radio, Switch, Field and Link compose with the
0.2 primitives above. Native semantics, forwarded refs, focus states and reduced
motion remain part of the API. The 0.2 foundations profile is dark only.
Components ship as dependencies, not copied source files. Customize semantic CSS
variables; host application owns layout, data fetching and side effects.

## Develop

See [foundations](docs/foundations.md) and the [component guide](docs/components.md)
for 0.2.5. Existing 0.1.1 projects should follow their matching guides. The Next.js
example includes `/foundations` and `/team` for reviewing the current source.

Node.js 22.12+ (Node 24 recommended), npm 11.

```sh
npm ci
npm run dev
```

```sh
npm run verify
npx playwright install chromium
npm run test:browser
```

`verify` builds the library/site, checks types, tests installer behavior, installs
real package tarballs into a clean consumer, and builds the Next.js App Router
example. The browser suite checks keyboard use, themes, forms and accessibility.
The site has a focused home page, documentation and a component catalog with
live previews. `/playground` is an additional composition verification surface.

## Workspace

| Directory         | Purpose                                     |
| ----------------- | ------------------------------------------- |
| `packages/tokens` | Authored JSON tokens → generated CSS        |
| `packages/react`  | React components, declarations and CSS      |
| `packages/cli`    | Original npm installer and doctor           |
| `packages/agent`  | Matching design guide and skill             |
| `apps/website`    | Landing page and plain-text agent endpoints |
| `examples/next`   | Server/client boundary integration fixture  |

Read [CONTRIBUTING.md](CONTRIBUTING.md), [architecture](docs/architecture.md),
[releases](docs/releases.md), and [deployment](docs/deployment.md).
Report vulnerabilities using the [security policy](SECURITY.md).

## License

Flood code is [MIT licensed](LICENSE). The bundled Inter font retains its
[original SIL Open Font License](packages/react/src/fonts/LICENSE.txt).
