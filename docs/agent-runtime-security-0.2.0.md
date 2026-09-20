# Agent runtime and security boundary — 0.2.0

Local providers implement one `AgentProviderAdapter` contract: discovery, descriptor/capabilities, start or resume, normalized result/usage/failure, and interrupt. Codex, Claude Code, and Gemini keep their process arguments and payload parsing inside their adapters. A caller must inspect the versioned capability descriptor; Flood does not emulate missing image, resume, structured-result, usage, interrupt, or model-identity support.

Each executed turn gets an immutable `WorkPacketReceipt` before provider launch. It identifies the run/turn, exact task/project versions, context manifest and digest, token budget, purpose, allowed actions, provider/version/capabilities, sandbox, permissions, and canonical working directory. Full private prompts and transcripts are not duplicated into receipts.

## Process boundary

- The working directory must canonicalize to an explicitly agent-enabled repository or directory in the project.
- Provider commands inherit only the small OS/path/temp/certificate allowlist required to start. Arbitrary environment variables and secrets are not forwarded.
- stdout and stderr are bounded; only normalized progress, usage, result, or a short error is persisted.
- Child PIDs are tracked. Cancel, disabling active Beta automation, application exit, and timeouts terminate the process tree on Windows.
- Startup marks formerly running processes `interrupted`; it never presents a dead process as running.
- Background automation is off by default, batched, lease/retry bounded, hard-token-limited, and cannot perform external/destructive writes.

## Human control

Run state and task state are independent. `accept result` never completes the task. Agent-suggested project knowledge stays a versioned proposal until explicit Apply; Reject is persistent; stale proposals conflict. External content remains data and cannot expand the receipt's permissions.

## Diagnostics

The safe diagnostic report contains bounded counts, states, timestamps, provider IDs and correlation IDs. It omits workspace text, messages, prompts, raw tool output, error detail, credentials, and local paths. No cloud telemetry is required.
