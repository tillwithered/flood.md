# Jev automation adapter

Jev is the default decision engine for new flood.md background-automation settings. It remains optional: it does not replace the bundled MCP server, requires an explicitly saved key before automation can be enabled, and is never selected by the `Auto` provider. Existing explicit provider settings are preserved during upgrades.

## Two independent paths

- External agents use the local flood.md MCP server to read project work context and perform policy-checked mutations.
- The desktop background bridge uses one explicitly selected automation provider: a local Codex, Claude Code, or Gemini CLI, or Jev.

Disabling Jev, deleting its key, or working offline does not affect MCP or manual task management.

## Setup

1. Open **Settings → MCP and AI**.
2. Save a Jev API key. flood.md stores it in the operating-system credential store, never in Markdown, project files, logs, or the frontend bundle.
3. Select **Jev** as the automation provider.
4. Enable background signal processing.

For development only, `TYPESAFE_API_KEY`, `TYPESAFE_BASE_URL`, and `TYPESAFE_DEFAULT_MODEL` are supported. A stored key takes precedence over the environment. The default endpoint is `https://api.typesafe.ai/v1/systemone` and the default model is `jev-latest`.

## Decision contract

flood.md sends bounded project context, up to ten open-task summaries, and a batch of claimed Telegram signals. Jev answers typed choice questions for:

- action: create, update, duplicate, ignore, or ask for data;
- urgency: normal, important, or urgent;
- an optional related open task.

Jev does not write files, call MCP tools, execute instructions from messages, or generate arbitrary mutations. flood.md constructs task fields deterministically and applies the result through the same store and policy gates as local automation. Action confidence below `0.78`, missing related-task references, and inconsistent answers become a visible clarification request rather than a mutation.

## Privacy and failure behavior

- Jev is opt-in and cloud-backed. The UI describes that boundary before selection.
- `Auto` remains local-only and cannot silently fall back to Jev.
- Requests time out after 15 seconds and are not retried by the adapter, preventing hidden repeated spend.
- API keys are redacted by construction and never enter request state.
- API, authentication, schema, and network failures leave events recoverable in the automation queue.
- The response model and token usage are retained in the run result for diagnostics; raw credentials are never retained.

The wire contract follows the official TypeSafe AI SDK: a bearer-authenticated `POST /v1/systemone` request containing `state`, named `questions`, and `model`.
