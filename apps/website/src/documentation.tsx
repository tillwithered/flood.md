import { isValidElement, useEffect, useState, type ReactNode } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowRight, ArrowUpRight, Copy } from "lucide-react";
import { Button, CodeSnippet, Heading, IconSlot, Inline, Link, Text } from "@flood-md/react";
import { docPages } from "../routes.mjs";
import { ComponentPreview, componentPages } from "./component-catalog";
import release from "./release.json";

const sources = import.meta.glob<string>("../../../docs/{README,installation,foundations,theming,agents,faq}.md", { query: "?raw", import: "default", eager: true });
const repository = "https://github.com/tillwithered/flood.md";
const install = `npx @flood-md/cli@${release.version} init`;
const groups = [...new Set(componentPages.map(page => page.group))];
function usageCode(component: typeof componentPages[number]) {
  const names = [...new Set(["FloodRoot", ...Array.from(component.code.matchAll(/<([A-Z]\w*)/g), match => match[1])])];
  const flood = names.filter(name => componentPages.some(page => page.name === name));
  const icons = names.filter(name => ["Plus", "ArrowRight", "Copy"].includes(name));
  const imports = `import { ${flood.join(", ")} } from "@flood-md/react";\n` + (icons.length ? `import { ${icons.join(", ")} } from "lucide-react";\n` : "");
  const example = component.slug === "flood-root" ? component.code : `<FloodRoot>\n${component.code}\n</FloodRoot>`;
  return `"use client";\n\n${imports}import "@flood-md/react/styles.css";\n\nexport function Example() {\n  return (\n${example.split("\n").map(line => `    ${line}`).join("\n")}\n  );\n}`;
}

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

function CopyButton({ value, label = "Copy code" }: { value: string; label?: string }) {
  const [status, setStatus] = useState("");
  async function copy() {
    try { await navigator.clipboard.writeText(value); setStatus("Copied."); }
    catch { setStatus("Select and copy the text manually."); }
  }
  return <span className="copy-control">
    <Button variant="subtle" size="sm" onClick={copy} aria-label={label}><IconSlot size="sm"><Copy /></IconSlot>{status === "Copied." ? "Copied" : "Copy"}</Button>
    <span className="sr-only" role="status">{status}</span>
  </span>;
}
function CodeBlock({ children }: { children?: ReactNode }) {
  return <div className="doc-code"><CopyButton value={textOf(children)} /><pre>{children}</pre></div>;
}
function markdownLink(href: string | undefined) {
  if (!href) return undefined;
  if (/^(https?:|mailto:|#|\/)/.test(href)) return href;
  const [file, hash] = href.split("#");
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
      <Link href="/components" className="side-link catalog-link" aria-current={path === "/components" ? "page" : undefined}>Overview <span>18</span></Link>
      {[...componentPages].sort((a, b) => a.name.localeCompare(b.name)).map(page => <Link key={page.slug} className="side-link" href={`/components/${page.slug}`} aria-current={path === `/components/${page.slug}` ? "page" : undefined}>{page.name}</Link>)}
    </div>}
    <div className="side-group"><Text size="helper" tone="subtle" className="side-label">Getting started</Text>
      {docPages.map(page => <Link key={page.path} href={page.path} className="side-link" aria-current={path === page.path ? "page" : undefined}>{page.label}</Link>)}
    </div>
    {!inComponents && <div className="side-group"><Link href="/components" className="side-link catalog-link">All components <span>18</span></Link></div>}
  </nav>;
}

export default function Documentation({ path }: { path: string }) {
  const doc = docPages.find(page => page.path === path);
  const component = componentPages.find(page => path === `/components/${page.slug}`);
  const catalog = path === "/components";
  const title = doc?.label ?? component?.name ?? (catalog ? "Components" : "Page not found");
  const description = doc?.description ?? component?.description ?? "Original components. Native semantics. One calm foundation.";
  const raw = doc ? sources[`../../../docs/${doc.file}`] : "";
  const markdown = raw?.replace(/^# .*\r?\n/, "") ?? "";
  const toc = doc ? sections(markdown) : component
    ? [{ id: "preview", label: "Preview" }, { id: "installation", label: "Installation" }, { id: "usage", label: "Usage" }, { id: "api", label: "API reference" }]
    : groups.map(group => ({ id: slug(group), label: group }));
  const ordered = [...docPages.map(page => ({ path: page.path, name: page.label })), { path: "/components", name: "Components" }, ...componentPages.map(page => ({ path: `/components/${page.slug}`, name: page.name }))];
  const current = ordered.findIndex(page => page.path === path);
  const previous = ordered[current - 1]; const next = ordered[current + 1];
  const sourcePath = doc ? `docs/${doc.file}` : "apps/website/src/component-catalog.tsx";
  const exampleCode = component ? usageCode(component) : "";
  const pageMarkdown = doc ? raw : component
    ? `# ${component.name}\n\n${component.description}\n\n## Installation\n\n\`\`\`sh\n${install}\n\`\`\`\n\n## Usage\n\n\`\`\`tsx\n${exampleCode}\n\`\`\`\n\n${component.notes.join("\n\n")}\n\n## API reference\n\n| Prop | Values | Default |\n| --- | --- | --- |\n${component.api.map(row => `| ${row.map(value => value.replaceAll("|", "\\|")).join(" | ")} |`).join("\n")}`
    : `# Components\n\n${componentPages.map(page => `- [${page.name}](https://flood.md/components/${page.slug}): ${page.description}`).join("\n")}`;
  useEffect(() => { document.title = `${title} — flood.md`; }, [title]);
  return <div className="docs-layout">
    <aside className="desktop-sidebar" aria-label="Documentation navigation"><Sidebar path={path} /></aside>
    <div className="doc-center">
      <details className="mobile-navigation"><summary>Browse documentation</summary><Sidebar path={path} /></details>
      <main id="main-content" className="doc-article">
        <div className="doc-breadcrumb"><Link href={component || catalog ? "/components" : "/docs"}>{component || catalog ? "Components" : "Documentation"}</Link><span aria-hidden="true">/</span><span>{title}</span></div>
        <header className="doc-heading">
          <Heading level={1} size="large">{title}</Heading>
          <Text as="p" tone="subtle" className="doc-description">{description}</Text>
          <Inline gap="3" className="doc-tools"><CopyButton value={pageMarkdown ?? ""} label="Copy page" /><Link href={`${repository}/edit/main/${sourcePath}`} className="edit-link">Edit on GitHub <IconSlot size="sm"><ArrowUpRight /></IconSlot></Link></Inline>
        </header>
        {doc && <div className="markdown-content"><Markdown remarkPlugins={[remarkGfm]} skipHtml components={{
          a: ({ href, children }) => <Link href={markdownLink(href)}>{children}</Link>,
          pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
          h2: ({ children, node }) => <h2 id={toc.find(section => "line" in section && section.line === node?.position?.start.line)?.id ?? slug(textOf(children))}>{children}</h2>,
          table: ({ children }) => <div className="table-scroll" tabIndex={0} role="region" aria-label="Documentation table"><table>{children}</table></div>,
        }}>{markdown}</Markdown></div>}
        {catalog && <div className="component-catalog">{groups.map(group => <section id={slug(group)} key={group}>
          <Heading level={2} size="section">{group}</Heading>
          <div className="catalog-grid">{componentPages.filter(page => page.group === group).map(page => <Link className="catalog-card" key={page.slug} href={`/components/${page.slug}`}>
            <span className="catalog-card-title">{page.name}<IconSlot size="sm"><ArrowUpRight /></IconSlot></span>
            <Text size="compact" tone="subtle">{page.description}</Text>
          </Link>)}</div>
        </section>)}</div>}
        {component && <>
          <section id="preview" className="component-preview" aria-label={`${component.name} preview`}>
            <div className="preview-stage"><ComponentPreview key={component.slug} slug={component.slug} /></div>
            <details className="preview-code"><summary>View code</summary><CodeBlock><code>{exampleCode}</code></CodeBlock></details>
          </section>
          <section id="installation" className="doc-section"><Heading level={2} size="section">Installation</Heading>
            <Text as="p" size="compact" tone="subtle">The base components ship together. Run once in an existing React project.</Text>
            <CodeSnippet code={install} action={<CopyButton value={install} label="Copy install command" />} />
            <Link href="/docs/installation">React and Next.js setup <IconSlot size="sm"><ArrowRight /></IconSlot></Link>
          </section>
          <section id="usage" className="doc-section"><Heading level={2} size="section">Usage</Heading>
            <Text as="p" size="compact">Import the stylesheet once and render inside <code>FloodRoot</code>. Use a client component for callbacks and state.</Text>
            <CodeBlock><code>{exampleCode}</code></CodeBlock><ul className="usage-notes">{component.notes.map(note => <li key={note}>{note}</li>)}</ul>
          </section>
          <section id="api" className="doc-section"><Heading level={2} size="section">API reference</Heading>
            {component.api.length > 0 && <div className="table-scroll" tabIndex={0} role="region" aria-label={`${component.name} props`}><table><thead><tr><th scope="col">Prop</th><th scope="col">Values</th><th scope="col">Default</th></tr></thead><tbody>{component.api.map(([prop, values, fallback]) => <tr key={prop}><td><code>{prop}</code></td><td>{values}</td><td>{fallback}</td></tr>)}</tbody></table></div>}
            <Link href={`${repository}/blob/v${release.version}/packages/react/src/index.tsx`}>View TypeScript source <IconSlot size="sm"><ArrowUpRight /></IconSlot></Link>
          </section>
        </>}
        {!doc && !component && !catalog && <Link href="/docs">Back to documentation</Link>}
        <nav className="doc-pagination" aria-label="Previous and next page">
          {previous ? <Link href={previous.path}><IconSlot size="sm"><ArrowLeft /></IconSlot>{previous.name}</Link> : <span />}
          {next && <Link href={next.path}>{next.name}<IconSlot size="sm"><ArrowRight /></IconSlot></Link>}
        </nav>
      </main>
    </div>
    <aside className="doc-toc" aria-label="Page outline"><Text size="helper" tone="subtle">On this page</Text><nav aria-label="On this page">{toc.map(item => <Link key={item.id} href={`#${item.id}`}>{item.label}</Link>)}</nav><Link href="/llms.txt">Agent entry point <IconSlot size="sm"><ArrowUpRight /></IconSlot></Link></aside>
  </div>;
}
