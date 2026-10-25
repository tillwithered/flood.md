import test from "node:test";
import assert from "node:assert/strict";
import { isPublicationGateChange } from "../scripts/ci-scope.mjs";

test("only a publication switch at the same version can use website CI", () => {
  const path = "apps/website/src/release.json";
  const before = { version: "0.2.5", published: false };
  const after = { version: "0.2.5", published: true };
  assert.equal(isPublicationGateChange([path], before, after), true);
  assert.equal(isPublicationGateChange([path], after, before), true);
  for (const files of [[], [path, "packages/react/src/index.tsx"], [path, "package-lock.json"], ["apps/website/src/main.tsx"]]) assert.equal(isPublicationGateChange(files, before, after), false);
  for (const invalid of [{...after,version:"0.2.6"}, {...after,published:"true"}, {...after,unexpected:true}, before, null]) assert.equal(isPublicationGateChange([path],before,invalid),false);
});
