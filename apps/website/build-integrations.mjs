import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";
import { build } from "vite";

const local = path => new URL(path, import.meta.url);
await build({
  configFile: false,
  publicDir: false,
  build: {
    target: "node22",
    ssr: fileURLToPath(local("./mcp.mjs")),
    outDir: fileURLToPath(local("./dist-server/")),
    emptyOutDir: true,
    rolldownOptions: { output: { entryFileNames: "mcp.mjs" } },
  },
  ssr: { noExternal: true },
});

const files = {
  "plugin.json": "../../plugins/flood/plugin.json",
  "mcp.json": "../../plugins/flood/mcp.json",
  "skills/flood-catalog/SKILL.md": "../../skills/flood-catalog/SKILL.md",
  "assets/flood-mark.png": "./public/flood-mark.png",
  LICENSE: "../../LICENSE",
};
const entries = await Promise.all(Object.entries(files).map(async ([name, path]) => [
  name, new Uint8Array(await readFile(local(path))),
]));
await writeFile(local("./dist/flood-plugin.zip"), zipSync(Object.fromEntries(entries), { mtime: new Date(2000, 0, 1) }));
