import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { strFromU8, unzipSync } from "fflate";

const read = path => readFile(new URL(path, import.meta.url));
const json = async path => JSON.parse(await read(path));

test("the MCP Registry manifest and plugin describe the same public remote", async () => {
  const registry = await json("../server.json");
  const plugin = await json("../plugins/flood/mcp.json");
  const { flood } = plugin.mcpServers;
  assert.deepEqual(registry.remotes, [{ type: flood.type, url: flood.url }]);
  assert.deepEqual(Object.keys(flood).sort(), ["type", "url"]);
  assert.equal(registry.packages, undefined);
  assert.equal(registry.repository.url, "https://github.com/tillwithered/flood.md");
});

test("the distributable ZIP shares the Skills.sh source and includes the OpenAI review cases", async () => {
  const archive = unzipSync(await read("../apps/website/dist/flood-plugin.zip"));
  const parse = name => JSON.parse(strFromU8(archive[name]));
  assert.deepEqual(parse("plugin.json"), await json("../plugins/flood/plugin.json"));
  assert.deepEqual(parse("mcp.json"), await json("../plugins/flood/mcp.json"));
  const { interface: listing, review, publication } = parse("plugin.json").extensions["com.openai"];
  for (const asset of [listing.logo, listing.composerIcon]) {
    assert.ok(archive[asset.replace(/^\.\//, "")]?.byteLength);
  }
  const skill = (await read("../skills/flood-catalog/SKILL.md")).toString();
  assert.equal(strFromU8(archive["skills/flood-catalog/SKILL.md"]), skill);
  assert.equal(review.test_cases.positive.length, 5);
  assert.equal(review.test_cases.negative.length, 3);
  const tools = new Set(["flood_info", "search_flood", "read_flood"]);
  for (const example of review.test_cases.positive) {
    assert.ok(example.description && example.prompt && example.expected_behavior);
    assert.ok(example.tools_triggered.split(", ").every(name => tools.has(name)));
  }
  for (const example of review.test_cases.negative) {
    assert.ok(example.description && example.prompt && example.expected_behavior);
  }
  assert.ok(publication.release_notes);
});
