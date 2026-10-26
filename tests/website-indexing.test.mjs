import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { pagePaths, indexablePaths, pageMetadata } from "../apps/website/routes.mjs";

let server, origin;
before(async () => {
  server = spawn(process.execPath, ["apps/website/server.mjs"], { env: { ...process.env, PORT: "0" }, stdio: ["ignore", "pipe", "pipe"] });
  origin = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Website did not start")), 10_000);
    server.once("error", reject);
    server.once("exit", () => reject(new Error("Website exited before readiness")));
    server.stdout.on("data", chunk => {
      const match = /listening on (\d+)/.exec(String(chunk));
      if (match) { clearTimeout(timeout); resolve(`http://127.0.0.1:${match[1]}`); }
    });
  });
});
after(async () => {
  if (server?.exitCode === null) await new Promise(resolve => { server.once("exit", resolve); server.kill(); });
});
const get = (path, options) => fetch(origin + path, options);

test("every indexable URL ships distinct metadata, readable content and reader styles before JavaScript", async () => {
  const titles = new Set();
  for (const path of indexablePaths) {
    const response = await get(path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    const metadata = pageMetadata(path);
    assert.ok(html.includes(`<title>${metadata.title}</title>`), path);
    assert.equal(titles.has(metadata.title), false, path);
    titles.add(metadata.title);
    assert.ok(html.includes(`<link rel="canonical" href="https://flood.md${path}"`), path);
    assert.ok(html.includes('<meta name="robots" content="index, follow"'), path);
    assert.ok(html.includes(`<meta property="og:url" content="https://flood.md${path}"`), path);
    assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1, path);
    assert.doesNotMatch(html, /Loading documentation|id="S:0"|<!--\$\?-->/, path);
    if (path !== "/") assert.match(html, /<link rel="stylesheet" href="\/assets\/documentation-[^"]+\.css"/, path);
    if (path.startsWith("/components/")) assert.match(html, /API reference/, path);
  }
});

test("sitemap lists only public canonical HTML routes and robots advertises it", async () => {
  const response = await get("/sitemap.xml");
  assert.match(response.headers.get("content-type"), /application\/xml/);
  const sitemap = await response.text();
  assert.deepEqual([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]), indexablePaths.map(path => "https://flood.md" + path));
  assert.doesNotMatch(sitemap, /playground|\.md<|lastmod/);
  const robots = await get("/robots.txt");
  assert.match(robots.headers.get("content-type"), /text\/plain/);
  assert.match(await robots.text(), /Sitemap: https:\/\/flood.md\/sitemap.xml/);
});

test("verification pages and Markdown duplicates remain readable with indexing instructions", async () => {
  for (const path of pagePaths) {
    if (!path.startsWith("/playground")) continue;
    const response = await get(path);
    assert.equal(response.headers.get("x-robots-tag"), "noindex, follow");
    assert.match(await response.text(), /<meta name="robots" content="noindex, follow"/);
  }
  const markdown = await get("/components/button.md");
  assert.equal(markdown.status, 200);
  assert.match(await markdown.text(), /^# Button/);
  assert.equal(markdown.headers.get("link"), '<https://flood.md/components/button>; rel="canonical"');
  assert.equal(markdown.headers.get("x-robots-tag"), "noindex, follow");
});

test("alternate HTML paths redirect, HEAD is empty and missing pages stay 404", async () => {
  for (const [path, target] of [["/index.html", "/"], ["/docs/", "/docs"], ["/components/button/index.html?from=test", "/components/button?from=test"]]) {
    const response = await get(path, { redirect: "manual" });
    assert.equal(response.status, 301);
    assert.equal(response.headers.get("location"), target);
  }
  const head = await get("/components/button", { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  for (const path of ["/missing", "/components/missing", "/docs/missing/", "/docs/missing.md"]) assert.equal((await get(path)).status, 404);
});
