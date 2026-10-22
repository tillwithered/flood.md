import { useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import {
  Button,
  Checkbox,
  Field,
  Input,
  Link,
  Radio,
  Switch,
  Textarea,
} from "@flood-md/react";
import "@flood-md/react/styles.css";
import "./site.css";

const command = "npx @flood-md/cli@0.1.0 init";
function App() {
  const [dark, setDark] = useState(false);
  const [tab, setTab] = useState("button");
  const [copyStatus, setCopyStatus] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("My next idea");
  const [validation, setValidation] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopyStatus("Copied. Run it in your React project.");
    } catch {
      setCopyStatus("Select the command and copy it manually.");
    }
  }
  function theme(checked: boolean) {
    setDark(checked);
    document.documentElement.dataset.floodTheme = checked ? "dark" : "light";
  }
  function save(event: FormEvent) {
    event.preventDefault();
    setValidation(!name.trim());
    if (name.trim()) {
      setBusy(true);
      setSaved(false);
      setTimeout(() => {
        setBusy(false);
        setSaved(true);
      }, 650);
    }
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <a href="/" className="wordmark" aria-label="flood.md home">
          <img src="/flood-mark.png" alt="" width="28" height="28" />
          flood<span>.md</span>
        </a>
        <div className="header-right">
          <span className="release">v0.1.0 · first foundations</span>
          <Link href="https://github.com/tillwithered/flood.md">
            GitHub <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </header>
      <main className="hero">
        <div className="intro">
          <p className="eyebrow">INDEPENDENT BY DESIGN</p>
          <h1>
            A little system.
            <br />
            <span>A lot of possibility.</span>
          </h1>
          <p className="description">
            Thoughtful components for your next idea.
            <br className="desktop-break" /> Built for React, Next.js, and the
            agent beside you.
          </p>
        </div>
        <div className="installation">
          <div className="command">
            <span aria-hidden="true" className="prompt">
              $
            </span>
            <code>{command}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={copy}
              aria-label="Copy installation command"
            >
              Copy <span aria-hidden="true">⧉</span>
            </Button>
          </div>
          <p className="install-help" role="status">
            {copyStatus || (
              <>
                Or give your agent{" "}
                <Link href="/llms.txt">flood.md/llms.txt</Link>. It knows the
                way.
              </>
            )}
          </p>
        </div>
        <section className="specimen" aria-label="Try Flood components">
          <div className="specimen-heading">
            <span>THE FIRST PIECES</span>
            <Switch
              label="Dark theme"
              checked={dark}
              onChange={(event) => theme(event.target.checked)}
            />
          </div>
          <div className="specimen-layout">
            <div
              className="component-nav"
              role="tablist"
              aria-label="Components"
            >
              {["button", "inputs", "choices"].map((item) => (
                <button
                  key={item}
                  id={`tab-${item}`}
                  type="button"
                  role="tab"
                  aria-selected={tab === item}
                  aria-controls={`panel-${item}`}
                  tabIndex={tab === item ? 0 : -1}
                  onClick={() => {
                    setTab(item);
                    setNotice("");
                  }}
                  onKeyDown={(event) => {
                    const items = ["button", "inputs", "choices"];
                    const index = items.indexOf(item);
                    const next =
                      event.key === "ArrowRight" || event.key === "ArrowDown"
                        ? (index + 1) % 3
                        : event.key === "ArrowLeft" || event.key === "ArrowUp"
                          ? (index + 2) % 3
                          : event.key === "Home"
                            ? 0
                            : event.key === "End"
                              ? 2
                              : -1;
                    if (next >= 0) {
                      event.preventDefault();
                      setTab(items[next]);
                      document.getElementById(`tab-${items[next]}`)?.focus();
                    }
                  }}
                >
                  {item === "button"
                    ? "Button"
                    : item === "inputs"
                      ? "Inputs"
                      : "Choices"}
                  <span aria-hidden="true">
                    0{item === "button" ? 1 : item === "inputs" ? 2 : 3}
                  </span>
                </button>
              ))}
            </div>
            <div
              className="component-stage"
              role="tabpanel"
              id={`panel-${tab}`}
              aria-labelledby={`tab-${tab}`}
              tabIndex={0}
            >
              {tab === "button" && (
                <>
                  <div className="button-row">
                    <Button
                      onClick={() =>
                        setNotice("A small beginning. Make it yours.")
                      }
                    >
                      Start something <span aria-hidden="true">↗</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setNotice("Same foundation. A quieter action.")
                      }
                    >
                      Make it yours
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setNotice("No extra weight. Just the action.")
                      }
                    >
                      Keep it simple
                    </Button>
                  </div>
                  <p className="stage-caption" role="status">
                    {notice || "Three expressions. One considered foundation."}
                  </p>
                </>
              )}
              {tab === "inputs" && (
                <form onSubmit={save} noValidate className="demo-form">
                  <Field
                    label="Project name"
                    error={validation ? "Give your idea a name." : undefined}
                  >
                    {(props) => (
                      <Input
                        {...props}
                        value={name}
                        name="project"
                        onChange={(event) => {
                          setName(event.target.value);
                          setSaved(false);
                        }}
                      />
                    )}
                  </Field>
                  <Button type="submit" loading={busy}>
                    {saved ? "Saved locally" : "Save idea"}
                  </Button>
                  <span role="status" className="stage-caption">
                    {saved
                      ? "Demo only — nothing was sent."
                      : "A label, a state, a clear next step."}
                  </span>
                </form>
              )}
              {tab === "choices" && (
                <div className="choice-demo">
                  <Checkbox
                    label="Leave room for a little personality"
                    defaultChecked
                  />
                  <fieldset>
                    <legend className="sr-only">Interface density</legend>
                    <Radio
                      label="Comfortable"
                      name="density"
                      value="comfortable"
                      defaultChecked
                    />
                    <Radio label="Compact" name="density" value="compact" />
                  </fieldset>
                  <Switch label="A quieter interface" defaultChecked />
                </div>
              )}
            </div>
          </div>
        </section>
        <p className="foundation-note">
          Original components. Shared tokens. Instructions included.
        </p>
      </main>
      <footer className="site-footer">
        <span>A growing collection, made with care.</span>
        <div>
          <Link href="https://github.com/tillwithered/flood.md/blob/main/LICENSE">
            MIT licensed
          </Link>
          <span className="footer-divider">/</span>
          <Link href="/agent/DESIGN.md">
            For your agent <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </footer>
      {location.pathname === "/playground" && (
        <section className="playground" aria-label="All component states">
          <h2>Component checks</h2>
          <Button disabled>Disabled</Button>
          <Button loading>Working</Button>
          <Field label="Email" error="Enter an email address.">
            {(props) => <Input {...props} type="email" />}
          </Field>
          <Field label="Notes" hint="Optional context">
            {(props) => <Textarea {...props} />}
          </Field>
          <Checkbox label="Disabled checkbox" disabled />
          <Switch label="Disabled switch" disabled />
          <Radio label="Disabled radio" disabled />
        </section>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
