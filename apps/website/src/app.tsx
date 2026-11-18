import { Fragment, useRef } from "react";
import { FloodRoot, Grid, ScrollArea, Skeleton, SkipLink, Stack, VisuallyHidden } from "@flood-md/react";
import "@flood-md/react/styles.css";
import "./site.css";
import "./discovery.css";
import "./site-navigation.css";
import { Home } from "./home";
import { AgentsDirectory, CategoriesDirectory, ComponentDirectory, RecipesDirectory } from "./discovery-pages";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { usesDocumentation } from "../site-guides.mjs";
import { routeLabel, useSiteNavigation } from "./site-navigation";
import type { PageContent } from "./site-pages";

type AppProps = { path: string } & PageContent;

export function App(initial: AppProps) {
  const pageScroll = useRef<HTMLDivElement>(null);
  const { route, pending } = useSiteNavigation(initial, pageScroll);
  return <ScrollArea ref={pageScroll} className="site-page-scroll" contentInset="none" tabIndex={-1}
    onFocus={event => {
      if (event.target.matches("[data-route-focus], [data-preserve-page-scroll], [data-returned-focus]")) event.preventDefault();
    }}
    data-route-arriving={route.revision > 0 && !pending || undefined}>
    <Page {...route} pending={pending} />
  </ScrollArea>;
}

function RouteLoading({ path }: { path: string }) {
  const studio = path.startsWith("/components/") && usesDocumentation(path);
  const document = !studio && usesDocumentation(path);
  return <main id="main-content" tabIndex={-1} className={`site-route-loading${document ? " docs-layout" : ""}`}
    data-loading-layout={studio ? "studio" : document ? "document" : "directory"}>
    <VisuallyHidden role="status">Loading {routeLabel(path) ?? "page"}…</VisuallyHidden>
    {(studio || document) && <aside className="site-route-loading-sidebar desktop-sidebar" aria-hidden="true">
      <Stack gap="3">
        <Skeleton shape="rounded" width="100%" height="2rem" />
        {[74, 92, 64, 84, 70, 96, 78].map(width => <Skeleton key={width} width={width + "%"} />)}
      </Stack>
    </aside>}
    <Stack gap="6" className={`site-route-loading-body${document ? " doc-article" : ""}`} aria-busy="true">
      {document && <Skeleton shape="rounded" width="11rem" height="2rem" className="site-route-loading-mobile" />}
      <Stack gap="3">
        <Skeleton width="min(60%, 18rem)" height={document || studio ? "2rem" : "3.5rem"} />
        {!studio && <Skeleton width="min(82%, 29rem)" />}
      </Stack>
      {document && <Skeleton shape="rounded" width="100%" height="2.5rem" className="site-route-loading-mobile" />}
      {studio ? <Skeleton shape="rounded" width="100%" className="site-route-loading-preview" /> :
        document ? <Stack gap="3">
          {[95, 86, 68, 92, 78, 45].map(width => <Skeleton key={width} width={width + "%"} />)}
          <Skeleton shape="rounded" width="100%" height="10rem" />
        </Stack> : <Grid minItemWidth="15rem" gap="4">
          {[0, 1, 2].map(index => <Skeleton key={index} shape="rounded" width="100%" height="10rem" />)}
        </Grid>}
    </Stack>
    {document && <aside className="doc-toc" aria-hidden="true">
      <Stack gap="3">
        <Skeleton width="min(80%, 7rem)" />
        <Skeleton width="min(64%, 6rem)" />
        <Skeleton width="min(72%, 6.5rem)" />
      </Stack>
    </aside>}
  </main>;
}

function Page({ path, documentation: Reader, preview, standalone, recipe, pending }: AppProps & { pending?: string }) {
  if (standalone && !pending) return preview;
  const home = path === "/";
  const destination = pending ?? path;
  const studio = destination.startsWith("/components/") && usesDocumentation(destination);
  return <FloodRoot className={"site-root " + (home ? "home-site" : "docs-site")}>
    <SkipLink href="#main-content" />
    <div className="site-shell" data-studio={studio || undefined}>
      <SiteHeader path={path} />
      {pending ? <RouteLoading path={pending} /> :
        <Fragment key={path}>
          {home ? <Home /> :
            path === "/components" || path.startsWith("/components/category/") ? <ComponentDirectory family={path.split("/")[3]} /> :
            path === "/categories" ? <CategoriesDirectory /> :
            path === "/recipes" || path.startsWith("/recipes/") ? <RecipesDirectory collection={path.split("/")[2]} /> :
            path === "/for-agents" ? <AgentsDirectory /> :
            recipe ? <main id="main-content" tabIndex={-1} className="recipe-playground">{preview}</main> :
            preview ?? (Reader ? <Reader path={path} /> : <RouteLoading path={path} />)}
        </Fragment>}
      <SiteFooter />
    </div>
  </FloodRoot>;
}
