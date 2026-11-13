import { isValidElement, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowRight, ArrowUpRight, List } from "lucide-react";
import { Breadcrumb, Button, Collapsible, Drawer, Grid, Heading, IconButton, IconSlot, Inline, Kbd, Link, PageHeader, ScrollArea, SearchInput, Select, SegmentedControl, Sheet, Stack, Surface, Text } from "@flood-md/react";
import { docPages, siteOrigin } from "../routes.mjs";
import { componentPages, componentGroups, matchesComponent } from "./component-catalog";
import { ComponentWorkbench } from "./component-workbench";
import { CodeBlock, CopyButton } from "./code-block";
import { DocsNavigation, GuideOutline, MobileDocsNavigation } from "./docs-navigation";
import { compactNavigation, phoneViewport, useStudioMedia } from "./studio-media";
import { usageCode, componentMarkdown } from "../component-docs.mjs";
import content from "./generated/content.json";
import { projectAdapters } from "../project-imports.mjs";
import ChartsPlayground from "./charts-playground";
import release from "./release.json";

const sources: Record<string, string> = content.docs;
const repository = "https://github.com/tillwithered/flood.md";

function textOf(value: ReactNode): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(value)) return textOf(value.props.children);
  return "";
}
function slug(text: string) { return text.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, "").trim().replace(/\s/g, "-"); }
function sections(markdown: string) {
  let fenced = false;
  const seen = new Map<string, number>();
  return markdown.split("\n").flatMap((line, index) => {
    if (line.startsWith("```")) fenced = !fenced;
    const match = !fenced && /^## (.+)/.exec(line);
    if (!match) return [];
    const label = match[1].trim(); const base = slug(label); const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return [{ label: label.replace(/`/g, ""), id: count ? `${base}-${count}` : base, line: index + 1 }];
  });
}

function MarkdownCodeBlock({ children }: { children?: ReactNode }) {
  const className = isValidElement<{ className?: string }>(children) ? children.props.className : undefined;
  return <CodeBlock code={textOf(children)} language={className?.replace(/^language-/, "") ?? "plaintext"} />;
}
function markdownLink(href: string | undefined) {
  if (!href) return undefined;
  if (href.startsWith(`${siteOrigin}/`)) return href.slice(siteOrigin.length);
  if (/^(https?:|mailto:|#|\/)/.test(href)) return href;
  const [file, hash] = href.split("#");
  if (file.startsWith("../packages/agent/")) return "/agent/" + file.slice("../packages/agent/".length) + (hash ? `#${hash}` : "");
  const page = docPages.find(item => item.file === file);
  if (page) return page.path + (hash ? `#${hash}` : "");
  if (file === "components.md" || file === "base-components.md") return "/components" + (hash ? `#${hash}` : "");
  const target = new URL(href, `${repository}/blob/main/docs/README.md`);
  return target.href;
}
function ComponentNavigation({ path, query, onQueryChange, initialFocusRef }: { path: string; query: string; onQueryChange: (query: string) => void; initialFocusRef?: RefObject<HTMLElement | null> }) {
  const localNav = useRef<HTMLElement>(null);
  const nav = initialFocusRef ?? localNav;
  const [category, setCategory] = useState("");
  const groups = componentGroups.filter(group => !category || group.id === category);
  const scrollToStart = () => {
    const viewport = nav.current?.closest<HTMLElement>(".flood-scroll-area__viewport");
    if (viewport) viewport.scrollTop = 0;
  };
  useEffect(() => {
    let cancelled = false;
    const align = () => {
      const current = nav.current?.querySelector('[aria-current="page"]');
      const viewport = nav.current?.closest<HTMLElement>(".flood-scroll-area__viewport");
      if (!current || !viewport || viewport.clientHeight === 0 || cancelled) return;
      const item = current.getBoundingClientRect(), frame = viewport.getBoundingClientRect();
      const toolsHeight = nav.current?.querySelector(".catalog-nav-tools")?.getBoundingClientRect().height ?? 0;
      const gap = parseFloat(getComputedStyle(viewport).fontSize) / 2;
      const bottom = Math.min(frame.bottom, innerHeight - gap);
      // Scroll this region only; never move the article or page heading.
      if (item.bottom > bottom) viewport.scrollTop += item.bottom - bottom + gap;
      else if (item.top < frame.top + toolsHeight) viewport.scrollTop -= frame.top + toolsHeight - item.top;
    };
    const frame = requestAnimationFrame(align);
    const viewport = nav.current?.closest(".flood-scroll-area__viewport");
    const observer = new ResizeObserver(align);
    if (viewport) observer.observe(viewport);
    void document.fonts.ready.then(align);
    return () => { cancelled = true; cancelAnimationFrame(frame); observer.disconnect(); };
  }, [nav, path]);
  const results = groups.flatMap(group => group.components.filter(page => matchesComponent(page, query)));
  return <nav ref={nav} tabIndex={initialFocusRef ? -1 : undefined} aria-label="Component list" className="side-nav">
      <div className="catalog-nav-tools">
        <Link href="/components" variant="ghost" size="sm" className="side-link catalog-link" aria-current={path === "/components" ? "page" : undefined}>All components <span>{componentPages.length}</span></Link>
        <SearchInput controlSize="sm" aria-label="Search components" placeholder="Find a component…" value={query}
          onChange={event => { onQueryChange(event.currentTarget.value); scrollToStart(); }}
          onKeyDown={event => { if (event.key === "Escape" && query) { event.preventDefault(); onQueryChange(""); } }} />
        <Select controlSize="sm" aria-label="Filter by component category" value={category}
          onChange={event => { setCategory(event.currentTarget.value); scrollToStart(); }}>
          <option value="">All categories</option>
          {componentGroups.map(group => <option key={group.id} value={group.id}>{group.label}</option>)}
        </Select>
        {(query || category) && <Text size="helper" tone="subtle" role="status">{results.length ? `${results.length} results` : "No components found."}</Text>}
      </div>
      {groups.map(group => {
        const entries = results.filter(page => page.group === group.id);
        return entries.length > 0 && <div className="side-group" key={group.id} role="group" aria-label={group.label}>
          <Text size="helper" tone="subtle" className="side-label">{group.label}</Text>
          {entries.map(page => <Link key={page.slug} variant="ghost" size="sm" className="side-link" href={`/components/${page.slug}`} aria-current={path === `/components/${page.slug}` ? "page" : undefined}>
            <span className="catalog-item-name" title={page.name}>{page.name}</span>
          </Link>)}
        </div>;
      })}
  </nav>;
}

export default function Documentation({ path }: { path: string }) {
  const doc = docPages.find(page => page.path === path);
  const component = componentPages.find(page => path === `/components/${page.slug}`);
  const catalog = path === "/components";
  const [query, setQuery] = useState("");
  const [catalogJump, setCatalogJump] = useState("");
  const workspacePreview = Boolean(component);
  const [workspacePanel, setWorkspacePanel] = useState<"catalog" | "reference" | null>(null);
  const phone = useStudioMedia(phoneViewport);
  const compactCatalog = useStudioMedia(compactNavigation);
  const ReferenceOverlay = phone ? Sheet : Drawer;
  const referenceDrawer = useRef<HTMLDialogElement>(null);
  const referenceTarget = useRef<HTMLElement>(null);
  const catalogFocus = useRef<HTMLElement>(null);
  const [referenceAnchor, setReferenceAnchor] = useState("");
  useEffect(() => {
    if (!compactCatalog && workspacePanel === "catalog") setWorkspacePanel(null);
  }, [compactCatalog, workspacePanel]);
  useEffect(()=>{
    if(!workspacePreview) return;
    const openReference = () => {
      if (["#usage","#design-notes","#api"].includes(location.hash)) {
        setReferenceAnchor(location.hash.slice(1));
        setWorkspacePanel("reference");
      } else {
        setReferenceAnchor("");
      }
    };
    openReference();
    window.addEventListener("hashchange",openReference);
    const onShortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.isComposing || !event.altKey ||
        event.ctrlKey || event.metaKey || event.shiftKey || document.querySelector("dialog:modal")) return;
      // Match the physical key on any layout. Some input sources only report the character.
      const key = event.key.toLowerCase();
      const matchesReferenceKey = event.code === "KeyR" ||
        ((!event.code || event.code === "Unidentified") && (key === "r" || key === "к"));
      if (!matchesReferenceKey) return;
      const trigger = document.getElementById("studio-reference-trigger");
      if (!trigger) return;
      event.preventDefault();
      trigger.click();
    };
    window.addEventListener("keydown", onShortcut);
    return () => {
      window.removeEventListener("hashchange", openReference);
      window.removeEventListener("keydown", onShortcut);
    };
  },[workspacePreview]);
  useEffect(()=>{
    if (!workspacePreview || workspacePanel !== "reference" || !referenceAnchor) return;
    const drawer = referenceDrawer.current;
    const target = referenceTarget.current;
    const viewport = drawer?.querySelector<HTMLElement>(".flood-overlay-body");
    if (!drawer || !target || !viewport?.contains(target)) return;
    const align = () => {
      target.focus({ preventScroll: true });
      viewport.scrollTop += target.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
    };
    const frame = requestAnimationFrame(align);
    const alignAfterEntry = (event: AnimationEvent) => { if (event.target === drawer) align(); };
    drawer.addEventListener("animationend", alignAfterEntry);
    return () => {
      cancelAnimationFrame(frame);
      drawer.removeEventListener("animationend", alignAfterEntry);
    };
  },[workspacePanel,workspacePreview,referenceAnchor,path,phone]);
  const visibleGroups = catalog ? componentGroups.map(group => ({ ...group, components: group.components.filter(page => matchesComponent(page, query)) })).filter(group => group.components.length > 0) : [];
  const resultCount = visibleGroups.reduce((total, group) => total + group.components.length, 0);
  const searching = query.trim().length > 0;
  const title = doc?.label ?? component?.name ?? (catalog ? "Components" : "Page not found");
  const description = doc?.description ?? component?.description;
  const raw = doc ? sources[doc.file] : "";
  const markdown = raw?.replace(/^# .*\r?\n/, "") ?? "";
  const [importMode, setImportMode] = useState<"package" | "project">("package");
  const [exampleImports, setExampleImports] = useState(() => component ? ["FloodRoot", ...component.imports.filter(name => componentPages.some(page => page.name === name))] : []);
  const [exampleCode, setExampleCode] = useState(() => component ? usageCode(component) : "");
  const docSections = doc ? sections(markdown) : [];
  const toc = doc ? (doc.file === "charts.md" ? [...docSections, { id: "latency-example", label: "Request latency example" }] : docSections) : component
    ? [{ id: "preview", label: "Component lab" }, { id: "usage", label: "Use in your project" }, { id: "design-notes", label: "Design notes" }, { id: "api", label: "API reference" }]
    : [];
  const ordered = [...docPages.map(page => ({ path: page.path, name: page.label })), { path: "/components", name: "Components" }, ...componentGroups.flatMap(group => group.components).map(page => ({ path: `/components/${page.slug}`, name: page.name }))];
  const current = ordered.findIndex(page => page.path === path);
  const previous = ordered[current - 1]; const next = ordered[current + 1];
  const pageMarkdown = component ? componentMarkdown(component, exampleCode) + (importMode === "project" ? `\n## Project UI setup\n\n${projectAdapters(exampleImports)}` : "") : "";
  const resourceOrigin = typeof location === "undefined" ? siteOrigin : location.origin;
  const [localPreview, setLocalPreview] = useState(false);
  useEffect(() => { setLocalPreview(["localhost", "127.0.0.1"].includes(location.hostname)); }, []);
  const agentContext = `Documentation version: ${content.version}${localPreview ? " (local source preview; source-only additions are not published)" : ""}.\n\nUse Flood for this task. Read the matching installed package declarations before making API changes.\n\n` +
    `Page: ${resourceOrigin}${path}\nAgent skill: ${resourceOrigin}/agent/SKILL.md\nDesign contract: ${resourceOrigin}/agent/DESIGN.md\nCanonical Markdown: ${resourceOrigin}${path}.md\n\n` +
    `The example below reflects the current playground settings. Keep native semantics and accessibility, import Flood styles once, and use semantic tokens before overrides. Do not invent unavailable components or claim that source-only APIs are already published.\n\n${pageMarkdown}`;
  useEffect(() => {
    document.title = `${title} — flood.md`;
    let cancelled = false;
    // A deep link can arrive before the lazy article exists. Resolve it after
    // the article and local font are ready, without a global navigation handler.
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const restored = navigation?.type === "back_forward" && typeof history.state?.floodScrollTop === "number";
    if (!workspacePreview && window.location.hash && !restored) {
      const hash = window.location.hash;
      void document.fonts.ready.then(() => {
        if (cancelled) return;
        try { document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ behavior: "instant" }); }
        catch { /* A malformed fragment does not prevent reading the page. */ }
      });
    }
    return () => { cancelled = true; };
  }, [title, workspacePreview]);
  const referenceContent = component && (
          <div className="studio-reference-content">
          <section id="usage" className="doc-section" tabIndex={-1} ref={!referenceAnchor || referenceAnchor === "usage" ? referenceTarget : undefined}><Heading level={2} size="section">Use {component.name}</Heading>
            <Text as="p" size="compact" tone="subtle">{component.description}</Text>
            <Inline gap="2" className="studio-reference-links">
              <Link href="/docs/installation">Install Flood</Link>
              {component.group === "charts" && <Link href="/docs/charts">Chart guide</Link>}
              <Link href="#design-notes">Design notes</Link>
              <Link href="#api">API reference</Link>
            </Inline>
            <ScrollArea orientation="horizontal" className="import-modes-scroll" aria-label="Example import choices" tabIndex={-1}><SegmentedControl label="Example import style" name="example-import-style" hideLabel className="import-modes" controlSize="sm" value={importMode} onValueChange={value=>setImportMode(value as "package"|"project")} options={[{value:"package",label:"Package"},{value:"project",label:"Project UI"}]} /></ScrollArea>
            {importMode === "project" && <Text as="p" size="compact" tone="subtle">These paths belong to your project. <Link href="/docs/project-ui">Create the UI adapters and alias first.</Link></Text>}
            <CopyButton value={agentContext} label="Copy for agent" text="Copy for agent" errorText="Share the page Markdown and example code with your agent." />
            <CodeBlock code={exampleCode} language="tsx" filename={`${component.slug}.tsx`} maxHeight="none" compact={phone} />
            {importMode === "project" && <Collapsible title="Project UI adapter files" className="adapter-instructions" controlSize="sm"><Markdown remarkPlugins={[remarkGfm]} skipHtml components={{ a: ({ href, children }) => <Link href={markdownLink(href)}>{children}</Link>, pre: ({ children }) => <MarkdownCodeBlock>{children}</MarkdownCodeBlock> }}>{projectAdapters(exampleImports)}</Markdown></Collapsible>}
          </section>
          <section id="design-notes" className="doc-section" tabIndex={-1} ref={referenceAnchor === "design-notes" ? referenceTarget : undefined}><Heading level={2} size="section">Design notes</Heading>
            <ul className="usage-notes">{component.notes.map(note => <li key={note}>{note}</li>)}</ul>
          </section>
          <section id="api" className="doc-section" tabIndex={-1} ref={referenceAnchor === "api" ? referenceTarget : undefined}><Heading level={2} size="section">API reference</Heading>
            {component.api.length > 0 && <ScrollArea orientation="horizontal" className="table-scroll" role="region" aria-label={`${component.name} props`}><table><thead><tr><th scope="col">Prop</th><th scope="col">Values</th><th scope="col">Default</th></tr></thead><tbody>{component.api.map(([prop, values, fallback]) => <tr key={prop}><td><code>{prop}</code></td><td>{values}</td><td>{fallback}</td></tr>)}</tbody></table></ScrollArea>}
            <Link href={`${repository}/blob/v${release.version}/packages/react/src/index.tsx`}>View TypeScript source <IconSlot size="sm"><ArrowUpRight /></IconSlot></Link>
          </section>
          <Inline gap="4" className="doc-resources"><Link href={`${path}.md`}>Page Markdown</Link><Link href="/agent/SKILL.md">Agent skill</Link></Inline>
          </div>
  );
  return <div className="docs-layout" data-preview-layout={workspacePreview ? "workspace" : undefined} data-catalog={catalog || undefined}>
    {(doc || component) && <aside className="desktop-sidebar" id={workspacePreview ? "studio-catalog" : undefined} aria-label={doc ? "Documentation navigation" : "Component navigation"}>
      <ScrollArea contentInset={doc ? "scrollbar" : "none"} aria-label={doc ? "Documentation sections scroll" : "Component list scroll"} className={doc ? "guide-navigation-scroll" : undefined} style={component ? { maxHeight: "100%" } : undefined}>
        {doc ? <DocsNavigation path={path} /> : <ComponentNavigation path={path} query={query} onQueryChange={setQuery} />}
      </ScrollArea>
    </aside>}
    <div className="doc-center">
      {doc && <MobileDocsNavigation path={path} />}
      <main tabIndex={-1} id="main-content" className="doc-article">
        {component && <div className="doc-breadcrumb"><Breadcrumb label="Page breadcrumb" items={[
          { label: "Components", href: "/components" },
          { label: componentGroups.find(group => group.id === component.group)?.label ?? component.group, href: `/components#${component.group}` },
          { label: title },
        ]} /></div>}
        {!workspacePreview && <PageHeader className="doc-heading" title={title} description={description} />}
        {doc && <GuideOutline items={toc} mobile />}
        <div className="doc-body">
        {doc && <div className="markdown-content"><Markdown remarkPlugins={[remarkGfm]} skipHtml components={{
          a: ({ href, children }) => <Link href={markdownLink(href)}>{children}</Link>,
          pre: ({ children }) => <MarkdownCodeBlock>{children}</MarkdownCodeBlock>,
          h2: ({ children, node }) => <h2 id={toc.find(section => "line" in section && section.line === node?.position?.start.line)?.id ?? slug(textOf(children))}>{children}</h2>,
          table: ({ children, node }) => {
            const line=node?.position?.start.line ?? 0;
            const section=[...toc].reverse().find(section=>'line' in section && section.line<line);
            const preceding=markdown.slice(0,node?.position?.start.offset ?? 0);
            const ordinal=(preceding.match(/^\s*\|?\s*:?-{3,}[^\n]*\|[^\n]*$/gm)??[]).length+1;
            return <ScrollArea orientation="horizontal" className="table-scroll" role="region" aria-label={`${section?.label??title} table ${ordinal}`}><table>{children}</table></ScrollArea>;
          },
        }}>{markdown}</Markdown></div>}
        {doc?.file === "charts.md" && <section id="latency-example" className="chart-guide-example" aria-label="Request latency example">
          <ChartsPlayground headingLevel={2} />
        </section>}
        {catalog && <Stack gap="8" className="component-catalog">
          <Stack gap="3">
            <SearchInput className="catalog-search" aria-label="Search components" placeholder="Find a component…" value={query}
              onChange={event => setQuery(event.currentTarget.value)} onKeyDown={event => { if (event.key === "Escape") setQuery(""); }} />
            <Inline gap="3" align="center" className="catalog-summary">
              <Text as="p" size="compact" tone="subtle" role="status">{searching && resultCount === 0 ? "No components found." : `${resultCount} ${resultCount === 1 ? "component" : "components"}`}</Text>
              <Link href="/docs/charts" size="sm">Chart guide <IconSlot size="sm"><ArrowRight /></IconSlot></Link>
            </Inline>
            {!searching && <>
              <nav className="catalog-category-links" aria-label="Component categories"><Inline gap="2">
                {componentGroups.map(group => <Link key={group.id} variant="outline" size="sm" href={`#${group.id}`}>{group.label}</Link>)}
              </Inline></nav>
              <div className="catalog-category-picker">
                <Select aria-label="Jump to component category" controlSize="sm" value={catalogJump} onChange={event => {
                  const category = event.currentTarget.value;
                  setCatalogJump(category);
                  if (category) window.location.hash = category;
                }}>
                  <option value="">Jump to category</option>
                  {componentGroups.map(group => <option key={group.id} value={group.id}>{group.label}</option>)}
                </Select>
              </div>
            </>}
          </Stack>
          {visibleGroups.map(group => <section id={group.id} key={group.id}>
            <Stack gap="4">
              <Stack gap="1">
                <Heading level={2} size="section">{group.label}</Heading>
                <Text as="p" size="compact" tone="subtle">{group.description}</Text>
              </Stack>
              <Grid gap="3" className="catalog-grid">
                {group.components.map(page => <Link className="catalog-card" key={page.slug} href={`/components/${page.slug}`}>
                  <Surface padding="4" className="catalog-card-surface">
                    <Stack gap="2">
                      <Inline gap="4" className="catalog-card-title"><Text size="label">{page.name}</Text><IconSlot size="sm"><ArrowUpRight /></IconSlot></Inline>
                      <Text size="compact" tone="subtle">{page.description}</Text>
                    </Stack>
                  </Surface>
                </Link>)}
              </Grid>
            </Stack>
          </section>)}
        </Stack>}

        {component && <>
          <section id="preview" aria-label={`${component.name} preview`}>
            <ComponentWorkbench key={component.slug} component={component} onCodeChange={setExampleCode} onImportsChange={setExampleImports} importMode={importMode}
              studioHeading={<Inline gap="2" className="studio-heading">
                <div className="studio-catalog-toggle">
                  <Sheet id="studio-catalog-sheet" className="studio-catalog-sheet" title="Components" size="lg" initialFocusRef={catalogFocus}
                    open={compactCatalog && workspacePanel === "catalog"} onOpenChange={open => setWorkspacePanel(open ? "catalog" : null)}
                    trigger={props => <IconButton {...props} size="sm" variant="subtle" label="Components"><List /></IconButton>}>
                    <ComponentNavigation path={path} query={query} onQueryChange={setQuery} initialFocusRef={catalogFocus} />
                  </Sheet>
                </div>
                <Heading level={1} title={title}>{title}</Heading>
              </Inline>}
              studioReference={<ReferenceOverlay ref={referenceDrawer} id="studio-reference" className="studio-reference-drawer" title="Component reference"
            size="lg" open={workspacePanel === "reference"} initialFocusRef={referenceTarget}
            onOpenChange={open => setWorkspacePanel(open ? "reference" : null)}
            trigger={props => <Button {...props} id="studio-reference-trigger" className="studio-reference-trigger"
              size="sm" variant="subtle" aria-label="Reference Alt R" aria-keyshortcuts="Alt+R">
              Reference <Kbd size="sm" aria-hidden="true">Alt R</Kbd>
            </Button>}>
            {referenceContent}
          </ReferenceOverlay>} />
          </section>
          {workspacePanel !== "reference" && <section className="studio-reference-fallback" aria-label="Component reference">{referenceContent}</section>}
        </>}
        {!doc && !component && !catalog && <Link href="/docs">Back to documentation</Link>}
        </div>
        {(doc || catalog) && <><Inline gap="4" className="doc-resources"><Link href={`${path}.md`}>Page Markdown</Link></Inline>
        <nav aria-label="Previous and next page"><Inline gap="4" className="doc-pagination">
          {previous && <Link href={previous.path} variant="subtle" size="sm"><IconSlot size="sm"><ArrowLeft /></IconSlot><Text style={{font:"inherit"}}>{previous.name}</Text></Link>}
          {next && <Link href={next.path} variant="subtle" size="sm" style={{marginInlineStart:"auto"}}><Text style={{font:"inherit"}}>{next.name}</Text><IconSlot size="sm"><ArrowRight /></IconSlot></Link>}
        </Inline>
        </nav></>}
      </main>
    </div>
    {doc && <GuideOutline items={toc} />}
  </div>;
}
