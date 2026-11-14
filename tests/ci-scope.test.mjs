import test from "node:test";
import assert from "node:assert/strict";
import { isIntegrationChange, isPublicationGateChange } from "../scripts/ci-scope.mjs";

test("integration scope covers only known MCP, guide and plugin inputs", () => {
  const files = ["apps/website/mcp.mjs", "docs/mcp.md", "plugins/flood/plugin.json"];
  assert.equal(isIntegrationChange(files), true);
  assert.equal(isIntegrationChange(["docs/mcp.md"]), true);
  assert.equal(isIntegrationChange([]), false);
  for (const shared of ["package-lock.json", "apps/website/server.mjs", "apps/website/routes.mjs",
    "packages/react/src/styles.css", "docs/agents.md", "plugins/flood/unknown.mjs", ".github/workflows/ci.yml"]) {
    assert.equal(isIntegrationChange([...files, shared]), false, shared);
  }
});

test("only a publication switch at the same version can use website CI", () => {
  const path = "apps/website/src/release.json";
  const before = { version: "0.2.5", published: false };
  const after = { version: "0.2.5", published: true };
  assert.equal(isPublicationGateChange([path], before, after), true);
  assert.equal(isPublicationGateChange([path], after, before), true);
  for (const files of [[], [path, "packages/react/src/index.tsx"], [path, "package-lock.json"], ["apps/website/src/main.tsx"]]) assert.equal(isPublicationGateChange(files, before, after), false);
  for (const invalid of [{...after,version:"0.2.6"}, {...after,published:"true"}, {...after,unexpected:true}, before, null]) assert.equal(isPublicationGateChange([path],before,invalid),false);
});
