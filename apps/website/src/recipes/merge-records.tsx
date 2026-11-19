"use client";

import { useEffect, useRef, useState } from "react";
import {
  Button, ComparisonTable, Container, DescriptionList, Dialog, Field, Fieldset,
  FormActions, Heading, PageHeader, Select, Stack, Surface,
} from "@flood-md/react";

const records = [
  { id: "C-104", name: "Avery Jordan", email: "avery@northwind.example", title: "Design lead", company: "Northwind" },
  { id: "C-218", name: "Avery Jordan", email: "ajordan@northwind.example", title: "Head of design", company: "Northwind" },
] as const;
const fieldLabels = { name: "Name", email: "Email", title: "Job title", company: "Company" } as const;
const fields = ["name", "email", "title", "company"] as const;
const conflicts = ["email", "title"] as const;

type RecordId = typeof records[number]["id"];
type Conflict = typeof conflicts[number];
type Resolution = Record<Conflict, RecordId | "">;
type Contact = { id: RecordId; name: string; email: string; title: string; company: string };
const initialResolution: Resolution = { email: "", title: "" };

function getRecord(id: RecordId) {
  return id === records[0].id ? records[0] : records[1];
}

export function MergeRecords() {
  const [survivor, setSurvivor] = useState<RecordId>(records[0].id);
  const [resolution, setResolution] = useState<Resolution>(initialResolution);
  const [merged, setMerged] = useState<Contact>();
  const [reviewOpen, setReviewOpen] = useState(false);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const removed = records[survivor === records[0].id ? 1 : 0];
  const { email, title } = resolution;
  const proposal: Contact | undefined = email && title
    ? { ...getRecord(survivor), email: getRecord(email).email, title: getRecord(title).title } : undefined;

  useEffect(() => {
    if (merged) resultHeading.current?.focus({ preventScroll: true });
  }, [merged]);

  function merge() {
    if (!proposal) return;
    setReviewOpen(false);
    setMerged(proposal);
  }

  return <Container size="sm" gutter="4">
    <Stack gap="6">
      <PageHeader title="Merge duplicate contacts" headingSize="page" />
      <Surface elevation="raised" padding="4">
        {merged ? <Stack gap="4">
          <Heading ref={resultHeading} tabIndex={-1} level={2} size="section">Contact {merged.id} merged</Heading>
          <DescriptionList items={fields.map(id => ({id, term:fieldLabels[id], description:merged[id]}))} />
        </Stack> : <Stack gap="6">
          <ComparisonTable caption="Contact records" hideCaption density="compact" criterionLabel="Field"
            columns={records.map(record => ({id:record.id, label:record.id}))}
            rows={fields.map(id => ({id, label:fieldLabels[id], cells:{
              [records[0].id]:records[0][id], [records[1].id]:records[1][id],
            }}))} />
          <Fieldset legend="Keep in the merged record" legendSize="section">
            <Stack gap="4">
              <Field label="Contact ID">{field =>
                <Select {...field} controlSize="sm" value={survivor} onChange={event => {
                  setSurvivor(getRecord(event.currentTarget.value as RecordId).id);
                }}>
                  {records.map(record => <option key={record.id} value={record.id}>{record.id}</option>)}
                </Select>
              }</Field>
              {conflicts.map(id => <Field key={id} label={fieldLabels[id]}>{field =>
                <Select {...field} controlSize="sm" value={resolution[id]}
                  onChange={event => setResolution(current => ({...current, [id]:event.currentTarget.value as Resolution[Conflict]}))}>
                  <option value="">Choose a value</option>
                  {records.map(record => <option key={record.id} value={record.id}>{record[id]} · {record.id}</option>)}
                </Select>
              }</Field>)}
            </Stack>
          </Fieldset>
          <FormActions primary={<Dialog
            title={`Merge contacts into ${survivor}?`}
            description={`Contact ${removed.id} will be removed.`}
            open={reviewOpen} onOpenChange={setReviewOpen} closeOnOutsideClick={false}
            initialFocusRef={cancel} getFallbackFocus={() => resultHeading.current}
            trigger={trigger => <Button {...trigger} disabled={!proposal}>Review merge</Button>}>
            <Stack gap="4">
              {proposal && <DescriptionList aria-label="Merged contact preview" dividers={false}
                items={fields.map(id => ({id, term:fieldLabels[id], description:proposal[id]}))} />}
              <FormActions secondary={<Button ref={cancel} variant="subtle" onClick={() => setReviewOpen(false)}>Cancel</Button>}
                primary={<Button onClick={merge} disabled={!proposal}>Merge contacts</Button>} />
            </Stack>
          </Dialog>} />
        </Stack>}
      </Surface>
    </Stack>
  </Container>;
}
