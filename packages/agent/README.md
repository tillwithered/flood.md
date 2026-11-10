# @flood-md/agent

Version-matched guidance for Flood React/Next.js projects. Read the installed
contract before composing screens. The 0.2.11 reference bundle includes spacing
guidance, routing and observable rules. These files grant
no authority to modify external services.

The optional `@flood-md/agent/inspect` export supplies inspectRenderedUI for
browser evaluation in local verification tooling. It reads the current rendered
DOM without mutation/network access and returns bounded observations, copy and
field geometry. See [rendered review](references/rendered-review.md) for execution,
privacy, limits and contextual review. The main knowledge-reader entry remains
Node-only. An empty observation list does not certify an interface's quality.
The same optional entry exports inspectSourceUI for bounded text observations
of host-owned JSX/CSS. It suggests owner review for native dialogs/controls and
custom layouts without reading files or executing source. Text matches can be
false positives or miss indirect code; see the rendered-review reference.

The package also exposes a Node-only, read-only knowledge API with TypeScript
declarations. No model provider, network service or MCP runtime is required.

```ts
import {createKnowledgeReader} from '@flood-md/agent';
const reader = createKnowledgeReader();
const context = await reader.info();
const page = await reader.list({kind: 'component', search: 'table'});
const material = await reader.read('component:data-table');
```

Follow nextCursor/nextOffset when present. Metadata is bounded separately from
material bodies; a selected body is checked against the matching package catalog.
The CLI adds host-version checks and preservation of project-owned guide copies.
knowledge.json contains semantic annotations; build generates dist/catalog.json
from the same canonical components, token manifest, guides and recipes used by
the website. Do not hand-edit generated hashes or duplicate component contracts.
See [Agent knowledge](../../docs/agent-knowledge.md) for groups, capabilities,
prerequisites, read budgets, compatibility and customization behavior.

The source bundle also includes thirteen routed workflows for the existing dark base:
composition, hierarchy, spacing, foundations, accessibility, forms, overlays, navigation,
data display, records, feedback, interface content and verification. The lightweight flood-ui entry selects
relevant skills; nested folders do not imply independent automatic discovery.
workflows.json describes applicability. rules.json describes observable checks;
neither is a completed component-audit report or executable enforcement engine.

| Source | Role |
| --- | --- |
| DESIGN.md | Shared versioned UI/component contract |
| SKILL.md | Short entry and task router |
| references/routing.md | Applicability, audience, prerequisites and governing source |
| references/composition.md | Screen/form composition workflow |
| references/flood-composition/SKILL.md | Full primitives-first composition skill routed from flood-ui |
| references/spacing.md | Measured spacing, density, nested geometry and hit areas |
| references/accessibility.md | Interaction and perception checks |
| references/customization.md | Scoped semantic customization |
| references/verification.md | Evidence before reporting completion |
| rules.json | Stable rule IDs with conditions, sources and observable checks |
| manifest.json | Source → installed-path mapping used by the CLI |
| workflows.json | Component-family applicability and routed full-skill sources |

CLI init copies every manifest entry into an unused owned path. Doctor checks
expected regular files without linked destinations. Neither tool rewrites host
instructions or proves agent compliance. The website serves these sources under
/agent/ after a build. Read only relevant references; installed declarations
govern available APIs. See [the human guide](../../docs/agents.md).

DESIGN.md includes concrete composition rules: intrinsic action widths,
responsive form parents, a close indicator/label pair, spacing between choices,
and keyboard/native form requirements. Always check the declarations of the
installed package before using APIs introduced by a later version.
See the user-facing [layout guide](../../docs/layout.md) for complete examples.

Manifest entry/rule guide paths identify package sources; manifest.files maps
them to project-root targets. installedEntry points directly to the project
skill. Keep manifest.version aligned with the package and DESIGN header.
