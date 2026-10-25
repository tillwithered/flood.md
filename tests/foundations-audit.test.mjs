import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { compileTokens } from "../scripts/token-compiler.mjs";

const source = JSON.parse(await readFile("packages/tokens/src/tokens.json", "utf8"));
const compiled = compileTokens(source, "foundation-audit");

test("resolved diagnostic groups do not traverse inherited Object properties", () => {
  const input = structuredClone(source);
  const sample = structuredClone(input.sets.shared.ref.stroke.width["2"]);
  input.sets.shared.ref.constructor = { prototype: { auditpollution: sample } };
  assert.equal(Object.hasOwn(Object.prototype, "auditpollution"), false);
  try {
    const output = compileTokens(input, "prototype-regression");
    const definitions = output.contexts[0].definitions.ref;
    assert.equal(Object.hasOwn(definitions, "constructor"), true);
    assert.deepEqual(definitions.constructor.prototype.auditpollution.$value, sample.$value);
    assert.equal(Object.hasOwn(Object.prototype, "auditpollution"), false);
    assert.equal(({}).auditpollution, undefined);
    assert.ok(JSON.stringify(definitions).includes('"auditpollution"'));
  } finally {
    // Keep other tests isolated if this regression is ever reintroduced.
    delete Object.prototype.auditpollution;
  }
});

async function filesWithin(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? filesWithin(join(directory, entry.name))
    : join(directory, entry.name)))).flat();
}

test("React foundation recipes reference existing public semantic roles", async () => {
  const publicNames = new Set(Object.values(compiled.tokenNames));
  const files = (await filesWithin("packages/react/src")).filter(file => /\.(?:css|tsx?)$/.test(file));
  const unknown = [];
  let references = 0;
  for (const file of files) {
    const contents = await readFile(file, "utf8");
    for (const match of contents.matchAll(/var\((--flood-sys-[a-z0-9-]+)(?=[\s,)])/g)) {
      references++;
      if (!publicNames.has(match[1])) unknown.push(`${file}: ${match[1]}`);
    }
  }
  assert.ok(references > 100, "audit must inspect actual component token consumers");
  assert.deepEqual([...new Set(unknown)], []);
});

test("structural geometry uses independent relative layout roles", () => {
  const roles = new Map(compiled.manifest.contexts[0].tokens.map(token => [token.id, token]));
  for (const [id, reference, value] of [
    ["sys.size.container.sm", "ref.layout.container.sm", 40],
    ["sys.size.container.md", "ref.layout.container.md", 64],
    ["sys.size.container.lg", "ref.layout.container.lg", 80],
    ["sys.size.grid.min-item", "ref.layout.grid.min-item", 16],
  ]) {
    const token = roles.get(id);
    assert.deepEqual(token.value, { value, unit: "rem" });
    assert.equal(token.alias, reference);
    assert.equal(token.since, "0.2.4");
    assert.equal(token.status, "experimental");
    assert.ok(token.usage.avoid.some(usage => /breakpoints/.test(usage)));
  }
});

test("bundled Inter and its retained license match recorded upstream assets", async () => {
  const provenance = await readFile("packages/react/src/fonts/README.md", "utf8");
  for (const [file, label] of [["InterVariable.woff2", "SHA-256"], ["InterVariable-Italic.woff2", "Italic SHA-256"], ["LICENSE.txt", "License SHA-256"]]) {
    const hash = createHash("sha256").update(await readFile(`packages/react/src/fonts/${file}`)).digest("hex");
    const expected = provenance.match(new RegExp(`- ${label}: \\x60([a-f0-9]{64})\\x60`))?.[1];
    assert.ok(expected, `${file} needs recorded provenance`);
    assert.equal(hash, expected, `${file} changed without updating its provenance`);
  }
  assert.match(provenance, /SIL Open Font License 1\.1/);
});
