"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Alert, Button, Container, Field, Fieldset, Grid, Heading, Inline,
  Input, Select, Stack, Surface, Switch, Text,
} from "@flood-md/react";
import "./settings-workspace.css";

const storageKey = "flood:settings-workspace:v1";
const timeZones = ["UTC", "Europe/London", "America/New_York", "Asia/Tokyo"] as const;
const maxNameLength = 80;
type TimeZone = typeof timeZones[number];

interface WorkspaceSettings {
  name: string;
  timeZone: TimeZone;
  assignmentAlerts: boolean;
  weeklyDigest: boolean;
}

const defaults: WorkspaceSettings = {
  name: "Studio North",
  timeZone: "UTC",
  assignmentAlerts: true,
  weeklyDigest: false,
};

function isTimeZone(value: unknown): value is TimeZone {
  return timeZones.some(timeZone => timeZone === value);
}

function readSettings(): WorkspaceSettings {
  const snapshot = window.localStorage.getItem(storageKey);
  if (snapshot === null) return defaults;
  const value: unknown = JSON.parse(snapshot);
  if (
    typeof value === "object" && value !== null &&
    "name" in value && typeof value.name === "string" && value.name.trim() &&
    value.name.length <= maxNameLength &&
    "timeZone" in value && isTimeZone(value.timeZone) &&
    "assignmentAlerts" in value && typeof value.assignmentAlerts === "boolean" &&
    "weeklyDigest" in value && typeof value.weeklyDigest === "boolean"
  ) {
    return {
      name: value.name,
      timeZone: value.timeZone,
      assignmentAlerts: value.assignmentAlerts,
      weeklyDigest: value.weeklyDigest,
    };
  }
  throw new Error("Invalid workspace settings");
}

export function SettingsWorkspace() {
  const [accepted, setAccepted] = useState<WorkspaceSettings | null>(null);
  const [draft, setDraft] = useState(defaults);
  const [readError, setReadError] = useState(false);
  const [nameError, setNameError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");
  const nameInput = useRef<HTMLInputElement>(null);

  function load() {
    try {
      const settings = readSettings();
      setAccepted(settings);
      setDraft(settings);
      setReadError(false);
    } catch {
      setReadError(true);
    }
  }

  useEffect(load, []);

  const dirty = accepted !== null && (
    draft.name !== accepted.name || draft.timeZone !== accepted.timeZone ||
    draft.assignmentAlerts !== accepted.assignmentAlerts || draft.weeklyDigest !== accepted.weeklyDigest
  );

  function update<K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]) {
    setDraft(current => ({ ...current, [key]: value }));
    setNotice("");
    if (key === "name") setNameError("");
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accepted) return;
    const name = draft.name.trim();
    if (!name) {
      setNameError("Enter a workspace name.");
      nameInput.current?.focus();
      return;
    }
    const proposal = { ...draft, name };
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(proposal));
    } catch {
      setSaveError("Settings could not be saved. Try again.");
      return;
    }
    setAccepted(proposal);
    setDraft(proposal);
    setNameError("");
    setSaveError("");
    setNotice("Settings saved.");
  }

  function reset() {
    if (!accepted) return;
    setDraft(accepted);
    setNameError("");
    setSaveError("");
    setNotice("Unsaved changes discarded.");
    nameInput.current?.focus({ preventScroll: true });
  }

  return (
    <Container size="md" gutter="4">
      <Stack gap="6">
        <Heading level={1} size="page">Workspace settings</Heading>
        {readError ? (
          <Stack gap="4">
            <Alert tone="error" announcement="polite">Settings could not be loaded.</Alert>
            <Inline><Button variant="subtle" onClick={load}>Retry</Button></Inline>
          </Stack>
        ) : accepted ? (
          <Surface padding="6" elevation="raised">
            <form aria-label="Workspace settings" onSubmit={save} noValidate>
              <Stack gap="6">
                <Fieldset legend="General" legendSize="section">
                  <Grid minItemWidth="14rem" gap="4">
                    <Field label="Workspace name" required error={nameError}>
                      {props => (
                        <Input {...props} ref={nameInput} name="name" maxLength={maxNameLength}
                          value={draft.name} onChange={event => update("name", event.currentTarget.value)} />
                      )}
                    </Field>
                    <Field label="Time zone">
                      {props => (
                        <Select {...props} name="timeZone" value={draft.timeZone}
                          onChange={event => {
                            const value = event.currentTarget.value;
                            if (isTimeZone(value)) update("timeZone", value);
                          }}>
                          {timeZones.map(timeZone => <option key={timeZone}>{timeZone}</option>)}
                        </Select>
                      )}
                    </Field>
                  </Grid>
                </Fieldset>
                <Fieldset legend="Notifications" legendSize="section">
                  <Stack gap="0" className="settings-switches">
                    <Switch className="settings-switch" label="New assignments" name="assignmentAlerts" checked={draft.assignmentAlerts}
                      onChange={event => update("assignmentAlerts", event.currentTarget.checked)} />
                    <Switch className="settings-switch" label="Weekly summary" name="weeklyDigest" checked={draft.weeklyDigest}
                      onChange={event => update("weeklyDigest", event.currentTarget.checked)} />
                  </Stack>
                </Fieldset>
                <Stack gap="4">
                  {saveError && <Alert tone="error" announcement="polite">{saveError}</Alert>}
                  <Inline gap="3">
                    <Button type="submit">Save settings</Button>
                    <Button variant="subtle" disabled={!dirty} onClick={reset}>Discard changes</Button>
                    <Text size="compact" tone="subtle" role="status">{notice}</Text>
                  </Inline>
                </Stack>
              </Stack>
            </form>
          </Surface>
        ) : <Text role="status">Loading settings…</Text>}
      </Stack>
    </Container>
  );
}
