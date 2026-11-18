import { useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { CodeSnippet, CopyButton, Heading, IconSlot, Inline, Link, Stack, Surface, Text } from "@flood-md/react";
import { HomeDiscoveryLinks } from "./discovery-pages";
import { TableBulkActions } from "./recipes/table-bulk-actions";
import release from "./release.json";

const command = `npx @flood-md/cli@${release.version} init`;

export function Home() {
  const [status, setStatus] = useState("");
  return <main id="main-content" tabIndex={-1} className="discovery-home">
    <section className="discovery-hero" aria-labelledby="hero-title">
      <Heading level={1} size="display" id="hero-title" className="discovery-hero-title">
        Good interfaces start<br className="discovery-hero-break" /> with a little Flood.
      </Heading>
      <Stack gap="4" className="discovery-hero-copy">
        <Text as="p" size="body" tone="subtle" className="discovery-hero-description">
          An open-source React design system for developers and coding agents.
        </Text>
        <Inline gap="2">
          <Link href="/recipes" variant="solid" size="md">Explore recipes <IconSlot size="sm"><ArrowRight /></IconSlot></Link>
          <Link href="/docs/installation" variant="ghost" size="md">Get started</Link>
        </Inline>
      </Stack>
    </section>

    <section aria-labelledby="featured-recipe">
      <Surface className="hero-preview" padding="0">
        <Stack gap="4" className="hero-preview-header">
          <Stack gap="2">
            <Heading id="featured-recipe" level={2} size="section">Table with bulk actions</Heading>
            <Text as="p" size="compact" tone="subtle">Filter projects, select rows and archive them in one step.</Text>
          </Stack>
          <Link href="/docs/recipes/table-bulk-actions" variant="outline" size="sm" className="hero-preview-link">
            View recipe <IconSlot size="sm"><ArrowUpRight /></IconSlot>
          </Link>
          <Inline gap="2" className="hero-preview-components">
            <Link href="/components/data-table" size="sm">DataTable</Link>
            <Link href="/components/bulk-action-bar" size="sm">BulkActionBar</Link>
          </Inline>
        </Stack>
        <div className="hero-preview-demo"><TableBulkActions compact /></div>
      </Surface>
    </section>

    <HomeDiscoveryLinks />

    <section className="home-installation" aria-labelledby="home-installation-heading">
      <Stack gap="1">
        <Heading id="home-installation-heading" level={2} size="section">Use Flood in your project</Heading>
        <Link href="/docs/installation">Read the installation guide</Link>
      </Stack>
      <div className="hero-install">
        <CodeSnippet code={command} prompt="$" className="installation-code" aria-label="Installation command"
          action={<CopyButton value={command} iconOnly size="sm" variant="ghost" disabled={!release.published}
            aria-label="Copy installation command" onCopied={() => setStatus("Command copied.")}
            onCopyError={() => setStatus("Select the command and copy it manually.")} />} />
        <Text as="p" size="helper" tone="subtle" role="status" className="hero-install-status">
          {release.published ? status : "Available after release"}
        </Text>
      </div>
    </section>
  </main>;
}
