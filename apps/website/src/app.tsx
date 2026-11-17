import { lazy, Suspense, useEffect, useRef, useState, type ComponentType, type RefObject } from "react";
import { CopyButton, CodeSnippet, FloodRoot, Heading, ScrollArea, SkipLink, Text } from "@flood-md/react";
import "@flood-md/react/styles.css";
import "./site.css";
import release from "./release.json";
import { SiteHeader } from "./site-header";
import { SiteFooter } from './site-footer';

const Examples = lazy(() => import("./examples"));
const ContentBoard = lazy(() => import("./content-board"));
const CollectionsPlayground = lazy(() => import("./collections-playground"));
const SurfaceStudy = lazy(() => import("./surface-study"));
const NavigationPlayground = lazy(() => import("./navigation-playground"));
const MotionPlayground = lazy(() => import("./motion-playground"));
const FormatFilterPreview = lazy(() => import("./format-filter-preview"));
const RecordManagement = lazy(() => import("./recipes/record-management").then(module => ({ default: module.RecordManagement })));
const SettingsWorkspace = lazy(() => import("./recipes/settings-workspace").then(module => ({ default: module.SettingsWorkspace })));
const ProductVariants = lazy(() => import("./recipes/product-variants").then(module => ({ default: module.ProductVariants })));
const MergeRecords = lazy(() => import("./recipes/merge-records").then(module => ({ default: module.MergeRecords })));
const ImportMapping = lazy(() => import("./recipes/import-mapping").then(module => ({ default: module.ImportMapping })));
const ChartsPlayground = lazy(() => import("./charts-playground"));
const DocumentReview = lazy(() => import("./recipes/document-review").then(module => ({ default: module.DocumentReview })));
const CodeEditorExample = lazy(() => import("./recipes/code-editor-workspace").then(module => ({ default: module.CodeEditorExample })));
const CodeReview = lazy(() => import("./recipes/code-review").then(module => ({ default: module.CodeReview })));
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
        An open-source design system for developers and coding agents.
      </Text>
      <div className="installation">
        <CodeSnippet code={command} prompt="$" className="installation-code" aria-label="Installation command"
          action={<CopyButton value={command} iconOnly size="sm" variant="ghost" disabled={!release.published}
            aria-label="Copy installation command" onCopied={() => setStatus("Command copied.")}
            onCopyError={() => setStatus("Select the command and copy it manually.")} />} />
        <Text as="p" size="helper" tone="subtle" role="status" className="installation-status">
          {release.published ? status : "Available after release"}
        </Text>
      </div>
    </section>
  </main>;
}

type DocProps = { path: string; scrollRootRef?: RefObject<HTMLDivElement | null> };
type AppProps = { path: string; documentation?: ComponentType<DocProps> };

export function App(props: AppProps) {
  const pageScroll = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const viewport = pageScroll.current;
    if (!viewport) return;
    const document = viewport.ownerDocument;
    const view = document.defaultView;
    if (!view) return;
    const navigation = view.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (navigation?.type === "back_forward" && typeof view.history.state?.floodScrollTop === "number") {
      viewport.scrollTop = view.history.state.floodScrollTop;
    }
    let saveTimer: number | undefined;
    const rememberScroll = () => {
      view.clearTimeout(saveTimer);
      saveTimer = undefined;
      if (view.history.state?.floodScrollTop === viewport.scrollTop) return;
      view.history.replaceState({ ...view.history.state, floodScrollTop: viewport.scrollTop }, "");
    };
    const queueSave = () => { saveTimer ??= view.setTimeout(rememberScroll, 250); };
    const scrollUnfocusedPage = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.metaKey || document.activeElement !== document.body ||
          document.querySelector("dialog:modal")) return;
      const positions = {
        ArrowDown: viewport.scrollTop + 40,
        ArrowUp: viewport.scrollTop - 40,
        PageDown: viewport.scrollTop + viewport.clientHeight,
        PageUp: viewport.scrollTop - viewport.clientHeight,
        Home: 0,
        End: viewport.scrollHeight,
        " ": viewport.scrollTop + (event.shiftKey ? -1 : 1) * viewport.clientHeight,
      };
      if (!Object.hasOwn(positions, event.key)) return;
      event.preventDefault();
      viewport.scrollTop = positions[event.key as keyof typeof positions];
    };
    document.addEventListener("keydown", scrollUnfocusedPage);
    viewport.addEventListener("scroll", queueSave, { passive: true });
    document.addEventListener("click", rememberScroll, { capture: true });
    view.addEventListener("pagehide", rememberScroll);
    return () => {
      document.removeEventListener("keydown", scrollUnfocusedPage);
      viewport.removeEventListener("scroll", queueSave);
      document.removeEventListener("click", rememberScroll, { capture: true });
      view.removeEventListener("pagehide", rememberScroll);
      view.clearTimeout(saveTimer);
    };
  }, []);
  return <ScrollArea ref={pageScroll} className="site-page-scroll" contentInset="none" tabIndex={-1}>
    <Page {...props} scrollRootRef={pageScroll} />
  </ScrollArea>;
}

function Page({ path, documentation: Reader, scrollRootRef }: AppProps & Pick<DocProps, "scrollRootRef">) {
  if (path === "/playground/navigation") return <Suspense fallback={null}><NavigationPlayground /></Suspense>;
  if (path === "/playground/motion") return <Suspense fallback={null}><MotionPlayground /></Suspense>;
  if (path === "/playground/surfaces") return <Suspense fallback={null}><SurfaceStudy /></Suspense>;
  if (path === "/playground/collections") return <Suspense fallback={<p>Loading collections…</p>}><CollectionsPlayground /></Suspense>;
  if (path === "/playground/content") return <Suspense fallback={<p>Loading components…</p>}><ContentBoard /></Suspense>;
  if (path === "/playground") return <Suspense fallback={<p>Loading examples…</p>}><Examples /></Suspense>;
  const home = path === "/";
  const Recipe = path === "/playground/records" ? RecordManagement : path === "/playground/settings" ? SettingsWorkspace :
    path === "/playground/product-variants" ? ProductVariants :
    path === "/playground/merge-records" ? MergeRecords :
    path === "/playground/import-mapping" ? ImportMapping :
    path === "/playground/charts" ? ChartsPlayground :
    path === "/playground/document-review" ? DocumentReview :
    path === "/playground/code-editor" ? CodeEditorExample :
    path === "/playground/code-review" ? CodeReview : undefined;
  const activeFormat = path === "/playground/collections/active-format";
  const filterGroup = path === "/playground/collections/filter-group";
  const savedViews = path === "/playground/collections/saved-views";
  const filterPreview = savedViews || filterGroup || activeFormat || path === "/playground/collections/format";
  return <FloodRoot className={`site-root ${home ? "home-site" : "docs-site"}`}>
    <SkipLink href="#main-content" />
    <div className="site-shell">
      <SiteHeader path={path} />
      {home ? <Home /> : Recipe ? (
        <main id="main-content" tabIndex={-1} className="recipe-playground">
          <Suspense fallback={null}><Recipe /></Suspense>
        </main>
      ) : filterPreview ? (
        <Suspense fallback={null}>
          <FormatFilterPreview mode={savedViews ? "views" : filterGroup ? "group" : activeFormat ? "tag" : "select"} />
        </Suspense>
      ) : Reader ? <Reader path={path} scrollRootRef={scrollRootRef} /> : <main id="main-content" tabIndex={-1} className="doc-loading">Loading documentation…</main>}
      <SiteFooter />
    </div>
  </FloodRoot>;
}

