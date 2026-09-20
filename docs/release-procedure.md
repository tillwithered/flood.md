# Release procedure

Signing material exists only in the protected GitHub Actions `release` environment. Never copy the private updater key, password, Telegram credentials, or connector configuration into the repository, artifacts, or logs.

## Release candidate

1. Run **Release candidate dry run** manually from the commit intended for release.
2. The workflow runs the single Stable gate, validates package/Tauri/Cargo versions and updater configuration, builds a signed NSIS bundle, then downloads the latest public Stable and exercises install → upgrade → bundled MCP identity → uninstall in a disposable directory.
3. Keep its installer, updater signature, hashes, and `target/stable-verification/evidence.json` as bounded RC evidence. The workflow does not publish a release.
4. Resolve every P0/P1 defect before creating a Stable tag.

## Stable tag

1. Set the same SemVer in `package.json`, `Cargo.toml` workspace metadata, and `src-tauri/tauri.conf.json`.
2. Create `v<version>` only from the reviewed commit that passed the RC gate.
3. The protected Release workflow repeats Stable verification, builds a draft release, downloads the latest public Stable installer, and exercises install → upgrade → bundled MCP identity → uninstall.
4. The draft is published only after NSIS/updater artifacts and signatures are present. Failed verification leaves the draft unpublished and the previous Stable/update endpoint intact.

Tauri updater signatures are mandatory and verified against the public key embedded in the application. The release workflow validates that updater artifacts are generated; the private key is never available to local builds unless the developer explicitly supplies their own environment.

## Data safety

- Install and uninstall smoke checks use a disposable application directory.
- Uninstall must not delete the user data directory.
- Schema migrations remain forward-safe and are tested through the same public-Stable upgrade path.
- A failed draft, installer, or updater check is not a release and must not replace `latest.json`.
