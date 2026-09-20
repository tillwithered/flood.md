# Desktop failure and recovery matrix

This matrix is the release contract for local data, agent work, and project knowledge. A failed operation must leave the last valid Markdown/JSON state readable and must never be presented as completed.

| Failure | Safe state | User-visible recovery | Contract |
| --- | --- | --- | --- |
| Concurrent external edit | The external version remains canonical; the local draft stays in memory | Reload and compare, then retry with the new version | `conflict` / `reload_and_retry` |
| Missing project, task, or material | No replacement object is created | Reload the project list | `not_found` / `reload` |
| Invalid Markdown, YAML, or JSON | The corrupt source is not overwritten | Open and repair the source file, then reload | `invalid_file`, `yaml`, `json` / `repair_source_file` |
| Filesystem or backup failure | Atomic write does not replace the last valid file | Retry or open the data folder and inspect permissions/free space | `io`, `backup` / `retry_or_open_data_folder` |
| Interrupted or cancelled agent process | Run is `interrupted` or `cancelled`; task remains open | Resume with a new run; no result is accepted automatically | Agent-run state contract |
| Agent output cannot be parsed | Run is `failed`; raw diagnostic is bounded | Retry after correcting provider output | No task/context mutation |
| Knowledge proposal has a stale base | Proposal stays pending and canonical knowledge is unchanged | Reload the proposal and review against the current version | `conflict` / `reload_and_retry` |
| App closes during a write | Temporary file may remain; canonical file remains the previous complete version | Reopen; cleanup/recovery diagnostics may be run | Atomic replace contract |
| Connector is offline or unauthorized | Local projects and tasks remain available | Reconnect explicitly; never display a false connected state | Connector capability state |
| Update download/install fails | Current installed version remains runnable | Retry from Settings; never mark the update installed | Tauri updater contract |

## Acceptance

- Store and Tauri commands return a stable machine-readable `code`, human message, and `recovery` action.
- UI keeps the current draft or pending proposal visible after a recoverable error.
- Agent results, task completion, and project-knowledge application are separate decisions.
- A release candidate must pass the stable verification gate plus clean-install and upgrade smoke checks before stable publication.
