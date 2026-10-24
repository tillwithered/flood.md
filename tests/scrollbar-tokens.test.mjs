import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { compileTokens } from "../scripts/token-compiler.mjs";

test("overlay scrollbar geometry and colors use public semantic aliases", async () => {
  const source = JSON.parse(await readFile("packages/tokens/src/tokens.json", "utf8"));
  const compiled = compileTokens(source, "local-audit");
  const tokens = new Map(compiled.manifest.contexts[0].tokens.map((token) => [token.id, token]));
  for (const [name, value] of Object.entries({ size: .375, inset: .25, "min-thumb": 1.5 })) {
    assert.deepEqual(tokens.get(`sys.scrollbar.${name}`).value, { value, unit: "rem" });
    assert.equal(tokens.get(`sys.scrollbar.${name}`).alias, `ref.scrollbar.${name}`);
  }
  assert.equal(tokens.get("sys.color.scrollbar.thumb").alias, "ref.color.neutral.550");
  assert.equal(tokens.get("sys.color.scrollbar.thumb-hover").alias, "ref.color.neutral.320");
  assert.deepEqual(source.sets.theme.dark.sys.color.field.border.$value, "{ref.color.neutral.750}", "quiet field choice stays intact");
});
