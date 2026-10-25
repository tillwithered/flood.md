import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { pagePaths, siteOrigin } from "./routes.mjs";

const root = fileURLToPath(new URL("./dist", import.meta.url));
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
};
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    if (pathname === "/health") {
      response.writeHead(200, { "Content-Type": "text/plain" });
      response.end("ok");
      return;
    }
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end();
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
    response.writeHead(200, {
      "Content-Type": types[extname(file)] ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      ...(pathname.startsWith("/playground") ? { "X-Robots-Tag": "noindex, follow" } : {}),
      ...(pathname.endsWith(".md") && pagePaths.has(pathname.slice(0, -3)) ? {
        "X-Robots-Tag": "noindex, follow",
        Link: `<${siteOrigin}${pathname.slice(0, -3)}>; rel="canonical"`,
      } : {}),
      "Cache-Control": pathname.startsWith("/assets/")
        ? "public, max-age=31536000, immutable"
        : "no-cache",
    });
    response.end(request.method === "HEAD" ? undefined : await readFile(file));
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain" });
    response.end("Not found");
  }
});
server.listen(Number(process.env.PORT ?? 4173), "0.0.0.0", () =>
  console.log(`Flood website listening on ${server.address().port}`),
);
