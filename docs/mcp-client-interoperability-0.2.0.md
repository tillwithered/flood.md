# MCP client interoperability — 0.2.0

Evidence captured on Windows on 2026-09-18 against `flood-mcp` built from commit `aaf3a64d6e144fc804ba4d166310e88cdf468967`.

`PASS` means the scenario was exercised. `LIMITED` means the client or host blocked the scenario before flood could be exercised. `N/A` means the client/server path does not advertise that capability. A limited cell must not be read as verified compatibility.

## Server baseline

- `flood-mcp --manifest`: preferred protocol `2026-07-28`; explicitly supported `2025-06-18`, `2025-11-25`, `2026-07-28`; 91 tools.
- Reproducible data: `crates/flood-core/tests/fixtures/baseline-v1`, copied to a temporary `FLOOD_DATA_DIR` before every mutation run.
- Direct stdio smoke on `2025-11-25`: `get_project_brief` PASS, `get_task` PASS, `preview_project_workspace_item_update` PASS, `apply_project_workspace_item_update` PASS, and missing-task error handling PASS. The mutation changed only the temporary fixture copy.
- Modern `2026-07-28` `server/discover` and tools-flow conformance, plus both legacy initialize eras, are covered by `crates/flood-mcp/tests/stdio_protocol.rs`.
- The server does not advertise MCP Tasks. Static stdio tool catalogs do not advertise `listChanged`.

The direct smoke proves the flood server contract. It does not substitute for a client-specific model session in the matrix below.

## Client matrix

| Client | Version | Configure / connect | List tools | Bounded read | Preview / apply | Error path | Cancel | Stable result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Codex CLI | `0.155.0-alpha.9` | PASS: isolated `CODEX_HOME`; `mcp add`, `mcp list --json`, `mcp get` accepted the stdio server | LIMITED | LIMITED | LIMITED | LIMITED | LIMITED | Configuration verified; model-level interoperability not verified in this host |
| Claude Code | `2.1.276` | PASS: isolated `CLAUDE_CONFIG_DIR`; `mcp list` reported `Connected` | LIMITED | LIMITED | LIMITED | LIMITED | LIMITED | Transport/health verified; model-level interoperability blocked by missing Claude auth |
| Gemini CLI | `0.60.0` | LIMITED: project config was accepted, but the temporary folder was untrusted; `--skip-trust` then stopped on missing Gemini auth | LIMITED | LIMITED | LIMITED | LIMITED | LIMITED | Configuration syntax verified; runtime interoperability not verified |

No row above is described as fully verified. This is intentional: the acceptance target requires pass/fail/limitations rather than turning missing evidence into a support claim.

## Environment limitations

### Codex CLI

The stdio configuration can be created and inspected in an isolated `CODEX_HOME`. The outer Codex host used for this verification blocks a nested `codex exec` launch, so a model session could not exercise flood tools. This is a host limitation, not a flood server failure.

### Claude Code

`claude auth status` returned `loggedIn: false`. MCP management does not require model auth, so an isolated configuration still reached flood and `claude mcp list` reported `Connected`. Tool discovery and tool calls require a model session and therefore remain `LIMITED` in this environment.

### Gemini CLI

The CLI accepted the project-scoped stdio configuration. In an untrusted temporary folder it disabled configured MCP servers. Running with `--skip-trust` advanced past trust handling but then returned auth error `41`: no auth method was configured. Runtime discovery and tool calls therefore remain `LIMITED`.

## Reproduction

Build or reuse a current `flood-mcp.exe`, copy `crates/flood-core/tests/fixtures/baseline-v1` to a temporary directory, and point `FLOOD_DATA_DIR` at that copy. Never run the mutation smoke against real user data.

Codex CLI can be isolated with `CODEX_HOME`:

```powershell
$env:CODEX_HOME = "<temporary-codex-home>"
codex mcp add flood --env "FLOOD_DATA_DIR=<fixture-copy>" -- <path-to-flood-mcp.exe>
codex mcp list --json
codex mcp get flood --json
```

Claude Code can be isolated with `CLAUDE_CONFIG_DIR`:

```powershell
$env:CLAUDE_CONFIG_DIR = "<temporary-claude-config>"
claude mcp add -s user flood -e "FLOOD_DATA_DIR=<fixture-copy>" -- <path-to-flood-mcp.exe>
claude mcp list
claude mcp get flood
claude auth status
```

Gemini CLI can keep MCP configuration inside a disposable working directory:

```powershell
gemini mcp add -s project -t stdio -e "FLOOD_DATA_DIR=<fixture-copy>" flood <path-to-flood-mcp.exe>
gemini mcp list
```

On an authenticated client, the model-level smoke is complete only after the same single session performs all of the following against the temporary fixture:

1. Connect and enumerate flood tools.
2. Call `get_project_brief` for `01ARZ3NDEKTSV4RRFFQ69G5FAV`.
3. Call `get_task` for `01ARZ3NDEKTSV4RRFFQ69G5FAW`.
4. Read rule `01ARZ3NDEKTSV4RRFFQ69G5FAX` with `get_project_workspace_item`.
5. Change only the temporary rule content through `preview_project_workspace_item_update`, then apply the unchanged preview with `apply_project_workspace_item_update`.
6. Call `get_task` with a nonexistent ID and confirm a structured error is surfaced.
7. Exercise cancellation only when the client exposes a reproducible cancel path for an in-flight MCP call; otherwise record `N/A` or `LIMITED` rather than claiming support.

Store only versions, statuses, protocol/tool metadata, and sanitized results. Do not store auth material, tokens, session files, or real task content as interoperability evidence.
