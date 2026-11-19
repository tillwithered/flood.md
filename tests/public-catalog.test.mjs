import test from "node:test";
import assert from "node:assert/strict";
import catalog from "../apps/website/src/component-catalog.json" with { type: "json" };
import publicCatalog from "../apps/website/src/public-catalog.json" with { type: "json" };
import { createKnowledgeReader } from "../packages/agent/lib/index.mjs";

test("the public catalog selects existing components in their intended sections", () => {
  const inventory = new Map(catalog.map(component => [component.slug, component]));
  const selected = [...publicCatalog.components, ...publicCatalog.charts];
  assert.equal(new Set(selected).size, selected.length, "Each component belongs to one public section");
  for (const slug of publicCatalog.components) {
    assert.ok(inventory.has(slug), `Unknown public component: ${slug}`);
    assert.notEqual(inventory.get(slug).group, "charts", `Chart listed as a component: ${slug}`);
  }
  for (const slug of publicCatalog.charts) {
    assert.equal(inventory.get(slug)?.group, "charts", `Unknown chart: ${slug}`);
  }
  for (const slug of ["app-shell", "code-block", "data-table", "combobox"]) {
    assert.ok(publicCatalog.components.includes(slug), `Public baseline lost ${slug}`);
  }
  for (const slug of ["payment-method-picker", "database-webhook-form", "trace-waterfall"]) {
    assert.ok(!selected.includes(slug), `Specialized component leaked into public selection: ${slug}`);
  }
});

test("public starter recipes have no dependencies on components outside the public catalog", async () => {
  const reader = createKnowledgeReader();
  const componentIds = new Set([...publicCatalog.components, ...publicCatalog.charts].map(slug => `component:${slug}`));
  const recipeIds = new Set(publicCatalog.recipes.map(slug => `recipe:${slug}`));
  assert.equal(recipeIds.size, publicCatalog.recipes.length, "Each recipe appears once");
  for (const id of recipeIds) {
    const { links, requires } = await reader.read(id, { length: 1 });
    for (const dependency of [...links, ...requires]) {
      if (dependency.startsWith("component:")) assert.ok(componentIds.has(dependency), `${id} references ${dependency}`);
      if (dependency.startsWith("recipe:")) assert.ok(recipeIds.has(dependency), `${id} references ${dependency}`);
    }
  }
});
