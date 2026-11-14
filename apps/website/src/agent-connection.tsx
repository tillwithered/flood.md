import type { ReactNode } from "react";
import { Heading, IconSlot, Inline, Link, Select, Stack, Surface, Tabs, Text } from "@flood-md/react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { siteOrigin } from "../routes.mjs";
import { agentScenarios } from "./agent-scenarios";
import { CopyButton } from "./code-block";
import { phoneViewport, useStudioMedia } from "./studio-media";
import "./agent-connection.css";

const endpoint = siteOrigin + "/mcp";
const editorActions: Record<string, { label: string; href: string }> = {
  Cursor: {
    label: "Add to Cursor",
    href: "cursor://anysphere.cursor-deeplink/mcp/install?name=flood&config=" +
      encodeURIComponent(btoa(JSON.stringify({ url: endpoint }))),
  },
  "VS Code": {
    label: "Add to VS Code",
    href: "vscode:mcp/install?" + encodeURIComponent(JSON.stringify({ name: "flood", type: "http", url: endpoint })),
  },
};

export function connectionSections(markdown: string) {
  const sections = markdown.split(/^## /m);
  const setup = sections.find(section => /^Set up your client\r?\n/.test(section));
  const referenceStart = sections.findIndex(section => /^Tools\r?\n/.test(section));
  const clients = (setup?.split(/^### /m).slice(1) ?? []).map(section => {
    const headingEnd = section.indexOf("\n");
    return { label: section.slice(0, headingEnd).trim(), instructions: section.slice(headingEnd + 1).trim() };
  });
  return { clients, reference: referenceStart < 0 ? "" : "## " + sections.slice(referenceStart).join("## ") };
}

export function AgentConnection({
  clients,
  markdown,
  reference,
  renderMarkdown,
}: {
  clients: ReturnType<typeof connectionSections>["clients"];
  markdown: string;
  reference: string;
  renderMarkdown: (source: string) => ReactNode;
}) {
  const [client, setClient] = useState("Codex");
  const phone = useStudioMedia(phoneViewport);
  if (!clients.length || !reference) return renderMarkdown(markdown);

  const items = clients.map(({ label, instructions }) => {
    const action = editorActions[label];
    return {
      value: label,
      label,
      content: <Surface padding="4" className="agent-client-panel">
        <Heading level={3} className="agent-client-name">{label}</Heading>
        {action && <Inline gap="2">
          <Link href={action.href} variant="solid" size="sm">
            {action.label}<IconSlot size="sm"><ArrowUpRight /></IconSlot>
          </Link>
        </Inline>}
        {renderMarkdown(instructions)}
        {(label === "ChatGPT" || label === "Other clients") && <Inline gap="2" className="agent-client-copy">
          <CopyButton value={endpoint} label="Copy server URL" text="Copy server URL" errorText="Select the server URL to copy it manually." />
        </Inline>}
      </Surface>,
    };
  });
  return <div className="agent-connection">
      <Stack gap="8">
        <section id="set-up-your-client" aria-labelledby="agent-client-heading">
          <Stack gap="3">
            <Heading level={2} size="section" id="agent-client-heading">Set up your client</Heading>
            {phone ? <>
              <Select aria-label="MCP client" value={client} onChange={event => setClient(event.currentTarget.value)}>
                {items.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
              </Select>
              {items.find(item => item.value === client)?.content}
            </> : <Tabs variant="line" controlSize="sm" label="MCP client" items={items} value={client} onValueChange={setClient} />}
          </Stack>
        </section>
        <section id="try-flood" aria-labelledby="try-flood-heading">
          <Stack gap="3">
            <Heading level={2} size="section" id="try-flood-heading">Try Flood</Heading>
            <Text as="p" tone="subtle" size="compact">Paste a prompt into a new chat with Flood connected.</Text>
            {agentScenarios.map(({ href, title, prompt }) => <Surface padding="4" className="agent-scenario" key={href}>
              <Stack gap="2">
                <Heading level={3} size="section">{title}</Heading>
                <Text as="p" size="compact">{prompt}</Text>
                <Inline gap="3" className="agent-scenario-actions">
                  <CopyButton value={prompt} label={`Copy prompt for ${title}`} text="Copy prompt" errorText="Select the prompt to copy it manually." />
                  <Link href={href} aria-label={`View ${title.toLowerCase()} example`}>View example <IconSlot size="sm"><ArrowRight /></IconSlot></Link>
                </Inline>
              </Stack>
            </Surface>)}
          </Stack>
        </section>
      </Stack>
      {renderMarkdown(reference)}
    </div>;
}
