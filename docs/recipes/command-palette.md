# Command palette

Use CommandPalette for a workspace-wide page finder or a set of searchable
commands. It shares filtering and keyboard behavior with CommandList and uses
Dialog for modal focus and dismissal. CommandPalette is available in the
unreleased 0.2.11 candidate.

```tsx
"use client";

import { Button, CommandPalette, FloodRoot } from "@flood-md/react";

export function WorkspaceSearch({ onNavigate }: { onNavigate: (id: string) => void }) {
  return (
    <FloodRoot>
      <CommandPalette
        title="Go to page"
        searchLabel="Search pages"
        placeholder="Search pages…"
        emptyMessage="No matching pages."
        trigger={props => <Button {...props} variant="subtle">Go to page</Button>}
        items={[
          { id: "projects", label: "All projects", group: "Projects" },
          { id: "assigned", label: "Assigned to me", group: "Projects", keywords: ["mine"] },
          { id: "inbox", label: "Inbox", group: "Workspace" },
        ]}
        onAction={onNavigate}
      />
    </FloodRoot>
  );
}
```

Import the Flood stylesheet once. Keep the trigger inside the existing FloodRoot.
Translate the dialog title, search label, placeholder, close label and state
messages. The title and search label remain available to assistive technology.
Use comfortable density by default and compact density for denser workspaces.

Opening focuses the search input. Arrow keys move through available results.
Enter or click calls the host action and requests closure. Escape, the close
button and optional outside dismissal close without invoking an action. Use
open/onOpenChange when the host owns visibility. A local query starts from
defaultQuery on each opening. For a controlled query, the host owns persistence
and reset. Set loading while replacing results asynchronously. The application
owns requests, permissions, actions, routing and any global shortcut.
