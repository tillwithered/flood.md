import { lazy, Suspense, useEffect, useRef, type ComponentType } from "react";
import { FloodRoot, ScrollArea, SkipLink } from "@flood-md/react";
import "@flood-md/react/styles.css";
import "./site.css";
import "./discovery.css";
import { Home } from "./home";
import { AgentsDirectory, CategoriesDirectory, ComponentDirectory, RecipesDirectory } from "./discovery-pages";
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
const ChartsPlayground = lazy(() => import("./charts-playground"));
type AppProps = { path: string; documentation?: ComponentType<{ path: string }> };

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
    <Page {...props} />
  </ScrollArea>;
}

function Page({ path, documentation: Reader }: AppProps) {
  if (path === "/playground/navigation") return <Suspense fallback={null}><NavigationPlayground /></Suspense>;
  if (path === "/playground/motion") return <Suspense fallback={null}><MotionPlayground /></Suspense>;
  if (path === "/playground/surfaces") return <Suspense fallback={null}><SurfaceStudy /></Suspense>;
  if (path === "/playground/collections") return <Suspense fallback={<p>Loading collections…</p>}><CollectionsPlayground /></Suspense>;
  if (path === "/playground/content") return <Suspense fallback={<p>Loading components…</p>}><ContentBoard /></Suspense>;
  if (path === "/playground") return <Suspense fallback={<p>Loading examples…</p>}><Examples /></Suspense>;
  const home = path === "/";
  const Recipe = path === "/playground/records" ? RecordManagement : path === "/playground/settings" ? SettingsWorkspace :
    path === "/playground/charts" ? ChartsPlayground : undefined;
  const activeFormat = path === "/playground/collections/active-format";
  const filterGroup = path === "/playground/collections/filter-group";
  const savedViews = path === "/playground/collections/saved-views";
  const filterPreview = savedViews || filterGroup || activeFormat || path === "/playground/collections/format";
  return <FloodRoot className={`site-root ${home ? "home-site" : "docs-site"}`}>
    <SkipLink href="#main-content" />
    <div className="site-shell">
      <SiteHeader path={path} />
      {home ? <Home /> :
      path === "/components" || path.startsWith("/components/category/") ? <ComponentDirectory family={path.split("/")[3]} /> :
      path === "/categories" ? <CategoriesDirectory /> :
      path === "/recipes" || path.startsWith("/recipes/") ? <RecipesDirectory collection={path.split("/")[2]} /> :
      path === "/for-agents" ? <AgentsDirectory /> : Recipe ? (
        <main id="main-content" tabIndex={-1} className="recipe-playground">
          <Suspense fallback={null}><Recipe /></Suspense>
        </main>
      ) : filterPreview ? (
        <Suspense fallback={null}>
          <FormatFilterPreview mode={savedViews ? "views" : filterGroup ? "group" : activeFormat ? "tag" : "select"} />
        </Suspense>
      ) : Reader ? <Reader path={path} /> : <main id="main-content" tabIndex={-1} className="doc-loading">Loading documentation…</main>}
      <SiteFooter />
    </div>
  </FloodRoot>;
}

