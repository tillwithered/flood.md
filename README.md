# flood.md

An independent design system for **React, TypeScript and Next.js**. Original
components, semantic tokens, a small installer, and versioned instructions for
coding agents. No third-party UI component library or Tailwind dependency.

## Connect

After the first npm release:

```sh
npx @flood-md/cli@0.1.0 init
```

Run in an existing npm-based React or Next.js project. Use `init --dry-run` to see
the plan first. The installer adds exact matching package versions and creates
`flood.json`, `flood/DESIGN.md` and `.agents/skills/flood-ui/SKILL.md`. Existing
files and root agent instructions are never overwritten. Import the stylesheet
once in your React entry or Next.js `app/layout.tsx`:

```tsx
import "@flood-md/react/styles.css";
import { Button } from "@flood-md/react";

export function Example() {
  return <Button>Start something</Button>;
}
```

Give an agent `https://flood.md/llms.txt` after deploying the new site. The guide
uses the same CLI as a manual installation. `npx @flood-md/cli doctor` checks
installed versions and owned instruction files. See [installation](docs/installation.md).

## First foundations

Button, Input, Textarea, Checkbox, Radio, Switch, Field and Link. Native form
semantics, forwarded refs, light/dark themes, focus states and reduced motion.
Components ship as dependencies, not copied source files. Customize semantic CSS
variables; host application owns layout, data fetching and side effects.

## Develop

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
The site is one screen; `/playground` is the component verification surface.

## Workspace

| Directory         | Purpose                                     |
| ----------------- | ------------------------------------------- |
| `packages/tokens` | Authored JSON tokens → generated CSS        |
| `packages/react`  | React components, declarations and CSS      |
| `packages/cli`    | Original npm installer and doctor           |
| `packages/agent`  | Matching design guide and skill             |
| `apps/website`    | Landing page and plain-text agent endpoints |
| `examples/next`   | Server/client boundary integration fixture  |

Read [architecture](docs/architecture.md), [releases](docs/releases.md), and
[deployment](docs/deployment.md). The previous desktop application is preserved
separately as `tillwithered/flood-desktop`; this repository is a new product.

## License and commercial direction

The core is MIT licensed. Future premium screen packs, project customization
tools and services can be separate products. No billing or account infrastructure
is required by this core.

The original Flood mark was preserved from the author's desktop repository; no
desktop application code is included in this new implementation.
