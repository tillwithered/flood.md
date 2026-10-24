# Flood v0.1 architecture

## Scope

One public monorepo, original React components, TypeScript declarations, semantic
CSS tokens and an npm-based CLI. The product supports npm projects with React
18.3/19 and Next.js App Router. React 19 + Next 16 are the initial CI integration
targets. Wider framework and package-manager support is not implied.

## Distribution

GitHub stores source and releases. npm distributes immutable versioned packages.
Railway serves the landing page, JSON schema and plain-text agent docs. npm is
delivery infrastructure, not the component engine. No runtime Flood API, database,
login, telemetry, remote agent execution or mandatory hosted state is required.

Tokens → React CSS/components → host app. The CLI installs tokens, React and agent
packages at the same exact release version. It writes only owned configuration
and agent files, and tells the user where to import CSS. It does not guess at
source-code AST mutations or rewrite existing instructions. Components are
dependencies, not copies, so upgrades follow ordinary package versioning.

`@flood-md/cli` uses Node built-ins and the matching agent package. The installer
currently uses npm only; consumers may import the library without the CLI using
another package manager. An npm failure does not write Flood configuration;
npm itself can change package/lock files, so inspect its output before retrying.

## Component contracts

Native buttons and inputs keep platform semantics. Callbacks/ref/state belong in
client components. Field supplies associations via a render callback. No data
access is built into components. React package entry keeps `"use client"` in the
published JS; Next root layouts import global CSS. Server components can render
Flood components with serializable props; callback composition lives in a client
component, as demonstrated by the Next fixture.

## Customization

Use semantic tokens first. Default follows OS theme; root data-flood-theme chooses
an explicit theme. Host overrides come after the Flood stylesheet. No project
theme editor or fine-tuning service exists in v0.1; tokens and public props are
the intended extension boundary. No implicit downloads or remote configuration.

## Versioning

### Unreleased dark foundations profile

The next aligned minor is planned as `0.2.0`; manifests remain `0.1.1` until
release preparation. This source change is not a published npm release.
`FloodRoot` explicitly selects `data-flood-foundations="neutral"` and
`data-flood-theme="dark"`. New foundation styles are scoped to that root;
legacy controls outside it keep their existing light/dark behavior. A new light
foundations profile is outside this slice.

The single token source remains `packages/tokens/src/tokens.json`. Typed
reference values feed semantic aliases and generated CSS, manifest, resolved
JSON and TypeScript lookup. Typography, spacing, finite radii and control/icon
geometry use relative units; root font size belongs to the host application.
Text/Heading and layout primitives compose with the existing native controls.
IconSlot accepts host SVG artwork without adding an icon library dependency.

Inter is a bundled, unmodified third-party WOFF2 asset under its original SIL
OFL 1.1, separate from Flood's MIT code. Its release, hash and license accompany
the source. CSS resolves the font locally without a CDN. The dark field recipe
includes a necessary boundary in addition to its quieter decorative outline;
the 2px focus accent is configurable and provisional. These choices do not
constitute a claim of complete accessibility across host compositions.

New public APIs require declaration output, user and agent guidance and an
aligned release decision. The installed `0.1.1` agent contract stays explicitly
separate from the unreleased next-minor additions.

One release train for tokens, React, agent and CLI. Release checks enforce exact
versions and required artifacts. Publish dependency-first. Never mutate an npm
version. Use a new patch release for corrections. Review changelog and upgrade
packages together; `doctor` detects divergence. Preserve any customized instruction
files by comparing upstream docs rather than replacing them automatically.
