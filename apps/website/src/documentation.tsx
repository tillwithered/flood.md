import { isValidElement, useEffect, useState, type ReactNode } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { Button, Heading, IconSlot, Inline, Link, ScrollArea, Text } from "@flood-md/react";
import { docPages } from "../routes.mjs";
import { componentPages } from "./component-catalog";
import { ComponentWorkbench } from "./component-workbench";
import { CodeBlock, CopyButton } from "./code-block";
import { usageCode, componentMarkdown, catalogMarkdown } from "../component-docs.mjs";
import content from "./generated/content.json";
import { projectAdapters } from "../project-imports.mjs";
import release from "./release.json";

const sources: Record<string, string> = content.docs;
const repository = "https://github.com/tillwithered/flood.md";
const groups = [...new Set(componentPages.map(page => page.group))];

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
function Sidebar({ path }: { path: string }) {
  const inComponents = path.startsWith("/components");
  return <nav aria-label="Documentation sections" className="side-nav">
    {inComponents && <div className="side-group"><Text size="helper" tone="subtle" className="side-label">Components</Text>
      <Link href="/components" className="side-link catalog-link" aria-current={path === "/components" ? "page" : undefined}>Overview <span>{componentPages.length}</span></Link>
      {[...componentPages].sort((a, b) => a.name.localeCompare(b.name)).map(page => <Link key={page.slug} className="side-link" href={`/components/${page.slug}`} aria-current={path === `/components/${page.slug}` ? "page" : undefined}>{page.name}</Link>)}
    </div>}
    <div className="side-group"><Text size="helper" tone="subtle" className="side-label">Getting started</Text>
      {docPages.map(page => <Link key={page.path} href={page.path} className="side-link" aria-current={path === page.path ? "page" : undefined}>{page.label}</Link>)}
    </div>
    {!inComponents && <div className="side-group"><Link href="/components" className="side-link catalog-link">All components <span>{componentPages.length}</span></Link></div>}
  </nav>;
}

export default function Documentation({ path }: { path: string }) {
  const doc = docPages.find(page => page.path === path);
  const component = componentPages.find(page => path === `/components/${page.slug}`);
  const catalog = path === "/components";
  const title = doc?.label ?? component?.name ?? (catalog ? "Components" : "Page not found");
  const description = doc?.description ?? component?.description ?? "Original components. Native semantics. One calm foundation.";
  const raw = doc ? sources[doc.file] : "";
  const markdown = raw?.replace(/^# .*\r?\n/, "") ?? "";
  const [importMode, setImportMode] = useState<"package" | "project">("package");
  const [exampleImports, setExampleImports] = useState(() => component ? ["FloodRoot", ...component.imports.filter(name => componentPages.some(page => page.name === name))] : []);
  const [exampleCode, setExampleCode] = useState(() => component ? usageCode(component) : "");
  const toc = doc ? sections(markdown) : component
    ? [{ id: "preview", label: "Component lab" }, { id: "usage", label: "Use in your project" }, { id: "design-notes", label: "Design notes" }, { id: "api", label: "API reference" }]
    : groups.map(group => ({ id: slug(group), label: group }));
  const ordered = [...docPages.map(page => ({ path: page.path, name: page.label })), { path: "/components", name: "Components" }, ...componentPages.map(page => ({ path: `/components/${page.slug}`, name: page.name }))];
  const current = ordered.findIndex(page => page.path === path);
  const previous = ordered[current - 1]; const next = ordered[current + 1];
  const pageMarkdown = doc ? raw ?? "" : component ? componentMarkdown(component, exampleCode) + (importMode === "project" ? `\n## Project UI setup\n\n${projectAdapters(exampleImports)}` : "") : catalogMarkdown(componentPages);
  const resourceOrigin = location.origin;
  const localPreview = ["localhost", "127.0.0.1"].includes(location.hostname);
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
    <aside className="desktop-sidebar" aria-label="Documentation navigation"><ScrollArea contentInset="scrollbar" aria-label="Documentation sections scroll" style={{ maxHeight: "calc(100svh - 4rem)" }}><Sidebar path={path} /></ScrollArea></aside>
    <div className="doc-center">
      <details className="mobile-navigation"><summary>Browse documentation</summary><Sidebar path={path} /></details>
      <main id="main-content" className="doc-article">
        <div className="doc-breadcrumb"><Link href={component || catalog ? "/components" : "/docs"}>{component || catalog ? "Components" : "Documentation"}</Link><span aria-hidden="true">/</span><span>{title}</span><span className="doc-version">v{content.version}</span>{["localhost", "127.0.0.1"].includes(location.hostname) && <span className="local-preview-label">Local preview</span>}</div>
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
        {catalog && <div className="component-catalog">{groups.map(group => <section id={slug(group)} key={group}>
          <Heading level={2} size="section">{group}</Heading>
          <div className="catalog-grid">{componentPages.filter(page => page.group === group).map(page => <Link className="catalog-card" key={page.slug} href={`/components/${page.slug}`}>
            <span className="catalog-card-title">{page.name}<IconSlot size="sm"><ArrowUpRight /></IconSlot></span>
            <Text size="compact" tone="subtle">{page.description}</Text>
          </Link>)}</div>
        </section>)}</div>}
        {component && <>
          <section id="preview" aria-label={`${component.name} preview`}>
            <ComponentWorkbench key={component.slug} component={component} onCodeChange={setExampleCode} onImportsChange={setExampleImports} importMode={importMode} agentContext={agentContext} />
          </section>
          <section id="usage" className="doc-section"><Heading level={2} size="section">Use {component.name}</Heading>
            <Text as="p" size="compact" tone="subtle">{component.name} is a named export of <code>@flood-md/react</code>. Connect the package once, then import what you use.</Text>
            <Link href="/docs/installation">First time here? Connect Flood <IconSlot size="sm"><ArrowRight /></IconSlot></Link>
            <div role="group" aria-label="Example import style" className="reader-modes import-modes"><Button variant="ghost" size="sm" aria-pressed={importMode === "package"} onClick={() => setImportMode("package")}>Package</Button><Button variant="ghost" size="sm" aria-pressed={importMode === "project"} onClick={() => setImportMode("project")}>Project UI</Button></div>
            {importMode === "project" && <Text as="p" size="compact" tone="subtle">These paths belong to your project. <Link href="/docs/project-ui">Create the UI adapters and alias first.</Link></Text>}
            <CodeBlock code={exampleCode} language="tsx" filename={`${component.slug}.tsx`} />
            {importMode === "project" && <details className="adapter-instructions"><summary>Project UI adapter files</summary><Markdown remarkPlugins={[remarkGfm]} skipHtml components={{ a: ({ href, children }) => <Link href={markdownLink(href)}>{children}</Link>, pre: ({ children }) => <MarkdownCodeBlock>{children}</MarkdownCodeBlock> }}>{projectAdapters(exampleImports)}</Markdown></details>}
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
          {previous ? <Link href={previous.path}><IconSlot size="sm"><ArrowLeft /></IconSlot>{previous.name}</Link> : <span />}
          {next && <Link href={next.path}>{next.name}<IconSlot size="sm"><ArrowRight /></IconSlot></Link>}
        </nav>
      </main>
    </div>
    <aside className="doc-toc" aria-label="Page outline"><Text size="helper" tone="subtle">On this page</Text><nav aria-label="On this page">{toc.map(item => <Link key={item.id} href={`#${item.id}`}>{item.label}</Link>)}</nav><Link href="/llms.txt">Agent entry point <IconSlot size="sm"><ArrowUpRight /></IconSlot></Link></aside>
  </div>;
}
