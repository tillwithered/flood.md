import { Inline, Link, Text } from '@flood-md/react';
import { VisitorCounter } from './visitor-counter';

export function SiteFooter() {
  return <footer className="site-footer">
    <Text size="helper" tone="subtle">A growing collection, made with care.</Text>
    <Inline gap="4">
      <VisitorCounter />
      <Link href="https://github.com/tillwithered/flood.md/blob/main/LICENSE">MIT licensed</Link>
      <Link href="/agent/SKILL.md">For your agent</Link>
      <Link href="/docs/privacy">Privacy</Link>
    </Inline>
  </footer>;
}
