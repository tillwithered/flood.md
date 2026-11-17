# Code editor workspace

Use ResizablePanels for an editor and results that need to stay in view together. Keep Run beside the panel layout control and leave focus on the initiating control through execution. Cancel an in-flight request where supported, and preserve the last completed result while a replacement runs.

The host mounts the editor in the first panel. It supplies the current draft and handles syntax, schema completions, diagnostics, shortcuts and execution. Give the editor a programmatic name and let it consume its own completion keys before the host handles the run shortcut. Route errors to Results and preserve the editable draft.

[Try the query workspace](/playground/code-editor).

The example runs a single read-only query shape against a local review queue. Replace its textarea and executor with the application's editor adapter and authorized query endpoint.

<!-- flood:code-editor-workspace -->
