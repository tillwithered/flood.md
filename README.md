# flood.md

An open-source design system for developers and coding agents. Flood ships
original UI components, dark foundations, semantic tokens and versioned design
guidance. The current implementation supports **React 18.3 and 19** and
**Next.js App Router**, with TypeScript declarations.

[Component catalog](https://flood.md/components) · [Charts](https://flood.md/docs/charts) ·
[Documentation](docs/README.md) · [Connect your agent](https://flood.md/docs/mcp) ·
[Releases](https://github.com/tillwithered/flood.md/releases)

## Quick start

In an existing React or Next.js project with Node.js 22.12+ and npm, install the
latest published release.

```sh
npx @flood-md/cli init
```

The CLI installs matching versions of the component, token and agent packages.
It adds project configuration and the Flood skill without overwriting existing
files. Use `init --dry-run` to see the planned changes first.
The main branch can include changes for the next release. Use the
[release tags](https://github.com/tillwithered/flood.md/tags) to read the source
and docs for an installed version.

Import the stylesheet once at the app entry or in the Next.js root layout.
Wrap your interface in `FloodRoot` to apply the dark foundations.

```tsx
import "@flood-md/react/styles.css";
import { Button, FloodRoot, Heading, Stack } from "@flood-md/react";

export function Workspace() {
  return (
    <FloodRoot>
      <Stack gap="4">
        <Heading level={1}>Workspace</Heading>
        <Button>New project</Button>
      </Stack>
    </FloodRoot>
  );
}
```

See [installation and upgrades](docs/installation.md) for manual setup and
version alignment. [Customize the foundations](docs/theming.md) with semantic
CSS variables.

## Build with a coding agent

Share the [agent entry point](https://flood.md/llms.txt) when starting a project
with an agent. In a connected project, the installed `flood/DESIGN.md` and
`.agents/skills/flood-ui/SKILL.md` guide component selection, composition and
verification. The [agent knowledge guide](docs/agent-knowledge.md) explains how
to look up a component or workflow with the CLI version recorded in `flood.json`.
Open [Connect your agent](https://flood.md/docs/mcp) for client setup and prompts
that lead to working Flood examples. See [agent setup](docs/agents.md) for the
versioned project workflow.

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

`verify` builds the packages and site, checks types, runs tests and validates the
packed packages in a clean consumer. The browser suite covers the website and
the Next.js example.

## Workspace

| Directory         | Purpose                                          |
| ----------------- | ------------------------------------------------ |
| `packages/tokens` | Authored JSON tokens → generated CSS             |
| `packages/react`  | React components, declarations and CSS           |
| `packages/cli`    | Installer, diagnostics and catalog search        |
| `packages/agent`  | Versioned design guidance and skills             |
| `apps/website`    | Website, component previews and agent endpoints |
| `examples/next`   | Next.js integration example                       |

Read [CONTRIBUTING.md](CONTRIBUTING.md), [architecture](docs/architecture.md),
[releases](docs/releases.md), and [deployment](docs/deployment.md).
To report a component issue, open a [GitHub issue](https://github.com/tillwithered/flood.md/issues/new/choose).
Report vulnerabilities using the [security policy](SECURITY.md).

## License

Flood code is [MIT licensed](LICENSE). The bundled Inter font retains its
[original SIL Open Font License](packages/react/src/fonts/LICENSE.txt).
