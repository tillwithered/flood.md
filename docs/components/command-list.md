# CommandList

A searchable list of actions. Choosing an item calls `onAction(id)`; it does not
store a selected form value. Use Combobox or MultiSelect for data-entry choices.
CommandList does not create a modal. A future command palette can compose it with
Dialog, with the host owning open/close state and the resulting navigation/action.
This document describes an unpublished source candidate, not an npm release.

```tsx
import { CommandList, FloodRoot } from "@flood-md/react";

export function Commands() {
  return <FloodRoot>
    <CommandList label="Commands" items={[
      { id: "new-project", label: "New project", description: "Start a workspace", keywords: ["create"], group: "Projects" },
      { id: "settings", label: "Settings", keywords: ["preferences"], group: "Workspace" },
    ]} onAction={(id) => { /* The host performs the named action. */ }} />
  </FloodRoot>;
}
```

## Item and query contracts

Items need unique nonempty `id` and `label`. Optional `description`, `keywords`,
`disabled` and `group` enrich the action. Matching ignores case/diacritics and
requires every whitespace-separated query term to occur in the combined label,
description, keywords or group. There is no fuzzy ranking, network fetch or
command execution engine. The input query is never a form value.

Groups follow their first occurrence; item order within a group is retained.
Disabled matching items remain visible and announced as unavailable but are
skipped by active keyboard movement. No selection is persisted after invocation.
The first enabled match is initially active; `aria-selected` describes the current
suggestion, not a submitted domain value.

`query` / `defaultQuery` and `onQueryChange` control search text. Refused controlled
changes leave the applied query and visible results unchanged. The host replaces
`items` for asynchronous results and owns request cancellation and stale-response
protection. `loading` hides stale actions, marks the list busy, and blocks their
invocation while keeping search editable. Localize `placeholder`, `emptyMessage`
and `loadingMessage`; state messages must be nonempty.

## Focus and activation

The editor is an ARIA combobox controlling a visibly present listbox; an
`aria-activedescendant` points only to an available rendered action. Each option name contains its full visible label and description; named groups
provide additional context. The input remains the single Tab stop;
options use pointer activation instead of becoming independent tab stops.

- Arrow Down/Up moves through enabled actions and wraps. Home/End selects the
  first/last enabled action. Modifier/Shift editing shortcuts are preserved.
- Enter invokes the active action and prevents accidental surrounding form submit.
  It does not invoke while composing with an IME or while loading/disabled.
- Mouse/touch activation invokes once. Focus is restored to the input **before**
  calling `onAction`, so a host action may deliberately move focus elsewhere.
- Escape is deliberately left unconsumed for the host or enclosing Dialog.
  It does not implicitly clear the query or dismiss a component-owned layer.
- `onKeyDown` on the root runs before the internal command model; the host can
  prevent default to take ownership. Inherited disabled fieldsets also block actions.

`label` is required, including with `hideLabel`. The forwarded ref points to the
search input. Ordinary div attributes, `id`, styles and handlers apply to the root
container; the generated input/list IDs are derived from that root identity.

## Styling and scope

CommandList composes Flood Label, Input, Surface, ScrollArea, Text and VisuallyHidden,
using existing field, selection, typography, spacing and radius tokens. Touch rows
retain the shared minimum target size; bounded results scroll independently.
`controlSize` sizes the editor and rows. No new palette, theme, animation, icon pack
or dependency is introduced. Nested menus, command shortcuts, rich custom item
renderers, modal layout and result ranking are deliberately separate follow-up work.
