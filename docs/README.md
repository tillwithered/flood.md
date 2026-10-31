# Flood documentation

Flood provides original React components, semantic CSS tokens and versioned
instructions for coding agents. Start with the guide for your task:

The website renders these guides at [/docs](https://flood.md/docs) and provides
live examples at [/components](https://flood.md/components). Edit the Markdown
here and review changes through a pull request; the next website build includes
them without a separate content service.

| Guide | What it covers |
| --- | --- |
| [Skills](skills.md) | Task-focused composition and verification workflows |
| [Interface content](interface-content.md) | Editorial decisions, purposeful copy and contextual reference adaptation |
| [Installation](installation.md) | React, Next.js, CLI setup and manual installation |
| [Project UI](project-ui.md) | Optional semantic @/ui/button imports in your application |
| [Layout](layout.md) | Intrinsic actions, responsive forms, choice sizing, gaps and hierarchy |
| [Components](components.md) | Available controls, props and form composition |
| [Base component inventory](base-components.md) | Available primitives and controls in the base release |
| [Customization](theming.md) | Scoped dark foundations overrides and legacy theme boundaries |
| [Foundations](foundations.md) | Typed semantic tokens and neutral dark profile for 0.2.11 |
| [Agents](agents.md) | Installing and using the matching agent instructions |
| [Agent knowledge](agent-knowledge.md) | Versioned discovery, selected reads and preserved project guides |
| [FAQ](faq.md) | Compatibility, customization, updates and common problems |
| [Command palette](recipes/command-palette.md) | Compose Dialog and CommandList with host-owned actions |
| [Table bulk actions](recipes/table-bulk-actions.md) | Controlled cross-page selection and local confirmation |
| [Grouped form](recipes/grouped-form.md) | Shared tracks, semantic groups and optional fields |

## Versions

This branch documents **version 0.2.11**; source availability does
not establish npm publication. Use matching exact versions of the Flood packages. Documentation on `main` can describe later work; the
[release tags](https://github.com/tillwithered/flood.md/releases) preserve the
source and docs for each release. Installed `flood/DESIGN.md` takes precedence
over website guidance when working in an existing project.

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md), [architecture](architecture.md),
[releases](releases.md) and the [security policy](../SECURITY.md).
