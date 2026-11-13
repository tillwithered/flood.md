import { Inline, Link } from '@flood-md/react';
import { VisitorCounter } from './visitor-counter';

export function SiteFooter() {
  return <footer className="site-footer">
    <VisitorCounter />
    <Inline gap="4">
      <Link href="https://github.com/tillwithered/flood.md/blob/main/LICENSE">MIT licensed</Link>
      <Link href="https://github.com/tillwithered/flood.md/releases">Releases</Link>
      <Link href="/agent/SKILL.md">For your agent</Link>
      <Link href="/docs/privacy">Privacy</Link>
    </Inline>
  </footer>;
}
