# Document review

Use TextRevision for an insertion, deletion or replacement within readable prose. Keep the decision controls in the discussion. Selecting an individual revision updates the document and the linked thread together. A thread can also be resolved or reopened independently of the decision.

Use TextAnnotation for comments on words that stay in the document. Link the
phrase and the focusable discussion by stable fragment IDs. Show the resolved
state on the same phrase so the thread can still be revisited.

Keep each revision ID, discussion ID and editor anchor separate. Go to text moves focus to the current anchor. If a document edit removes the anchor, keep the thread and tell readers where it was detached. Preserve replies and pending drafts when closing and reopening a discussion. The host owns document positions, revision application, conflict handling and persistence.

[Try the document review workspace](/playground/document-review).

<!-- flood:document-review -->

Verify both decisions, the resulting document text, keyboard focus after jumping from the discussion, and reopening a detached discussion. In a collaborative editor, only change the decision and resolution after the editor accepts the update.
