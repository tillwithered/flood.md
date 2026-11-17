"use client";

import { useId, useRef, useState } from "react";
import {
  Button, Container, ErrorSummary, FormActions, ImportColumnMapping, PageHeader, SaveStatus, Stack, Surface,
  type ErrorSummaryItem,
} from "@flood-md/react";

const columns = [
  { id: "account_name", title: "Company", example: "Northwind" },
  { id: "main_email", title: "Work email", example: "team@example.com" },
  { id: "legacy_email", title: "Old email", example: "unknown" },
] as const;
const targets = [
  { id: "company", label: "Company" },
  { id: "email", label: "Email" },
] as const;
type ColumnId = typeof columns[number]["id"];
type Target = typeof targets[number]["id"];
type Mapping = Record<ColumnId, Target | null>;
type SourceIssue = { id: string; sourceId: ColumnId; row: number; message: string };
type Result = { state: "ready" } | { state: "checking" } | { state: "valid" } | { state: "invalid"; issues: SourceIssue[] } | { state: "failed" } | { state: "imported" };

const initial: Mapping = { account_name: "company", main_email: "email", legacy_email: null };

function validateSource(mapping: Mapping): SourceIssue[] {
  // In a real importer, check the parsed rows and use file row numbers in the result.
  return mapping.legacy_email === "email" ? [{
    id: "legacy-invalid-email", sourceId: "legacy_email", row: 2,
    message: "“unknown” is not a valid email address. Skip Old email or correct the file.",
  }] : [];
}

function fieldTarget(value: string | null): Target | null {
  return value === "company" || value === "email" ? value : null;
}

export function ImportMapping() {
  const id = useId();
  const version = useRef(0);
  const [mapping, setMapping] = useState(initial);
  const [result, setResult] = useState<Result>({ state: "ready" });
  const [attempted, setAttempted] = useState(false);
  const assigned = Object.values(mapping).filter(Boolean);
  const missingCompany = !assigned.includes("company");
  const mappingErrors: ErrorSummaryItem[] = columns.flatMap(column => {
    const target = mapping[column.id];
    if (!target || assigned.filter(value => value === target).length < 2) return [];
    return [{ id: column.id, fieldId: `${id}-${column.id}`, message: `${column.title}: choose a target that is not already mapped.` }];
  });
  const sourceErrors: ErrorSummaryItem[] = result.state === "invalid" ? result.issues.map(issue => ({
    id: issue.id, fieldId: `${id}-${issue.sourceId}`,
    message: `${columns.find(column => column.id === issue.sourceId)?.title}, row ${issue.row}: ${issue.message}`,
  })) : [];

  function update(column: ColumnId, target: Target | null) {
    version.current++;
    setMapping(current => ({ ...current, [column]: target }));
    setResult({ state: "ready" });
  }

  async function verify() {
    setAttempted(true);
    if (missingCompany || mappingErrors.length) return;
    const request = ++version.current;
    const snapshot = mapping;
    setResult({ state: "checking" });
    try {
      const issues = await Promise.resolve(validateSource(snapshot));
      if (request === version.current) setResult(issues.length ? { state: "invalid", issues } : { state: "valid" });
    } catch {
      if (request === version.current) setResult({ state: "failed" });
    }
  }

  const errors = [...mappingErrors, ...sourceErrors];
  return <Container size="sm" gutter="4">
    <Stack gap="6">
      <PageHeader title="Map import columns" headingSize="page" />
      <Surface elevation="raised" padding="4">
        <form onSubmit={event => { event.preventDefault(); void verify(); }}>
          <Stack gap="4">
            {attempted && (errors.length > 0 || missingCompany || result.state === "failed") &&
              <ErrorSummary title="Check field mapping" autoFocus errors={errors}
                formErrors={missingCompany ? [{ id: "company", message: "Map one column to Company." }]
                  : result.state === "failed" ? [{ id: "check", message: "The file could not be checked. Try again." }] : undefined} />}
            <ImportColumnMapping caption="Map CSV columns" hideCaption value={mapping} targets={targets}
              columns={columns.map(column => {
                const fieldId = `${id}-${column.id}`;
                return {id:column.id,label:column.title,example:column.example,fieldId,
                  invalid:attempted && errors.some(error => error.fieldId === fieldId)};
              })}
              onMappingChange={(sourceId, target) => {
                const column = columns.find(item => item.id === sourceId);
                if (column) update(column.id, fieldTarget(target));
              }} />
            <FormActions
              status={result.state === "imported" ? <SaveStatus state="saved" label="Import complete" /> : undefined}
              secondary={<Button type="submit" variant="subtle" loading={result.state === "checking" ? "retain-focus" : false}>
                Check mapping
              </Button>}
              primary={<Button type="button" disabled={result.state !== "valid"} onClick={() => setResult({ state: "imported" })}>
                Import contacts
              </Button>} />
          </Stack>
        </form>
      </Surface>
    </Stack>
  </Container>;
}
