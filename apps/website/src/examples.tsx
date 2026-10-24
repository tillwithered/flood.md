import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, ArrowUpRight, Copy, Plus } from "lucide-react";
import {
  Button, Checkbox, CodeSnippet, Divider, Field, FloodRoot, Heading, IconButton,
  IconSlot, Inline, Input, Link, Radio, Stack, Surface, Switch, Text, Textarea,
} from "@flood-md/react";
import "@flood-md/react/styles.css";
import "./site.css";
import release from "./release.json";
import { SiteHeader } from "./site-header";

const command = `npx @flood-md/cli@${release.version} init`;
const initialNote = "A modern React app with a calm, focused interface for my team. Keep it simple and flexible.";
const initialIdeas = [
  { id: 1, title: "Onboarding flow", description: "A simple welcome experience for new users.", complete: false },
  { id: 2, title: "Dashboard layout", description: "A clean and flexible structure.", complete: false },
  { id: 3, title: "Settings page", description: "Account, billing and team management.", complete: false },
];

function PlaygroundChecks() {
  return (
    <section className="playground" aria-label="All component states">
      <Heading size="section">Component checks</Heading><Divider />
      <div role="tablist" aria-label="Component checks">
        <Button role="tab" id="checks-choices" aria-selected="true" aria-controls="checks-panel">Choices</Button>
      </div>
      <Stack gap="4" role="tabpanel" id="checks-panel" aria-labelledby="checks-choices">
        <Checkbox label="Leave room for a little personality" defaultChecked />
        <fieldset className="choice-checks"><legend>Project visibility</legend><Inline>
          <Radio label="Private" name="visibility" value="private" defaultChecked />
          <Radio label="Public" name="visibility" value="public" />
        </Inline></fieldset>
        <Switch label="Email updates" defaultChecked />
        <Inline><Button disabled>Disabled</Button><Button loading>Working</Button></Inline>
        <Field label="Email" error="Enter an email address.">{(props) => <Input {...props} type="email" />}</Field>
        <Field label="Notes" hint="Optional context">{(props) => <Textarea {...props} />}</Field>
        <Checkbox label="Disabled checkbox" disabled />
        <Switch label="Disabled switch" disabled />
        <Radio label="Disabled radio" disabled />
      </Stack>
    </section>
  );
}

export default function Examples() {
  const [copyStatus, setCopyStatus] = useState("");
  const [name, setName] = useState("My project");
  const [note, setNote] = useState(initialNote);
  const [validation, setValidation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ideas, setIdeas] = useState(initialIdeas);
  const [ideaStatus, setIdeaStatus] = useState("");
  const workspaceInput = useRef<HTMLInputElement>(null);
  const pendingSave = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextIdea = useRef(4);

  useEffect(() => () => { if (pendingSave.current !== null) clearTimeout(pendingSave.current); }, []);

  function clearSavedState() {
    if (pendingSave.current !== null) clearTimeout(pendingSave.current);
    pendingSave.current = null;
    setBusy(false);
    setSaved(false);
  }
  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(command);
      setCopyStatus("Copied. Ready for your React project.");
    } catch {
      setCopyStatus("Select the command and copy it manually.");
    }
  }
  function saveWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setValidation(!name.trim());
    if (!name.trim()) {
      workspaceInput.current?.focus();
      return;
    }
    setSaved(false);
    setBusy(true);
    pendingSave.current = setTimeout(() => {
      pendingSave.current = null;
      setBusy(false);
      setSaved(true);
    }, 650);
  }
  function addIdea() {
    const id = nextIdea.current++;
    const title = `New idea ${id}`;
    setIdeas((previous) => [...previous, { id, title, description: "A little room for your next good idea.", complete: false }]);
    setIdeaStatus(`${title} added.`);
  }

  return (
    <FloodRoot className="site-root">
      <div className="site-shell">
        <SiteHeader path="/playground" />

        <main className="landing-main">
          <section className="hero" aria-labelledby="hero-title">
            <Heading level={1} size="display" id="hero-title" className="hero-title">
              <span className="hero-line">Good interfaces</span>
              <span className="hero-line">start with a little <span className="brand-phrase"><img className="hero-mark" src="/flood-mark.png" alt="" width="108" height="108" /> Flood.</span></span>
            </Heading>
            <Text as="p" size="lead" tone="subtle" className="hero-description">
              A calm foundation for React.<br />Native components. Instructions for your agent.
            </Text>
            <div className="installation">
              <CodeSnippet code={command} className="installation-code" aria-label="Installation command"
                action={<Button size="lg" variant="subtle" onClick={copyCommand}
                  disabled={!release.published} aria-label="Copy installation command">
                  Copy <IconSlot size="sm"><Copy /></IconSlot>
                </Button>} />
              <Text as="p" size="helper" tone="subtle" role="status" className="installation-status">
                {!release.published ? <>Preview · npm release is being prepared. <Link href="/llms.txt">Agent guide</Link></> : copyStatus}
              </Text>
            </div>
          </section>

          <section className="foundation" id="foundation" aria-label="Try the foundation">
            <Link href="#foundation" className="foundation-label">Try the foundation</Link>
            <div className="foundation-grid">
              <Surface className="workspace-panel" padding="8" style={{ padding: "var(--landing-panel-padding)" }}>
                <form onSubmit={saveWorkspace} noValidate aria-label="Workspace settings">
                  <Stack gap="6">
                    <Field label="Workspace name" required error={validation ? "Give your workspace a name." : undefined}>
                      {(props) => <Input {...props} ref={workspaceInput} name="workspace" controlSize="xl"
                        value={name} autoComplete="off" onChange={(event) => {
                          setName(event.target.value); setValidation(false); clearSavedState();
                        }} />}
                    </Field>
                    <Stack gap="2">
                      <Field label="Project note" describedBy="note-counter">
                        {(props) => <Textarea {...props} name="note" controlSize="xl" rows={3} maxLength={500}
                          value={note} onChange={(event) => { setNote(event.target.value); clearSavedState(); }} />}
                      </Field>
                      <Inline gap="3" className="workspace-actions" align="start">
                        <Text size="helper" tone="subtle" id="note-counter">{note.length} / 500</Text>
                        <Button type="submit" size="xl" loading={busy} className="save-button">
                          {busy ? "Saving…" : "Save changes"}
                          {!busy && <IconSlot size="md"><ArrowRight /></IconSlot>}
                        </Button>
                      </Inline>
                    </Stack>
                    <Text as="p" size="helper" role="status" className="workspace-status">
                      {saved ? "Workspace saved locally. Nothing was sent." : ""}
                    </Text>
                  </Stack>
                </form>
              </Surface>

              <Surface className="ideas-panel" padding="8">
                <Stack gap="6">
                  <Inline gap="4" className="ideas-heading">
                    <Heading level={2} size="section">Ideas</Heading>
                    <IconButton label="Add idea" onClick={addIdea}><Plus /></IconButton>
                  </Inline>
                  <Stack gap="3" role="list" aria-label="Ideas">
                    {ideas.map((idea) => <div key={idea.id} className="idea-row" role="listitem" data-complete={idea.complete || undefined}>
                      <Checkbox checked={idea.complete} onChange={(event) => {
                        const complete = event.target.checked;
                        setIdeas((previous) => previous.map((item) => item.id === idea.id ? { ...item, complete } : item));
                      }} label={<Stack gap="1">
                        <Text size="body" className="idea-title">{idea.title}</Text>
                        <Text size="compact" tone="subtle">{idea.description}</Text>
                      </Stack>} />
                    </div>)}
                  </Stack>
                </Stack>
                <div role="status" className="sr-only">{ideaStatus}</div>
              </Surface>
            </div>
          </section>
          {location.pathname === "/playground" && <PlaygroundChecks />}
        </main>

        <footer className="site-footer">
          <Text size="helper" tone="subtle">A growing collection, made with care.</Text>
          <Inline gap="4">
            <Link href="https://github.com/tillwithered/flood.md/blob/main/LICENSE">MIT licensed</Link>
            <span className="header-divider" aria-hidden="true" />
            <Link href="/agent/DESIGN.md" className="icon-link">For your agent <IconSlot size="sm"><ArrowUpRight /></IconSlot></Link>
          </Inline>
        </footer>
      </div>
    </FloodRoot>
  );
}
