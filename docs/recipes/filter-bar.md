# Filter bar

For staged conditions and persisted query definitions, see
[Collection views](collection-views.md) and its two working consumers.

Compose existing Field, SearchInput, Select and Button. Filtering belongs to the
host collection, not to DataTable. This recipe filters the full local data set
before handing it to the table and resets page and selection when filters change.

```tsx
"use client";
import {useState} from "react";
import {Button, DataTable, Field, Inline, SearchInput, Select, Stack} from "@flood-md/react";

const projects = [
  {id: "design", name: "Design system", status: "Active", members: 12},
  {id: "website", name: "Website", status: "Active", members: 4},
  {id: "research", name: "Research", status: "Draft", members: 2},
];

export function ProjectTable() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<readonly string[]>([]);
  function resetResults() { setPage(1); setSelected([]); }
  const visible = projects.filter(project =>
    project.name.toLowerCase().includes(query.trim().toLowerCase()) &&
    (status === "all" || project.status === status));

  return <Stack gap="4">
    <Inline gap="3" align="end">
      <Field label="Search projects">{props => <SearchInput {...props}
        value={query} onChange={event => {setQuery(event.currentTarget.value); resetResults();}} />}</Field>
      <Field label="Status">{props => <Select {...props} value={status}
        onChange={event => {setStatus(event.currentTarget.value); resetResults();}}>
        <option value="all">All statuses</option>
        <option value="Active">Active</option>
        <option value="Draft">Draft</option>
      </Select>}</Field>
      {(query || status !== "all") && <Button variant="subtle"
        onClick={() => {setQuery(""); setStatus("all"); resetResults();}}>Clear filters</Button>}
    </Inline>
    <DataTable caption="Projects" selectable pageSize={5}
      page={page} onPageChange={setPage} selectedIds={selected} onSelectionChange={setSelected}
      columns={[{id:"name",label:"Project",sortable:true},
        {id:"status",label:"Status"}, {id:"members",label:"Members",sortable:true,align:"end"}]}
      rows={visible.map(project => ({id:project.id,label:project.name,cells:{
        name:project.name,status:project.status,members:project.members}}))} />
  </Stack>;
}
```

Place inside FloodRoot and import the shared stylesheet once. Keep visible labels
for filters, including when defaults are active. A clear action resets actual
values. Expose active filters as removable Tag components when the filter set
gets larger; do not add a duplicate generic FilterBar component just for layout.

For remote data, debounce or submit at the host boundary, cancel obsolete requests
and map loading/error states explicitly. Use DataTable paginationMode="server" for an individual server page with explicit
controlled page/sort and totalRows; do not interpret its select-page checkbox as
server-wide selection. Table + Pagination remains available for a host-owned
contract. Follow recipe:record-workspace for request generations and recovery.
