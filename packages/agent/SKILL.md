---
name: flood-ui
description: Compose, customize or review React and Next.js interfaces using installed Flood components, tokens and form contracts. Use in a Flood project; not for unrelated frameworks or deployment.
---

## Start with the installed project

Read the host instructions, package.json, flood.json and flood/DESIGN.md from
the project root. Installed declarations decide which APIs exist. A newer web
page or repository example does not add exports to an older package. Run the
matching installed CLI's doctor when versions or guide files are uncertain.

The matching CLI's info command reports project/bundle scope and capabilities.
Use catalog to discover compact metadata by kind/group, then read a selected ID.
Read [knowledge discovery](references/knowledge.md) when using these commands or
extending Flood's knowledge. Complete paginated selected instructions before
acting; metadata, related links and capability declarations are not executed checks.

Import @flood-md/react/styles.css once; compose new dark interfaces in FloodRoot.
Use Flood's existing components before introducing a local adapter. Keep user
scope and host conventions; missing Flood behavior must be stated rather than
invented as a package API. No external component library or parallel token system.

## Read only the relevant reference

For a new screen, read the composition and interface-content workflows below
before the first JSX. Discover owners in the installed catalog before choosing
familiar low-level controls. Keep a short role → selected component → consulted
contract record in the development notes, outside the interface. A supplied guide
or a remembered export is not evidence that its contract was read.

Before delivery, review the actual screen against those choices and the content
workflow. Optional subtitle, description and hint slots start empty; fill one
only for information the user needs beyond the title or control itself.

For a new screen or composed form, read the hierarchy workflow to choose visual
roles, shared tracks and relationship spacing. For a composed form, also read the forms workflow's grouping section; independent
per-row grids do not establish a coherent hierarchy. For icon-bearing controls,
use the foundations workflow. During browser verification use the optional
[rendered review observer](references/rendered-review.md) and review its findings.
It cannot replace the separate copy and grouping decisions.
For save, upload or other fallible operations, read the feedback workflow too:
message lifetime belongs to the operation/record, not merely the page's Alert.

| Work | Read next | Required result |
| --- | --- | --- |
| Introducing or editing interface copy, labels, hierarchy or adapting a reference | [Interface content skill](references/flood-interface-content/SKILL.md) | Necessary, accurate content with a clear job; no invented capabilities or redundant narration |
| Component, composite, website or playground UI | [Composition skill](references/flood-composition/SKILL.md) | Reused primitives; missing small capabilities implemented before composites |
| New screen, layout or form | [Composition](references/composition.md) | Existing primitives, correct host width and form ownership |
| Task/group/field hierarchy, flat forms or inconsistent row tracks | [Hierarchy skill](references/flood-hierarchy/SKILL.md) | Distinct roles, shared control edges and deliberate vertical rhythm |
| Spacing, density, nested geometry or shifting previews | [Spacing skill](references/flood-spacing/SKILL.md) | Measured visual relationships and nonoverlapping interactive areas |
| Existing dark surfaces, type, control and icon sizing | [Foundations skill](references/flood-foundations/SKILL.md) | Correct semantic roles and coherent consumers |
| Keyboard, names, focus, perception or reflow | [Accessibility skill](references/flood-accessibility/SKILL.md) | Real interaction and associations preserved |
| Field ownership, validation, submission and reset | [Forms skill](references/flood-forms/SKILL.md) | Actual form values and accepted/refused transitions |
| Popup, dialog, drawer or nested layer | [Overlays skill](references/flood-overlays/SKILL.md) | Appropriate geometry, dismissal and focus ownership |
| Destinations, panels, disclosure or hierarchy | [Navigation skill](references/flood-navigation/SKILL.md) | Navigation, selection and expansion kept distinct |
| Tables, lists, cards, files and long content | [Data display skill](references/flood-data-display/SKILL.md) | Meaningful structures and reachable overflow |
| Status, progress, alerts, loading or empty content | [Feedback skill](references/flood-feedback/SKILL.md) | Honest operation state with one announcement owner |
| Brand or deliberate semantic overrides | [Customization](references/customization.md) | Scoped semantic overrides; unchanged behavior |
| Completion, stabilization or regression review | [Verification skill](references/flood-verification/SKILL.md) | Checks and limits reported against the actual host |
| Decide which document governs a change | [Routing and sources](references/routing.md) | Source of truth and prerequisites identified |

The project-root flood/rules.json lists stable rule IDs and their observable
checks; it is an index, not executable policy. At completion report which checks
ran, their result and any unverified behavior. Doctor checks installation only.
Guidance cannot guarantee an agent's compliance or certify application accessibility.

The workflow index lists component-family applicability, not a requirement to load
every skill or proof that a component passed its checks. These specialized skills
are routed references inside flood-ui; independent discovery of nested folders
is not assumed. Resolve sources through the installed manifest when needed.

Preserve existing instructions and customized guides. This skill authorizes no
deployment, deletion, external messages or sending host source to other services.
