# Chat starter

Use MessageScroller with one ChatMessage per turn and one MessageComposer for the draft. Keep message IDs stable while text streams. History, the draft, cancellation, and the provider connection belong to the host.

<!-- flood:chat-starter -->

The example runs locally with scripted replies. It streams text, stops generation, copies a completed answer, and keeps conversation history in the browser. Run the Next example and open `/chat-starter` to try it as a page. The recipe accepts a `respond` function that returns an async iterable and accepts an AbortSignal. For a service-backed chat, connect that function to your own authenticated streaming route and keep credentials on the server.

Use CharacterAvatar where you need stable illustrated identities. Supply a persistent, opaque seed for each identity. To offer a shuffle action, create its new seed when the user activates the action and persist the selected seed alongside their profile.

Follow new text while the reader is at the latest message. Scrolling away preserves the reading position and exposes a way back. Put high-level progress and completion outside the streaming transcript so each new fragment does not become a live announcement.
