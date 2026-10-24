import { IconSlot, Inline, Link } from "@flood-md/react";

/** Website composition; control appearance and sizing belong to Flood. */
export function SiteHeader({ path }: { path: string }) {
  return <header className="site-header">
    <Link href="/" className="wordmark" aria-label="flood.md home">
      <img src="/flood-mark.png" alt="" width="34" height="34" />
      <span>flood<span className="wordmark-suffix">.md</span></span>
    </Link>
    <nav aria-label="Main navigation" className="header-nav">
      <Inline gap="2" className="header-links">
        <Link href="/docs" variant="ghost" size="sm" aria-current={path.startsWith("/docs") ? "page" : undefined}>Docs</Link>
        <Link href="/components" variant="ghost" size="sm" aria-current={path.startsWith("/components") ? "page" : undefined}>Components</Link>
        <Link href="https://github.com/tillwithered/flood.md" variant="subtle" size="sm">
          <IconSlot size="sm"><img className="github-mark" src="/github-mark.svg" alt="" width="20" height="20" /></IconSlot>GitHub
        </Link>
      </Inline>
    </nav>
  </header>;
}
