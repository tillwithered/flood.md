import test from "node:test";
import assert from "node:assert/strict";
import { createKnowledgeReader } from "../packages/agent/lib/index.mjs";
import { createFloodMcpHandler } from "../apps/website/dist-server/mcp.mjs";
import { createServer } from "node:http";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../apps/website/dist/agent/", import.meta.url));
const siteOrigin = "https://flood.md";

test("public MCP search finds recipes and components from tasks in English and Russian", async t => {
  const server = createServer(createFloodMcpHandler({ root, siteOrigin }));
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise(resolve => server.close(resolve)));

  async function search(args) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "search_flood", arguments: args } }),
    });
    assert.equal(response.status, 200);
    return (await response.json()).result;
  }

  const tasks = [
    ["table with filters and bulk actions", "таблица с фильтрами и массовыми действиями", "recipe:table-bulk-actions", ["component:data-table", "component:collection-toolbar", "component:bulk-action-bar"]],
    ["sidebar navigation with collapsible groups", "сайдбар с раскрывающимися группами", "recipe:navigation-workspace", ["component:sidebar", "component:navigation-group"]],
    ["line chart with comparison", "линейный график со сравнением", "component:line-chart", []],
  ];
  for (const [english, russian, first, supporting] of tasks) {
    for (const phrase of [english, russian]) {
      const { items } = (await search({ search: phrase, limit: 4 })).structuredContent;
      assert.equal(items[0]?.id, first, phrase);
      assert.ok(items[0]?.url?.startsWith(siteOrigin), phrase);
      for (const id of supporting) assert.ok(items.some(item => item.id === id), `${phrase}: ${id}`);
    }
  }
  const firstId = async phrase => (await search({ search: phrase })).structuredContent.items[0]?.id;
  assert.equal(await firstId("table"), "component:table");
  assert.equal(await firstId("scroll area"), "component:scroll-area");
  assert.equal(await firstId("CollectionToolbar"), "component:collection-toolbar");
  assert.equal(await firstId("component:LINE-CHART"), "component:line-chart");
  assert.equal(await firstId("Build a requests table with search filters and bulk actions"), "recipe:table-bulk-actions");
  assert.equal(await firstId("Нужна таблица заявок: фильтрация, выделение строк, массовое одобрение"), "recipe:table-bulk-actions");
  assert.equal(await firstId("Build a request latency dashboard with a comparison to last week, a latency distribution and a service filter. Use Flood."), "guide:charts");
  assert.equal(await firstId("Дашборд задержек запросов: сравнение, распределение, фильтр по сервисам"), "guide:charts");
  assert.equal((await search({ search: "component:missing-thing" })).structuredContent.total, 0);

  const browse = (await search({ limit: 4 })).structuredContent;
  const reader = createKnowledgeReader({ root });
  const local = await reader.list({ limit: 4 });
  assert.deepEqual(browse.items.map(item => item.id), local.items.map(item => item.id));
  assert.equal((await reader.list({ search: tasks[0][0] })).total, 0);

  const query = { search: "table with filters and bulk actions", kind: "component", group: "data-feedback" };
  const full = (await search(query)).structuredContent;
  const first = (await search({ ...query, limit: 1 })).structuredContent;
  const second = (await search({ ...query, limit: 1, cursor: first.nextCursor })).structuredContent;
  assert.deepEqual([first.items[0], second.items[0]], full.items.slice(0, 2));
  assert.ok(full.items.every(item => item.kind === query.kind && item.groups.includes(query.group)));
  assert.equal((await search({ ...query, search: "sidebar", cursor: first.nextCursor })).isError, true);
  assert.equal((await search({ ...query, cursor: "dm9pZA" })).isError, true);
  assert.equal((await search({ ...query, group: "unknown" })).isError, true);
});
