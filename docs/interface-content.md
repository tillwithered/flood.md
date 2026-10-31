# Interface content

Flood's interface-content workflow covers the information and wording in a UI:
labels, actions, hierarchy, hints, states and adaptation of reference content.
It is separate from typography sizing. Use it when introducing visible copy or
reviewing an existing interface; it does not authorize rewriting user documents.

## Start with the task

Identify the user, their current task and the state they are in. Give each text
element a purpose: identify, distinguish, guide, explain a relevant consequence,
report a real state or support recovery. Keep, rewrite, move or remove it based
on that purpose. A component's optional description prop is not a requirement to
write a description.

An invoice list can simply be titled “Invoices”. A category label, the same noun
in a heading and a sentence describing the obvious workflow need separate reasons
to remain. Necessary breadcrumbs, section headings and the printed document's
own title still have valid jobs; there is no universal maximum heading count.

During completion, review each supporting sentence in screen order and record
its new information. If it only narrates the obvious next action, leave the
optional slot empty. The optional @flood-md/agent/inspect browser observer can
inventory copy and geometry; it cannot judge whether a sentence belongs in the
product. See [rendered review](/agent/references/rendered-review.md).

## Concise content keeps necessary detail

Remove routine narration, decorative assurances and implementation facts that do
not affect the task. An ordinary preview does not need to announce its embedded
fonts. An export-format choice may need to explain selectable text. A field may
need a non-obvious unit or constraint. A destructive action may need a clear
consequence. Do not hide essential information just to reduce visible text.

Name actions by their actual result and preserve accessible names. An error
should support recovery; success must match a completed operation. Local
validation does not establish expert review. A PDF export is not a restorable
backup of editable records. Sample-data distinctions belong where they prevent
a real misunderstanding, rather than repeated throughout an established test host.

## Learn from references in context

Transfer the question a pattern answers, then use the host's actual objects,
actions and states. A bill-processing product's approval or payment stages do
not become capabilities of an invoice generator because their layout is useful.
Its promotional language is not a vocabulary for the host's working interface.

See the full [interface content skill](/agent/references/flood-interface-content/SKILL.md)
and [decision examples](/agent/references/interface-content-examples.md). The
matching installed CLI can discover and read workflow:interface-content. This
additive guidance is part of 0.2.10; installed projects
keep their current versions and customized guide copies.

## Review the result

Read the composed screen in task order. Check visible and accessible copy,
repeated meaning across regions and the state after an action. Remove empty
wrappers or reserved gaps when a subtitle or banner is removed. Explain important
editorial decisions in the review, rather than adding those explanations to the UI.
Phrase scans and word counts cannot establish content quality or agent compliance.

Further reading: [Fluent content design](https://fluent2.microsoft.design/content-design)
relates content to user intent and timing; [DWP hint guidance](https://design-system.dwp.gov.uk/guidance/hint-text)
asks whether a hint is needed; [GOV.UK error messages](https://design-system.service.gov.uk/components/error-message/)
connect failure to recovery. These inform the workflow; their service-specific
wording and punctuation conventions are not universal Flood rules.

## Prototype context

An explicitly requested local prototype does not require a permanent Demo or
Prototype badge in the shell. Keep provenance and implementation limits in its
README/test handoff. A visible distinction still belongs beside an affected
record, choice or action when it changes interpretation, such as sample records
mixed with real data or an existing simulation/live choice. Preserve accurate
action and media names; removing a badge does not imply real connectivity or
delivery. Draft, Pending and Offline remain meaningful record states.
