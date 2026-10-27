"use client";

import { useEffect, useState } from "react";
import {
  Button, ContextMenu, DatePicker, DateRangePicker, Dialog, Editable, FloodRoot,
  Menu, NavigationTree, Stack, TagInput, Tree, type MenuItem,
} from "@flood-md/react";

const actions: readonly MenuItem[] = [
  { id: "rename", label: "Rename" },
  { id: "export", type: "submenu", label: "Export", items: [
    { id: "pdf", label: "PDF" }, { id: "text", label: "Plain text" },
  ] },
];
const initialRange = { start: "2026-10-10", end: "2026-10-14" };

export function NewControls() {
  const [ready, setReady] = useState(false);
  const [submitted, setSubmitted] = useState("");
  const [action, setAction] = useState("");
  const [selection, setSelection] = useState("");
  useEffect(() => setReady(true), []);
  return <FloodRoot>
    <main style={{ maxWidth: "40rem", margin: "2rem auto", padding: "1rem", minWidth: 0 }} data-hydrated={ready}>
      <h1>New controls integration</h1>
      <Stack gap="6">
        <form id="new-controls-form" onSubmit={event => {
          event.preventDefault();
          setSubmitted(JSON.stringify([...new FormData(event.currentTarget)]));
        }}>
          <Stack gap="4">
            <DatePicker id="integration-date" label="Delivery date" name="delivery"
              calendarLabel="Delivery calendar" openCalendarLabel="Choose delivery"
              defaultValue="2026-10-26" today="2026-10-26" locale="en-US" required />
            <DateRangePicker id="integration-range" label="Trip dates" startName="tripStart" endName="tripEnd"
              calendarLabel="Trip calendar" openCalendarLabel="Choose trip"
              defaultValue={initialRange} today="2026-10-26" locale="en-US" required />
            <Editable id="integration-name" label="Project name" name="project" defaultValue="Flood" />
            <TagInput label="Topics" name="topics" defaultValue={["Design"]} required />
            <Button type="submit">Save controls</Button>
            <Button type="reset" variant="subtle">Reset controls</Button>
          </Stack>
        </form>
        <output aria-label="Submitted controls">{submitted}</output>
        <section aria-label="Nested layers">
          <Dialog title="Project editor" trigger={props => <Button {...props}>Open project editor</Button>}>
            <Stack gap="4">
              <DatePicker label="Review date" defaultValue="2026-10-26" today="2026-10-26" locale="en-US"
                calendarLabel="Review calendar" openCalendarLabel="Choose review" />
              <Menu label="Editor actions" items={actions} onAction={setAction}
                trigger={props => <Button {...props}>Editor actions</Button>} />
              <ContextMenu label="Document actions" items={actions} onAction={setAction}>
                <Button variant="subtle">Project document</Button>
              </ContextMenu>
            </Stack>
          </Dialog>
        </section>
        <output aria-label="Invoked action">{action}</output>
        <Tree label="Project files" defaultExpandedValues={["source"]} onValueChange={value => setSelection(String(value))}
          items={[{ value: "source", label: "Source", selectable: false, children: [
            { value: "button", label: "Button" }, { value: "input", label: "Input" },
          ] }]} />
        <output aria-label="Selected file">{selection}</output>
        <NavigationTree label="Integration navigation" currentValue="forms" defaultExpandedValues={["guides"]}
          items={[{ value: "guides", label: "Guides", children: [
            { value: "forms", label: "Forms", href: "#integration-forms" },
          ] }]} />
        <section id="integration-forms" tabIndex={-1}><h2>Form destination</h2></section>
      </Stack>
    </main>
  </FloodRoot>;
}
