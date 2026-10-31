import { lazy, Suspense, useState, type ComponentType } from "react";
import { CopyButton, CodeSnippet, FloodRoot, Heading, Inline, Link, SkipLink, Text } from "@flood-md/react";
import "@flood-md/react/styles.css";
import "./site.css";
import release from "./release.json";
import { SiteHeader } from "./site-header";
import { SiteFooter } from './site-footer';

const Examples = lazy(() => import("./examples"));
const ContentBoard = lazy(() => import("./content-board"));
const CollectionsPlayground = lazy(() => import("./collections-playground"));
const command = `npx @flood-md/cli@${release.version} init`;

function Home() {
  const [status, setStatus] = useState("");
  return <main id="main-content" tabIndex={-1} className="home-main">
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
          action={<CopyButton value={command} size="lg" variant="subtle" disabled={!release.published}
            aria-label="Copy installation command" onCopied={() => setStatus("Copied. Ready for your React project.")}
            onCopyError={() => setStatus("Select the command and copy it manually.")} />} />
        <Text as="p" size="helper" tone="subtle" role="status" className="installation-status">
          {release.published ? status : "Preview · npm release is being prepared."}
        </Text>
      </div>
    </section>
  </main>;
}

export function App({ path, documentation: Reader }: { path: string; documentation?: ComponentType<{ path: string }> }) {
  if (path === "/playground/collections") return <Suspense fallback={<p>Loading collections…</p>}><CollectionsPlayground /></Suspense>;
  if (path === "/playground/content") return <Suspense fallback={<p>Loading components…</p>}><ContentBoard /></Suspense>;
  if (path === "/playground") return <Suspense fallback={<p>Loading examples…</p>}><Examples /></Suspense>;
  const home = path === "/";
  return <FloodRoot className={`site-root ${home ? "home-site" : "docs-site"}`}>
    <SkipLink href="#main-content" />
    <div className="site-shell">
      <SiteHeader path={path} />
      {home ? <Home /> : Reader ? <Reader path={path} /> : <main id="main-content" tabIndex={-1} className="doc-loading">Loading documentation…</main>}
      <SiteFooter />
    </div>
  </FloodRoot>;
}

