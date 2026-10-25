import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, readdir, link, symlink, rename, unlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname, resolve, relative, isAbsolute } from "node:path";
import { initProject, doctor, AGENT_FILES, VERSION } from "../packages/cli/lib/index.mjs";

const reactProject = JSON.stringify({ dependencies: { react: "^19.0.0" } });
const directoryLink = process.platform === "win32" ? "junction" : "dir";

async function fixture(t, content = reactProject) {
  const base = await mkdtemp(join(tmpdir(), "flood-install-audit-"));
  const root = join(base, "project"), outside = join(base, "outside");
  await mkdir(root); await mkdir(outside);
  if (content !== undefined) await writeFile(join(root, "package.json"), content);
  t.after(() => rm(base, { recursive: true, force: true }));
  return { base, root, outside };
}

test("init refuses a hard-linked npm manifest before installer or owned writes", async t => {
  const { root, outside } = await fixture(t);
  const target = join(outside, "package.json");
  await writeFile(target, reactProject); await unlink(join(root, "package.json"));
  await link(target, join(root, "package.json"));
  let calls = 0;
  await assert.rejects(initProject(root, { installer() { calls++; }, log() {} }), /linked path: package\.json/);
  assert.equal(calls, 0); assert.equal(await readFile(target, "utf8"), reactProject);
  assert.deepEqual(await readdir(root), ["package.json"]);
});

test("init refuses a symbolic npm manifest without touching its target", async t => {
  const { root, outside } = await fixture(t);
  const target = join(outside, "package.json");
  await writeFile(target, reactProject); await unlink(join(root, "package.json"));
  try { await symlink(target, join(root, "package.json"), "file"); }
  catch (error) { if (error.code === "EPERM") { t.skip("Host does not allow file symlinks; hard-link and directory-link cases still run."); return; } throw error; }
  let calls = 0;
  await assert.rejects(initProject(root, { installer() { calls++; }, log() {} }), /linked path: package\.json/);
  assert.equal(calls, 0); assert.equal(await readFile(target, "utf8"), reactProject);
  assert.deepEqual(await readdir(outside), ["package.json"]);
});

test("linked project roots and linked ancestors are rejected before reads or writes", async t => {
  const { base, root, outside } = await fixture(t);
  const direct = join(base, "linked-project"), ancestor = join(base, "linked-parent");
  await symlink(root, direct, directoryLink); await symlink(base, ancestor, directoryLink);
  let calls = 0;
  try {
    for (const path of [direct, join(ancestor, "project")]) {
      await assert.rejects(initProject(path, { installer() { calls++; }, log() {} }), /linked project directory/);
      await assert.rejects(doctor(path, () => {}), /linked project directory/);
    }
    assert.equal(calls, 0); assert.deepEqual(await readdir(outside), []);
    assert.deepEqual(await readdir(root), ["package.json"]);
  } finally { await unlink(direct); await unlink(ancestor); }
});

test("non-regular manifest destinations fail without invoking npm", async t => {
  const { root } = await fixture(t);
  await unlink(join(root, "package.json")); await mkdir(join(root, "package.json"));
  await assert.rejects(initProject(root, { installer() { assert.fail("npm must not run"); }, log() {} }), /regular file/);
  assert.deepEqual(await readdir(root), ["package.json"]);
});

test("invalid JSON shapes and non-string React declarations fail with project errors", async t => {
  const { root } = await fixture(t);
  for (const [value, expected] of [
    ["null", /valid project object/], ["[]", /valid project object/], ["true", /valid project object/],
    ['"project"', /valid project object/], ["{", /valid project object/],
    [JSON.stringify({ dependencies: { react: {} } }), /React was not found/],
    [JSON.stringify({ devDependencies: { react: [] } }), /React was not found/],
    [JSON.stringify({ dependencies: { react: "  " } }), /React was not found/],
  ]) {
    await writeFile(join(root, "package.json"), value);
    await assert.rejects(initProject(root, { installer() { assert.fail("npm must not run"); }, log() {} }), expected);
    assert.deepEqual(await readdir(root), ["package.json"]);
  }
});

test("init rechecks project ancestry after installer before writing configuration", async t => {
  const { base, root, outside } = await fixture(t);
  await writeFile(join(outside, "package.json"), reactProject);
  const moved = join(base, "original-project");
  try {
    await assert.rejects(initProject(root, { async installer() {
      await rename(root, moved); await symlink(outside, root, directoryLink);
    }, log() {} }), /linked project directory/);
    assert.deepEqual(await readdir(outside), ["package.json"]);
    assert.equal(await readFile(join(outside, "package.json"), "utf8"), reactProject);
  } finally { await unlink(root); }
});

test("init rechecks replaced npm manifests and installer-created conflicts", async t => {
  const { root, outside } = await fixture(t);
  const target = join(outside, "package.json"); await writeFile(target, reactProject);
  await assert.rejects(initProject(root, { async installer() {
    await unlink(join(root, "package.json")); await link(target, join(root, "package.json"));
  }, log() {} }), /linked path: package\.json/);
  assert.deepEqual(await readdir(root), ["package.json"]);
  assert.equal(await readFile(target, "utf8"), reactProject);
  await unlink(join(root, "package.json")); await writeFile(join(root, "package.json"), reactProject);
  await assert.rejects(initProject(root, { async installer() {
    await mkdir(join(root, "flood")); await writeFile(join(root, "flood", "DESIGN.md"), "Host-owned guide");
  }, log() {} }), /already exists/);
  assert.equal(await readFile(join(root, "flood", "DESIGN.md"), "utf8"), "Host-owned guide");
  assert.deepEqual((await readdir(root)).sort(), ["flood", "package.json"]);
});

test("normal devDependency projects preserve host files and install resolving guide links", async t => {
  const manifest = JSON.stringify({ devDependencies: { react: "^18.3.1", next: "^16.0.0" } });
  const { root } = await fixture(t, manifest);
  const instructions = "# Host rules\nUse this project's own deployment process.\n";
  await writeFile(join(root, "AGENTS.md"), instructions);
  let calls = 0;
  await initProject(root, { installer() { calls++; }, log() {} });
  assert.equal(calls, 1); assert.equal(await readFile(join(root, "AGENTS.md"), "utf8"), instructions);
  assert.equal(await readFile(join(root, "package.json"), "utf8"), manifest);
  const config = JSON.parse(await readFile(join(root, "flood.json"), "utf8"));
  assert.equal(config.framework, "next"); assert.equal(config.version, VERSION);
  const owned = new Set(AGENT_FILES.map(file => resolve(root, file.target)));
  for (const file of AGENT_FILES.filter(file => file.target.endsWith(".md"))) {
    const installedPath = resolve(root, file.target), contents = await readFile(installedPath, "utf8");
    for (const [, target] of contents.matchAll(/\]\(([^)]+)\)/g)) {
      if (/^(?:[a-z]+:|\/|#)/i.test(target)) continue;
      const destination = resolve(dirname(installedPath), target.split("#")[0]);
      assert.ok(!isAbsolute(relative(root, destination)) && !relative(root, destination).startsWith(".."));
      assert.ok(owned.has(destination), `Uninstalled guide link ${file.target} -> ${target}`);
      assert.ok((await readFile(destination)).length > 0);
    }
  }
});
