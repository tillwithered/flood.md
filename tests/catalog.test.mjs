import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { catalogMarkdown } from "../apps/website/component-docs.mjs";

test("catalog Markdown partitions every available component exactly once in declared group order", async () => {
  const pages = JSON.parse(await readFile(new URL("../apps/website/src/component-catalog.json", import.meta.url)));
  const groups = JSON.parse(await readFile(new URL("../apps/website/src/component-groups.json", import.meta.url)));
  const markdown = catalogMarkdown(pages);
  assert.equal(new Set(pages.map(page => page.slug)).size, pages.length);
  let previous = -1;
  for (const group of groups) {
    const position = markdown.indexOf(`## ${group.label}\n`);
    assert.ok(position > previous);
    previous = position;
  }
  for (const page of pages) assert.equal(markdown.split(`https://flood.md/components/${page.slug})`).length - 1, 1);
  assert.throws(() => catalogMarkdown([...pages, { group: "unknown" }]), /Unknown catalog group/);
});
