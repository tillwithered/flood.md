# Record management

[Open the working composition](/playground/records).

Search requests, narrow the table by status, open one request, and edit it in a
Drawer. Saving updates the request and returns to the same table.
The example uses in-memory fixtures that reset on reload.

## Choose where details open

Use a Drawer for a bounded inspection or edit that starts and ends in the same
list. Use a destination page for details that need a stable URL, substantial
room, or several independent tasks.

When users compare several attributes, DataTable can use a `primaryAction`
in the identity column. Pass the Drawer trigger handlers and ref to that
action. Check the row background, title and description, checkbox and any
secondary menu independently. Use `toolbar` and `inset="roomy"` for a heading
and filters that share the table surface. Use the request title as the visible
action and keep its ID beside it for disambiguation.

```tsx
<Drawer title="Review workspace access" size="lg"
  trigger={buttonProps => (
    <DataTable caption="Requests" hideCaption inset="roomy"
      toolbar={<Heading level={2} size="section">Requests</Heading>}
      columns={[{id: "request", label: "Request"}, {id: "status", label: "Status"}]}
      rows={[{
        id: "REQ-108",
        cells: {status: "New"},
        primaryAction: {
          column: "request",
          title: "Review workspace access",
          description: "REQ-108 · Operations",
          buttonProps,
        },
      }]} />
  )}>
  <Stack gap="8">
    <Section title="Customer message" headingLevel={3} headingSize="group">
      <Text as="p">Confirm who should manage member permissions.</Text>
    </Section>
    <Section title="Assignment" headingLevel={3} headingSize="group">
      <Field label="Owner">{field => <Input {...field} />}</Field>
    </Section>
  </Stack>
</Drawer>
```

Use `size="lg"` when long messages and several field groups need the wider
reading area. Compose the body from Section for separately named content,
DescriptionList for facts and Fieldset for related controls. Check wrapping and
scrolling with the longest title and a real footer action before selecting a size.
Use the group heading size inside a detail Drawer to keep the record name prominent.
Keep the request facts in one DescriptionList and use a compact, captioned Table
for related records that have comparable columns, such as activity dates and events.
Give that table its own heading when it identifies a distinct section. The Drawer
body owns vertical scrolling and the footer keeps the next action within reach.

When the detail contains line items and a total, use the Table footer to mark
the summary and keep its amount aligned with the line-item amounts. A row header
labels the total, and the Table footer supplies the separator and emphasis.

```tsx
<tfoot>
  <tr>
    <th scope="row" colSpan={2}>Total</th>
    <td data-numeric>{formattedTotal}</td>
  </tr>
</tfoot>
```

## Keep browsing state and edit state separate

Keep search, filter, accepted records and the open record ID in the host.
Keep the DataTable and its ScrollArea mounted while the Drawer is open. Reset the
scroll position only when the user changes the query or filter.

Entering edit mode copies the selected record. Cancel edit returns to details
without changing accepted data. Saving replaces the record by stable ID.
Recompute matches using the existing search and filter. Use a floating ToastRegion
for the save result so it cannot move the table. If the updated record leaves
the results, explain why and preserve the query. For a remote save, close
on accepted data and retain the draft with actionable feedback on failure.

## Restore focus to a useful place

Forward the Drawer trigger props from the single overlay to the row action
that opens it. Focus Edit request when details open, Subject when editing starts,
and Edit request after Cancel edit. On close, return focus to the same row
action without scrolling. Drawer resolves `getFallbackFocus` after closing
if the row left the results. The recipe returns Search requests and keeps
the current query.

Keep subject and ID together in the list. Status earns a stable trailing slot
because users filter and compare by it. Put owner and the longer summary in the
Drawer, where they support a decision about a single record. Put the summary
in the Drawer description slot so it stays grouped with the title. Keep the
named values together in the body below it.

Review the Drawer with a wrapped title, then with its description omitted.
The heading and summary should read as one group while the values begin a
separate block. Check the visible copy and the scrollable area above the action.

Give each DescriptionList item a stable string `id`, such as `"owner"`.
Open a real row during browser verification. A build alone never exercises the
Drawer's conditional detail content.

<!-- flood:record-management -->
