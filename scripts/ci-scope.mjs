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

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let gateOnly = false;
  try {
    const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, "utf8"));
    const base = event.pull_request?.base?.sha ?? event.before;
    if (!/^[a-f0-9]{40}$/.test(base ?? "") || /^0+$/.test(base)) throw new Error("No bounded diff base");
    const git = args => {
      const result = spawnSync("git", args, { encoding: "utf8" });
      if (result.status !== 0) throw new Error("Diff unavailable");
      return result.stdout;
    };
    const files = git(["diff", "--name-only", "--no-renames", `${base}...HEAD`]).trim().split("\n").filter(Boolean);
    if (files.length === 1 && files[0] === "apps/website/src/release.json") gateOnly = isPublicationGateChange(files, JSON.parse(git(["show", `${base}:apps/website/src/release.json`])), JSON.parse(await readFile(files[0], "utf8")));
  } catch { /* Unknown or mixed changes always retain the complete checks. */ }
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `gate_only=${gateOnly}\n`);
  console.log(gateOnly ? "Publication gate only: website verification" : "Complete product verification");
}
