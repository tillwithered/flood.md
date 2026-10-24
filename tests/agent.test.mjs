import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { AGENT_FILES } from "../packages/cli/lib/index.mjs";

test("the agent bundle resolves every skill reference and rule guide", async () => {
  const root = new URL("../packages/agent/", import.meta.url);
  const skill = await readFile(new URL("SKILL.md", root), "utf8");
  const referenced = [...skill.matchAll(/\]\((references\/[^)#]+)\)/g)].map(match => match[1]);
  assert.ok(referenced.length > 0);
  for (const path of referenced) {
    assert.ok(AGENT_FILES.some(file => file.source === path), `Unshipped skill reference ${path}`);
    assert.ok((await stat(new URL(path, root))).isFile());
  }
  const rules = JSON.parse(await readFile(new URL("rules.json", root), "utf8"));
  assert.equal(rules.schemaVersion, 1);
  assert.equal(new Set(rules.rules.map(rule => rule.id)).size, rules.rules.length);
  for (const rule of rules.rules) {
    for (const property of ["id", "when", "sourceOfTruth", "guide"]) assert.equal(typeof rule[property], "string");
    for (const property of ["for", "requires", "verify"]) assert.ok(rule[property].length > 0);
    assert.ok(AGENT_FILES.some(file => file.source === rule.guide), `Unshipped rule guide ${rule.guide}`);
  }
  const manifest = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
  for (const file of AGENT_FILES) {
    assert.ok((await stat(new URL(file.source, root))).isFile());
    assert.ok(manifest.files.includes(file.source) || manifest.files.includes(file.source.split("/")[0]));
  }
});


test("source rule links resolve to concrete installed paths through the versioned manifest", async () => {
  const root = new URL("../packages/agent/", import.meta.url);
  const manifest = JSON.parse(await readFile(new URL("manifest.json", root), "utf8"));
  const packageInfo = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
  assert.equal(manifest.version, packageInfo.version);
  assert.equal(manifest.files.find(file => file.source === manifest.entry).target, manifest.installedEntry);
  const rules = JSON.parse(await readFile(new URL("rules.json", root), "utf8"));
  for (const rule of rules.rules) assert.match(manifest.files.find(file => file.source === rule.guide).target, /^\.agents\/skills\/flood-ui\/references\//);
});
