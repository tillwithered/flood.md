import { readFile, appendFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

/** Only the verified publication switch can use the smaller website check. */
export function isPublicationGateChange(files, before, after) {
  if (files.length !== 1 || files[0] !== "apps/website/src/release.json") return false;
  const valid = value => value && Object.keys(value).sort().join(",") === "published,version" && typeof value.published === "boolean" && typeof value.version === "string";
  return Boolean(valid(before) && valid(after) && before.version === after.version && before.published !== after.published);
}

const integrationFiles = new Set([
  "apps/website/server.mjs",
  "apps/website/visitors.mjs",
  "apps/website/mcp.mjs",
  "apps/website/mcp-search.mjs",
  "docs/mcp.md",
  "plugins/flood/plugin.json",
  "plugins/flood/mcp.json",
  "skills/flood-catalog/SKILL.md",
]);

export function isIntegrationChange(files) {
  return files.length > 0 && files.every(file => integrationFiles.has(file));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let scope = "full";
  try {
    const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, "utf8"));
    const base = process.env.GITHUB_EVENT_NAME === "pull_request" ? event.pull_request?.base?.sha
      : process.env.GITHUB_EVENT_NAME === "push" ? event.before : undefined;
    if (!/^[a-f0-9]{40}$/.test(base ?? "") || /^0+$/.test(base)) throw new Error("No bounded diff base");
    const git = args => {
      const result = spawnSync("git", args, { encoding: "utf8" });
      if (result.status !== 0) throw new Error("Diff unavailable");
      return result.stdout;
    };
    const files = git(["diff", "--name-only", "--no-renames", "-z", base, "HEAD"]).split("\0").filter(Boolean);
    if (isIntegrationChange(files)) scope = "integration";
    if (files.length === 1 && files[0] === "apps/website/src/release.json" &&
        isPublicationGateChange(files, JSON.parse(git(["show", `${base}:apps/website/src/release.json`])), JSON.parse(await readFile(files[0], "utf8")))) scope = "publication";
  } catch { /* Unknown or mixed changes always retain the complete checks. */ }
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `scope=${scope}\n`);
  console.log(`Verification scope: ${scope}`);
}
