import { useRef, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import { Plus } from "lucide-react";
import {
  Button, Checkbox, Divider, Field, FloodRoot, Heading, IconButton,
  Inline, Input, Link, Radio, Stack, Surface, Switch, Text, Textarea,
} from "@flood-md/react";
import "@flood-md/react/styles.css";
import "./site.css";
import release from "./release.json";

const command = `npx @flood-md/cli@${release.version} init`;
const tabs = ["button", "inputs", "choices"] as const;
type DemoTab = typeof tabs[number];

function App() {
  const [tab, setTab] = useState<DemoTab>("button");
  const [copyStatus, setCopyStatus] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("My next idea");
  const [validation, setValidation] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopyStatus("Copied. Run it in your React project.");
    } catch {
      setCopyStatus("Select the command and copy it manually.");
    }
  }
  function save(event: FormEvent) {
    event.preventDefault();
    setValidation(!name.trim());
    if (!name.trim()) {
      input.current?.focus();
      return;
    }
    setBusy(true);
    setSaved(false);
    setTimeout(() => { setBusy(false); setSaved(true); }, 650);
  }

  return (
    <FloodRoot className="site-root">
      <div className="site-shell">
        <header className="site-header">
          <a href="/" className="wordmark" aria-label="flood.md home">
            <img src="/flood-mark.png" alt="" width="28" height="28" />
            flood<span>.md</span>
          </a>
          <Inline gap="6" className="header-right">
            <Text size="helper" tone="subtle" className="release">v{release.version} · dark foundations</Text>
            <Link href="https://github.com/tillwithered/flood.md">GitHub <span aria-hidden="true">↗</span></Link>
          </Inline>
        </header>

        <main className="hero">
          <Stack gap="4" className="intro">
            <Text as="p" size="helper" tone="subtle" className="eyebrow">INDEPENDENT BY DESIGN</Text>
            <Heading level={1} size="large">A clear foundation.<br />Room to make it yours.</Heading>
            <Text as="p" size="body" tone="subtle" className="description">
              Clean components. A considered dark theme.{" "}<br className="desktop-break" />
              For React, Next.js, and the agent beside you.
            </Text>
          </Stack>

          <div className="installation">
            <div className="command">
              <span aria-hidden="true" className="prompt">$</span>
              <code>{command}</code>
              <Button variant="subtle" size="sm" onClick={copy} disabled={!release.published}
                aria-label="Copy installation command">Copy <span aria-hidden="true">⧉</span></Button>
            </div>
            <Text as="p" size="helper" tone="subtle" className="install-help" role="status">
              {!release.published ? <>Preview · npm release is being prepared. <Link href="/llms.txt">Agent guide</Link></>
                : copyStatus || <>Or give your agent <Link href="/llms.txt">flood.md/llms.txt</Link>.</>}
            </Text>
          </div>

          <section className="specimen" aria-label="Try Flood components">
            <Inline gap="4" className="specimen-heading">
              <Text size="helper" tone="subtle">THE FIRST PIECES</Text>
              <Text size="helper" tone="subtle">Neutral · dark</Text>
            </Inline>
            <Surface padding="0" className="specimen-surface">
              <div className="specimen-layout">
                <div className="component-nav" role="tablist" aria-label="Components">
                  {tabs.map((item, index) => (
                    <button key={item} id={`tab-${item}`} type="button" role="tab"
                      aria-selected={tab === item} aria-controls={`panel-${item}`}
                      tabIndex={tab === item ? 0 : -1}
                      onClick={() => { setTab(item); setNotice(""); }}
                      onKeyDown={(event) => {
                        const next = event.key === "ArrowRight" || event.key === "ArrowDown" ? (index + 1) % tabs.length
                          : event.key === "ArrowLeft" || event.key === "ArrowUp" ? (index + tabs.length - 1) % tabs.length
                            : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
                        if (next >= 0) {
                          event.preventDefault(); setTab(tabs[next]);
                          document.getElementById(`tab-${tabs[next]}`)?.focus();
                        }
                      }}>
                      {item === "button" ? "Button" : item === "inputs" ? "Inputs" : "Choices"}
                      <span aria-hidden="true">0{index + 1}</span>
                    </button>
                  ))}
                </div>
                {tabs.map((item) => (
                  <div key={item} className="component-stage" role="tabpanel"
                    id={`panel-${item}`} aria-labelledby={`tab-${item}`} tabIndex={0} hidden={tab !== item}>
                    {item === "button" && <Stack gap="4">
                      <Inline gap="2">
                        <Button onClick={() => setNotice("A small beginning. Make it yours.")}>Start something <span aria-hidden="true">↗</span></Button>
                        <Button variant="subtle" onClick={() => setNotice("Same foundation. A quieter action.")}>Make it yours</Button>
                        <IconButton label="Add a new idea" onClick={() => setNotice("A new idea. A little more possibility.")}><Plus /></IconButton>
                      </Inline>
                      <Text as="p" size="helper" tone="subtle" role="status">{notice || "Simple actions. Room for a little personality."}</Text>
                    </Stack>}
                    {item === "inputs" && <form onSubmit={save} noValidate className="demo-form">
                      <Field label="Project name" required error={validation ? "Give your idea a name." : undefined}>
                        {(props) => <Input {...props} ref={input} value={name} name="project" autoComplete="off"
                          onChange={(event) => { setName(event.target.value); setSaved(false); setValidation(false); }} />}
                      </Field>
                      <Button type="submit" loading={busy}>{saved ? "Saved locally" : "Save idea"}</Button>
                      <Text as="p" size="helper" tone="subtle" className="stage-caption" role="status">
                        {saved ? "Demo only — nothing was sent." : "A label, a state, a clear next step."}
                      </Text>
                    </form>}
                    {item === "choices" && <Stack gap="2" className="choice-demo">
                      <Checkbox label="Leave room for a little personality" defaultChecked />
                      <fieldset>
                        <legend className="sr-only">Project visibility</legend>
                        <Inline gap="4">
                          <Radio label="Private" name="visibility" value="private" defaultChecked />
                          <Radio label="Public" name="visibility" value="public" />
                        </Inline>
                      </fieldset>
                      <Switch label="Email updates" defaultChecked />
                    </Stack>}
                  </div>
                ))}
              </div>
            </Surface>
          </section>
          <Text as="p" size="helper" tone="subtle" className="foundation-note">Original components. Shared tokens. Agent instructions included.</Text>
        </main>

        <footer className="site-footer">
          <Text size="helper" tone="subtle">A growing collection, made with care.</Text>
          <Inline gap="4">
            <Link href="https://github.com/tillwithered/flood.md/blob/main/docs/base-components.md">Components</Link>
            <Link href="https://github.com/tillwithered/flood.md/blob/main/LICENSE">MIT licensed</Link>
            <span aria-hidden="true" className="footer-divider">/</span>
            <Link href="/agent/DESIGN.md">For your agent <span aria-hidden="true">↗</span></Link>
          </Inline>
        </footer>

        {location.pathname === "/playground" && <section className="playground" aria-label="All component states">
          <Heading size="section">Component checks</Heading><Divider />
          <Inline><Button disabled>Disabled</Button><Button loading>Working</Button></Inline>
          <Field label="Email" error="Enter an email address.">{(props) => <Input {...props} type="email" />}</Field>
          <Field label="Notes" hint="Optional context">{(props) => <Textarea {...props} />}</Field>
          <Checkbox label="Disabled checkbox" disabled />
          <Switch label="Disabled switch" disabled />
          <Radio label="Disabled radio" disabled />
        </section>}
      </div>
    </FloodRoot>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
