import { readFile, mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { VERSION } from "../packages/cli/lib/index.mjs";
import { verifyCandidate } from "./ci-artifacts.mjs";

const names = ["tokens", "react", "agent", "cli"];
const sourceOnly = process.argv.includes('--source-only');
const npm = (args) =>
  spawnSync(process.execPath, [process.env.npm_execpath, ...args], {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
for (const path of ["package.json", "apps/website/package.json", "examples/next/package.json"]) {
  const manifest = JSON.parse(await readFile(path, "utf8"));
  if (manifest.version !== VERSION) throw new Error(`${path}: workspace version differs from CLI ${VERSION}`);
  for (const [name, version] of Object.entries(manifest.dependencies ?? {}))
    if (name.startsWith("@flood-md/") && version !== VERSION)
      throw new Error(`${path}: ${name} must be pinned to ${VERSION}`);
}
const websiteRelease = JSON.parse(await readFile("apps/website/src/release.json", "utf8"));
if (websiteRelease.version !== VERSION) throw new Error("Website command version differs from release train");
const agentManifest = JSON.parse(await readFile("packages/agent/manifest.json", "utf8"));
if (agentManifest.version !== VERSION) throw new Error("Agent manifest version differs from release train");
const design = await readFile("packages/agent/DESIGN.md", "utf8");
if (!design.split(/\r?\n/, 1)[0].includes(VERSION)) throw new Error("Agent guide version differs from release train");
for (const name of names) {
  const manifest = JSON.parse(
    await readFile(`packages/${name}/package.json`, "utf8"),
  );
  if (manifest.version !== VERSION)
    throw new Error(`${name}: version differs from CLI ${VERSION}`);
  for (const [dependency, version] of Object.entries(
    manifest.dependencies ?? {},
  ))
    if (dependency.startsWith("@flood-md/") && version !== VERSION)
      throw new Error(`${dependency}: internal dependency must be ${VERSION}`);
  if (
    name === "react" && !sourceOnly &&
    !(await readFile("packages/react/dist/index.js", "utf8")).startsWith(
      '"use client";',
    )
  )
    throw new Error("Missing client boundary");
}
if (process.argv.includes("--check") || sourceOnly) {
  console.log(`Release ${VERSION}: package versions aligned.`);
  process.exit(0);
}
if (process.env.GITHUB_REF_NAME !== `v${VERSION}`)
  throw new Error(`Expected release tag v${VERSION}`);
await mkdir(".artifacts", { recursive: true });
// CI publishes the exact archives built before the successful browser gates.
const prepared = process.env.FLOOD_PREPARED_CANDIDATE === 'true'
  ? await verifyCandidate('.artifacts/release-candidate') : null;
for (const name of names) {
  let archive;
  let archivePath;
  if (prepared) {
    archive = prepared.packages.find(pkg => pkg.name === name);
    archivePath = `.artifacts/release-candidate/${archive.file}`;
  } else {
  const packed = npm([
    "pack",
    `./packages/${name}`,
    "--pack-destination",
    ".artifacts",
    "--json",
  ]);
  if (packed.status !== 0) throw new Error(packed.stderr);
  [archive] = JSON.parse(packed.stdout);
  archivePath = `.artifacts/${archive.filename}`;
  }
  const remote = npm([
    "view",
    `@flood-md/${name}@${VERSION}`,
    "dist.integrity",
    "--json",
  ]);
  if (remote.status === 0) {
    if (JSON.parse(remote.stdout) !== archive.integrity)
      throw new Error(`${name}: existing npm version has different contents`);
    console.log(`Already published and matching: ${name}@${VERSION}`);
    continue;
  }
  if (!remote.stderr.includes("E404") && !remote.stdout.includes("E404"))
    throw new Error(remote.stderr || remote.stdout);
  const result = npm([
    "publish",
    archivePath,
    "--access",
    "public",
    "--provenance",
  ]);
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  if (result.status !== 0)
    throw new Error(
      `Publication failed for ${name}; inspect npm access and scope ownership.`,
    );
}
