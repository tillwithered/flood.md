"use client";
import {useRef, useState, type FormEvent} from "react";
import {Button, Checkbox, DescriptionList, DocumentPreview, Drawer, Field, FileItem, FileList,
  Heading, Inline, Input, Link, Section, Select, Stack, StatusIndicator, Surface, Text} from "@flood-md/react";

const defaults = {name: "Design workspace", visibility: "private", updates: true};
const attachments = [
  {
    name:"Research findings — international expansion and onboarding.pdf", size:2457600, status:"Ready for review", tone:"info",
    pages:[
      {title:"Research findings", body:"In the first week, new teams looked for a short list of setup tasks and a way to invite teammates."},
      {title:"Recommended changes", body:"Put the first setup task on the workspace home and link to the full checklist from there."},
    ],
  },
  {
    name:"Brand guidelines.pdf", size:1048576, status:"Reviewed", tone:"success",
    pages:[{title:"Brand guidelines", body:"Use the wordmark on plain backgrounds and keep the surrounding area clear of other marks."}],
  },
] as const;

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
    <Section title="Workspace settings">
      <Stack gap="6">
        <form aria-label="Workspace review settings" onSubmit={submit} onReset={reset}>
          <Stack gap="4">
            <Field label="Workspace name" required error={error || undefined}>
              {control => <Input {...control} ref={nameRef} name="workspace" required pattern={".*\\S.*"}
                value={draft.name} onChange={event => {setDraft({...draft, name: event.currentTarget.value}); setError("");}}
                onInvalid={() => setError("Enter a workspace name, including at least one non-space character.")} />}
            </Field>
            <Field label="Visibility">
              {control => <Select {...control} name="visibility" value={draft.visibility}
                onChange={event => setDraft({...draft, visibility: event.currentTarget.value})}>
                <option value="private">Only me</option><option value="team">Project team</option>
              </Select>}
            </Field>
            <Checkbox label="Product updates" name="updates" value="yes" checked={draft.updates}
              onChange={event => setDraft({...draft, updates: event.currentTarget.checked})} />
            <Inline gap="3">
              <Button type="submit">Apply changes</Button><Button type="reset" variant="subtle">Reset settings</Button>
              {saved && <StatusIndicator size="sm" presentation="wrap" tone={!dirty ? "success" : "neutral"}
                label={dirty ? "Unapplied changes" : "Applied"} />}
            </Inline>
          </Stack>
        </form>
        {saved && <Stack gap="3">
          <DescriptionList items={[
            {id:"name", term:"Accepted name", description:saved.name},
            {id:"visibility", term:"Accepted visibility", description:saved.visibility === "team" ? "Project team" : "Only me"},
            {id:"updates", term:"Accepted updates", description:saved.updates},
          ]} />
        </Stack>}
        <Drawer title="Files"
          open={filesOpen} onOpenChange={setFilesOpen} closeLabel="Close project files"
          trigger={props => <Button {...props} variant="subtle">Review files</Button>}
          footer={<Button onClick={() => setFilesOpen(false)}>Done reviewing</Button>}>
          <FileList label="Sample project files" appearance="plain" dividers={false}>
            {attachments.map(file => <FileItem key={file.name} lang="en" name={file.name} nameOverflow="truncate" format={null} size={file.size} metadataVariant="plain"
              description={<StatusIndicator label={file.status} tone={file.tone} size="sm" presentation="wrap" />}
              renderPreview={trigger => <DocumentPreview title={file.name} pageCount={file.pages.length} trigger={trigger}
                renderPage={page => {
                  const content = file.pages[page - 1];
                  return {state:"ready",content:<Surface padding="6" style={{inlineSize:"36rem",maxInlineSize:"100%"}}>
                    <Stack gap="3"><Heading level={3} size="section">{content.title}</Heading><Text as="p">{content.body}</Text></Stack>
                  </Surface>};
                }} />} />)}
          </FileList>
        </Drawer>
        <Text as="p" size="helper" tone="subtle"><Link href="/docs/recipes/workspace-review">Read the composition and its checks</Link></Text>
      </Stack>
    </Section>
  </Surface>;
}
