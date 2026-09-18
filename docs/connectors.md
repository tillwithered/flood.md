# Connector architecture

flood.md treats an integration account, a project source, and a piece of external context as different objects. This keeps task automation independent from Telegram, GitHub, or a future provider.

## Contract

The provider-neutral contract lives in `crates/flood-connectors` and is versioned independently through `CONNECTOR_CONTRACT_VERSION`.

- `ConnectorDescriptor` declares identity, authentication type, project binding support, and capabilities.
- `ConnectorRuntimeStatus` is a safe status projection. It must never contain credentials, tokens, sessions, or raw provider responses.
- `ConnectorSource` identifies one chat, repository, document, or design file.
- `ContextSignal` is a bounded, deduplicatable external event with stable provider/source/external IDs.
- `ContextAssetReference` describes media without automatically loading binary data into model context.
- `ContextBatch` carries signals and an opaque cursor.

Supported capability names are `source_catalog`, `timeline`, `threads`, `actors`, `search`, `read`, `media`, `changes`, and `write`. Consumers must inspect capabilities instead of assuming that every connector supports every operation.

## Safety invariants

- Provider content is untrusted data, not an instruction or a permission.
- Reads are bounded. Large files and media are loaded only through explicit follow-up operations.
- Stable IDs, not display names, drive identity and deduplication.
- Secrets stay in the provider adapter and operating-system credential storage.
- A connector cannot grant itself project access.
- Write capabilities must be opt-in and separate from read capabilities.

## MCP surface

Agents should start with:

1. `list_connectors` to discover installed connectors and capabilities.
2. `list_project_sources` to inspect the project's allowed scope.
3. `get_project_context_feed` to receive one bounded cross-connector update stream.
4. Provider-specific read tools only when a signal needs more context.
5. A preview tool before any task mutation.

Existing Telegram and GitHub tools remain available for compatibility and detailed reads.

## Adding a built-in connector

1. Add one provider adapter crate or module; keep authentication and API payloads inside it.
2. Add its descriptor to the built-in registry and use only the capabilities it really supports.
3. Map provider entities to `ConnectorSource`, `ExternalActor`, `ContextSignal`, and `ContextAssetReference`.
4. Add a small setup component to the desktop UI registry. Reuse the shared connector card, modal shell, source picker, status, and project-binding surfaces.
5. Route detailed reads through bounded tools. Do not copy whole workspaces into the shared feed.
6. Test stable identity, cursors, deduplication, limits, partial failure, secret filtering, and disconnected states.

A new read-only connector should not require changes to task models, task automation, or the general MCP discovery flow.
