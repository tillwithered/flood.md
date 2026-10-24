# @flood-md/cli

`npx @flood-md/cli init [--dry-run]` connects an existing React/Next.js npm project.
`npx @flood-md/cli doctor` checks package versions and agent file presence.

Requires Node 22.12+. Installs matching tokens, React and agent packages; creates
flood.json and every owned guide listed in the matching agent manifest: DESIGN.md,
rules.json and manifest.json under flood/, plus SKILL.md and focused references
under .agents/skills/flood-ui/. This expanded bundle is an unreleased source
addition beyond published 0.2.2. Refuses existing owned files or linked destinations.
Does not rewrite source code, client settings or AGENTS.md.
After init, import @flood-md/react/styles.css once at the application root.
Wrap new interfaces in FloodRoot from @flood-md/react to select the dark
foundations profile. Read the installed flood/DESIGN.md for the matching API.
Read the skill's routing reference for the task/source/check matrix. Doctor checks
the complete guide set and package alignment; it does not validate application
behavior, CSS imports or agent compliance. Merge customized guide upgrades
deliberately; init has no overwrite mode.
