import assert from "node:assert/strict";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import selection from "../apps/website/src/public-catalog.json" with { type: "json" };

const componentPath = slug => `/components/${slug}`;
const recipePath = slug => `/docs/recipes/${slug}`;
const orderedPaths = paths => [...new Set(paths)].sort();
const htmlLinks = html => [...html.matchAll(/\bhref="([^"]+)"/g)].map(match => match[1]);
const markdownLinks = markdown => [...markdown.matchAll(/\]\(([^)\s]+)\)/g)].map(match => match[1]);
const sitemapLinks = xml => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);

function assertInventory(actual, expected, message) {
  if (actual.length === expected.length && actual.every((entry, index) => entry === expected[index])) return;
  const absent = expected.filter(entry => !actual.includes(entry)).slice(0, 6);
  const unexpected = actual.filter(entry => !expected.includes(entry)).slice(0, 6);
  assert.fail(`${message}. Expected ${expected.length}, got ${actual.length}. Missing: ${absent.join(", ") || "none"}. Unexpected: ${unexpected.join(", ") || "none"}.`);
}

function scopedPaths(links, pattern, origin) {
  return orderedPaths(links
    .filter(link => /^(?:\/(?!\/)|https?:\/\/)/.test(link))
    .map(link => new URL(link, origin).pathname)
    .filter(path => pattern.test(path)));
}

export async function verifyPublicCatalog(base) {
  const origin = new URL(base);
  assert.ok(["https:", "http:"].includes(origin.protocol) && !origin.username && !origin.password, "A plain HTTP(S) origin is required");
  const componentLinks = orderedPaths([...selection.components, ...selection.charts].map(componentPath));
  const chartLinks = orderedPaths(selection.charts.map(componentPath));
  const recipeLinks = orderedPaths(selection.recipes.map(recipePath));
  const componentPattern = /^\/components\/[a-z0-9-]+$/;
  const recipePattern = /^\/docs\/recipes\/[a-z0-9-]+$/;

  const load = async (path, options) => fetch(new URL(path, origin), {
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(10000),
    ...options,
  });
  const read = async (path, type) => {
    const response = await load(path);
    assert.equal(response.status, 200, path);
    assert.ok(response.headers.get("content-type")?.includes(type), `${path} must serve ${type}`);
    return response.text();
  };

  const [directory, charts, recipes, markdownIndex, sitemap, catalogText] = await Promise.all([
    read("/components", "text/html"),
    read("/components/category/charts", "text/html"),
    read("/recipes", "text/html"),
    read("/components.md", "text/markdown"),
    read("/sitemap.xml", "application/xml"),
    read("/agent/dist/catalog.json", "application/json"),
  ]);

  assertInventory(scopedPaths(htmlLinks(directory), componentPattern, origin), componentLinks, "Component directory must match the public selection");
  assertInventory(scopedPaths(htmlLinks(charts), componentPattern, origin), chartLinks, "Charts directory must match the public chart selection");
  assertInventory(scopedPaths(htmlLinks(recipes), recipePattern, origin), recipeLinks, "Recipe directory must match the starter recipes");
  assertInventory(scopedPaths(markdownLinks(markdownIndex), componentPattern, origin), componentLinks, "Markdown index must match the public selection");
  const indexedLinks = sitemapLinks(sitemap);
  assertInventory(scopedPaths(indexedLinks, componentPattern, origin), componentLinks, "Sitemap must include exactly the public components");
  assertInventory(scopedPaths(indexedLinks, recipePattern, origin), recipeLinks, "Sitemap must include exactly the starter recipes");
  assert.ok(scopedPaths(indexedLinks, /^\/components\/category\/charts$/, origin).length, "Charts must have an indexable route");
  assert.deepEqual(scopedPaths(indexedLinks, /^\/playground(?:\/|$)/, origin), [], "Previews must stay out of the sitemap");

  const catalog = JSON.parse(catalogText);
  const componentIds = componentLinks.map(path => `component:${path.split("/").at(-1)}`);
  const recipeIds = recipeLinks.map(path => `recipe:${path.split("/").at(-1)}`);
  const materialIds = kind => catalog.materials.filter(material => material.kind === kind).map(material => material.id).sort();
  assertInventory(materialIds("component"), componentIds, "Agent catalog must expose exactly the public components");
  assertInventory(materialIds("recipe"), recipeIds, "Agent catalog must expose exactly the starter recipes");
  const knownIds = new Set(catalog.materials.map(material => material.id));
  for (const material of catalog.materials) {
    for (const id of [...material.links, ...material.requires]) {
      assert.ok(knownIds.has(id), `${material.id} references an unpublished material: ${id}`);
    }
  }

  for (const [path, name] of [[componentPath("app-shell"), "AppShell"], [componentPath("code-block"), "CodeBlock"], [componentPath("line-chart"), "LineChart"], [recipePath("navigation-workspace"), "Navigation workspace"]]) {
    const [html, markdown] = await Promise.all([read(path, "text/html"), read(`${path}.md`, "text/markdown")]);
    assert.ok(html.includes(name), `${path} must prerender its title`);
    assert.ok(markdown.startsWith(`# ${name}`), `${path}.md must have its own content`);
  }
  for (const path of ["/playground/navigation", "/playground/settings", "/playground/table-bulk-actions"]) {
    const response = await load(path);
    assert.equal(response.status, 200, `${path} must continue to serve its runnable example`);
    assert.match(response.headers.get("x-robots-tag") ?? "", /\bnoindex\b/, `${path} must stay unindexed`);
    await response.body?.cancel();
  }

  const hiddenRoutes = [
    "/playground",
    "/playground/content",
    "/playground/charts",
    "/playground/product-variants",
    componentPath("payment-method-picker"),
    componentPath("trace-waterfall"),
    recipePath("product-variants"),
  ];
  const missingPaths = [
    ...hiddenRoutes,
    ...hiddenRoutes.filter(path => !path.startsWith("/playground")).map(path => `${path}.md`),
    `${componentPath("payment-method-picker")}/index.html`,
    "/agent/dist/materials/component-payment-method-picker.md",
    "/agent/dist/materials/component-trace-waterfall.md",
    "/agent/dist/materials/recipe-product-variants.md",
  ];
  await Promise.all(missingPaths.map(async path => {
    const response = await load(path);
    assert.equal(response.status, 404, `${path} must not be publicly accessible`);
    await response.body?.cancel();
  }));

  const rpc = async (method, params, protocol) => {
    const response = await load("/mcp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        ...(protocol ? { "mcp-protocol-version": protocol } : {}),
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    assert.equal(response.status, 200, `MCP ${method}`);
    const body = await response.json();
    assert.ok(body.result && !body.error, `MCP ${method} returned a protocol error`);
    return body.result;
  };
  const session = await rpc("initialize", { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "flood-public-catalog-check", version: "1.0.0" } });
  assert.ok(session.protocolVersion, "MCP protocol version");
  const call = (name, args) => rpc("tools/call", { name, arguments: args }, session.protocolVersion);
  const data = async (name, args) => {
    const result = await call(name, args);
    assert.ok(result.structuredContent && !result.isError, `MCP ${name} returned a tool error`);
    return result.structuredContent;
  };

  const info = await data("flood_info", {});
  assert.equal(info.version, catalog.version, "MCP serves the projected agent catalog version");
  assert.equal(info.materialCount, catalog.materials.length, "MCP serves the projected agent catalog material count");
  for (const [kind, expected] of [["component", componentIds], ["recipe", recipeIds]]) {
    const ids = [];
    let cursor;
    do {
      const page = await data("search_flood", { kind, limit: 20, ...(cursor ? { cursor } : {}) });
      assert.equal(page.total, expected.length, `MCP browse total for ${kind}`);
      ids.push(...page.items.map(item => item.id));
      cursor = page.nextCursor;
      assert.ok(!cursor || (page.items.length && ids.length < expected.length), `MCP ${kind} cursor must advance`);
    } while (cursor);
    assertInventory(ids.sort(), expected, `MCP browse must expose exactly the public ${kind} IDs`);
  }
  for (const [id, path, name] of [["component:app-shell", componentPath("app-shell"), "AppShell"], ["component:code-block", componentPath("code-block"), "CodeBlock"], ["recipe:navigation-workspace", recipePath("navigation-workspace"), "Navigation workspace"]]) {
    const result = await data("search_flood", { search: id, limit: 1 });
    assert.equal(result.items[0]?.id, id, `MCP exact search for ${id}`);
    assert.equal(new URL(result.items[0].url).pathname, path, `${id} must link to the public page`);
    const body = await data("read_flood", { id, length: 100 });
    assert.ok(body.text.startsWith(`# ${name}`), `MCP must return the contract for ${id}`);
  }
  for (const id of ["component:payment-method-picker", "component:trace-waterfall", "recipe:product-variants"]) {
    const [kind] = id.split(":");
    const result = await data("search_flood", { search: id, kind, limit: 1 });
    assert.equal(result.total, 0, `MCP must omit ${id}`);
    const body = await call("read_flood", { id, length: 100 });
    assert.equal(body.isError, true, `MCP must reject direct reads of ${id}`);
    assert.equal(body.structuredContent, undefined, `MCP must not return material for ${id}`);
  }

  return { components: componentLinks.length, charts: chartLinks.length, recipes: recipeLinks.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await verifyPublicCatalog(process.argv[2] ?? process.env.WEBSITE_URL ?? "http://127.0.0.1:4173");
  console.log(`Verified ${result.components} public components, including ${result.charts} charts, and ${result.recipes} recipes across the website and MCP.`);
}
