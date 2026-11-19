import { isValidElement, useState, type ReactNode } from "react";
import { Collapsible, Heading, IconSlot, Inline, Link, Select, Stack, Surface, Tabs, Text } from "@flood-md/react";
import ReactMarkdown from "react-markdown";
import mcpGuide from "../../../docs/mcp.md?raw";
import { siteOrigin } from "../site-guides.mjs";
import { agentEndpoint, connectionSections, editorActions } from "./agent-setup-content";
import { CodeBlock, CopyButton } from "./code-block";
import { phoneViewport, useStudioMedia } from "./studio-media";
import "./agents-directory.css";

const { clients, catalogSkillCommand } = connectionSections(mcpGuide);
const prompt = "Build a requests table with search, status filters and a bulk approval action. Use Flood.";
const panelStyle = { padding: "var(--agents-panel-inset)" };
const editorIcons: Readonly<Record<string, string>> = {
  Cursor: "/agent-icons/cursor.svg",
  "VS Code": "/agent-icons/vscode.png",
};

function ClientInstructions({ label, instructions }: (typeof clients)[number]) {
  const editorAction = editorActions[label];
  const editorIcon = editorIcons[label];
  const showEndpoint = label === "ChatGPT" || label === "Other clients";
  const content = <div className="agents-instructions">
    <ReactMarkdown components={{
      a: ({ href, children }) => (
        <Link href={href === siteOrigin + "/flood-plugin.zip" ? "/flood-plugin.zip" : href}>{children}</Link>
      ),
      pre: ({ children }) => {
        if (!isValidElement<{ children?: ReactNode; className?: string }>(children)) return <pre>{children}</pre>;
        const code = String(children.props.children ?? "").trim();
        if (children.props.className === "language-sh") {
          return <Command code={code} label={`Copy ${label} command`} />;
        }
        return <CodeBlock compact code={code} language={children.props.className?.replace(/^language-/, "")}
          filename={label === "Cursor" ? ".cursor/mcp.json" : undefined} />;
      },
    }}>{instructions}</ReactMarkdown>
  </div>;
  return <Stack gap="4" className="agents-client-panel">
    <Heading level={3} size="group" className="agents-client-heading">{label}</Heading>
    {editorAction ? <Stack gap="3">
      <Inline><Link href={editorAction.href} variant="solid" size="sm">
        {editorIcon && <IconSlot size="sm"><img src={editorIcon} alt="" width={16} height={16} /></IconSlot>}
        {editorAction.label}
      </Link></Inline>
      <Collapsible title="Manual setup" className="agents-manual" variant="flush" controlSize="sm">{content}</Collapsible>
    </Stack> : content}
    {showEndpoint && <CopyButton value={agentEndpoint} label="Copy server URL" text="Copy server URL"
      errorText="Select the server URL to copy it manually." />}
  </Stack>;
}

function Command({ code, label }: { code: string; label: string }) {
  return <CodeBlock code={code} language="sh" label={label.replace(/^Copy /, "")} copyLabel={label} compact />;
}

function ClientSetup() {
  const [client, setClient] = useState(clients[0]?.label ?? "");
  const phone = useStudioMedia(phoneViewport);
  const items = clients.map(item => ({
    value: item.label,
    label: item.label,
    content: <ClientInstructions {...item} />,
  }));

  return <Surface style={panelStyle} className="agents-setup-panel">
    {phone ? <Stack gap="4">
      <Select aria-label="MCP client" value={client} onChange={event => setClient(event.currentTarget.value)}>
        {items.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
      </Select>
      {items.find(item => item.value === client)?.content}
    </Stack> : <Tabs variant="round" controlSize="sm" label="MCP client" value={client}
      onValueChange={setClient} items={items} />}
  </Surface>;
}

export function AgentsDirectory() {
  return <main id="main-content" tabIndex={-1} className="agents-directory">
    <header className="agents-directory-heading">
      <Heading level={1} size="display">Flood for coding agents</Heading>
    </header>

    <section className="agents-directory-section" aria-labelledby="connect-flood">
      <Stack gap="2">
        <Heading id="connect-flood" level={2} size="section">Connect Flood MCP</Heading>
        <Text as="p" tone="subtle" size="compact">Give your agent access to Flood’s public components, recipes and skills.</Text>
      </Stack>
      <ClientSetup />
    </section>

    <section className="agents-directory-section" aria-labelledby="try-flood-prompt">
      <Stack gap="2">
        <Heading id="try-flood-prompt" level={2} size="section">Try a prompt</Heading>
        <Text as="p" tone="subtle" size="compact">Paste it into a chat with Flood connected.</Text>
      </Stack>
      <Surface style={panelStyle} className="agents-prompt-panel">
        <Stack gap="4">
          <Text as="p" size="body">{prompt}</Text>
          <CopyButton value={prompt} label="Copy prompt" text="Copy prompt" errorText="Select the prompt to copy it manually." />
        </Stack>
      </Surface>
    </section>

    {catalogSkillCommand && <section className="agents-directory-section" aria-labelledby="catalog-skill">
      <Stack gap="2">
        <Heading id="catalog-skill" level={2} size="section">Install the catalog skill</Heading>
        <Text as="p" tone="subtle" size="compact">Teach your agent to check the Flood version installed in your project.</Text>
      </Stack>
      <Command code={catalogSkillCommand} label="Copy catalog skill command" />
    </section>}
  </main>;
}
