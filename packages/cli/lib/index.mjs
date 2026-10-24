import { readFile, writeFile, mkdir, lstat, access } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

export const VERSION = "0.2.2";
const packages = ["@flood-md/tokens", "@flood-md/react", "@flood-md/agent"];
const json = async (path) => JSON.parse(await readFile(path, "utf8"));
const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};
const agentFile = (name) =>
  fileURLToPath(import.meta.resolve(`@flood-md/agent/${name}`));

// Refuse links and existing instruction files before changing any project data.
export async function checkTarget(root, relative) {
  let current = root;
  for (const part of relative.split("/")) {
    current = join(current, part);
    try {
      if ((await lstat(current)).isSymbolicLink())
        throw new Error(`Refusing linked path: ${relative}`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  if (await exists(join(root, relative)))
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
  const files = [
    "flood.json",
    "flood/DESIGN.md",
    ".agents/skills/flood-ui/SKILL.md",
  ];
  for (const file of files) await checkTarget(root, file);
  log(
    `Flood ${VERSION} · ${framework} · npm\nInstall: ${packages.map((p) => `${p}@${VERSION}`).join(", ")}\nCreate: ${files.join(", ")}`,
  );
  if (dryRun) return;
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
  await mkdir(join(root, "flood"), { recursive: true });
  await mkdir(join(root, ".agents/skills/flood-ui"), { recursive: true });
  await writeFile(
    join(root, files[0]),
    JSON.stringify(config, null, 2) + "\n",
    { flag: "wx" },
  );
  await writeFile(
    join(root, files[1]),
    await readFile(agentFile("DESIGN.md")),
    { flag: "wx" },
  );
  await writeFile(join(root, files[2]), await readFile(agentFile("SKILL.md")), {
    flag: "wx",
  });
  log(
    `\nConnected. Import '@flood-md/react/styles.css' in ${framework === "next" ? "app/layout.tsx" : "your app entry"}.\nWrap your interface in <FloodRoot> from '@flood-md/react' to use the dark foundations.\nRead flood/DESIGN.md for component APIs. Run npx @flood-md/cli doctor to verify.`,
  );
}

export async function doctor(root, log = console.log) {
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
  for (const name of ["flood/DESIGN.md", ".agents/skills/flood-ui/SKILL.md"])
    if (!(await exists(join(root, name)))) failures.push(`${name}: missing`);
  if (failures.length) throw new Error(failures.join("\n"));
  log(
    `Flood ${config.version}: package versions and agent files are aligned.\nCheck the stylesheet import in your application entry; doctor does not parse application code.`,
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
