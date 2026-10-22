# Contributing to Flood

Read [AGENTS.md](AGENTS.md), [architecture](docs/architecture.md) and the relevant
package guide before changing code. Flood authors its own controls and tokens;
do not introduce a third-party UI component library.

## Local development

Use Node.js 22.12 or newer (CI uses Node 24) and npm.

```sh
npm ci
npm run dev
```

Create a topic branch and open a pull request against main. Explain the user-facing
change and validation. Main requires the GitHub Actions verify check before merge.

```sh
npm run verify
npx playwright install chromium
npm run test:browser
npm run release:check
```

Add focused tests for changed behavior. UI changes should cover keyboard use,
labels, focus, narrow screens and both themes. Update component and agent guides
when the public API changes. Match Flood package versions in releases and preserve
Next.js client boundaries. See the [release process](docs/releases.md).

## Public repository boundary

This repository contains product source, public documentation, examples, tests,
website source and reproducible build/release tooling. Account-specific operations,
incident journals, deployment identifiers and internal plans belong outside it.
Never commit credentials, including to private repositories. Use service secret
stores and keep example environment files limited to variable names and placeholders.

Report vulnerabilities through the [security policy](SECURITY.md).
