# Desktop delivery — 2026-09-22

Scope: transfer the accumulated dark desktop interface, task workspace, agent dock and settings to the actual application and `main`. Codex remains the sole execution provider. No mobile/minimum-window acceptance or public release was requested.

## Corrections during the delivery review

- The Dock starts collapsed and retains its open/collapsed state during navigation. It is hidden in project settings, including from keyboard navigation.
- Scroll thumbs appear during scrolling and disappear after 800 ms; gutters remain stable. Forced-colors mode keeps the thumb visible.
- Project settings have a visible return action and a sticky header with Save when dirty. Dirty-state rendering directly tracks form values.
- A successful project save no longer closes over newer edits made during the request. Automation changes use the submitted value rather than a later edit.
- Existing settings simplification, provider-neutral composer wording, slash commands, task context and per-project conversation bindings are included.
- Clean Windows CI exposed CRLF front-matter parsing failure. The shared reader now accepts LF/CRLF delimiters without rewriting files or normalizing conflict-version bytes. A regression fixture covers project, task, rule and skill reads and verifies byte preservation.

Affected contracts: shell/header C01/C02, settings C17, project-context flow, persistence DAT-01 and agent interaction INT-01/02/03. Current user dark-only and normal-desktop amendments supersede older theme/size matrices.

## Evidence and limitations

- `npm run check`: zero Svelte errors/warnings; token contrast, generated files, local documentation links and 12 px font floor pass.
- `cargo test --workspace`: passes, including core file conflict/recovery, MCP protocol and desktop tests. Existing Windows LNK4098 warnings remain.
- Tauri release build with a local override disabling updater signatures produces the NSIS installer. The official updater configuration is unchanged. This local installation is not a signed public release.
- Installed MCP self-check: all 20 checks pass, using isolated data.
- Browser verification on synthetic fixtures: task page, Dock collapse/expand, `/task <title>` opens a prefilled creation form, project-settings return, dirty-draft discard guard, Save visibility, sticky header, Dock exclusion from project settings, and application settings layout.
- The current-user installation replaces the existing application. Local project data were backed up first; all 102 existing Markdown hashes matched after installation. Credentials and sessions were not added to the repository.
- The installed executable launches with a responsive native window. Its only binary difference from the build output is the bundler's `BUNDLE_TYPE_VAR_NSS` marker replacing `UNK`; the installed MCP binary matches exactly.
- **Native visual/interaction acceptance is still open.** Windows automation fails before execution with `failed to write kernel assets` / missing path. Process startup and browser checks do not prove native clicks, dialogs, rendering, or end-to-end agent delivery. No message was sent to a real agent conversation for this review.

Next verification: native Dock send/recovery, task editing/completion, project save while typing, settings dialogs and connection flow. Automatic creation/mirroring of Codex conversations remains outside the shipped capability proven by this review.
