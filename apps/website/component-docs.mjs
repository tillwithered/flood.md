import taxonomy from "./src/component-groups.json" with { type: "json" };
/** Shared content formatting for the reader, clipboard and real .md files. */
export function usageCode(component) {
  const names = [...new Set(["FloodRoot", ...component.imports])];
  const iconNames = ["Plus", "ArrowRight", "Copy"];
  const flood = names.filter(name => !iconNames.includes(name));
  const icons = names.filter(name => iconNames.includes(name));
  const imports = `import { ${flood.join(", ")} } from "@flood-md/react";\n` + (icons.length ? `import { ${icons.join(", ")} } from "lucide-react";\n` : "");
  const body = component.slug === "flood-root" ? component.code : `<FloodRoot>\n${component.code.split("\n").map(line => `  ${line}`).join("\n")}\n</FloodRoot>`;
  return `"use client";\n\n${imports}import "@flood-md/react/styles.css";\n\nexport function Example() {\n  return (\n${body.split("\n").map(line => `    ${line}`).join("\n")}\n  );\n}\n`;
}
export function componentMarkdown(component, exampleCode = usageCode(component)) {
  const escapeCell = value => String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
  return `# ${component.name}\n\n${component.description}\n\nConnect Flood once using [the installation guide](https://flood.md/docs/installation). Then import the components you use; no per-component add command is needed.\n\n## Example\n\n\`\`\`tsx\n${exampleCode.trimEnd()}\n\`\`\`\n\n## Design notes\n\n${component.notes.map(note => `- ${note}`).join("\n")}\n\n## API reference\n\n| Prop | Values | Default |\n| --- | --- | --- |\n${component.api.map(row => `| ${row.map(value => `\`${escapeCell(value).replaceAll("`", "&#96;")}\``).join(" | ")} |`).join("\n")}\n`;
}
export function catalogMarkdown(pages) {
  const ids = new Set(taxonomy.map(group => group.id));
  if (ids.size !== taxonomy.length) throw new Error("Duplicate catalog group");
  for (const page of pages) if (!ids.has(page.group)) throw new Error(`Unknown catalog group: ${page.group}`);
  const sections = taxonomy.flatMap(group => {
    const entries = pages.filter(page => page.group === group.id).sort((a, b) => a.name.localeCompare(b.name));
    return entries.length ? [`## ${group.label}\n\n${group.description}\n\n${entries.map(page => `- [${page.name}](https://flood.md/components/${page.slug}): ${page.description}`).join("\n")}`] : [];
  });
  return `# Components\n\nOriginal React components with native semantics. Connect the package once, then import the components you use.\n\n${sections.join("\n\n")}\n`;
}
