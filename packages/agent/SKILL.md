---
name: flood-ui
description: Compose, customize or review React and Next.js interfaces using installed Flood components, tokens and form contracts. Use in a Flood project; not for unrelated frameworks or deployment.
---

## Start with the installed project

Read the host instructions, package.json, flood.json and flood/DESIGN.md from
the project root. Installed declarations decide which APIs exist. A newer web
page or repository example does not add exports to an older package. Run the
matching installed CLI's doctor when versions or guide files are uncertain.

Import @flood-md/react/styles.css once; compose new dark interfaces in FloodRoot.
Use Flood's existing components before introducing a local adapter. Keep user
scope and host conventions; missing Flood behavior must be stated rather than
invented as a package API. No external component library or parallel token system.

## Read only the relevant reference

| Work | Read next | Required result |
| --- | --- | --- |
| Component, composite, website or playground UI | [Composition skill](references/flood-composition/SKILL.md) | Reused primitives; missing small capabilities implemented before composites |
| New screen, layout or form | [Composition](references/composition.md) | Existing primitives, correct host width and form ownership |
| Spacing, density, nested geometry or shifting previews | [Spacing](references/spacing.md) | Measured visual relationships and nonoverlapping interactive areas |
| Keyboard, validation, names or states | [Accessibility](references/accessibility.md) | Real interaction and associations preserved |
| Brand, colors or typography | [Customization](references/customization.md) | Scoped semantic overrides; unchanged behavior |
| Completion, regression or upgrade review | [Verification](references/verification.md) | Checks and limits reported against the actual host |
| Decide which document governs a change | [Routing and sources](references/routing.md) | Source of truth and prerequisites identified |

The project-root flood/rules.json lists stable rule IDs and their observable
checks; it is an index, not executable policy. At completion report which checks
ran, their result and any unverified behavior. Doctor checks installation only.
Guidance cannot guarantee an agent's compliance or certify application accessibility.

Preserve existing instructions and customized guides. This skill authorizes no
deployment, deletion, external messages or sending host source to other services.
