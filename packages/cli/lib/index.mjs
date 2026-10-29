import { readFile, writeFile, mkdir, lstat } from "node:fs/promises";
import { resolve, join, parse, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createHash } from 'node:crypto';
import { createKnowledgeReader } from '@flood-md/agent';

export const VERSION = "0.2.10";
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

async function projectDirectory(root) {
  const absolute = resolve(root);
  const anchor = parse(absolute).root;
  let current = anchor;
  // Inspect prefixes before descendants so a linked ancestor cannot redirect
  // either package.json reads or subsequent npm/configuration writes.
  for (const part of ["", ...relative(anchor, absolute).split(sep).filter(Boolean)]) {
    if (part) current = join(current, part);
    const info = await lstat(current).catch(() => {
      throw new Error("Run Flood inside an existing project directory.");
    });
    if (info.isSymbolicLink()) throw new Error(`Refusing linked project directory: ${current}`);
    if (!info.isDirectory()) throw new Error("Run Flood inside a regular project directory.");
  }
  return absolute;
}

async function projectManifest(root) {
  const path = join(root, "package.json");
  const info = await lstat(path).catch(() => {
    throw new Error("Run init inside a React project with a package.json.");
  });
  if (info.isSymbolicLink()) throw new Error("Refusing linked path: package.json");
  if (!info.isFile()) throw new Error("package.json must be a regular file.");
  if (info.nlink > 1) throw new Error("Refusing linked path: package.json");
  const manifest = await json(path).catch(() => {
    throw new Error("package.json must contain a valid project object.");
  });
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest))
    throw new Error("package.json must contain a valid project object.");
  return manifest;
}

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
  root = await projectDirectory(root);
  const manifest = await projectManifest(root);
  if (![manifest.dependencies?.react, manifest.devDependencies?.react].some(value => typeof value === "string" && value.trim()))
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
  await projectDirectory(root);
  await projectManifest(root);
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
  root = await projectDirectory(root);
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

async function installedVersion(root, name) {
  let current = root;
  while (true) {
    try {
      const path = join(current, 'node_modules', name, 'package.json');
      const info = await lstat(path);
      if (!info.isFile() || info.isSymbolicLink() || info.size > 64 * 1024) throw Error('Invalid package manifest.');
      const pkg = await json(path);
      if (pkg.name !== name || !/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(pkg.version ?? '')) throw Error('Invalid package identity.');
      return pkg.version;
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const parent = resolve(current, '..'); if (parent === current) return null; current = parent;
  }
}

export async function knowledgeInfo(root) {
  root = await projectDirectory(root);
  const app = await projectManifest(root);
  const configInfo = await inspectTarget(root, 'flood.json');
  let config;
  if (configInfo) {
    if (!configInfo.isFile() || configInfo.nlink !== 1 || configInfo.size > 64 * 1024) throw Error('Invalid flood.json.');
    config = await json(join(root, 'flood.json')).catch(() => { throw Error('Malformed flood.json.'); });
    if (!config || typeof config !== 'object' || Array.isArray(config) || !/^\d+\.\d+\.\d+$/.test(config.version ?? '')) throw Error('Invalid flood.json version.');
  }
  const versions = Object.fromEntries(await Promise.all([...packages, '@flood-md/cli'].map(async name => [name, await installedVersion(root, name)])));
  const knowledge = await createKnowledgeReader().info();
  const present = Object.values(versions).filter(Boolean);
  let guideVersion = null;
  if (config) {
    const stat = await inspectTarget(root, 'flood/manifest.json');
    if (!stat?.isFile() || stat.nlink !== 1 || stat.size > 64 * 1024) throw Error('Missing or invalid project guide manifest.');
    const installed = await json(join(root, 'flood/manifest.json')).catch(() => { throw Error('Malformed project guide manifest.'); });
    if (installed?.schemaVersion !== 1 || !/^\d+\.\d+\.\d+$/.test(installed.version ?? '')) throw Error('Invalid project guide manifest version.');
    guideVersion = installed.version;
  }
  const mismatch = knowledge.version !== VERSION || (config && (config.version !== VERSION || guideVersion !== VERSION)) || present.some(version => version !== VERSION);
  const missing = config && packages.some(name => !versions[name]);
  const state = mismatch ? 'version-mismatch' : missing ? 'missing-packages' : config ? 'connected' : 'bundle-only';
  const dependencies = {...app.devDependencies, ...app.dependencies};
  return {schemaVersion:1, version:VERSION, project:{state, framework:dependencies.next ? 'next' : dependencies.react ? 'react' : 'unknown', configuredVersion:config?.version ?? null, guideVersion, installedVersions:versions}, knowledge};
}

async function knowledgeContext(root) {
  const info = await knowledgeInfo(root);
  if (['version-mismatch','missing-packages'].includes(info.project.state)) {
    const error = new Error('Project packages, Flood configuration and this CLI must match before reading knowledge. Run info or the matching installed CLI.');
    error.code = 'VERSION_MISMATCH'; throw error;
  }
  return info;
}

export async function knowledgeCatalog(root, query = {}) {
  const info = await knowledgeContext(root);
  return {...await createKnowledgeReader().list(query), scope:info.project.state};
}

export async function knowledgeRead(root, id, {source = 'auto', offset = 0, length = 10000, linksOffset = 0} = {}) {
  if (!['auto','package'].includes(source)) throw Error('Read source must be auto or package.');
  if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(length) || length < 1 || length > 40000) throw Error('Invalid read range.');
  const info = await knowledgeContext(root);
  const reader = createKnowledgeReader();
  const upstream = await reader.read(id, {length:1, linksOffset});
  if (source === 'package' || info.project.state !== 'connected' || !upstream.installedTarget) return {...await reader.read(id, {offset,length,linksOffset}), customized:false, scope:info.project.state};
  const stat = await inspectTarget(root, upstream.installedTarget);
  if (!stat?.isFile() || stat.nlink !== 1 || stat.size > 1024 * 1024) throw Error('Selected project guide is missing, linked or exceeds the read budget.');
  const bytes = await readFile(join(root, upstream.installedTarget));
  if (bytes.length > 1024 * 1024) throw Error('Project guide exceeds the read budget.');
  const body = new TextDecoder('utf-8', {fatal:true}).decode(bytes);
  if (id === 'guide:design' && !body.split(/\r?\n/,1)[0].endsWith('· ' + VERSION)) throw Error('Project design guide version differs. Compare and merge the matching guide.');
  const chars = Array.from(body);
  if (offset > chars.length) throw Error('Read offset is outside the project material.');
  const end = Math.min(chars.length, offset + length), sha256 = createHash('sha256').update(bytes).digest('hex');
  return {...upstream, source:'project', scope:info.project.state, customized:sha256 !== upstream.sha256,
    packageSha256:upstream.sha256, sha256, text:chars.slice(offset,end).join(''), offset,
    totalCharacters:chars.length, truncated:end < chars.length, nextOffset:end < chars.length ? end : null};
}

function knowledgeArguments(command, args) {
  const options = {}, positional = [];
  const flags = command === 'catalog' ? new Set(['kind','group','search','limit','cursor']) : command === 'read' ? new Set(['offset','length','source','links-offset']) : new Set();
  for (let i=0; i<args.length; i++) {
    const value = args[i];
    if (value === '--json') { if (options.json) throw Error('Duplicate --json.'); options.json = true; continue; }
    if (!value.startsWith('--')) { positional.push(value); continue; }
    const key = value.slice(2);
    const optionKey = key === 'links-offset' ? 'linksOffset' : key;
    if (!flags.has(key) || Object.hasOwn(options,optionKey) || args[i+1] === undefined || args[i+1].startsWith('--')) throw Error('Unknown, repeated or incomplete knowledge option.');
    const raw = args[++i];
    if (['offset','length','limit','links-offset'].includes(key)) {
      if (!/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw))) throw Error('Knowledge ranges must be integers.');
      options[optionKey] = Number(raw);
    } else options[key] = raw;
  }
  if (positional.length !== (command === 'read' ? 1 : 0)) throw Error('Read requires one material ID; info and catalog accept only options.');
  delete options.json; return {id:positional[0], options};
}

export async function run(args, {root = process.cwd(), log = console.log} = {}) {
  const [command, ...flags] = args;
  if (['info','catalog','read'].includes(command)) {
    const {id, options} = knowledgeArguments(command, flags);
    const result = command === 'info' ? await knowledgeInfo(root) : command === 'catalog' ? await knowledgeCatalog(root, options) : await knowledgeRead(root,id,options);
    log(JSON.stringify(result)); return result;
  }
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
    `Flood ${VERSION}\n\nnpx @flood-md/cli init [--dry-run]  Connect a React or Next.js project\nnpx @flood-md/cli doctor           Check packages and agent files\nnpx @flood-md/cli info             Read project and knowledge versions as JSON\nnpx @flood-md/cli catalog          Discover bounded knowledge metadata as JSON\nnpx @flood-md/cli read <id>        Read one installed-version material as JSON\n\nComponents ship together in @flood-md/react; import the ones you need.\nUpdates: review the changelog and upgrade Flood packages together.\nhttps://flood.md`,
  );
}
