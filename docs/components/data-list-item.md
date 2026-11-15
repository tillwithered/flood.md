# DataListItem

A native `li` with title, description, media, metadata and independent actions.
Render inside DataList or another `ul` / `ol`.

```tsx
<DataListItem
  media={<Avatar name="Alex Morgan" size="sm" />}
  title="Alex Morgan"
  description="Product designer"
  metadata="Member"
  actions={<Button variant="subtle" size="sm">Manage</Button>}
/>
```

Import DataListItem and any composed components from `@flood-md/react`. Import
the shared stylesheet once and render within FloodRoot. All slots except title
are optional. Removing description or media does not reserve empty space.

Supply Link as the title for navigation. Do not give the row a button role or
nest actions inside a link. Use meaningful names for icon-only actions. Decorative
media should not repeat information already present in the title. Metadata is
supporting text; use Badge or StatusIndicator where that meaning is useful.

Use `details` for short supporting facts that belong beneath the title or
description. Compose MetadataList there when there are several facts. Reserve
`metadata` at the trailing edge for a value that readers compare across rows.

Long titles and descriptions wrap. In a DataList up to 24rem wide, a row with
both metadata and actions moves the pair beneath the copy. Metadata starts at
the title edge and the actions align to the end of the list. DataList owns
density and separators; standalone rows use the comfortable spacing default.
Refs point to the real list item.

Use `layout="content"` for multiline authored content or rich
descriptions whose avatar belongs beside the title, such as an actor and a
comment. In a narrow DataList, including one in a Drawer on desktop, the
trailing region moves below the copy and starts on the same edge. Wide lists
keep trailing actions alongside the copy. Compose identity and status in their
own roles and keep timestamps in `metadata` when they help interpret the entry.
Use the default row for records that need compact scanning across titles and
trailing actions. FileItem and NotificationItem own their specialized layout.

Choose metadata by recognition, comparison and action needs. A category is not
a lifecycle status; priority is another dimension. Keep needed triage information
visible, but do not make every value a competing chip. Review long and missing
metadata across several siblings; equal gaps do not create common scan columns.
See the records workflow in [Skills](/docs/skills) for contextual decisions.

Pass `selection` with a localized checkbox label, accepted `checked` value
and `onCheckedChange` when the item participates in a bulk action. Keep the
record link and individual actions in their own slots. A row can omit selection
or supply a disabled checkbox. DataList keeps peer rows aligned. Set
`reserveSelectionSpace` on DataList if a filter can temporarily hide every
selectable item and the visible text should keep its position.
