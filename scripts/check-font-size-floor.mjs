import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceRoot = fileURLToPath(new URL("../src", import.meta.url));
const violations = [];

async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await inspect(entryPath);
      continue;
    }
    if (!entry.name.endsWith(".css") && !entry.name.endsWith(".svelte")) continue;

    const source = await readFile(entryPath, "utf8");
    const patterns = [
      /font-size\s*:\s*(\d+(?:\.\d+)?)px/g,
      /font\s*:\s*(\d+(?:\.\d+)?)px(?:\/[^\s]+)?/g
    ];
    for (const pattern of patterns) {
      for (const match of source.matchAll(pattern)) {
        if (Number(match[1]) >= 12) continue;
        const line = source.slice(0, match.index).split("\n").length;
        violations.push(`${path.relative(sourceRoot, entryPath)}:${line} (${match[1]}px)`);
      }
    }
  }
}

await inspect(sourceRoot);

if (violations.length) {
  console.error("Visible UI text must be at least 12px:\n" + violations.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("Font-size floor: OK (12px minimum)");
