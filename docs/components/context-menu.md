# ContextMenu

ContextMenu applies Flood's Menu action/preference/submenu model to a content
region. It opens from a native context-menu event at the pointer position, or
from ContextMenu / Shift+F10 while the region or one of its controls has focus.
Available in the unpublished 0.2.7 candidate.

```tsx
import {Button, ContextMenu} from "@flood-md/react";

<ContextMenu
  label="Document actions"
  items={[
    {id: "open", label: "Open"},
    {id: "export", type: "submenu", label: "Export", items: [
      {id: "pdf", label: "PDF"},
      {id: "text", label: "Plain text"},
    ]},
  ]}
  onAction={id => handleAction(id)}
>
  <Button variant="subtle">Document</Button>
</ContextMenu>
```

The ref points to a named root div with group semantics. Its default `tabIndex=0` makes an otherwise
noninteractive region available for keyboard context activation; choose a host
tab order deliberately when its children already provide an appropriate stop.
No hidden synthetic trigger is inserted. On close, focus returns to the actual
focusable source control or the region. Pointer-triggered positioning uses that
document's viewport coordinates and the shared overlay collision logic; keyboard
activation anchors beside the focused source. Popups remain inside viewport
bounds and escape clipped/transformed ancestors through the native top layer.

`open`/`defaultOpen` and `onOpenChange` govern the root popup. A host may refuse
open or close requests. `disabled` prevents this component from intercepting
context-menu and keyboard requests, preserving the browser's native context
menu; it does not disable arbitrary child controls. Host `onContextMenu` and
`onKeyDown` run first and can prevent the Flood behavior.

Items, IDs, preferences and nested navigation follow Menu. Action selection
requests closure of the whole tree and calls `onAction(id)` once. Preference
items stay open unless `closeOnSelect` is requested. Escape closes the deepest
level; Tab exits via the root source, not an internal submenu item. An outside
interaction dismisses the tree while preserving its intended focus destination.
Cleanup cancels pending hover timers and removes document listeners.

The component does not infer actions, modify documents or provide an application
command engine. Supply a visible action button as an alternative when touch
devices do not expose a reliable native context-menu gesture. Existing content,
text selection and modified keyboard shortcuts remain host-owned.
