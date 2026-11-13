"use client";

import {useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent} from "react";
import {
  Button, DataTable, DescriptionList, Drawer, EmptyState,
  Field, Grid, Heading, Inline, Input, SearchInput, Section, Select,
  Stack, StatusIndicator, Surface, Table, ToastRegion,
  type DataTableColumn, type ToastItem,
} from "@flood-md/react";

const statuses = {
  new: {label: "New", tone: "info"},
  active: {label: "In progress", tone: "warning"},
  resolved: {label: "Resolved", tone: "success"},
} as const;

type Status = keyof typeof statuses;
type RequestRecord = {
  id: string;
  title: string;
  owner: string;
  status: Status;
  summary: string;
};

const requestColumns: DataTableColumn[] = [
  {id: "subject", label: "Subject", sortable: true},
  {id: "status", label: "Status", sortable: true},
];

const activityByRequest: Record<string, readonly {date: string; activity: string}[]> = {
  "REQ-105": [
    {date: "2026-11-10", activity: "Access issue reported"},
    {date: "2026-11-11", activity: "Identity verified"},
    {date: "2026-11-12", activity: "Recovery link sent"},
  ],
  "REQ-117": [
    {date: "2026-11-11", activity: "Permission review requested"},
    {date: "2026-11-12", activity: "Regional roles exported"},
  ],
};
const activityDate = new Intl.DateTimeFormat("en", {month: "short", day: "numeric", timeZone: "UTC"});

const fixtures: RequestRecord[] = [
  {id: "REQ-104", title: "Update billing address", owner: "Mina Chen", status: "new", summary: "Use the new address on future invoices."},
  {id: "REQ-105", title: "Restore workspace access", owner: "Alex Morgan", status: "active", summary: "A teammate cannot sign in after changing email."},
  {id: "REQ-106", title: "Export April invoices", owner: "Noah Park", status: "resolved", summary: "Provide a copy for the finance team."},
  {id: "REQ-107", title: "Add a backup contact", owner: "Mina Chen", status: "active", summary: "Route account notices to a second contact."},
  {id: "REQ-108", title: "Review workspace roles", owner: "Alex Morgan", status: "new", summary: "Confirm who should manage member permissions."},
  {id: "REQ-109", title: "Correct the renewal date", owner: "Noah Park", status: "active", summary: "The displayed date differs from the order confirmation."},
  {id: "REQ-110", title: "Remove a duplicate invitation", owner: "Mina Chen", status: "resolved", summary: "Keep the invitation sent to the current address."},
  {id: "REQ-111", title: "Check a missing delivery notification", owner: "Alex Morgan", status: "active", summary: "A shipping update did not reach the assigned contact."},
  {id: "REQ-112", title: "Change invoice recipient", owner: "Noah Park", status: "new", summary: "Send future copies to the accounts inbox."},
  {id: "REQ-113", title: "Transfer workspace ownership", owner: "Mina Chen", status: "active", summary: "The previous owner has moved to another team."},
  {id: "REQ-114", title: "Confirm a duplicate charge", owner: "Alex Morgan", status: "resolved", summary: "Compare the two entries against the receipt."},
  {id: "REQ-115", title: "Recover archived access settings", owner: "Noah Park", status: "active", summary: "Review the settings before the workspace is reopened."},
  {id: "REQ-116", title: "Replace the emergency contact", owner: "Mina Chen", status: "active", summary: "Update the contact listed for urgent account issues."},
  {id: "REQ-117", title: "Review regional account permissions", owner: "Alex Morgan", status: "active", summary: "Check access before the next regional rollout."},
];

function matchesRequest(record: RequestRecord, query: string, status: Status | "all") {
  const needle = query.trim().toLowerCase();
  const searchable = `${record.id} ${record.title} ${record.summary}`.toLowerCase();
  return (status === "all" || record.status === status) && searchable.includes(needle);
}

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function RecordManagement() {
  const formId = useId();
  const [records, setRecords] = useState(fixtures);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status | "all">("all");
  const [recordId, setRecordId] = useState<string | null>(null);
  const [draft, setDraft] = useState<RequestRecord | null>(null);
  const [notice, setNotice] = useState<ToastItem | null>(null);
  const search = useRef<HTMLInputElement>(null);
  const table = useRef<HTMLDivElement>(null);
  const subject = useRef<HTMLInputElement>(null);
  const edit = useRef<HTMLButtonElement>(null);
  const returnToEdit = useRef(false);
  const selected = records.find(record => record.id === recordId);
  const activity = selected ? activityByRequest[selected.id] : undefined;
  const results = records.filter(record => matchesRequest(record, query, status));
  const editing = draft !== null;
  const open = selected !== undefined;

  useBrowserLayoutEffect(() => {
    if (editing) {
      subject.current?.focus({preventScroll: true});
    } else if (open && returnToEdit.current) {
      returnToEdit.current = false;
      edit.current?.focus({preventScroll: true});
    }
  }, [open, editing]);

  function changeQuery(nextQuery: string, nextStatus: Status | "all") {
    setQuery(nextQuery);
    setStatus(nextStatus);
    setNotice(null);
    table.current?.querySelector('[role="region"][aria-label="Requests"]')?.scrollTo({top: 0});
  }

  function closeRecord() {
    returnToEdit.current = false;
    setDraft(null);
    setRecordId(null);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    const title = draft.title.trim();
    if (!title) {
      subject.current?.setCustomValidity("Enter a subject.");
      subject.current?.reportValidity();
      return;
    }
    const updated = {...draft, title, owner: draft.owner.trim()};
    setRecords(current => current.map(record => record.id === updated.id ? updated : record));
    setNotice({
      id: updated.id,
      title: `${updated.id} updated`,
      description: matchesRequest(updated, query, status) ? undefined : "It no longer matches your search or filter.",
      status: "success",
    });
    closeRecord();
  }

  function cancelEdit() {
    returnToEdit.current = true;
    setDraft(null);
  }

  const drawerTitle = draft ? `Edit ${draft.id}` : selected?.title ?? "Request details";

  return <section aria-label="Request workspace">
    <Stack gap="6">
      <Heading level={1} size="page">Requests</Heading>
      <Grid gap="4" minItemWidth="12rem">
        <Field label="Search requests">
          {field => <SearchInput {...field} ref={search} value={query} clearLabel="Clear search"
            placeholder="Subject, summary or request ID"
            onChange={event => changeQuery(event.target.value, status)} />}
        </Field>
        <Field label="Status">
          {field => <Select {...field} value={status}
            onChange={event => changeQuery(query, event.target.value as Status | "all")}>
            <option value="all">All statuses</option>
            {Object.entries(statuses).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}
          </Select>}
        </Field>
      </Grid>
      <Drawer
        title={drawerTitle}
        size="lg"
        description={editing ? undefined : selected?.summary}
        open={open}
        onOpenChange={open => { if (!open) closeRecord(); }}
        initialFocusRef={edit}
        getFallbackFocus={() => search.current}
        trigger={({ref, onClick, ...trigger}) =>
          <Surface elevation="raised" padding="0" className="request-table-frame">
            <DataTable ref={table} caption="Requests" hideCaption inset="roomy" minWidth="min-content"
              maxViewportHeight="26rem" stickyHeader pageSize={fixtures.length}
              columns={requestColumns} rows={results.map(record => ({
                id: record.id,
                cells: {status: <StatusIndicator {...statuses[record.status]} size="sm" />},
                sortValues: {status: statuses[record.status].label},
                primaryAction: {
                  column: "subject", title: record.title, description: record.id,
                  buttonProps: {
                    ...trigger,
                    "aria-expanded": open && record.id === recordId,
                    "aria-label": `${record.title}, ${record.id}`,
                    onClick: event => {
                      ref(event.currentTarget);
                      setRecordId(record.id);
                      onClick?.(event);
                    },
                  },
                },
              }))}
              emptyContent={<EmptyState title="No matching requests" actions={<Button variant="subtle" onClick={() => {
                search.current?.focus({preventScroll: true});
                changeQuery("", "all");
              }}>Clear filters</Button>} />} />
          </Surface>}
        footer={draft
          ? <Inline gap="2"><Button variant="subtle" onClick={cancelEdit}>Cancel edit</Button>
            <Button type="submit" form={formId}>Save changes</Button></Inline>
          : <Button ref={edit} onClick={() => { if (selected) setDraft({...selected}); }}>Edit request</Button>}
      >
        {draft
          ? <form id={formId} onSubmit={save}>
            <Stack gap="4">
              <Field label="Subject" required>
                {field => <Input {...field} ref={subject} value={draft.title} onChange={event => {
                  event.currentTarget.setCustomValidity("");
                  setDraft({...draft, title: event.target.value});
                }} />}
              </Field>
              <Field label="Owner">
                {field => <Input {...field} value={draft.owner}
                  onChange={event => setDraft({...draft, owner: event.target.value})} />}
              </Field>
              <Field label="Status">
                {field => <Select {...field} value={draft.status}
                  onChange={event => setDraft({...draft, status: event.target.value as Status})}>
                  {Object.entries(statuses).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}
                </Select>}
              </Field>
            </Stack>
          </form>
          : selected && <Stack gap="8"><DescriptionList items={[
              {id: "request-id", term: "Request ID", description: selected.id},
              {id: "owner", term: "Owner", description: selected.owner || "Unassigned"},
              {id: "status", term: "Status", description: <StatusIndicator {...statuses[selected.status]} />},
            ]} />
            {activity && <Section title="Activity" headingLevel={3} headingSize="group">
              <Table caption="Request activity" hideCaption density="compact">
                <thead><tr><th scope="col">Date</th><th scope="col">Event</th></tr></thead>
                <tbody>{activity.map(item => <tr key={item.date}>
                  <td><time dateTime={item.date}>{activityDate.format(new Date(item.date))}</time></td>
                  <td>{item.activity}</td>
                </tr>)}</tbody>
              </Table>
            </Section>}
          </Stack>}
      </Drawer>
      <ToastRegion items={notice ? [notice] : []} onDismiss={() => setNotice(null)} />
    </Stack>
  </section>;
}
