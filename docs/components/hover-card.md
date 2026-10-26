# HoverCard

HoverCard reveals supporting information about a person, document or item. Its
content may include native links and actions. Use Tooltip for a short text hint,
and Popover for an explicit editing task. Essential information must also be
available without discovering this preview.

```tsx
import {Button, HoverCard, Link, Stack, Text} from "@flood-md/react";

<HoverCard title="Alex Morgan" trigger={props => <Button {...props} variant="subtle">Alex Morgan</Button>}>
  <Stack gap="2">
    <Text as="p" size="compact" tone="subtle">Product designer on the Flood team.</Text>
    <Link href="/team/alex">View profile</Link>
  </Stack>
</HoverCard>
```

Spread all supplied trigger props onto one native button or Flood Button. They
include its ref, accessible expanded state and interaction handlers. The panel
is a named non-modal dialog, not a tooltip. The forwarded ref targets its div.

Mouse or pen hover opens after `openDelay` (300ms). Keyboard focus opens
immediately without moving focus. Tab enters the following preview controls in
document order; ArrowDown explicitly moves to the first one. Moving between the
trigger and preview gets `closeDelay` (180ms) of grace. Focus inside either keeps
the preview open. Clicking the trigger pins it open, providing an explicit touch
alternative; another click closes it. Escape, an outside click, focus moving
outside, or the close icon dismiss it. Dismissal does not immediately reopen
while the trigger remains hovered or focused.

Use `open`, `defaultOpen` and `onOpenChange` for controlled or uncontrolled
visibility. Controlled owners must update `open` in response to the callback.
`side` and `align` use the same collision-aware placement as other Flood
overlays. `disabled` blocks opening. `closeLabel` localizes the close action;
`title` supplies the dialog's visible accessible name. Content is mounted while
open. This component requires browsers with the native Popover API.
