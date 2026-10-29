"use client";
import {useRef, useState, type FormEvent} from "react";
import {Alert, Badge, Button, Checkbox, DescriptionList, Drawer, Field, FileItem, FileList,
  Inline, Input, Link, Section, Select, Stack, StatusIndicator, Surface, Text} from "@flood-md/react";

const defaults = {name: "Design workspace", visibility: "private", updates: true};

/** Host state and native form semantics; no persistence or upload transport. */
export function WorkspaceReview() {
  const [draft, setDraft] = useState(defaults);
  const [saved, setSaved] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState("");
  const [filesOpen, setFilesOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaved({name: String(data.get("workspace")), visibility: String(data.get("visibility")),
      updates: data.has("updates") ? "On" : "Off"});
    setError("");
  }
  function reset(event: FormEvent<HTMLFormElement>) {
    const nativeEvent = event.nativeEvent;
    queueMicrotask(() => {
      if (nativeEvent.defaultPrevented) return;
      setDraft(defaults); setSaved(null); setError("");
    });
  }
  const dirty = saved !== null && (saved.name !== draft.name || saved.visibility !== draft.visibility
    || saved.updates !== (draft.updates ? "On" : "Off"));

  return <Surface padding="4">
    <Section title="Workspace review" description="A local composition of Flood components. Nothing is sent or persisted."
      actions={<Badge size="sm">Local example</Badge>}>
      <Stack gap="6">
        <form aria-label="Workspace review settings" onSubmit={submit} onReset={reset}>
          <Stack gap="4">
            <Field label="Workspace name" required error={error || undefined}>
              {control => <Input {...control} ref={nameRef} name="workspace" required pattern={".*\\S.*"}
                value={draft.name} onChange={event => {setDraft({...draft, name: event.currentTarget.value}); setError("");}}
                onInvalid={() => setError("Enter a workspace name, including at least one non-space character.")} />}
            </Field>
            <Field label="Visibility" hint="A local preference, not an access-control setting.">
              {control => <Select {...control} name="visibility" value={draft.visibility}
                onChange={event => setDraft({...draft, visibility: event.currentTarget.value})}>
                <option value="private">Only me</option><option value="team">Project team</option>
              </Select>}
            </Field>
            <Checkbox label="Product updates" name="updates" value="yes" checked={draft.updates}
              onChange={event => setDraft({...draft, updates: event.currentTarget.checked})} />
            <Inline gap="3">
              <Button type="submit">Accept locally</Button><Button type="reset" variant="subtle">Reset settings</Button>
              <StatusIndicator size="sm" tone={saved && !dirty ? "success" : "neutral"}
                label={saved ? dirty ? "Unsaved changes" : "Accepted in this session" : "Not accepted yet"} />
            </Inline>
          </Stack>
        </form>
        {saved && <Stack gap="3">
          <Alert tone="info" announcement="polite">Snapshot accepted in memory only. Reloading clears it.</Alert>
          <DescriptionList items={[
            {id:"name", term:"Accepted name", description:saved.name},
            {id:"visibility", term:"Accepted visibility", description:saved.visibility === "team" ? "Project team" : "Only me"},
            {id:"updates", term:"Accepted updates", description:saved.updates},
          ]} />
        </Stack>}
        <Drawer title="Files" description="Local preview."
          open={filesOpen} onOpenChange={setFilesOpen} closeLabel="Close project files"
          trigger={props => <Button {...props} variant="subtle">Review files</Button>}
          footer={<Button onClick={() => setFilesOpen(false)}>Done reviewing</Button>}>
          <Stack gap="4"><FileList label="Sample project files">
            <FileItem name="Research findings — international expansion and onboarding.pdf" format="PDF" size={2457600}
              description={<StatusIndicator label="Ready for review" tone="info" size="sm" />} />
            <FileItem name="Brand guidelines.pdf" format="PDF" size={1048576}
              description={<StatusIndicator label="Reviewed" tone="success" size="sm" />} />
          </FileList><Text as="p" size="compact" tone="subtle">Sample records only. No file is uploaded.</Text></Stack>
        </Drawer>
        <Text as="p" size="helper" tone="subtle"><Link href="/docs/recipes/workspace-review">Read the composition and its checks</Link></Text>
      </Stack>
    </Section>
  </Surface>;
}
