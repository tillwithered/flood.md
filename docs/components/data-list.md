# DataList

A native `ul` with structured DataListItem rows. Use it for project summaries,
people, files or settings records with a title and supporting information.
It is not a listbox, a definition list or an interactive data grid.

```tsx
import {DataList, DataListItem, Link, Button} from "@flood-md/react";

<DataList aria-label="Projects" density="comfortable" dividers>
  <DataListItem
    title={<Link href="/projects/design">Design system</Link>}
    description="Foundations and reusable components"
    metadata="Updated today"
    actions={<Button variant="subtle" size="sm">Manage</Button>}
  />
</DataList>
```

Use `density="compact"` for shorter rows. `dividers={false}` removes separators.
Both retain native list semantics, refs and DOM attributes. Direct children should
be DataListItem or native `li`. Use a nearby heading or accessible list label.

Keep navigation in a real title Link and actions in separate buttons. The whole
row has no click handler, pressed state, keyboard navigation or selection model.
Actions remain independent Tab stops. The host owns sorting, fetching and empty,
loading or error content. Do not put arbitrary non-list content directly in `ul`.

## Select metadata for the task

Protect the title/summary width and keep useful scan signals in predictable
positions across different records. The trailing slot is not a request to show
every schema property. For several independent comparisons use Table/DataTable
with named columns. A detail view can expose more named attributes through
DescriptionList. See the records workflow in [Skills](/docs/skills).
