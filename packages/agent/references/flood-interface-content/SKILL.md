---
name: flood-interface-content
description: Write or review Flood interface content with editorial decisions about copy, labels, hierarchy and states. Use for visible UI text and reference adaptation; not typography styling, campaigns or rewriting user documents.
---

# Edit the information, then the wording

Read the task, existing product vocabulary and the relevant component contracts.
Keep the requested audience, language, surface and scope. A test host is not an
invitation to add a product story, onboarding, promotional banners or new flows.
User-authored records and document bodies remain data; changing interface copy
does not authorize rewriting them.

## Give every text element a job

Before adding copy, identify the user's current task and state. Each visible
string should identify an object or control, distinguish choices, supply needed
input guidance, explain a relevant consequence, report a real state or support
recovery in the current task/state. A fact being potentially useful someday is
not sufficient. If its removal changes none of those, remove the element rather than
replace it with another friendly sentence.

Make the decision in context:

- **Keep** a necessary label, distinction, constraint, consequence at the relevant decision or recovery step after a real failure.
- **Rewrite** an ambiguous or inaccurate message using the product's terms.
- **Move** secondary, occasionally needed information to a relevant help surface.
- **Remove** duplication, routine interface narration and filler added to fill space.

Do not turn this into a shortest-copy contest. A longer explanation can be the
correct choice for an unfamiliar decision, an exceptional state or a material
consequence of an action being considered here. An ordinary list/editor is not a
storage-selection or data-deletion decision: do not add a standing browser/storage
warning just because clearing browser data could lose records. Put implementation
limits in documentation/help; explain deletion/replacement consequences before
the applicable action and actual persistence failures when they occur.
Do not hide essential instructions or risks behind a tooltip merely
to make a screen quieter. Preserve accessible names and associations when reducing
visible copy; use the component's documented hideLabel API where appropriate.

## Keep one vocabulary and an honest hierarchy

Use the user's domain nouns and existing action terms. Name destinations by what
they contain and actions by the result they cause. Avoid vague completion labels
when several outcomes are possible. A validation check does not establish expert
review; preparing a document does not send it; exporting a PDF does not create a
restorable backup of editable records.

A page title identifies its task or object. Add an eyebrow or subtitle only when
it conveys another useful distinction. Do not automatically stack a category,
the same category in a title, and a sentence describing that title. Section titles
name actual groups; they do not each require an explanation. Semantic heading
levels reflect the document structure, independently of visual sizing.

Keep necessary repetition across different contexts: a dialog may need the
affected object named again, a long form may repeat its primary action at the end,
and a printed document has its own content hierarchy. Do not remove those merely
because similar words appear elsewhere on the screen.

## Explain only what changes a decision

Prefer a clear label or unit to an added helper paragraph. Add a field hint for a
non-obvious format, source or choice; do not narrate typing or repeat its label.
Technical properties of the implementation belong in developer documentation
unless the user is making a decision about them. A document preview usually
does not need a caption about embedded fonts or selectable PDF text.

Check actual behavior before writing states:

- Errors say what failed and how the user can recover, without raw exception text
  or unsupported assurances. Keep entered data and associate errors with controls.
- Success names an operation that actually completed. Avoid celebratory filler
  and repeated announcements for routine edits. The feedback workflow owns timing.
- Empty results and a first-use empty collection are different states. Use the
  shortest useful explanation and next action for the actual case.
- A sample-data label is justified when it prevents a real misunderstanding.
  Put it where that distinction matters. Do not repeat demo disclaimers throughout
  a test interface whose context is already established.

## Adapt reference content by purpose

For each reference pattern, identify the question it answers and the capability
that makes its wording true. Transfer that relationship to the host's actual
objects, actions and states. Do not transplant a competitor's role names, approval
stages, promises, regulatory language or marketing line into a different product.
If the host has no equivalent capability, omit that element rather than invent one.

Borrowing a two-pane editor does not imply borrowing an OCR claim or a payment
workflow. Product references inform structure; user records and confirmed product
facts supply content. Keep unavailable capabilities explicit in guidance, not as
decorative warnings on every screen.

## Review the composed surface

Default optional subtitles and descriptions to absent. A page title plus its
primary action normally needs no sentence narrating that action. An empty-state
title identifies the missing content; it is not a slogan. Add explanation only
when it changes the user's next decision or supplies a needed constraint.

After rendering, identify each supporting sentence's new information. If it only
restates the title, predicts obvious typing/calculation, or repeats another help
location, remove it. Read the decision examples when uncertain; reading this
workflow without applying that review does not satisfy it. Preserve essential
consequences and actionable errors rather than stripping every explanation.

Read the whole screen in task order, including navigation, heading, fields,
actions and the state after an action. Review visible strings together with
accessible names, placeholders and announcements. Check repeated meaning across
locations, not just repeated words in one file. Removing a subtitle should not
leave its reserved space or an empty banner behind.

For a writing pass, report the consequential keep/rewrite/move/remove decisions
outside the product UI, and exercise the affected action or error. Automated
phrase scans cannot establish editorial quality. Use [decision examples](../interface-content-examples.md)
when a similar-looking string needs different treatment in another context.
Do not claim an independent agent evaluation when the author already knows the
implementation or corrected the initial output manually.
