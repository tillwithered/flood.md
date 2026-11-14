import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { pagePaths, siteOrigin } from "./routes.mjs";
import { visitorRequest } from './visitors.mjs';
import { createFloodMcpHandler } from "./dist-server/mcp.mjs";

const root = fileURLToPath(new URL("./dist", import.meta.url));
const floodMcp = createFloodMcpHandler({ root: join(root, "agent"), siteOrigin });
const openAiChallenge = process.env.OPENAI_APPS_CHALLENGE;
const documentPolicy = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
].join("; ");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".zip": "application/zip",
};
const server = createServer(async (request, response) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  if (process.env.NODE_ENV === "production") {
    response.setHeader("Strict-Transport-Security", "max-age=31536000");
  }
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    if (pathname === "/health") {
      response.writeHead(200, { "Content-Type": "text/plain" });
      response.end("ok");
      return;
    }
    if (pathname === '/api/visitors') { await visitorRequest(request,response,siteOrigin); return; }
    if (pathname === "/mcp") { await floodMcp(request, response); return; }
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end();
      return;
    }
    if (pathname === "/.well-known/openai-apps-challenge" && openAiChallenge) {
      response.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      });
      response.end(request.method === "GET" ? openAiChallenge : undefined);
      return;
    }
    const normalized = pathname === "/index.html" ? "/" : pathname.replace(/\/index\.html$|\/$/, "") || "/";
    if (normalized !== pathname && pagePaths.has(normalized)) {
      response.writeHead(301, { Location: normalized + new URL(request.url, "http://localhost").search });
      response.end();
      return;
    }
    const file = resolve(
      root,
      `.${pagePaths.has(pathname) ? pathname === "/" ? "/index.html" : `${pathname}/index.html` : pathname}`,
    );
    if (!file.startsWith(root + sep)) {
      response.writeHead(403);
      response.end();
      return;
    }
    if (!(await stat(file)).isFile()) throw new Error("missing");
    const extension = extname(file);
    const pluginDownload = pathname === "/flood-plugin.zip";
    response.writeHead(200, {
      "Content-Type": types[extension] ?? "application/octet-stream",
      ...(extension === ".html" ? {
        "Content-Security-Policy": documentPolicy,
        "X-Frame-Options": "DENY",
      } : {}),
      ...(pluginDownload ? {
        "Content-Disposition": 'attachment; filename="flood-plugin.zip"',
        "CDN-Cache-Control": "no-store",
      } : {}),
      ...(pathname.startsWith("/playground") ? { "X-Robots-Tag": "noindex, follow" } : {}),
      ...(pathname.endsWith(".md") && pagePaths.has(pathname.slice(0, -3)) ? {
        "X-Robots-Tag": "noindex, follow",
        Link: `<${siteOrigin}${pathname.slice(0, -3)}>; rel="canonical"`,
      } : {}),
      "Cache-Control": pathname.startsWith("/assets/")
        ? "public, max-age=31536000, immutable"
        : pluginDownload ? "private, no-store" : "no-cache",
    });
    response.end(request.method === "HEAD" ? undefined : await readFile(file));
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain" });
    response.end("Not found");
  }
});
server.requestTimeout = 5000;
server.headersTimeout = 5000;
server.listen(Number(process.env.PORT ?? 4173), "0.0.0.0", () =>
  console.log(`Flood website listening on ${server.address().port}`),
);
