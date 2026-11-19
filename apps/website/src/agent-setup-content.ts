import { siteOrigin } from "../site-guides.mjs";

export const agentEndpoint = siteOrigin + "/mcp";

export const editorActions: Readonly<Record<string, { label: string; href: string }>> = {
  Cursor: {
    label: "Add to Cursor",
    href: "cursor://anysphere.cursor-deeplink/mcp/install?name=flood&config=" +
      encodeURIComponent(btoa(JSON.stringify({ url: agentEndpoint }))),
  },
  "VS Code": {
    label: "Add to VS Code",
    href: "vscode:mcp/install?" + encodeURIComponent(JSON.stringify({ name: "flood", type: "http", url: agentEndpoint })),
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
  const catalogSkill = sections.find(section => /^Install the catalog skill\r?\n/.test(section));
  return {
    clients,
    reference: referenceStart < 0 ? "" : "## " + sections.slice(referenceStart).join("## "),
    catalogSkillCommand: catalogSkill?.match(/^`{3}sh\r?\n([^\r\n]+)/m)?.[1],
  };
}
