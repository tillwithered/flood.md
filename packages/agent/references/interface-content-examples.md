# Interface content decisions

These examples explain context, not a forbidden-word list or fixed word budget.
Keep the user's language, task and domain vocabulary.

| Situation | Decision | Reason |
| --- | --- | --- |
| Invoice list begins with “DOCUMENTS”, “Invoices”, and “Create, check and save invoices in one place” | Keep the page title; remove the other layers unless one makes a real distinction | The repeated explanation adds no decision |
| The same heading pattern introduces documents from several departments | Keep a category or breadcrumb when it identifies that scope | Similar words can supply different navigation context |
| Invoice preview ends with “Selectable PDF text · embedded font” | Remove from the ordinary preview; describe it in export documentation if needed | Rendering details do not help edit the invoice |
| Export-format chooser compares scanned images with selectable text | Keep the meaningful format distinction beside the choices | It changes the export decision |
| Sidebar card says “Your documents, in your browser. Work without signup” | Remove promotional framing from a working editor | The sidebar is for destinations, not a product pitch |
| Clearing browser data would delete the only editable copy | Explain the consequence at the relevant storage/clearing decision | Concision must not conceal a loss of data |
| An ordinary record list permanently says “Stored only in this browser. Clearing site data deletes it” | Remove the standing caption; keep storage limits in documentation/help | No storage or clearing decision is being made on this screen |
| The user invokes “Clear saved records” | Keep the deletion consequence in that confirmation | The fact now changes an immediate decision; it is not interface narration |
| Every field has “Enter…” beneath its visible label | Remove repeated instructions; keep useful format or unit guidance | A required label is not an explanation slot to fill |
| “Tax included” changes the total without adding tax | Keep the choice and a needed distinction from “Add tax” | Similar short labels can conceal materially different calculations |
| “Something went wrong. Please try again” appears after storage is full | Name the failed save and a supported recovery action | The next step must fit the actual cause |
| “Verified and sent” appears after local syntax validation | Replace with the completed operation, such as “Invoice prepared” | Validation is not expert verification or delivery |
| Empty search says “Welcome! Start your journey…” | State that there are no matches and offer a relevant reset | The collection already exists; this is a filtered result |
| A test host repeatedly explains that its records are samples | Remove redundant disclaimers when the test context is already established | Test provenance can live in the test brief |
| An explicitly requested local prototype has a permanent Demo badge in its sidebar | Remove the badge and its otherwise empty wrapper; retain provenance in README/test handoff | Development context is not an operational state or decision |
| A working interface switches between simulated output and real external effects | Keep an accurate distinction at the choice or affected action, if this capability exists | The environment changes what the action does; do not invent a mode solely to justify a label |
| A record is Draft or a camera is Offline inside a prototype | Keep the meaningful record state | Removing prototype narration is not permission to strip operational information |
| A mixed production list includes sample records that could be mistaken for real ones | Keep a clear sample distinction on the affected records | It prevents a concrete misunderstanding |
| A printed invoice has a document title, number and party headings | Keep the meaningful document hierarchy | A document is not the application's decorative page header |

## Contextual adaptation

A bill-processing reference may group records by draft, approval and payment.
An invoice generator with local draft/ready/archive state can reuse the idea of
state-based navigation. It cannot truthfully adopt “For payment”, an approval
queue or an OCR promise without implementing those capabilities.

Choose the host's action vocabulary deliberately. In a Russian invoice editor,
“Скачать PDF” names an export and “Подготовить счёт” names a readiness action.
“Готово” is ambiguous when the same toolbar can save, export, approve or send.
In a simple selection dialog, “Готово” may be sufficient. Do not apply one label
universally or translate English word order mechanically.

## A bounded review

For an interface-writing task, inspect the supplied surface and state the user's
task. Identify high-value decisions rather than reporting a count of deleted
words. Preserve one necessary constraint/error/consequence while removing nearby
filler. Check the affected action after editing. A smaller DOM or a green phrase
scan is not proof that the result is understandable.
