import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { createKnowledgeReader } from "../../packages/agent/lib/index.mjs";
import { version } from "./src/release.json" with { type: "json" };
import { pagePaths } from "./routes.mjs";

const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const bodyLimit = 32 * 1024;
const userErrors = new Set(["INVALID_QUERY", "INVALID_CURSOR", "STALE_CURSOR", "UNKNOWN_MATERIAL"]);

function publicMaterial(material, siteOrigin) {
  const [kind, slug] = material.id.split(":");
  const path = { component: `/components/${slug}`, guide: `/docs/${slug}`, recipe: `/docs/recipes/${slug}` }[kind];
  return { ...material, ...(pagePaths.has(path) ? { url: siteOrigin + path } : {}) };
}

function toolResult(run) {
  return async input => {
    try {
      const result = { ...await run(input), source: "website" };
      return { structuredContent: result, content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      const message = userErrors.has(error.code) ? error.message : "The Flood catalog is temporarily unavailable.";
      return { isError: true, content: [{ type: "text", text: message }] };
    }
  };
}

function configureServer(reader, siteOrigin) {
  const server = new McpServer({ name: "flood", version, websiteUrl: siteOrigin }, {
    instructions: "Browse public Flood components, design rules and skills. For existing projects, use their installed Flood version and host instructions as the authority for APIs and local customizations.",
  });
  server.registerTool("flood_info", {
    title: "Flood catalog version",
    description: "Report the version, scope and coverage of the public Flood catalog.",
    annotations,
  }, toolResult(async () => ({ ...await reader.info(), docs: siteOrigin + "/docs/mcp" })));
  server.registerTool("search_flood", {
    title: "Search Flood",
    description: "Find public Flood components, recipes, tokens and agent guidance by name or topic. Results include material IDs for read_flood.",
    annotations,
    inputSchema: {
      search: z.string().max(160).optional(),
      kind: z.enum(["guide", "workflow", "reference", "component", "recipe", "token"]).optional(),
      group: z.string().max(80).optional(),
      limit: z.number().int().min(1).max(20).optional(),
      cursor: z.string().max(1024).optional().describe("Pass nextCursor with the same search and filters."),
    },
  }, toolResult(async input => {
    const result = await reader.list(input);
    return { ...result, items: result.items.map(item => publicMaterial(item, siteOrigin)) };
  }));
  server.registerTool("read_flood", {
    title: "Read Flood material",
    description: "Read one public material by ID. Continue with nextOffset if the result is truncated. Required prerequisites are listed separately from related materials.",
    annotations,
    inputSchema: {
      id: z.string().max(160).regex(/^[a-z][a-z0-9-]*:[a-z0-9][a-z0-9.-]*$/),
      offset: z.number().int().nonnegative().optional(),
      length: z.number().int().min(1).max(12000).optional(),
      linksOffset: z.number().int().nonnegative().optional(),
    },
  }, toolResult(async ({ id, ...options }) => publicMaterial(await reader.read(id, options), siteOrigin)));
  return server;
}

function httpError(response, status, code, message) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code, message } }));
}

async function readBody(request) {
  if (Number(request.headers["content-length"]) > bodyLimit) return;
  const chunks = [];
  let bytes = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    bytes += chunk.length;
    if (bytes > bodyLimit) return;
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export function createFloodMcpHandler({ root, siteOrigin }) {
  const reader = createKnowledgeReader({ root });
  const allowedOrigins = new Set([siteOrigin, "https://chatgpt.com", "https://platform.openai.com"]);
  return async (request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    const { origin } = request.headers;
    if (origin && !allowedOrigins.has(origin)) return httpError(response, 403, -32000, "Origin not allowed.");
    if (request.method !== "POST") {
      response.setHeader("Allow", "POST");
      return httpError(response, 405, -32000, "Use POST for this stateless MCP server.");
    }
    if (request.headers["content-type"]?.split(";")[0].trim().toLowerCase() !== "application/json") {
      return httpError(response, 415, -32600, "Send application/json.");
    }

    let payload;
    try {
      const body = await readBody(request);
      if (body === undefined) {
        response.setHeader("Connection", "close");
        return httpError(response, 413, -32600, "Request exceeds 32 KiB.");
      }
      payload = JSON.parse(body);
    } catch {
      if (!response.destroyed) httpError(response, 400, -32700, "Invalid JSON.");
      return;
    }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return httpError(response, 400, -32600, "Send a single JSON-RPC message.");
    }

    const server = configureServer(reader, siteOrigin);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    try {
      await server.connect(transport);
      await transport.handleRequest(request, response, payload);
    } catch {
      if (!response.headersSent && !response.destroyed) httpError(response, 500, -32603, "MCP request failed.");
      else response.destroy();
    } finally {
      await server.close();
    }
  };
}
