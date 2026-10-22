# @flood-md/cli

`npx @flood-md/cli init [--dry-run]` connects an existing React/Next.js npm project.
`npx @flood-md/cli doctor` checks package versions and agent file presence.

Requires Node 22.12+. Installs matching tokens, React and agent packages; creates
flood.json, flood/DESIGN.md and .agents/skills/flood-ui/SKILL.md. Refuses existing
owned files or linked destinations. Does not rewrite source code or AGENTS.md.
After init, import @flood-md/react/styles.css once at the application root.
