# ListBox

Use ListBox for application option selection, with a visible or visually hidden
accessible label. Options retain their disabled state and optional descriptions.

`selectionBehavior="automatic"` keeps single selection following keyboard focus.
Use `selectionBehavior="manual"` when arrows should only move focus and Enter,
Space or a click should confirm. Multiple selection keeps its explicit behavior.
TimePicker composes the manual mode so navigation does not prematurely commit.

`appearance="plain"` removes the list's surface and internal scrolling when a
parent Popover/ScrollArea owns these roles. Options, selection indicators,
accessible naming and keyboard focus remain. The default `surface` appearance
preserves standalone styling and scrolling.
