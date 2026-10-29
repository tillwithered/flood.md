# @flood-md/agent

Version-matched guidance for Flood React/Next.js projects. Read the installed
contract before composing screens. The 0.2.9 reference bundle includes spacing
guidance, routing and observable rules. These files grant
no authority to modify external services.

The source bundle also includes ten routed workflows for the existing dark base:
composition, spacing, foundations, accessibility, forms, overlays, navigation,
data display, feedback and verification. The lightweight flood-ui entry selects
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
