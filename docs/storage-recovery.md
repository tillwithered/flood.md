# Storage recovery contract

Canonical project and task Markdown is local-first and must never be silently replaced after a failed write or a stale concurrent edit.

- Writes use a temporary file and become visible only after a successful commit.
- I/O failures before commit leave the previous canonical file unchanged.
- GUI, MCP, and migration operations share the same filesystem lock and version checks.
- Two writers using the same base version serialize: one may commit, while the stale writer receives `conflict`.
- Invalid UTF-8, malformed metadata, and files over the documented limit fail closed. Flood does not rewrite the damaged input while reporting the error.
- Legacy `chats` migration is restartable after either the root rename or an individual document conversion.
- Runtime integration state is recoverable and is not allowed to replace canonical Markdown.
- Backup restore validates paths, entry count, expanded size, and per-file limits before installing data.

The deterministic recovery suite lives in `crates/flood-core/tests/recovery_integrity.rs`. Low-level write-failure behavior is tested beside the atomic writer in `store.rs` so the injected failure uses the same pre-commit path as production writes.
