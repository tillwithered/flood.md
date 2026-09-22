# Stable 0.2.0 reproducible baseline

Recorded on 2026-09-18 for issue `#21`. This document fixes the known-good
dogfood baseline before the sequential Stable 0.2.0 work changes product
contracts.

## Supported and reproduced environment

- Product target: Windows 10 or newer.
- Reproduced in the current Windows development environment.
- Repository: `tillwithered/flood-dev`, branch `main`.
- Public comparison release: `v0.1.6`.
- Repository requirements remain Node.js 22+, stable Rust, and the Tauri 2
  prerequisites.
- Toolchain used for this baseline:
  - Node.js `v24.16.0`
  - npm `11.13.0`
  - rustc `1.98.1 (48a229cea 2026-09-01)`
  - cargo `1.98.1 (797e8a9bc 2026-08-05)`
  - tauri-cli `2.11.4`

## Reproduce after clone

From a normal PowerShell session with the prerequisites installed:

```powershell
git clone https://github.com/tillwithered/flood-dev.git
cd flood-dev

npm ci
npm run check
npm run build

cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace

npm run tauri -- build --no-sign
```

`--no-sign` is the reproducible local build command. The repository enables
Tauri updater artifacts, so the normal signed release path also requires the
protected `TAURI_SIGNING_PRIVATE_KEY` available to the release environment.
That secret is intentionally not part of the repository or fixtures.

The expected local desktop artifacts include:

- `target/release/flood-desktop.exe`
- `target/release/bundle/nsis/flood.md_0.1.6_x64-setup.exe`

## Verification matrix

| Layer | Command | Baseline result |
| --- | --- | --- |
| Dependencies | `npm ci` | Pass; clean install |
| Svelte/TypeScript/UI checks | `npm run check` | Pass; `svelte-check` has 0 errors and 0 warnings |
| Frontend bundle | `npm run build` | Pass |
| Rust formatting | `cargo fmt --all -- --check` | Pass |
| Rust lint | `cargo clippy --workspace --all-targets -- -D warnings` | Pass |
| Rust tests | `cargo test --workspace` | Pass |
| Sanitized storage fixture | `cargo test -p flood-core --test baseline_fixtures` | Pass |
| Desktop package | `npm run tauri -- build --no-sign` | Pass on the reproduced Windows configuration |

The workspace test baseline contains:

- `flood-connectors`: 2 unit tests.
- `flood-core`: 51 unit tests plus 1 executable baseline-fixture integration
  test.
- `flood-github`: 4 unit tests.
- `flood-mcp`: 50 unit tests plus 4 stdio protocol integration tests.
- `flood-desktop`: 22 unit tests.
- Rust doc tests: pass.

## Current functional inventory

- Local-first projects and tasks with readable Markdown as the canonical source
  of truth.
- Stable identifiers, version hashes, atomic writes, conflict detection,
  recoverable trash, backups, and duplicate-safe/idempotent agent operations.
- Task urgency/status, relations, checkpoints, optional original-message
  snapshot, and attachments.
- Telegram through TDLib, linked project chats, inbox triage, bounded message
  context, media/albums, and task creation from a discussion.
- Explicit project sources with per-source agent access. Current source kinds
  include repository, directory, external skill, Figma, documentation, website,
  and other.
- Project-owned Markdown documents, rules, and skills.
- Read-only GitHub integration and bounded repository context.
- Bundled local stdio MCP for projects, tasks, Telegram triage, project/task
  work context, context receipts, source access, and local agent-run workflow.
- Offline project/task core without Telegram or a network connection.

## Persistent data contracts

The canonical project/task formats are version `1`.

```text
<data-root>/
  projects/
    <project-ulid>/
      project.md
      tasks/
        <task-ulid>.md
      workspace/
        documents/
          <item-ulid>.md
        rules/
          <item-ulid>.md
        skills/
          <item-ulid>.md
  agent-runs.json
```

Project, task, and project-workspace files use YAML front matter followed by
ordinary Markdown. The file bytes are hashed to produce the optimistic
concurrency version used by mutations.

Project metadata includes its stable ID, title, timestamps, explicit resources,
optional Telegram links/participants, and project memory. The Markdown body
keeps the human-readable project context.

Task metadata includes its stable ID, project ID, timestamps, urgency, status,
relations, checkpoints, optional source snapshot, and optional trash timestamp.
The Markdown body is the task description. A source snapshot can preserve text,
author, time, provider/link/message identifiers, media, and bounded surrounding
conversation.

Project-owned documents/rules/skills have a stable ID, project ID, kind, title,
optional summary, explicit agent-access flag, timestamps, and bounded revision
history. Their bodies remain Markdown.

`agent-runs.json` is format version `1` and records local agent execution
state, timestamps, task/project relation, provider, working directory,
progress/result, applied guidance, and optional blocker/error data.

## Sanitized executable fixtures

The canonical baseline fixtures live under:

`crates/flood-core/tests/fixtures/baseline-v1/`

They contain only deterministic sample data and `example.invalid` URLs:

- one project with repository/documentation sources;
- one task with a sanitized original-message snapshot and checkpoint;
- one project-owned rule;
- one project-owned skill;
- one agent run.

`crates/flood-core/tests/baseline_fixtures.rs` copies the fixture tree to a
temporary data root, opens it through `Store::new`, and verifies all of those
objects through the same production read APIs used by the app and MCP.

## Known baseline limitations

- The shipped MCP server is local stdio. A regular cloud ChatGPT conversation
  cannot launch it, and this release does not ship a remotely reachable HTTPS
  MCP bridge.
- GitHub access is read-only and is additionally limited by the linked
  installation/repository and the project's explicit source-access setting.
- MCP cannot grant itself access to a project source.
- Figma, website, and documentation resources can be project context
  references; flood.md does not turn those references into unrestricted remote
  access by itself.
- Telegram is optional for the core product. Independent local builds can leave
  protected release Telegram credentials unset and use developer-owned values
  in the app.
- Official updater artifacts need the protected signing key. The local baseline
  therefore verifies packaging with `--no-sign`.
- Windows is the supported desktop target in the current public product.

## Delta from public stable v0.1.6

`v0.1.6` is the latest public stable used for comparison. The current
development branch adds the Stable 0.2.0 foundation on top of it, including:

- a generic connector contract and the new `flood-connectors` crate;
- much broader project/task storage and workflow contracts, including project
  memory, relations, checkpoints, activity/automation state, backups, and agent
  runs;
- project-owned documents, rules, and skills plus explicit source permissions;
- MCP project-context/work-packet behavior, context receipts, source gating,
  and local agent-run flow;
- expanded read-only GitHub/project-source context;
- desktop/UI support for the newer project-context and integration flows;
- updated product/MCP/connector documentation and localized screenshots.

No format migration is introduced by this baseline task: project/task/workspace
Markdown remains format version `1`, and the baseline fixtures exercise the
current readers directly.
