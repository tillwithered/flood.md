# Contributing to Flood

Read [AGENTS.md](AGENTS.md), [architecture](docs/architecture.md) and the relevant
package guide before changing code. Flood authors its own controls and tokens;
do not introduce a third-party UI component library.

Build larger components and website UI from Flood's existing small components.
If a needed capability is missing, improve or add the primitive first. Do not
replace a shared component with local markup to solve a visual issue. See the
[composition skill](packages/agent/references/flood-composition/SKILL.md).

## Local development

Use Node.js 22.12 or newer (CI uses Node 24) and npm.

```sh
npm ci
npm run dev
```

Create a topic branch and open a pull request against main. Explain the user-facing
change and validation. Main requires the GitHub Actions verify check before merge.

Name branches after the work, using lowercase hyphenated topics:

| Purpose | Example |
| --- | --- |
| Feature | `feat/base-components` |
| Correction | `fix/icon-alignment` |
| Documentation | `docs/installation-guide` |
| Repository maintenance | `chore/repository-naming` |
| Release | `release/0.2.3-installation` |

Branch names, commit subjects and PR titles describe the change rather than the
tool or assistant used to author it. CI verifies every pull request and pushes
to main, independently of the topic branch's name.

```sh
npm run verify
npx playwright install chromium
npm run test:browser
npm run release:check
```

Add focused tests for changed behavior. UI changes should cover keyboard use,
labels, focus, narrow screens and the supported dark profile. Update component and agent guides
when the public API changes. Match Flood package versions in releases and preserve
Next.js client boundaries. See the [release process](docs/releases.md).

## Public repository boundary

This repository contains product source, public documentation, examples, tests,
website source and reproducible build/release tooling. Account-specific operations,
incident journals, deployment identifiers and internal plans belong outside it.
Never commit credentials, including to private repositories. Use service secret
stores and keep example environment files limited to variable names and placeholders.

Report vulnerabilities through the [security policy](SECURITY.md).
