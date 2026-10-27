import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, realpath, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { verifyCandidate } from "./ci-artifacts.mjs";
import { consumerEnvironment } from "./consumer-env.mjs";

const workspace = fileURLToPath(new URL("../", import.meta.url));
const json = async path => JSON.parse(await readFile(path, "utf8"));
const rootPackage = await json(join(workspace, "package.json"));
const version = rootPackage.version;
const template = await json(join(workspace, "examples/next/package.json"));
const catalog = await json(join(workspace, "apps/website/src/component-catalog.json"));
const sandbox = await mkdtemp(join(tmpdir(), "flood-registry-"));
const inside = (root, path) => { const value = relative(root, path); return value === "" || (value !== ".." && !value.startsWith(".." + sep) && !isAbsolute(value)); };
assert.ok(!inside(await realpath(workspace), await realpath(sandbox)), "Consumer must be outside the checkout");
const project = join(sandbox, "project");
await mkdir(project);
const userConfig = join(sandbox, "npmrc");
await writeFile(userConfig, "registry=https://registry.npmjs.org/\n");
// Registry consumption needs no publisher, artifact or account credentials.
const env = consumerEnvironment(process.env);
Object.assign(env, { CI: "true", NEXT_TELEMETRY_DISABLED: "1", NPM_CONFIG_CACHE: join(sandbox, "cache"), NPM_CONFIG_USERCONFIG: userConfig });
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run through npm run release:verify-registry");
function run(command, args, cwd = project, extraEnv = {}) {
  const result = spawnSync(command, args, { cwd, env: { ...env, ...extraEnv }, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || "Consumer command failed");
  return result.stdout;
}
const npm = args => run(process.execPath, [npmCli, ...args]);
const packages = ["tokens", "react", "agent", "cli"];
const registry = {};
const candidate = process.env.FLOOD_PREPARED_CANDIDATE === 'true' ? await verifyCandidate('.artifacts/release-candidate') : null;
const deadline = Date.now() + 5 * 60_000;
while (Object.keys(registry).length < packages.length) {
  for (const name of packages.filter(name => !registry[name])) {
    const result = spawnSync(process.execPath, [npmCli, "view", `@flood-md/${name}@${version}`, "--json", "--prefer-online", "--fetch-timeout=10000", "--fetch-retries=0"], { cwd: project, env, encoding: "utf8", maxBuffer: 2 * 1024 * 1024 });
    if (result.status === 0) {
      const metadata = JSON.parse(result.stdout);
      assert.equal(metadata.version, version);
      assert.ok(metadata.dist?.integrity);
      if (candidate) assert.equal(metadata.dist.integrity, candidate.packages.find(pkg => pkg.name === name).integrity, 'Registry differs from the verified candidate');
      registry[name] = metadata.dist.integrity;
    }
  }
  if (Object.keys(registry).length === packages.length) break;
  if (Date.now() >= deadline) throw new Error("Published package metadata did not become available");
  console.log("Waiting for registry propagation");
  await new Promise(resolve => setTimeout(resolve, 5000));
}
const devDependencies = Object.fromEntries(["typescript", "@types/react", "@types/react-dom", "@types/node"].map(name => [name, rootPackage.devDependencies[name]]));
await writeFile(join(project, "package.json"), JSON.stringify({ name: "flood-registry-next-consumer", private: true, type: "module", scripts: template.scripts, dependencies: { next: template.dependencies.next, react: template.dependencies.react, "react-dom": template.dependencies["react-dom"] }, devDependencies }, null, 2));
npm(["install", "--ignore-scripts", "--no-audit", "--no-fund", "--save-dev", "--save-exact", `@flood-md/cli@${version}`]);
const cliManifest = await json(join(project, "node_modules/@flood-md/cli/package.json"));
const cli = join(project, "node_modules/@flood-md/cli", cliManifest.bin.flood);
run(process.execPath, [cli, "init", "--dry-run"]);
run(process.execPath, [cli, "init"]);
run(process.execPath, [cli, "doctor"]);
const lock = await json(join(project, "package-lock.json"));
for (const name of packages) {
  const directory = join(project, `node_modules/@flood-md/${name}`);
  assert.equal((await json(join(directory, "package.json"))).version, version);
  assert.ok(inside(await realpath(project), await realpath(directory)), "Registry package resolved outside consumer");
  assert.equal(lock.packages[`node_modules/@flood-md/${name}`].integrity, registry[name]);
}
const manifest = await json(join(project, "flood/manifest.json"));
assert.equal(manifest.version, version);
for (const file of manifest.files) assert.equal(await readFile(join(project, file.target), "utf8"), await readFile(join(project, "node_modules/@flood-md/agent", file.source), "utf8"));
assert.ok(manifest.files.some(file => file.source === "references/spacing.md"));
assert.ok((await readFile(join(project, "node_modules/@flood-md/react/dist/index.js"), "utf8")).startsWith('"use client";'));
await writeFile(join(project, "registry-check.mjs"), `import assert from 'node:assert/strict';import{createElement as h}from'react';import{renderToStaticMarkup as render}from'react-dom/server';import * as Flood from'@flood-md/react';assert.deepEqual(Object.keys(Flood).sort(),${JSON.stringify(catalog.map(component => component.name).sort())});assert.ok(render(h(Flood.FloodRoot,null,h(Flood.Button,null,'Registry ready'))).includes('Registry ready'));`);
run(process.execPath, ["registry-check.mjs"]);
for (const file of ["app", "tsconfig.json", "next-env.d.ts"]) await cp(join(workspace, "examples/next", file), join(project, file), { recursive: true });
npm(["run", "build"]);
// Never reuse the checkout's fixed-port Next server as registry evidence.
const probe = createServer();
await new Promise((resolve,reject)=>{probe.once("error",reject);probe.listen(0,"127.0.0.1",resolve);});
const port = probe.address().port;
await new Promise((resolve,reject)=>probe.close(error=>error?reject(error):resolve()));
const baseURL = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, [join(project, "node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", String(port)], { cwd: project, env, stdio: ["ignore", "pipe", "pipe"] });
let serverLog = "";
server.stdout.on("data", chunk => { serverLog = (serverLog + chunk).slice(-12000); });
server.stderr.on("data", chunk => { serverLog = (serverLog + chunk).slice(-12000); });
try {
  const readyBy = Date.now() + 30_000;
  while (true) {
    try { if ((await fetch(baseURL, { signal: AbortSignal.timeout(2000) })).ok) break; } catch {}
    if (server.exitCode !== null || Date.now() >= readyBy) throw new Error("Registry Next server did not become ready: " + serverLog);
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  await new Promise((resolve,reject)=>{
    const browser = spawn(process.execPath, [join(workspace, "node_modules/@playwright/test/cli.js"), "test", "--config=playwright.registry.config.ts"], {cwd:workspace,env:{...env,FLOOD_NEXT_TEST_URL:baseURL},stdio:"inherit"});
    browser.once("error",reject);
    browser.once("exit",code=>code===0?resolve():reject(new Error("Registry browser verification failed")));
  });
} finally {
  if (server.pid && server.exitCode === null) {
    const exited = new Promise(resolve=>server.once("exit",resolve));
    const forced = setTimeout(()=>server.kill("SIGKILL"),5000);
    server.kill("SIGTERM"); await exited; clearTimeout(forced);
  }
}
await mkdir(join(workspace, ".artifacts"), { recursive: true });
await writeFile(join(workspace, ".artifacts/registry-verification.json"), JSON.stringify({ version, exports: catalog.length, agentFiles: manifest.files.length, registryIntegrity: registry, cli: "passed", reactSSR: "passed", nextBuild: "passed", nextBrowser: "passed" }, null, 2));
console.log(`Registry ${version} verified: CLI, ${catalog.length} exports, ${manifest.files.length} agent files, React SSR and clean Next build/browser tests.`);
