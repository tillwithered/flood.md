# Using Flood with an agent

Flood pairs a React design system with a workflow for agents building and
reviewing interfaces. Each release connects component contracts, runnable
recipes and focused skills through the same catalog.

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

For reusable components, the composition skill also routes to
[component families](../packages/agent/references/component-families.md): choose
the closest existing anatomy and compare sizing, shape, nested insets and states
in the same scene. Flood's repository instructions require that same guide for
its own authors. Installed projects receive it through the matching manifest and
knowledge catalog; existing customized guides are not silently overwritten.

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

For visual composition, look up `workflow:layout-composition` for shared
edges and grouping and `workflow:typography` for text roles and fit. Use
`workflow:decision-design` when a screen needs to support a consequential
choice, batch outcome or operational summary.

For an application with multiple destinations, start with
`workflow:application-structure`. It covers the shared page frame and visual
hierarchy, when work belongs in a page or an overlay, and the context that
should survive transitions between them.

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
it explicitly. For a client that reads project instructions such as `AGENTS.md`,
add a short trigger to the existing instructions at the scope where Flood is used:

```markdown
For UI work in this project, start at `.agents/skills/flood-ui/SKILL.md`.
Use the installed version to select the relevant rule, recipe and component.
For a new screen, identify the next useful action and what must survive it.
For a visible change, exercise the affected state in the running app and
include the observed outcome and evidence in your handoff.
```

Use the `installedEntry` path in `flood/manifest.json` if it differs. The
installer preserves `AGENTS.md`; add this trigger yourself if it suits your client.

## Review the running interface

When composing a new flow, start from a nearby recipe, check the installed
component contracts and apply the workflow for the task. For example, use the
[record management recipe](recipes/record-management.md) to see how a collection
preserves filters, scroll and focus around a detail Drawer and edit form.

For a visual issue, exercise the actual state and inspect the captured evidence.
If it repeats, check the smallest component or layout that can enforce the fix.
Add a browser assertion when behavior can be measured. Use the relevant workflow
or a runnable example for decisions that depend on the task, such as information
hierarchy or which details should stay visible. Use clean runs to test whether
agents discover and apply new guidance on another task.

When comparing Flood with another UI stack, give both agents the same user
task, fixture data and browser states. Keep model settings and time limits
comparable. Evaluate task success, recovery and rendered hierarchy with shared
criteria. Record use of Flood components and installed APIs separately from
the shared product criteria. Have a reviewer inspect the running results
without relying on the implementing agent's completion summary.

For a full-window AppShell route, use
[`assertWorkspaceScroll`](../packages/agent/references/rendered-review.md#require-workspace-scroll-in-browser-tests)
in the browser suite. Exercise both the populated and filtered states so
document scrolling fails the test on either state.

If the project requires that behavior before merge, run this test in a required
host CI check. Configure the check for the relevant routes and fixtures so a
missing route, missing test or failed browser launch cannot count as a pass.
Keep the workflow and changes to its coverage under host review. Use the same
test locally to give an agent a reproducible failure to fix.

For visual hierarchy, give the agent a specific decision to review: for example,
the page's primary action, the alignment of peer collection tools and the
findability of a quiet close control. Ask for the rendered state and observed
outcome in the handoff. An assertion about target bounds can settle geometry;
review the screenshot of the whole region to judge relative emphasis.

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
