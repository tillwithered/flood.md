import { CodeSnippet, CopyButton, Heading, Link, Text } from "@flood-md/react";
import release from "./release.json";

const command = `npx @flood-md/cli@${release.version} init`;

export function Home() {
  return <main id="main-content" tabIndex={-1} className="home-main">
    <section className="hero home-discovery" aria-labelledby="hero-title">
      <Heading level={1} size="display" id="hero-title" className="hero-title">
        <span className="hero-line">Good interfaces</span>{" "}
        <span className="hero-line">start with a little <span className="brand-phrase"><img className="hero-mark" src="/flood-mark.png" alt="" width="108" height="108" /> Flood.</span></span>
      </Heading>
      <Text as="p" size="lead" tone="subtle" className="hero-description">
        An open-source design system<br /> for developers and coding agents.
      </Text>
      <div className="home-install">
        {release.published ? <CodeSnippet code={command} prompt="$" aria-label="Installation command"
          action={<CopyButton value={command} iconOnly size="sm" variant="ghost" aria-label="Copy installation command" />} /> : null}
        <Link href="/docs/installation" className="home-install-link">Install Flood</Link>
      </div>
    </section>
  </main>;
}
