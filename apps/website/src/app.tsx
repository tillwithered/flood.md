import { lazy, Suspense, useState, type ComponentType } from "react";
import { Copy } from "lucide-react";
import { Button, CodeSnippet, FloodRoot, Heading, IconSlot, Inline, Link, Text } from "@flood-md/react";
import "@flood-md/react/styles.css";
import "./site.css";
import release from "./release.json";
import { SiteHeader } from "./site-header";

const Examples = lazy(() => import("./examples"));
const ContentBoard = lazy(() => import("./content-board"));
const repository = "https://github.com/tillwithered/flood.md";
const command = `npx @flood-md/cli@${release.version} init`;

function Home() {
  const [status, setStatus] = useState("");
  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(command);
      setStatus("Copied. Ready for your React project.");
    } catch { setStatus("Select the command and copy it manually."); }
  }
  return <main id="main-content" className="home-main">
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
          action={<Button size="lg" variant="subtle" onClick={copyCommand} disabled={!release.published} aria-label="Copy installation command">
            Copy <IconSlot size="sm"><Copy /></IconSlot>
          </Button>} />
        <Text as="p" size="helper" tone="subtle" role="status" className="installation-status">
          {release.published ? status : "Preview · npm release is being prepared."}
        </Text>
      </div>
    </section>
  </main>;
}

export function App({ path, documentation: Reader }: { path: string; documentation?: ComponentType<{ path: string }> }) {
  if (path === "/playground/content") return <Suspense fallback={<p>Loading components…</p>}><ContentBoard /></Suspense>;
  if (path === "/playground") return <Suspense fallback={<p>Loading examples…</p>}><Examples /></Suspense>;
  const home = path === "/";
  return <FloodRoot className={`site-root ${home ? "home-site" : "docs-site"}`}>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <div className="site-shell">
      <SiteHeader path={path} />
      {home ? <Home /> : Reader ? <Reader path={path} /> : <main id="main-content" className="doc-loading">Loading documentation…</main>}
      <footer className="site-footer">
        <Text size="helper" tone="subtle">A growing collection, made with care.</Text>
        <Inline gap="4">
          <Link href={`${repository}/blob/main/LICENSE`}>MIT licensed</Link>
          <Link href="/agent/SKILL.md">For your agent</Link>
        </Inline>
      </footer>
    </div>
  </FloodRoot>;
}

