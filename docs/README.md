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
| [Charts](charts.md) | Choose a chart by the question it answers and try the live latency example |
| [Base component inventory](base-components.md) | Available primitives and controls in the base release |
| [Customization](theming.md) | Scoped dark foundations overrides and legacy theme boundaries |
| [Foundations](foundations.md) | Typed semantic tokens and neutral dark profile for 0.2.11 |
| [Agents](agents.md) | Installing and using the matching agent instructions |
| [Connect your agent](https://flood.md/docs/mcp) | Connecting an MCP client and trying Flood workflows |
| [Agent knowledge](agent-knowledge.md) | Versioned discovery, selected reads and preserved project guides |
| [FAQ](faq.md) | Compatibility, customization, updates and common problems |
| [Command palette](recipes/command-palette.md) | Compose Dialog and CommandList with host-owned actions |
| [Table bulk actions](recipes/table-bulk-actions.md) | Controlled cross-page selection and local confirmation |
| [File gallery](recipes/file-gallery.md) | File previews, selection, archives and focus recovery |
| [Grouped form](recipes/grouped-form.md) | Shared tracks, semantic groups and optional fields |
| [Import mapping](recipes/import-mapping.md) | Match incoming columns to fields and correct validation errors |
| [Action review](recipes/action-review.md) | Inspect a proposed action and submit a decision |
| [Record association](recipes/record-association.md) | Search for a related record and keep its relationship draft |
| [Refresh controls](recipes/refresh-controls.md) | Manual and scheduled refresh while keeping collection rows |
| [Checkpoint navigator](recipes/checkpoint-navigator.md) | Jump to a review section and independently flag it |
| [Dependent filters](recipes/dependent-filters.md) | Apply related choices together and recover from incompatible values |
| [Version history](recipes/version-history.md) | Inspect, compare and restore saved versions |
| [Conversion funnel](recipes/conversion-funnel.md) | Compare ordered stages of the same cohort |
| [Collaborative save](recipes/collaborative-save.md) | Preserve local edits and review a conflicting save |
| [Map and list](recipes/map-and-list.md) | Share selection between location results and a map adapter |
| [Support reply](recipes/support-reply.md) | Isolate channel drafts and review macro changes |
| [Staged changes](recipes/staged-changes.md) | Review an explicit draft and select changes to apply |
| [Document review](recipes/document-review.md) | Review inline revisions and their linked discussions |
| [Code editor workspace](recipes/code-editor-workspace.md) | Connect a code editor and its query results |
| [Code review](recipes/code-review.md) | Inspect changed files and hold discussions on source lines |
| [Address confirmation](recipes/address-confirmation.md) | Fill dependent address fields and confirm a correction |
| [Record management](recipes/record-management.md) | Search, filter and edit records without losing the working list |
| [Settings workspace](recipes/settings-workspace.md) | Group settings, validate a draft and save changes |

## Versions

This branch documents **version 0.2.15**; source availability does
not establish npm publication. Use matching exact versions of the Flood packages. Documentation on `main` can describe later work; the
[release tags](https://github.com/tillwithered/flood.md/releases) preserve the
source and docs for each release. Installed `flood/DESIGN.md` takes precedence
over website guidance when working in an existing project.

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md), [architecture](architecture.md),
[releases](releases.md) and the [security policy](../SECURITY.md).
