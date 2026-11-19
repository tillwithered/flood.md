# TokenInput

Use TokenInput for one editable text line with structured mentions or slash
commands. Use SuggestionTextarea for longer plain-text drafts. Use TagInput for
choosing separate values outside a text flow.

```tsx
import {TokenInput} from "@flood-md/react";

export function MessagePrompt() {
  return <TokenInput label="Message" name="message" suggestions={[
    {trigger: "@", id: "mia", label: "Mia Chen"},
    {trigger: "/", id: "summary", label: "Summary"},
  ]} />;
}
```

The value combines plain text parts and atomic tokens. Tokens have a stable
domain ID, display label and trigger (`@` or `/`). Use `onValueChange` to
accept the structured parts in a controlled editor. Press Enter to choose an
active suggestion or submit. A named form field serializes the accepted
parts as JSON. Copy and paste preserve tokens between compatible editors
and provide readable plain text to other apps. Undo and redo restore
structured edits. Ctrl/Command+Space reopens a dismissed suggestion match.

Use `resolveSuggestions` for asynchronous options and cancel work with the
supplied signal. The host owns permissions, command execution and message
delivery. Validate IDs again when consuming pasted tokens or submitted form
data.
