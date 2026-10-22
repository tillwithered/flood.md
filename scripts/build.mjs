import { readFile, writeFile, mkdir, copyFile, cp } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const tokens = JSON.parse(
  await readFile("packages/tokens/src/tokens.json", "utf8"),
);
const rules = (values) =>
  Object.entries(values)
    .map(([key, value]) => `  --flood-${key}: ${value};`)
    .join("\n");
const css = `/* Generated from packages/tokens/src/tokens.json. */\n:root {\n${rules({ ...tokens.shared, ...tokens.light })}\n  color-scheme: light;\n}\n@media (prefers-color-scheme: dark) { :root:not([data-flood-theme="light"]) {\n${rules(tokens.dark)}\n  color-scheme: dark;\n} }\n[data-flood-theme="light"] {\n${rules(tokens.light)}\n  color-scheme: light;\n}\n[data-flood-theme="dark"] {\n${rules(tokens.dark)}\n  color-scheme: dark;\n}\n`;
await mkdir("packages/tokens/dist", { recursive: true });
await writeFile("packages/tokens/dist/tokens.css", css);
await copyFile(
  "packages/tokens/src/tokens.json",
  "packages/tokens/dist/tokens.json",
);
const result = spawnSync(
  process.execPath,
  [
    "node_modules/typescript/bin/tsc",
    "-p",
    "packages/react/tsconfig.build.json",
  ],
  { stdio: "inherit" },
);
if (result.status !== 0) process.exit(result.status ?? 1);
await copyFile(
  "packages/react/src/styles.css",
  "packages/react/dist/styles.css",
);
for (const name of ["tokens", "react", "agent", "cli"])
  await copyFile("LICENSE", `packages/${name}/LICENSE`);
await mkdir("apps/website/public/schema", { recursive: true });
await mkdir("apps/website/public/agent", { recursive: true });
await cp("schema", "apps/website/public/schema", { recursive: true });
await copyFile(
  "packages/agent/DESIGN.md",
  "apps/website/public/agent/DESIGN.md",
);
await copyFile("packages/agent/SKILL.md", "apps/website/public/agent/SKILL.md");
await copyFile("docs/llms.txt", "apps/website/public/llms.txt");
console.log("Built Flood packages and agent endpoints.");
