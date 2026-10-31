# Using Flood with an agent

Start with the host's instructions, package.json, flood.json and installed
flood/DESIGN.md. Use matching package/CLI versions and declarations. A newer
website example does not add APIs to an older installation.

Version 0.2.3 includes the expanded skill, rules and reference bundle, including
spacing guidance. Existing projects keep their installed files; compare new
guidance before updating customized instructions.

Version 0.2.9 adds ten specialized routed skills for stabilizing and
composing the dark base. See [Skills](skills.md) for their applicability and full
sources. The website index is generated from the same bundle metadata rather
than a second handwritten skill catalog. Source additions do not update an
already installed package; use the guide set matching your installation.

Version 0.2.11 adds [versioned knowledge discovery](agent-knowledge.md):
info reports installation context, catalog discovers compact metadata, and read
loads a selected contract or workflow. The catalog includes typed recipes and
semantic token records. Unknown capabilities and version mismatches are explicit;
copied host guides remain project-owned.

For discovery, give an agent [flood.md/llms.txt](https://flood.md/llms.txt).
It identifies deployed status and entry points. Follow [installation](installation.md);
preview the matching CLI's init with --dry-run before applying it within the user's
scope. The CLI does not install an agent runtime or require a hosted Flood service.

## Compose from primitives

Flood includes the [Flood composition skill](../packages/agent/references/flood-composition/SKILL.md).
The main Flood skill routes component, website and playground work to it. The
manifest installs the full skill under
`.agents/skills/flood-ui/references/flood-composition/SKILL.md`; it is loaded by
that router rather than relying on independent discovery of nested skills.
Existing installations must compare and merge new guidance deliberately.

Reuse the existing library component; fix the relationship in its proper owner.
If a reusable primitive is missing, build or extend it before the composition.
Do not replace StatusIndicator with custom text, hide its anatomy, or duplicate
a Badge/Progress/Dialog implementation just to make one layout fit.

## Files and responsibilities

| Project file | For whom / when | Prerequisite | Source of truth | What to check |
| --- | --- | --- | --- | --- |
| flood.json | Developer / agent, setup or upgrade | Existing React project | Exact installed release, framework and paths | Matching CLI doctor |
| flood/DESIGN.md | Designer / developer / agent, every composition | Installed declarations | Version-matched UI contracts | Supported props and rendered states |
| .agents/skills/flood-ui/SKILL.md | Skill-aware client, Flood UI work | Project context | Short task router | Load only the relevant reference |
| references/routing.md in the skill folder | Human / agent, resolve ownership | Matching guide set | Responsibility and source matrix | Correct source and prerequisites |
| references/composition.md in the skill folder | Screen/form author | User content and installed APIs | Composition workflow | Intrinsic actions, responsive forms, close choice labels |
| references/spacing.md in the skill folder | Designer / developer / agent | Installed tokens and rendered host | Spacing and density decisions | Visible gaps, row pitch, wrapping and nonoverlapping touch targets |
| references/accessibility.md in the skill folder | Control author / reviewer | Runnable host | Interaction and perception | Names, keyboard, focus, forms and contrast context |
| references/customization.md in the skill folder | Theme author | Installed token manifest | Semantic override workflow | Resolved roles and affected states/surfaces |
| references/verification.md in the skill folder | Developer / reviewer, completion | Host checks | Evidence requirements | Commands, manual results and gaps |
| flood/rules.json | Human / agent / project tooling | Same bundle | Rule IDs, conditions, sources and checks | Evidence for each applicable rule |
| flood/manifest.json | Installer / reviewer | Matching package | Explicit source → project-path mapping | Complete files; existing files preserved |
| workflows.json in the skill folder | Agent / reviewer, task selection | Same installed bundle | Workflow applicability | Read relevant skills; applicability is not behavioral proof |

Manifest `entry` and rule `guide` paths are package-source paths. Resolve them
through `manifest.files`: each source maps to a target relative to the host
project root. `installedEntry` names the installed skill directly. Manifest
version and DESIGN header are checked by doctor alongside package alignment;
customized guide contents are preserved and must be merged deliberately.

The package publishes DESIGN.md, SKILL.md, rules.json, manifest.json and
references/*.md. The website exposes the same sources under /agent/.
The [routing reference](../packages/agent/references/routing.md) connects each
question with its governing source and verification method.

## Use only the context needed

For a settings form, read DESIGN.md and SKILL.md, then composition/accessibility.
Consult installed declarations for actual Field/Select props and read only those
component pages. Before completion use verification. For a color-only change,
load customization and the relevant token roles; unrelated guides stay unloaded.

Clients supporting the skill-folder convention can discover it. Others can read
it explicitly or link it from existing instructions. The installer preserves
AGENTS.md; it does not configure clients or guarantee automatic discovery.

The rules index is data, not an executable policy engine. It cannot make an agent
obey guidance or certify accessibility. Host checks and Flood's repository
verification supply evidence. Doctor checks package alignment and expected regular
files; it does not parse CSS imports or assess visual quality/completed user flows.

## Safe installation and upgrades

Init refuses existing owned files and linked destinations before npm runs, then
rechecks after installation. During upgrades compare new package sources with
installed copies, merge deliberately and retain host requirements. Do not delete
customized guides merely to make init succeed.

Import @flood-md/react/styles.css once and compose new dark interfaces in
FloodRoot. See [layout](layout.md), [components](components.md) and
[customization](theming.md). Flood guidance governs UI use; it grants no authority
to publish, delete data, transmit source or bypass the user's instructions.
