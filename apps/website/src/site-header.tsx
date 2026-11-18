import { IconSlot, Inline, Link } from "@flood-md/react";
import { SiteSearch } from "./site-search";

/** Website composition; control appearance and sizing belong to Flood. */
export function SiteHeader({ path }: { path: string }) {
  const inComponents = path === "/components" || path.startsWith("/components/");
  const inRecipes = path.startsWith("/recipes") || path.startsWith("/docs/recipes/");
  const inAgents = ["/for-agents", "/docs/mcp", "/docs/agents", "/docs/skills", "/docs/agent-knowledge"].includes(path);
  return <header className="site-header">
    <Link href="/" className="wordmark" aria-label="flood.md home">
      <img src="/flood-mark.png" alt="" width="34" height="34" />
      <span>flood<span className="wordmark-suffix">.md</span></span>
    </Link>
    <nav aria-label="Main navigation" className="header-nav">
      <Inline gap="2" className="header-links">
        <Link href="/components" variant="ghost" size="sm" aria-current={inComponents ? "page" : undefined}>Components</Link>
        <Link href="/recipes" variant="ghost" size="sm" aria-current={inRecipes ? "page" : undefined}>Recipes</Link>
        <Link href="/docs" variant="ghost" size="sm" aria-current={path.startsWith("/docs") && !inRecipes && !inAgents ? "page" : undefined}>Docs</Link>
        <Link href="/for-agents" variant="ghost" size="sm" aria-current={inAgents ? "page" : undefined}>For agents</Link>
      </Inline>
    </nav>
    <Inline gap="2" className="header-utilities">
      <SiteSearch />
        <Link href="https://github.com/tillwithered/flood.md" variant="ghost" size="sm" className="header-github" aria-label="GitHub">
          <IconSlot size="sm"><img className="github-mark" src="/github-mark.svg" alt="" width="20" height="20" /></IconSlot>
          <span>GitHub</span>
        </Link>
    </Inline>
  </header>;
}
