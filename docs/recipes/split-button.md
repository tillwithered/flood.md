# Split button

Keep the common action directly available and place alternatives in Menu.
ButtonGroup preserves independent native Tab stops; Menu owns popup navigation.

```tsx
import {Button, ButtonGroup, IconButton, Menu} from "@flood-md/react";

export function PublishActions({onAction}: {onAction: (action: string) => void}) {
  return <ButtonGroup label="Publish actions">
    <Button variant="subtle" onClick={() => onAction("publish")}>Publish</Button>
    <Menu label="More publishing actions" align="end"
      trigger={props => <IconButton {...props} label="More publishing actions" variant="subtle">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </IconButton>}
      items={[{id:"schedule",label:"Schedule…"},{id:"draft",label:"Save draft"}]}
      onAction={onAction} />
  </ButtonGroup>;
}
```

The primary button performs an action; the icon button only opens alternatives.
Use matching variants and sizes. Do not make the whole group one button or nest
an action in another button. The host owns pending state and confirmation.
