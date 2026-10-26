import { isValidElement, useEffect, useRef, useState, type ReactNode } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { Breadcrumb, Button, Collapsible, Heading, IconSlot, Inline, Input, Link, ScrollArea, SegmentedControl, Stack, Surface, Text } from "@flood-md/react";
import { docPages, siteOrigin } from "../routes.mjs";
import { componentPages, componentGroups, matchesComponent } from "./component-catalog";
import { ComponentWorkbench } from "./component-workbench";
import { CodeBlock, CopyButton } from "./code-block";
import { usageCode, componentMarkdown, catalogMarkdown } from "../component-docs.mjs";
import content from "./generated/content.json";
import { projectAdapters } from "../project-imports.mjs";
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
  if (/^(https?:|mailto:|#|\/)/.test(href)) return href;
  const [file, hash] = href.split("#");
  if (file.startsWith("../packages/agent/")) return "/agent/" + file.slice("../packages/agent/".length) + (hash ? `#${hash}` : "");
  const page = docPages.find(item => item.file === file);
  if (page) return page.path + (hash ? `#${hash}` : "");
  if (file === "components.md" || file === "base-components.md") return "/components" + (hash ? `#${hash}` : "");
  const target = new URL(href, `${repository}/blob/main/docs/README.md`);
  return target.href;
}
function Sidebar({ path, query, onQueryChange, visible = true }: { path: string; query: string; onQueryChange: (query: string) => void; visible?: boolean }) {
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!visible) return;
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
    void document.fonts.ready.then(align);
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [path, visible]);
  const inComponents = path.startsWith("/components");
  const results = componentPages.filter(page => matchesComponent(page, query));
  return <nav ref={nav} aria-label="Documentation sections" className="side-nav">
    {inComponents && <>
      <div className="catalog-nav-tools">
        <Link href="/components" variant="ghost" size="sm" className="side-link catalog-link" aria-current={path === "/components" ? "page" : undefined}>All components <span>{componentPages.length}</span></Link>
        <Input type="search" controlSize="sm" aria-label="Search components" placeholder="Find a component…" value={query} onChange={event => onQueryChange(event.currentTarget.value)} onKeyDown={event => { if (event.key === "Escape") onQueryChange(""); }} />
        {query && <Inline gap="2" className="catalog-search-summary"><Text size="helper" tone="subtle" role="status">{results.length} results</Text><Button variant="ghost" size="sm" onClick={() => onQueryChange("")}>Clear search</Button></Inline>}
      </div>
      {componentGroups.map(group => {
        const entries = group.components.filter(page => matchesComponent(page, query));
        return entries.length > 0 && <div className="side-group" key={group.id} role="group" aria-label={group.label}>
          <Text size="helper" tone="subtle" className="side-label">{group.label}</Text>
          {entries.map(page => <Link key={page.slug} variant="ghost" size="sm" className="side-link" href={`/components/${page.slug}`} aria-current={path === `/components/${page.slug}` ? "page" : undefined}>{page.name}</Link>)}
        </div>;
      })}
      {results.length === 0 && <Text as="p" size="compact" tone="subtle" className="catalog-empty">No components found.</Text>}
    </>}
    {[{label:"Documentation",pages:docPages.filter(page=>page.group!=="recipes")},{label:"Recipes",pages:docPages.filter(page=>page.group==="recipes")}].map(group=>group.pages.length>0&&
      <div className="side-group" key={group.label}><Text size="helper" tone="subtle" className="side-label">{group.label}</Text>
        {group.pages.map(page => <Link key={page.path} href={page.path} variant="ghost" size="sm" className="side-link" aria-current={path === page.path ? "page" : undefined}>{page.label}</Link>)}
      </div>)}
    {!inComponents && <div className="side-group"><Link href="/components" variant="ghost" size="sm" className="side-link catalog-link">All components <span>{componentPages.length}</span></Link></div>}
  </nav>;
}

export default function Documentation({ path }: { path: string }) {
  const doc = docPages.find(page => page.path === path);
  const component = componentPages.find(page => path === `/components/${page.slug}`);
  const catalog = path === "/components";
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleGroups = componentGroups.map(group => ({ ...group, components: group.components.filter(page => matchesComponent(page, query)) })).filter(group => group.components.length > 0);
  const title = doc?.label ?? component?.name ?? (catalog ? "Components" : "Page not found");
  const description = doc?.description ?? component?.description ?? "Original components. Native semantics. One calm foundation.";
  const raw = doc ? sources[doc.file] : "";
  const markdown = raw?.replace(/^# .*\r?\n/, "") ?? "";
  const [importMode, setImportMode] = useState<"package" | "project">("package");
  const [exampleImports, setExampleImports] = useState(() => component ? ["FloodRoot", ...component.imports.filter(name => componentPages.some(page => page.name === name))] : []);
  const [exampleCode, setExampleCode] = useState(() => component ? usageCode(component) : "");
  const toc = doc ? sections(markdown) : component
    ? [{ id: "preview", label: "Component lab" }, { id: "usage", label: "Use in your project" }, { id: "design-notes", label: "Design notes" }, { id: "api", label: "API reference" }]
    : visibleGroups.map(group => ({ id: group.id, label: group.label }));
  const ordered = [...docPages.map(page => ({ path: page.path, name: page.label })), { path: "/components", name: "Components" }, ...componentGroups.flatMap(group => group.components).map(page => ({ path: `/components/${page.slug}`, name: page.name }))];
  const current = ordered.findIndex(page => page.path === path);
  const previous = ordered[current - 1]; const next = ordered[current + 1];
  const pageMarkdown = doc ? raw ?? "" : component ? componentMarkdown(component, exampleCode) + (importMode === "project" ? `\n## Project UI setup\n\n${projectAdapters(exampleImports)}` : "") : catalogMarkdown(componentPages);
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
    if (window.location.hash) {
      const hash = window.location.hash;
      void document.fonts.ready.then(() => {
        if (cancelled) return;
        try { document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ behavior: "instant" }); }
        catch { /* A malformed fragment does not prevent reading the page. */ }
      });
    }
    return () => { cancelled = true; };
  }, [title]);
  return <div className="docs-layout">
    <aside className="desktop-sidebar" aria-label="Documentation navigation"><ScrollArea contentInset="scrollbar" aria-label="Documentation sections scroll" style={{ maxHeight: "calc(100svh - 4rem)" }}><Sidebar path={path} query={query} onQueryChange={setQuery} /></ScrollArea></aside>
    <div className="doc-center">
      <Collapsible className="mobile-navigation" title="Browse documentation" open={mobileOpen} onOpenChange={setMobileOpen} controlSize="sm"><ScrollArea aria-label="Mobile documentation sections" style={{ maxHeight: "60svh" }}><Sidebar path={path} query={query} onQueryChange={setQuery} visible={mobileOpen} /></ScrollArea></Collapsible>
      <main tabIndex={-1} id="main-content" className="doc-article">
        <div className="doc-breadcrumb"><Breadcrumb label="Page breadcrumb" items={catalog ? [{label:title}] : [{label:component ? "Components" : "Documentation",href:component ? "/components" : "/docs"}, ...(component ? [{label:componentGroups.find(group=>group.id===component.group)?.label??component.group,href:`/components#${component.group}`}] : []), {label:title}]} /><Text size="helper" tone="subtle" className="doc-version">v{content.version}</Text>{localPreview && <Text size="helper" tone="subtle" className="local-preview-label">Local preview</Text>}</div>
        <header className="doc-heading">
          <Heading level={1} size="large">{title}</Heading>
          <Text as="p" tone="subtle" className="doc-description">{description}</Text>
          {!component && <Inline gap="3" className="doc-tools"><CopyButton value={agentContext} label="Copy for agent" text="Copy for agent" /></Inline>}
        </header>
        <div>
        {doc && <div className="markdown-content"><Markdown remarkPlugins={[remarkGfm]} skipHtml components={{
          a: ({ href, children }) => <Link href={markdownLink(href)}>{children}</Link>,
          pre: ({ children }) => <MarkdownCodeBlock>{children}</MarkdownCodeBlock>,
          h2: ({ children, node }) => <h2 id={toc.find(section => "line" in section && section.line === node?.position?.start.line)?.id ?? slug(textOf(children))}>{children}</h2>,
          table: ({ children }) => <ScrollArea orientation="horizontal" className="table-scroll" role="region" aria-label="Documentation table"><table>{children}</table></ScrollArea>,
        }}>{markdown}</Markdown></div>}
        {catalog && <div className="component-catalog">
          {!query && <nav className="catalog-jumps" aria-label="Component categories">{componentGroups.map(group => <Link key={group.id} variant="outline" size="sm" href={`#${group.id}`}>{group.label}<Text size="helper" tone="subtle">{group.components.length}</Text></Link>)}</nav>}
          {visibleGroups.map(group => <section id={group.id} key={group.id}>
            <Heading level={2} size="section">{group.label}</Heading>
            <Text as="p" size="compact" tone="subtle" className="catalog-description">{group.description}</Text>
            <div className="catalog-grid">{group.components.map(page => <Link className="catalog-card" key={page.slug} href={`/components/${page.slug}`}>
              <Surface padding="4" className="catalog-card-surface"><Stack gap="2">
                <Inline gap="4" className="catalog-card-title"><Text size="label">{page.name}</Text><IconSlot size="sm"><ArrowUpRight /></IconSlot></Inline>
                <Text size="compact" tone="subtle">{page.description}</Text>
              </Stack></Surface>
            </Link>)}</div>
          </section>)}
          {visibleGroups.length === 0 && <Text as="p" tone="subtle">No components found. Try another name or category.</Text>}
        </div>}

        {component && <>
          <section id="preview" aria-label={`${component.name} preview`}>
            <ComponentWorkbench key={component.slug} component={component} onCodeChange={setExampleCode} onImportsChange={setExampleImports} importMode={importMode} agentContext={agentContext} />
          </section>
          <section id="usage" className="doc-section"><Heading level={2} size="section">Use {component.name}</Heading>
            <Text as="p" size="compact" tone="subtle">{component.name} is a named export of <code>@flood-md/react</code>. Connect the package once, then import what you use.</Text>
            <Link href="/docs/installation">First time here? Connect Flood <IconSlot size="sm"><ArrowRight /></IconSlot></Link>
            <ScrollArea orientation="horizontal" className="import-modes-scroll" aria-label="Example import choices" tabIndex={-1}><SegmentedControl label="Example import style" name="example-import-style" hideLabel className="import-modes" controlSize="sm" value={importMode} onValueChange={value=>setImportMode(value as "package"|"project")} options={[{value:"package",label:"Package"},{value:"project",label:"Project UI"}]} /></ScrollArea>
            {importMode === "project" && <Text as="p" size="compact" tone="subtle">These paths belong to your project. <Link href="/docs/project-ui">Create the UI adapters and alias first.</Link></Text>}
            <CodeBlock code={exampleCode} language="tsx" filename={`${component.slug}.tsx`} />
            {importMode === "project" && <Collapsible title="Project UI adapter files" className="adapter-instructions" controlSize="sm"><Markdown remarkPlugins={[remarkGfm]} skipHtml components={{ a: ({ href, children }) => <Link href={markdownLink(href)}>{children}</Link>, pre: ({ children }) => <MarkdownCodeBlock>{children}</MarkdownCodeBlock> }}>{projectAdapters(exampleImports)}</Markdown></Collapsible>}
          </section>
          <section id="design-notes" className="doc-section"><Heading level={2} size="section">Design notes</Heading>
            <ul className="usage-notes">{component.notes.map(note => <li key={note}>{note}</li>)}</ul>
          </section>
          <section id="api" className="doc-section"><Heading level={2} size="section">API reference</Heading>
            {component.api.length > 0 && <ScrollArea orientation="horizontal" className="table-scroll" role="region" aria-label={`${component.name} props`}><table><thead><tr><th scope="col">Prop</th><th scope="col">Values</th><th scope="col">Default</th></tr></thead><tbody>{component.api.map(([prop, values, fallback]) => <tr key={prop}><td><code>{prop}</code></td><td>{values}</td><td>{fallback}</td></tr>)}</tbody></table></ScrollArea>}
            <Link href={`${repository}/blob/v${release.version}/packages/react/src/index.tsx`}>View TypeScript source <IconSlot size="sm"><ArrowUpRight /></IconSlot></Link>
          </section>
        </>}
        {!doc && !component && !catalog && <Link href="/docs">Back to documentation</Link>}
        </div>
        <Inline gap="4" className="doc-resources"><Link href={`${path}.md`}>Page Markdown</Link><Link href="/agent/SKILL.md">Agent skill</Link></Inline>
        <nav className="doc-pagination" aria-label="Previous and next page">
          {previous ? <Link href={previous.path} variant="subtle" size="sm"><IconSlot size="sm"><ArrowLeft /></IconSlot>{previous.name}</Link> : <span />}
          {next && <Link href={next.path} variant="subtle" size="sm">{next.name}<IconSlot size="sm"><ArrowRight /></IconSlot></Link>}
        </nav>
      </main>
    </div>
    <aside className="doc-toc" aria-label="Page outline"><Text size="helper" tone="subtle">On this page</Text><nav aria-label="On this page">{toc.map(item => <Link key={item.id} href={`#${item.id}`}>{item.label}</Link>)}</nav><Link href="/llms.txt">Agent entry point <IconSlot size="sm"><ArrowUpRight /></IconSlot></Link></aside>
  </div>;
}
