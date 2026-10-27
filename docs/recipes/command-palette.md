# Command palette

Compose Dialog and CommandList when commands need a modal search surface. Keep
routing, permissions and business actions in your application. This is a project
recipe using the 0.2.7 source API, not another package export.

```tsx
"use client";

import { useState } from "react";
import { Button, CommandList, Dialog, FloodRoot } from "@flood-md/react";

export function CommandPalette({ onCommand }: { onCommand: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  function changeOpen(next: boolean) {
    if (next) setQuery("");
    setOpen(next);
  }

  return (
    <FloodRoot>
      <Dialog
        title="Commands"
        open={open}
        onOpenChange={changeOpen}
        trigger={props => <Button {...props} variant="subtle">Commands</Button>}
      >
        <CommandList
          label="Search commands"
          hideLabel
          query={query}
          onQueryChange={setQuery}
          items={[
            { id: "new-project", label: "New project", group: "Projects", keywords: ["create"] },
            { id: "recent-projects", label: "Recent projects", group: "Projects" },
            { id: "settings", label: "Open settings", group: "Workspace" },
          ]}
          onAction={id => {
            changeOpen(false);
            onCommand(id);
          }}
        />
      </Dialog>
    </FloodRoot>
  );
}
```

Import the Flood stylesheet once at your application entry. If this component
already lives inside FloodRoot, reuse that scope instead of adding another one.

Dialog owns modal focus, Escape, outside dismissal and trigger focus restoration.
CommandList owns filtering, grouped results and keyboard invocation. Opening the
palette clears its query; closing it does not execute a command. Escape stays
available to Dialog rather than being consumed by the search control.

`onCommand` identifies a host-owned action. It is not awaited: keep saving state,
errors and navigation in your application. An action may move focus to its own
destination; the layer should preserve that deliberate focus change.

Add a global shortcut only at the application boundary, with your own editing,
permission and nested-layer policy. Do not display a shortcut hint until that
shortcut actually works. No shortcut, router, fuzzy-ranking service or command
permission engine is installed by this recipe.
