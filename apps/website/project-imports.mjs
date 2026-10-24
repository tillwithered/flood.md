import catalog from "./src/component-catalog.json" with { type: "json" };

// This explicit catalog is the only name-to-project-path map. No source guessing.
const paths = new Map(catalog.map(({ name, slug }) => [name, slug]));

function components(names) {
  if (!Array.isArray(names)) throw new TypeError("Component names must be an array.");
  return [...new Set(names)].map((name) => {
    if (typeof name !== "string" || !paths.has(name)) {
      throw new Error(`Unknown Flood component: ${String(name)}`);
    }
    return { name, slug: paths.get(name) };
  });
}

/** Import only known named component exports; preserve their first-use order. */
export function importStatements(names, mode = "package") {
  if (mode !== "package" && mode !== "project") throw new Error(`Unknown import mode: ${String(mode)}`);
  const selected = components(names);
  if (!selected.length) return "";
  if (mode === "package") return `import { ${selected.map(({ name }) => name).join(", ")} } from "@flood-md/react";`;
  return selected.map(({ name, slug }) => `import { ${name} } from "@/ui/${slug}";`).join("\n");
}

/** Documentation only: the host deliberately creates these thin re-export files. */
export function projectAdapters(names) {
  const selected = components(names);
  const files = selected.map(({ name, slug }) => `### src/ui/${slug}.ts\n\n\`\`\`ts\nexport { ${name} } from "@flood-md/react";\n\`\`\``).join("\n\n");
  return [
    "## Optional project UI boundary",
    "Connect Flood once using [the installation guide](/docs/installation). These files are project-owned adapters, not component implementation copies. Create only the files needed by the example; the CLI does not create or overwrite them.",
    "Merge this alias into your existing tsconfig.json; preserve its other settings and aliases. Configure the same @ alias in your bundler if it does not read TypeScript paths. Next.js supports these TypeScript path aliases.",
    "```json\n{\n  \"compilerOptions\": {\n    \"paths\": {\n      \"@/*\": [\"./src/*\"]\n    }\n  }\n}\n```",
    files,
    "### src/ui/styles.css\n\n```css\n@import \"@flood-md/react/styles.css\";\n```",
    'Import the stylesheet once at your application entry. In Next.js App Router, import it in src/app/layout.tsx (or app/layout.tsx). Keep FloodRoot around the UI that should use dark foundations.\n\n```tsx\nimport "@/ui/styles.css";\n```',
    "The @/ui name isolates the package boundary; the implementation is still React. Keep \"use client\" in host modules using callbacks, state or Field's function child. Re-exports preserve the package's component types and refs, but do not promise framework-independent components or automatic migrations.",
  ].filter(Boolean).join("\n\n") + "\n";
}
