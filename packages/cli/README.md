# @flood-md/cli

`npx @flood-md/cli init [--dry-run]` connects an existing React/Next.js npm project.
`npx @flood-md/cli doctor` checks package versions and agent file presence.

Version 0.2.11 adds read-only JSON discovery. Use the CLI version matching
flood.json; source availability does not mean the candidate is published.

```sh
npx @flood-md/cli@0.2.11 info
npx @flood-md/cli@0.2.11 catalog --kind workflow --group composition
npx @flood-md/cli@0.2.11 read component:data-table
npx @flood-md/cli@0.2.11 read recipe:table-bulk-actions
```

info distinguishes connected, bundle-only, version-mismatch and missing-packages
states. catalog/read refuse mismatched or incomplete connected installations.
All three commands return JSON; failures return structured JSON on stderr and a
nonzero exit code. They do not install, modify host files or fetch remote guides.
The npx runner itself may fetch the explicitly selected package.

catalog filters by kind, group and literal metadata search. Default pages contain
at most 12 entries; --limit accepts 1–50, within a 16 KiB output budget. Follow
nextCursor; a changed query or catalog invalidates an old cursor. read returns
one known ID, at most 10,000 Unicode code points by default (maximum 40,000).
Follow nextOffset using --offset to finish instructions; --links-offset pages
optional links separately. Required prerequisites are explicit in requires.

Copied guides default to project-owned content, identified by source, customized
and hashes. --source package compares canonical content without overwriting.
Missing/linked project copies fail explicitly. A modified flood/catalog.json
cannot redirect reads. See [Agent knowledge](../../docs/agent-knowledge.md)
for the complete protocol and limits.

Requires Node 22.12+. Installs matching tokens, React and agent packages; creates
flood.json and every owned guide listed in the matching agent manifest: DESIGN.md,
rules.json and manifest.json under flood/, plus SKILL.md and focused references
under .agents/skills/flood-ui/. Version 0.2.3 includes the expanded bundle and
spacing reference. Refuses existing owned files or linked destinations.
Does not rewrite source code, client settings or AGENTS.md.
After init, import @flood-md/react/styles.css once at the application root.
Wrap new interfaces in FloodRoot from @flood-md/react to select the dark
foundations profile. Read the installed flood/DESIGN.md for the matching API.
Read the skill's routing reference for the task/source/check matrix. Doctor checks
the complete guide set and package alignment; it does not validate application
behavior, CSS imports or agent compliance. Merge customized guide upgrades
deliberately; init has no overwrite mode.

Init and doctor reject linked project-directory ancestry. Init also requires a
regular nonlinked package.json (including no hardlinks), validates its project
object and React dependency, and rechecks paths after npm before owned writes.
These checks do not sandbox npm or stop an external process from racing filesystem
changes; run installs only in a trusted project and inspect npm failures.
