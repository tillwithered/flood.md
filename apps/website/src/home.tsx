import { useState } from "react";
import { CodeSnippet, CopyButton, Heading, Text } from "@flood-md/react";
import release from "./release.json";

const command = `npx @flood-md/cli@${release.version} init`;

export function Home() {
  const [status, setStatus] = useState("");
  return <main id="main-content" tabIndex={-1} className="home-main">
    <section className="hero" aria-labelledby="hero-title">
      <Heading level={1} size="display" id="hero-title" className="hero-title">
        <span className="hero-line">Good interfaces</span>
        <span className="hero-line">start with a little <span className="brand-phrase"><img className="hero-mark" src="/flood-mark.png" alt="" width="108" height="108" /> Flood.</span></span>
      </Heading>
      <Text as="p" size="lead" tone="subtle" className="hero-description">
        An open-source design system for developers and coding agents.
      </Text>
      <div className="installation">
        <CodeSnippet code={command} prompt="$" className="installation-code" aria-label="Installation command"
          action={<CopyButton value={command} iconOnly size="sm" variant="ghost" disabled={!release.published}
            aria-label="Copy installation command" onCopied={() => setStatus("Command copied.")}
            onCopyError={() => setStatus("Select the command and copy it manually.")} />} />
        <Text as="p" size="helper" tone="subtle" role="status" className="installation-status">
          {release.published ? status : "Available after release"}
        </Text>
      </div>
    </section>
  </main>;
}
