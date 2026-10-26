"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  FloodRoot, Heading, Text, Stack, Inline, Surface, Divider,
  Button, IconButton, Field, Input, Textarea, Select, Checkbox, Radio, Switch, NumberInput, Slider, Combobox, MultiSelect,
  type ControlSize,
} from "@flood-md/react";

const sizes: ControlSize[] = ["2xs", "xs", "sm", "md", "lg", "xl", "2xl"];

export function FoundationForm() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const [error, setError] = useState<string>();
  const [status, setStatus] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [pinned, setPinned] = useState(false);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("project") ?? "").trim();
    if (!name) {
      setError("Required project name");
      setStatus("");
      event.currentTarget.querySelector<HTMLInputElement>("#project-name")?.focus();
      return;
    }
    setError(undefined);
    setStatus(`Saved ${name}`);
    setSubmitted(JSON.stringify(Object.fromEntries(data)));
  }

  return (
    <FloodRoot id="foundation-root" style={{ minHeight: "100vh", padding: "var(--flood-sys-space-6)" }}>
      <main data-hydrated={hydrated} style={{ maxWidth: "48rem", marginInline: "auto" }}>
        <Stack gap="8">
          <Stack gap="2">
            <Text size="helper">Flood · unreleased dark profile</Text>
            <Heading level={1} size="large">Dark foundations</Heading>
            <Text as="p">A quiet foundation for useful interfaces. Original components, shared tokens and Inter.</Text>
          </Stack>

          <Surface>
            <form onSubmit={save} noValidate onReset={() => { setError(undefined); setStatus(""); setSubmitted(""); }}>
              <Stack gap="6">
                <Stack gap="2">
                  <Heading size="section">Project settings</Heading>
                  <Text as="p" size="compact">Create a space for your team.</Text>
                </Stack>
                <Field id="project-name" label="Project name" required hint="Visible to your team" error={error}>
                  {(control) => <Input {...control} name="project" defaultValue="Flood" autoComplete="organization" />}
                </Field>
                <Field id="project-description" label="Project description" hint="Describe the work in a few words">
                  {(control) => <Textarea {...control} name="description" defaultValue="A place for good ideas." rows={3} />}
                </Field>
                <Field id="project-url" label="Project address" hint="Read only">
                  {(control) => <Input {...control} readOnly value="flood.md" />}
                </Field>
                <Field id="project-region" label="Project region" hint="Where your team works">
                  {(control) => <Select {...control} name="region" defaultValue="global">
                    <option value="global">Global</option>
                    <optgroup label="Regions">
                      <option value="europe">Europe</option>
                      <option value="americas">Americas</option>
                    </optgroup>
                  </Select>}
                </Field>
                <Divider />
                <Stack gap="4">
                  <Checkbox label="Email updates" name="updates" value="yes" defaultChecked />
                  <Switch label="Public preview" name="preview" value="yes" />
                </Stack>
                <fieldset style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
                  <legend style={{ fontSize: "var(--flood-sys-type-label-size)", marginBottom: "var(--flood-sys-space-2)" }}>Account type</legend>
                  <Inline gap="6">
                    <Radio label="Personal" name="account" value="personal" />
                    <Radio label="Team" name="account" value="team" defaultChecked />
                  </Inline>
                </fieldset>
                <Inline>
                  <Button type="submit">Save project</Button>
                  <Button variant="subtle" type="reset">Reset form</Button>
                  <IconButton label="Add item" onClick={() => setStatus("Item added")}><span aria-hidden="true">+</span></IconButton>
                </Inline>
                <Text as="div" size="helper" role="status">{status}</Text>
                <output hidden={!submitted} aria-label="Submitted form data" data-testid="form-data" style={{ overflowWrap: "anywhere", fontSize: "var(--flood-sys-type-helper-size)" }}>{submitted}</output>
              </Stack>
            </form>
          </Surface>

          <Stack gap="4">
            <Heading size="section">Actions and sizes</Heading>
            <Inline gap="2">
              {sizes.map((size) => <Button key={size} size={size} variant="subtle" data-testid={`size-${size}`}>{size}</Button>)}
            </Inline>
            <Inline>
              <Button>Primary action</Button>
              <Button variant="subtle">Secondary action</Button>
              <Button variant="subtle" aria-pressed={pinned} onClick={() => setPinned(!pinned)}>Pin project</Button>
              <Button disabled>Disabled</Button>
              <Button loading>Working</Button>
            </Inline>
            <Surface elevation="raised" padding="3">
              <Inline><Text size="compact">Contextual toolbar</Text><Button variant="ghost" size="sm">Options</Button></Inline>
            </Surface>
          </Stack>

          <Stack gap="4">
            <Heading size="section">Fields and feedback</Heading>
            <Field label="Seats">{control => <NumberInput {...control} name="seats" defaultValue={5} min={0} max={20} />}</Field>
            <Slider label="Budget range" name="budget" defaultValue={[20, 80]} step={5} />
            <Field label="Runtime">{control => <Combobox {...control} name="runtime" options={[{value:"react",label:"React"},{value:"vue",label:"Vue"}]} placeholder="Choose a runtime" />}</Field>
            <Field label="Runtimes">{control => <MultiSelect {...control} name="runtimes" options={[{value:"react",label:"React"},{value:"vue",label:"Vue"}]} defaultValue={["react"]} placeholder="Search runtimes" />}</Field>
            <Inline gap="4">
              {(["sm", "md", "lg", "xl"] as const).map((size) => <div key={size} style={{ flex: "1 1 9rem", minWidth: 0 }}><Field id={`field-${size}`} label={`Field ${size}`}>{(control) => <Input {...control} controlSize={size} placeholder="Enter a value" />}</Field></div>)}
            </Inline>
            <Field id="disabled-field" label="Unavailable field" hint="Ask an administrator for access">
              {(control) => <Input {...control} value="Access restricted" disabled />}
            </Field>
            <Inline gap="6">
              <Text size="compact" tone="success">Success: saved</Text>
              <Text size="compact" tone="warning">Warning: check access</Text>
              <Text size="compact" tone="info">Info: draft version</Text>
            </Inline>
          </Stack>
        </Stack>
      </main>
    </FloodRoot>
  );
}

