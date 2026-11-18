import { useState } from "react";
import { ArrowDownRight, ArrowRight, Layers3 } from "lucide-react";
import { CodeSnippet, CopyButton, Heading, IconSlot, Inline, Link, Stack, Surface, Text } from "@flood-md/react";
import { HomeDiscoveryLinks } from "./discovery-pages";
import { TableBulkActions } from "./recipes/table-bulk-actions";
import release from "./release.json";

const command = `npx @flood-md/cli@${release.version} init`;

export function Home() {
  const [status, setStatus] = useState("");
  return <main id="main-content" tabIndex={-1} className="discovery-home">
    <section className="discovery-hero" aria-labelledby="hero-title">
      <div className="discovery-hero-layout">
        <Stack gap="6" className="discovery-hero-copy">
          <Heading level={1} size="display" id="hero-title" className="discovery-hero-title">
            Good interfaces start with a little <span>Flood.</span>
          </Heading>
          <Text as="p" size="lead" tone="subtle" className="discovery-hero-description">
            An open-source design system for developers and coding agents.
          </Text>
          <Inline gap="2" className="discovery-hero-actions">
            <Link href="/recipes" variant="solid" size="md">Explore recipes <IconSlot size="sm"><ArrowRight /></IconSlot></Link>
            <Link href="/docs/installation" variant="outline" size="md">Get started</Link>
          </Inline>
          <div className="hero-install">
            <CodeSnippet code={command} prompt="$" className="installation-code" aria-label="Installation command"
              action={<CopyButton value={command} iconOnly size="sm" variant="ghost" disabled={!release.published}
                aria-label="Copy installation command" onCopied={() => setStatus("Command copied.")}
                onCopyError={() => setStatus("Select the command and copy it manually.")} />} />
            <Text as="p" size="helper" tone="subtle" role="status" className="hero-install-status">
              {release.published ? status : "Available after release"}
            </Text>
          </div>
        </Stack>
        <Surface className="hero-preview" padding="4">
          <Stack gap="3">
            <Inline gap="2" align="center" className="hero-preview-header">
              <IconSlot size="sm"><Layers3 /></IconSlot>
              <Heading level={2} size="group">Table with bulk actions</Heading>
              <Link href="/docs/recipes/table-bulk-actions" variant="ghost" size="sm" className="hero-preview-link">
                View recipe <IconSlot size="sm"><ArrowDownRight /></IconSlot>
              </Link>
            </Inline>
            <TableBulkActions />
          </Stack>
        </Surface>
      </div>
    </section>
    <HomeDiscoveryLinks />
  </main>;
}
