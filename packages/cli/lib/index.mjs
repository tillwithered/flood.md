import { readFile, writeFile, mkdir, lstat } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

export const VERSION = "0.2.3";
const packages = ["@flood-md/tokens", "@flood-md/react", "@flood-md/agent"];
const json = async (path) => JSON.parse(await readFile(path, "utf8"));
const agentFile = (name) =>
  fileURLToPath(import.meta.resolve(`@flood-md/agent/${name}`));
const agentManifest = await json(agentFile("manifest.json"));
const safeRelative = (path) => typeof path === "string" && /^[a-zA-Z0-9._/-]+$/.test(path) &&
  !path.startsWith("/") && !path.split("/").some(part => !part || part === "." || part === "..");
if (agentManifest.schemaVersion !== 1 || agentManifest.version !== VERSION || !Array.isArray(agentManifest.files) ||
    !agentManifest.files.length || agentManifest.files.some(file =>
      !safeRelative(file.source) || !safeRelative(file.target) ||
      !(file.target.startsWith("flood/") || file.target.startsWith(".agents/skills/flood-ui/"))) ||
    new Set(agentManifest.files.map(file => file.target)).size !== agentManifest.files.length)
  throw new Error("Invalid Flood agent file manifest.");
export const AGENT_FILES = Object.freeze(agentManifest.files.map(file => Object.freeze({ ...file })));

async function inspectTarget(root, relative) {
  let current = root;
  let info;
  for (const part of relative.split("/")) {
    current = join(current, part);
    try {
      info = await lstat(current);
      if (info.isSymbolicLink()) throw new Error(`Refusing linked path: ${relative}`);
    } catch (error) {
      if (error.code === "ENOENT") return undefined;
      throw error;
    }
  }
  return info;
}

// Refuse links and existing instruction files before changing any project data.
export async function checkTarget(root, relative) {
  if (await inspectTarget(root, relative))
    throw new Error(`${relative} already exists. No files were overwritten.`);
}

export function install(root) {
  const args = [
    "install",
    "--save-exact",
    ...packages.map((name) => `${name}@${VERSION}`),
  ];
  // Only constant, internally generated arguments are sent to the Windows npm shim.
  const result = spawnSync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    args,
    { cwd: root, stdio: "inherit", shell: process.platform === "win32" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(
      "npm install failed. Configuration was not written; fix npm access and retry.",
    );
}

export async function initProject(
  root,
  { dryRun = false, installer = install, log = console.log } = {},
) {
  const manifest = await json(join(root, "package.json")).catch(() => {
    throw new Error("Run init inside a React project with a package.json.");
  });
  if (!(manifest.dependencies?.react || manifest.devDependencies?.react))
    throw new Error(
      "React was not found. Create a React or Next.js project first.",
    );
  const framework =
    manifest.dependencies?.next || manifest.devDependencies?.next
      ? "next"
      : "react";
  const files = ["flood.json", ...AGENT_FILES.map(file => file.target)];
  for (const file of files) await checkTarget(root, file);
  log(
    `Flood ${VERSION} · ${framework} · npm\nInstall: ${packages.map((p) => `${p}@${VERSION}`).join(", ")}\nCreate: ${files.join(", ")}`,
  );
  if (dryRun) return;
  // Read the complete bundled guide set before npm or owned writes can change anything.
  const guides = await Promise.all(AGENT_FILES.map(async file => ({
    ...file, content: await readFile(agentFile(file.source)),
  })));
  await installer(root);
  const config = {
    $schema: "https://flood.md/schema/config.json",
    version: VERSION,
    framework,
    packageManager: "npm",
    components: "@flood-md/react",
    stylesheet: "@flood-md/react/styles.css",
    instructions: "flood/DESIGN.md",
  };
  // Recheck after npm has run, before creating owned files.
  for (const file of files) await checkTarget(root, file);
  for (const file of files) await mkdir(resolve(root, file, ".."), { recursive: true });
  await writeFile(
    join(root, files[0]),
    JSON.stringify(config, null, 2) + "\n",
    { flag: "wx" },
  );
  for (const file of guides) {
    await checkTarget(root, file.target);
    await writeFile(join(root, file.target), file.content, { flag: "wx" });
  }
  log(
    `\nConnected. Import '@flood-md/react/styles.css' in ${framework === "next" ? "app/layout.tsx" : "your app entry"}.\nWrap your interface in <FloodRoot> from '@flood-md/react' to use the dark foundations.\nRead flood/DESIGN.md for component APIs. Run npx @flood-md/cli doctor to verify.`,
  );
}

export async function doctor(root, log = console.log) {
  const configInfo = await inspectTarget(root, "flood.json");
  if (!configInfo?.isFile()) throw new Error("No regular flood.json. Run init first.");
  const config = await json(join(root, "flood.json")).catch(() => {
    throw new Error("No flood.json. Run init first.");
  });
  const failures = [];
  for (const name of packages) {
    let path = root,
      found;
    while (true) {
      try {
        found = await json(join(path, "node_modules", name, "package.json"));
        break;
      } catch {}
      const parent = resolve(path, "..");
      if (parent === path) break;
      path = parent;
    }
    if (!found || found.version !== config.version)
      failures.push(
        `${name}: expected ${config.version}, found ${found?.version ?? "missing"}`,
      );
  }
  for (const { target } of AGENT_FILES) {
    try {
      const info = await inspectTarget(root, target);
      if (!info?.isFile()) failures.push(`${target}: missing or not a regular file`);
    } catch (error) { failures.push(error.message); }
  }
  if (!failures.length) {
    const installed = await json(join(root, "flood/manifest.json")).catch(() => undefined);
    if (installed?.version !== config.version) failures.push("Agent manifest version differs; compare and merge the matching guide bundle.");
    const header = (await readFile(join(root, "flood/DESIGN.md"), "utf8")).split(/\r?\n/, 1)[0];
    if (!header.endsWith("\u00b7 " + config.version)) failures.push("DESIGN.md version differs; preserve custom edits while updating the contract.");
  }
  if (failures.length) throw new Error(failures.join("\n"));
  log(
    `Flood ${config.version}: package versions and ${AGENT_FILES.length} agent files are aligned.\nCheck the stylesheet import in your application entry; doctor does not parse application code or validate UI.`,
  );
}

export async function run(args) {
  const [command, ...flags] = args;
  if (
    flags.some((flag) => flag !== "--dry-run") ||
    (flags.length && command !== "init")
  )
    throw new Error("Unsupported option. Use --help.");
  if (command === "init")
    return initProject(process.cwd(), { dryRun: flags.includes("--dry-run") });
  if (command === "doctor") return doctor(process.cwd());
  if (command === "--version") return console.log(VERSION);
  if (command && command !== "--help")
    throw new Error(`Unknown command: ${command}. Use --help.`);
  console.log(
    `Flood ${VERSION}\n\nnpx @flood-md/cli init [--dry-run]  Connect a React or Next.js project\nnpx @flood-md/cli doctor           Check packages and agent files\n\nComponents ship together in @flood-md/react; import the ones you need.\nUpdates: review the changelog and upgrade Flood packages together.\nhttps://flood.md`,
  );
}
