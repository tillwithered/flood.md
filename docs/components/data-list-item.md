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

Long titles and descriptions wrap. Trailing metadata and actions may move onto
another line at narrow widths. DataList owns density and separators; standalone
rows use the comfortable spacing default. Refs point to the real list item.
