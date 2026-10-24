import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  writeFile,
  mkdir,
  readFile,
  readdir,
  symlink,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initProject, doctor, AGENT_FILES, VERSION } from "../packages/cli/lib/index.mjs";

async function fixture(t, manifest = { dependencies: { react: "^19.0.0" } }) {
  const root = await mkdtemp(join(tmpdir(), "flood-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, "package.json"), JSON.stringify(manifest));
  return root;
}
test("dry run detects Next without installing or writing files", async (t) => {
  const root = await fixture(t, {
    dependencies: { react: "^19.0.0", next: "^16.0.0" },
  });
  let called = false;
  await initProject(root, {
    dryRun: true,
    installer: () => {
      called = true;
    },
    log() {},
  });
  assert.equal(called, false);
  assert.deepEqual(await readdir(root), ["package.json"]);
});
test("init creates matching owned instructions and preserves AGENTS.md", async (t) => {
  const root = await fixture(t);
  await writeFile(join(root, "AGENTS.md"), "My project rules");
  const output = [];
  await initProject(root, { installer() {}, log(message) { output.push(message); } });
  assert.ok(output.some((message) => message.includes("<FloodRoot>")));
  assert.equal(
    JSON.parse(await readFile(join(root, "flood.json"))).version,
    VERSION,
  );
  assert.equal(
    await readFile(join(root, "AGENTS.md"), "utf8"),
    "My project rules",
  );
  assert.match(
    await readFile(join(root, "flood/DESIGN.md"), "utf8"),
    /Next.js/,
  );
  assert.ok((await readFile(join(root, "flood/DESIGN.md"), "utf8")).split(/\r?\n/, 1)[0].includes(VERSION));
  await assert.rejects(
    initProject(root, {
      installer() {
        assert.fail("must not install");
      },
    }),
    /already exists/,
  );
});
test("existing agent files fail before npm runs", async (t) => {
  const root = await fixture(t);
  await mkdir(join(root, ".agents/skills/flood-ui"), { recursive: true });
  await writeFile(join(root, ".agents/skills/flood-ui/SKILL.md"), "custom");
  await assert.rejects(
    initProject(root, {
      installer() {
        assert.fail("must not install");
      },
      log() {},
    }),
    /already exists/,
  );
  assert.equal(
    await readFile(join(root, ".agents/skills/flood-ui/SKILL.md"), "utf8"),
    "custom",
  );
});
test("failed install writes no Flood configuration", async (t) => {
  const root = await fixture(t);
  await assert.rejects(
    initProject(root, {
      installer() {
        throw new Error("offline");
      },
      log() {},
    }),
    /offline/,
  );
  assert.deepEqual(await readdir(root), ["package.json"]);
});
test("unsupported projects are rejected", async (t) => {
  const root = await fixture(t, { dependencies: { vue: "3" } });
  await assert.rejects(
    initProject(root, {
      installer() {
        assert.fail();
      },
      log() {},
    }),
    /React was not found/,
  );
});
test("linked instruction directories are rejected", async (t) => {
  const root = await fixture(t);
  const outside = await mkdtemp(join(tmpdir(), "flood-outside-"));
  t.after(() => rm(outside, { recursive: true, force: true }));
  await symlink(
    outside,
    join(root, "flood"),
    process.platform === "win32" ? "junction" : "dir",
  );
  await assert.rejects(
    initProject(root, {
      installer() {
        assert.fail();
      },
      log() {},
    }),
    /linked path/,
  );
  assert.deepEqual(await readdir(outside), []);
});

test("init provisions the entire manifest bundle and doctor notices missing references", async (t) => {
  const root = await fixture(t);
  await initProject(root, { installer() {}, log() {} });
  for (const file of AGENT_FILES) {
    const source = new URL(`../packages/agent/${file.source}`, import.meta.url);
    assert.equal(await readFile(join(root, file.target), "utf8"), await readFile(source, "utf8"));
  }
  for (const name of ["tokens", "react", "agent"]) {
    const directory = join(root, "node_modules", "@flood-md", name);
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, "package.json"), JSON.stringify({ version: VERSION }));
  }
  await doctor(root, () => {});
  const reference = AGENT_FILES.find(file => file.kind === "reference");
  await rm(join(root, reference.target));
  await assert.rejects(doctor(root, () => {}), error => error.message.includes(reference.target));
});

test("an existing focused reference blocks installation before npm and preserves content", async (t) => {
  const root = await fixture(t);
  const file = AGENT_FILES.find(file => file.kind === "reference");
  await mkdir(join(root, file.target, ".."), { recursive: true });
  await writeFile(join(root, file.target), "Host-specific instructions");
  await assert.rejects(initProject(root, { installer() { assert.fail("must not install"); }, log() {} }), /already exists/);
  assert.equal(await readFile(join(root, file.target), "utf8"), "Host-specific instructions");
  await assert.rejects(readFile(join(root, "flood.json")), { code: "ENOENT" });
});

test("a linked skill reference directory is never followed", async (t) => {
  const root = await fixture(t);
  const outside = await mkdtemp(join(tmpdir(), "flood-ref-outside-"));
  t.after(() => rm(outside, { recursive: true, force: true }));
  await mkdir(join(root, ".agents/skills/flood-ui"), { recursive: true });
  await symlink(outside, join(root, ".agents/skills/flood-ui/references"), process.platform === "win32" ? "junction" : "dir");
  await assert.rejects(initProject(root, { installer() { assert.fail("must not install"); }, log() {} }), /linked path/);
  assert.deepEqual(await readdir(outside), []);
});

test("doctor rejects a linked guide directory without reading its files", async (t) => {
  const root = await fixture(t);
  const outside = await mkdtemp(join(tmpdir(), "flood-doctor-outside-"));
  t.after(() => rm(outside, { recursive: true, force: true }));
  await initProject(root, { installer() {}, log() {} });
  const path = join(root, ".agents/skills/flood-ui/references");
  await rm(path, { recursive: true });
  await symlink(outside, path, process.platform === "win32" ? "junction" : "dir");
  await assert.rejects(doctor(root, () => {}), /linked path/);
});

test("doctor catches stale guide versions without overwriting customized text", async (t) => {
  const root = await fixture(t);
  await initProject(root, { installer() {}, log() {} });
  for (const name of ["tokens", "react", "agent"]) {
    const directory = join(root, "node_modules", "@flood-md", name);
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, "package.json"), JSON.stringify({ version: VERSION }));
  }
  const manifestPath = join(root, "flood/manifest.json");
  const original = await readFile(manifestPath, "utf8");
  await writeFile(manifestPath, JSON.stringify({ ...JSON.parse(original), version: "0.0.0" }));
  await assert.rejects(doctor(root, () => {}), /manifest version differs/);
  await writeFile(manifestPath, original);
  const designPath = join(root, "flood/DESIGN.md");
  const lines = (await readFile(designPath, "utf8")).split("\n");
  lines[0] = "# Flood design system \u00b7 0.0.0";
  const customized = lines.join("\n") + "\nHost-specific instructions remain mine.\n";
  await writeFile(designPath, customized);
  await assert.rejects(doctor(root, () => {}), /DESIGN.md version differs/);
  assert.equal(await readFile(designPath, "utf8"), customized);
});
