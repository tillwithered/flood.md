import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "vite";
import { pagePaths, indexablePaths, siteOrigin, pageMetadata } from "../apps/website/routes.mjs";

const workspace = fileURLToPath(new URL("../", import.meta.url));
const website = join(workspace, "apps/website");
const dist = join(website, "dist");
const serverOutput = join(workspace, ".artifacts/website-prerender");
await build({
  root: website,
  build: { ssr: "src/entry-server.tsx", outDir: serverOutput, emptyOutDir: true },
});
const { render } = await import(pathToFileURL(join(serverOutput, "entry-server.js")).href);
const template = await readFile(join(dist, "index.html"), "utf8");
const manifest = JSON.parse(await readFile(join(dist, ".vite/manifest.json"), "utf8"));
const escape = value => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
for (const path of pagePaths) {
  const metadata = pageMetadata(path);
  const html = metadata.indexable ? await render(path) : "";
  if (metadata.indexable && (!html.includes("<h1") || html.includes("Loading documentation…"))) throw new Error(`Incomplete prerender: ${path}`);
  const readerStyles = path.startsWith("/docs") || path.startsWith("/components")
    ? (manifest["src/documentation.tsx"]?.css ?? []).map(file => `    <link rel="stylesheet" href="/${escape(file)}" />`).join("\n") : "";
  const head = `${readerStyles}
    <link rel="canonical" href="${escape(metadata.canonical)}" />
    <meta name="robots" content="${metadata.indexable ? "index, follow" : "noindex, follow"}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="flood.md" />
    <meta property="og:title" content="${escape(metadata.title)}" />
    <meta property="og:description" content="${escape(metadata.description)}" />
    <meta property="og:url" content="${escape(metadata.canonical)}" />
    <meta property="og:image" content="${siteOrigin}/flood-mark.png" />
    <meta property="og:image:alt" content="Flood mark" />
    <meta name="twitter:card" content="summary" />`;
  const document = template
    .replace(/<title>[^<]*<\/title>/, `<title>${escape(metadata.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${escape(metadata.description)}" />`)
    .replace("</head>", `${head}\n  </head>`)
    .replace('<div id="root"></div>', () => `<div id="root">${html}</div>`);
  const destination = join(dist, path === "/" ? "index.html" : `${path.slice(1)}/index.html`);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, document);
}
await writeFile(join(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexablePaths.map(path => `  <url><loc>${siteOrigin}${path}</loc></url>`).join("\n")}\n</urlset>\n`);
// Let crawlers read noindex on verification pages instead of blocking the crawl.
await writeFile(join(dist, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap.xml\n`);
console.log(`Prerendered ${indexablePaths.length} public pages with metadata, sitemap and robots.txt.`);
