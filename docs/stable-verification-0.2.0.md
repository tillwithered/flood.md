# Stable 0.2.0 verification

The repository has one machine-verifiable entrypoint for the checks required before a Stable release:

```powershell
pwsh -NoProfile -File scripts/verify-stable.ps1
```

The command intentionally runs from a locked dependency install through a production desktop build. It verifies:

- `npm ci`, `npm run check`, and `npm run build`;
- `cargo fmt --all -- --check`;
- `cargo clippy --workspace --all-targets -- -D warnings`;
- `cargo test --workspace`;
- deterministic human-agent trust/safety evals without a model/network call;
- defensive boundary and redaction fixtures described in [security-audit-0.2.0.md](security-audit-0.2.0.md);
- a 1,100-task/100-run performance fixture with explicit Windows timing and peak-working-set budgets;
- the release `flood-mcp` binary;
- the MCP manifest, primary protocol, non-empty tool catalog, and catalog digest;
- the isolated MCP self-check;
- a production Tauri application build without installer bundling;
- SHA-256 hashes for the MCP and desktop binaries.

Successful verification writes bounded evidence to `target/stable-verification/evidence.json` and `performance.json`. The evidence contains build identity, MCP catalog identity, self-check summary, fixture sizes, timing/memory measurements, artifact sizes, and hashes. It does not contain project/task content, credentials, or environment values.

## Faster local iteration

After `npm ci` has already succeeded, dependency installation may be skipped:

```powershell
pwsh -NoProfile -File scripts/verify-stable.ps1 -SkipInstall
```

`-SkipTauriBuild` is only for targeted development diagnostics. It does **not** satisfy the Stable gate and must not be used by required CI or release jobs.

## CI and release behavior

The Windows CI job and tagged release job execute the same script without skip flags. A required command therefore cannot be silently omitted from a green release. Installer creation, signing, updater metadata, and installation/upgrade tests are enforced by the protected RC and tagged-release workflows described in [release-procedure.md](./release-procedure.md).
