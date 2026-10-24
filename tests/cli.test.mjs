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
import { initProject, VERSION } from "../packages/cli/lib/index.mjs";

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
