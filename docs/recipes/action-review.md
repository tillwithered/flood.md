# Review a proposed action

Show the operation, the affected object and the arguments before asking for a decision. Keep the proposal visible after a failed submission so the reviewer can retry. Separate sending a decision from the action's execution result. Re-open a changed proposal only after the host supplies its new revision.

Use a short confirmation for one clear action. Use a panel or a page with an inspectable payload when reading the details takes time. Scope approval to the exact proposal ID and revision. Keep permissions, editable arguments and execution in the application.

<!-- flood:action-review -->

Supply the editor only when editing is allowed, validate the edit with the action schema, and send it as its own decision. Mount by proposal ID and revision so a changed proposal cannot inherit the previous editor. Exercise error recovery, expiration, proposal replacement and keyboard access to long arguments. On a successful decision the next action should reflect what the host actually knows. Execution can be queued, running, succeeded or failed after the review is accepted.
