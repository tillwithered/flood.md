# Route work to its source

Read the host's instructions before Flood guidance. User requirements define the
task; Flood's contracts explain supported implementation. These files do not
override user authority or grant permission for unrelated operations.

| Question / when | Audience | Prerequisite | Source of truth | Verify with |
| --- | --- | --- | --- | --- |
| What needs saying? New or edited interface copy and reference adaptation | Designer / developer / agent | User task, product vocabulary and actual capabilities | flood-interface-content/SKILL.md | Contextual keep/rewrite/move/remove decisions; meaningful hierarchy; preserved recovery and accessible names |
| Which primitive owns this role? Component/composite UI work | Developer / agent / reviewer | Matching catalog and component anatomy | flood-composition/SKILL.md | Reuse existing primitives; extend small capabilities first |
| Which API can I import? Every component edit | Developer / agent | Installed exact versions | Installed @flood-md/react declarations; flood.json | Type-check host imports; CLI doctor for alignment |
| What does this release mean? Setup / upgrade | Developer / agent | Matching guide | flood/DESIGN.md, package changelog | Compare version and declarations; preserve host edits |
| How should a screen fit together? Screen / form work | Designer / developer / agent | Scope, content and current API | composition.md; host layout requirements | Narrow/wide rendered screen and native form interaction |
| Why does spacing look wrong? Density / nested geometry | Designer / developer / agent | Installed tokens and actual wrapper tree | spacing.md; host content hierarchy | Measured visible gaps, row pitch, text reflow and touch targets |
| What must remain accessible? Control/state work | Developer / reviewer / agent | Named controls and actual host context | accessibility.md; installed component contract | Keyboard, accessible names, validation and focus checks |
| How can appearance change? Theme / density work | Designer / developer / agent | Existing semantic roles | customization.md; installed token manifest | Inspect resolved roles, contrast and reflow |
| Is this done? Completion / regression | Reviewer / agent | Runnable host and checks | verification.md; project scripts | Report commands, manual checks and gaps |
| Which rules apply? Planning / review | Human / agent / tooling | Same installed guide set | flood/rules.json | Rule IDs linked to evidence, not a blanket pass |

References are beside this file. In an initialized project the contract and
rules are under project-root flood/. On the website these files are under
/agent/references/ and /agent/. Use installed files for existing applications;
the deployed website describes its own source/release status.

For exact per-component examples and API tables, read the matching component
Markdown page. Do not load every component page or all references by default.
Public source catalog/declarations generate website API tables during builds;
the website is not a replacement for the host's installed declarations.
