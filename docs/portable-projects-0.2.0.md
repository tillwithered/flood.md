# Portable project export/import — 0.2.0

A project export is a ZIP containing `flood-project-export.json` plus the canonical project directory under `project/`. The manifest records schema version, export time, stable project ID/version, relative file paths, sizes, and SHA-256 hashes.

Included data is limited to project-owned Markdown, tasks, attachments, bounded history and project knowledge proposals. Global integration state, credentials, Telegram/provider sessions, runtime files, caches, process output, and automation queues are outside the project directory and cannot enter the archive.

Import rejects unsafe paths, symlinks, excessive file counts/sizes, missing or extra files, hash mismatches, invalid Markdown, project identity/version mismatch, and task references to another project. Stable IDs and versions are preserved only when they do not collide. An existing project/task ID returns an explicit conflict report and writes nothing; import never silently overwrites or invents a remap.

Whole-workspace backup/restore remains a separate recovery operation. Portable project export is for ownership and transfer, not credential migration.
