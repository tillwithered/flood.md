# Using Flood with an agent

Read flood.json and the installed flood/DESIGN.md before editing an existing
project. Use the matching package and CLI version. This guide describes **0.2.2**;
existing 0.1.1 projects retain their earlier version-specific component guide.

For public installation, give an agent https://flood.md/llms.txt. That endpoint
tracks the deployed release. Start with `npx @flood-md/cli@0.2.2 init --dry-run`,
then follow [installation](installation.md) and the matching package's agent files.

## Versioned files

| File | Purpose |
| --- | --- |
| flood.json | Installed version, framework, stylesheet and instruction paths |
| flood/DESIGN.md | Matching composition and component rules |
| .agents/skills/flood-ui/SKILL.md | Skill for clients that discover this location |

The installer preserves AGENTS.md and refuses to overwrite its owned files or
follow linked destinations. If the client does not discover the skill, reference
flood/DESIGN.md in its existing instructions. During upgrades, compare the new
package files with customized copies; do not overwrite host-specific rules.

## 0.2 composition

Import @flood-md/react/styles.css once and compose inside FloodRoot for the dark
foundations profile. Use Text/Heading and Stack/Inline/Surface before adding
ad hoc layout CSS. Prefer subtle standalone secondary actions; ghost needs a
clear parent. Preserve Field's associations, native form behavior, visible
labels, keyboard focus and relative type/geometry. No light foundations profile
or third-party component implementation is supplied.

Flood instructions govern UI work. They do not authorize publication, deletion,
source transmission or bypassing host instructions. There is no required hosted
Flood agent service or telemetry. Doctor checks versions and files; it does not
verify application code, CSS imports or completed user flows.
