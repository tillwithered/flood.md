import { IconLink, IconSlot, Inline, Link, Tooltip } from "@flood-md/react";
import { BookOpen, Boxes, Rows3, Terminal } from "lucide-react";
import { SiteSearch } from "./site-search";

/** Website composition; control appearance and sizing belong to Flood. */
export function SiteHeader({ path }: { path: string }) {
  const inComponents = path === "/components" || path.startsWith("/components/");
  const inRecipes = path.startsWith("/recipes") || path.startsWith("/docs/recipes/");
  const inAgents = ["/for-agents", "/docs/mcp", "/docs/agents", "/docs/skills", "/docs/agent-knowledge"].includes(path);
  const destinations = [
    { href: "/components", label: "Components", icon: Boxes, current: inComponents },
    { href: "/recipes", label: "Recipes", icon: Rows3, current: inRecipes },
    { href: "/docs", label: "Docs", icon: BookOpen, current: path.startsWith("/docs") && !inRecipes && !inAgents },
    { href: "/for-agents", label: "For agents", icon: Terminal, current: inAgents },
  ];
  return <header className="site-header">
    <Link href="/" className="wordmark" aria-label="flood.md home">
      <img src="/flood-mark.png" alt="" width="34" height="34" />
      <span>flood<span className="wordmark-suffix">.md</span></span>
    </Link>
    <div className="site-search-entry"><SiteSearch /></div>
    <div className="header-actions">
      <nav aria-label="Main navigation" className="header-nav">
        <Inline gap="1" className="header-links">
          {destinations.map(({ href, label, icon: Icon, current }) => <Tooltip key={href} content={label} side="bottom" delay={80}
            trigger={props => <IconLink {...props} aria-describedby={undefined} href={href} label={label} variant="ghost"
              size="sm" iconSize="xs" aria-current={current ? "page" : undefined}><Icon /></IconLink>} />)}
        </Inline>
      </nav>
      <Link href="https://github.com/tillwithered/flood.md" variant="subtle" size="sm" className="header-github">
        <IconSlot size="sm"><img className="github-mark" src="/github-mark.svg" alt="" width="20" height="20" /></IconSlot>
        <span>GitHub</span>
      </Link>
    </div>
  </header>;
}
