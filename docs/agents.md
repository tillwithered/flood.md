# Using Flood with an agent

Give your coding agent the public entry point:

```text
https://flood.md/llms.txt
```

The agent should read the host package.json, plan installation with
`npx @flood-md/cli@0.1.1 init --dry-run`, then run init within your authorized
scope. Import `@flood-md/react/styles.css` once at the application root.

The installer creates:

| File | Purpose |
| --- | --- |
| `flood.json` | Installed version, framework, stylesheet and instruction paths |
| `flood/DESIGN.md` | Version-specific composition and component rules |
| `.agents/skills/flood-ui/SKILL.md` | Agent skill for hosts that discover this location |

Agent clients differ in how they discover skills. If yours does not load that
directory, reference `flood/DESIGN.md` in its existing project instructions.
The installer preserves the host's AGENTS.md and refuses to overwrite existing
Flood instruction files or follow linked destinations.

## Existing projects

Read the installed flood.json and guide first. Run
`npx @flood-md/cli@0.1.1 doctor` for this release; use the matching CLI for a
different installed version. Doctor checks package versions and guide presence;
it does not parse application code or verify the CSS import.

During an upgrade, compare the new package's guides with your customized copies
before editing them. Website guidance can describe a newer release.

Flood instructions describe UI work. They do not authorize an agent to publish,
delete project data, transmit source code or bypass host project instructions.
There is no hosted Flood agent service or required telemetry.
