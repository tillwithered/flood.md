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

One release train for tokens, React, agent and CLI. Release checks enforce exact
versions and required artifacts. Publish dependency-first. Never mutate an npm
version. Use a new patch release for corrections. Review changelog and upgrade
packages together; `doctor` detects divergence. Preserve any customized instruction
files by comparing upstream docs rather than replacing them automatically.
