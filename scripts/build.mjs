import { readFile, writeFile, mkdir, copyFile, cp, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, resolve, relative } from "node:path";
import { createHash } from "node:crypto";
import { compileTokens } from "./token-compiler.mjs";
import { buildAgentKnowledge } from './agent-knowledge.mjs';
import { isPublicMaterial, isPublicSite } from '../apps/website/site-scope.mjs';
import { validateKnowledgeCatalog } from '../packages/agent/lib/index.mjs';

const tokens = JSON.parse(
  await readFile("packages/tokens/src/tokens.json", "utf8"),
);
const { version } = JSON.parse(
  await readFile("packages/tokens/package.json", "utf8"),
);
const compiled = compileTokens(tokens, version);
await mkdir("packages/tokens/dist", { recursive: true });
await writeFile("packages/tokens/dist/tokens.css", compiled.legacy.css);
await writeFile(
  "packages/tokens/dist/tokens.json",
  JSON.stringify(compiled.legacy.json, null, 2) + "\n",
);
await writeFile("packages/tokens/dist/foundations.css", compiled.css);
await writeFile("packages/tokens/dist/foundations.js", compiled.js);
await writeFile("packages/tokens/dist/foundations.d.ts", compiled.dts);
await writeFile(
  "packages/tokens/dist/foundations.manifest.json",
  JSON.stringify(compiled.manifest, null, 2) + "\n",
);
for (const context of compiled.contexts) {
  await writeFile(
    `packages/tokens/dist/${context.preset}.${context.theme}.tokens.json`,
    JSON.stringify(context.definitions, null, 2) + "\n",
  );
}
const result = spawnSync(
  process.execPath,
  [
    "node_modules/typescript/bin/tsc",
    "-p",
    "packages/react/tsconfig.build.json",
  ],
  { stdio: "inherit" },
);
if (result.status !== 0) process.exit(result.status ?? 1);
await copyFile(
  "packages/react/src/styles.css",
  "packages/react/dist/styles.css",
);
const componentStyles = await Promise.all(["foundations", "content-elements", "link-preview", "approval-request", "environment-switcher", "citation", "project-update", "pipeline-run", "milestone-progress", "domain-verification", "delivery-attempts", "record-relations", "content-advisory", "navigation-layout", "form-controls", "quantity-fields", "find-bar", "media-transcript", "feedback-actions", "editable", "tag-input", "command-list", "date-field", "time-field", "carousel", "phone-input", "cascader", "token-input", "conversation", "comparison-charts", "calendar", "event-calendar", "questionnaire", "date-picker", "error-summary", "resizable-panels", "range-calendar", "date-range-field", "date-range-picker", "menu-extensions", "tree", "navigation-tree", "date-time-picker", "hover-card", "color-controls", "tree-select", "collection-cards", "reorder-list", "kanban-board", "data-table", "editable-grid", "data-table-expansion", "sparkline", "charts", "scatter-chart", "range-chart", "bullet-chart", "waterfall-chart", "histogram", "box-plot", "dumbbell-chart", "file-records", "time-picker", "date-time-range-picker", "action-collections", "surface-context", "filter-condition", "key-value-editor", "deadline-status", "relative-time-range-picker", "recurrence-editor", "json-inspector", "source-line", "code-diff", "stack-trace", "dependency-graph", "suggestion-textarea", "query-input", "log-viewer", "trace-waterfall", "collection-toolbar", "collection-view-switcher", "sidebar", "navigation-item", "navigation-group", "motion-interactions", "motion-layers", "motion-preference"].map(name => readFile(`packages/react/src/${name}.css`, "utf8")));
await writeFile("packages/react/dist/foundations.css", componentStyles.join("\n"));
await cp("packages/react/src/fonts", "packages/react/dist/fonts", { recursive: true });
for (const name of ["tokens", "react", "agent", "cli"])
  await copyFile("LICENSE", `packages/${name}/LICENSE`);
const websiteContent = await import("./build-website-content.mjs");
const knowledge = await buildAgentKnowledge(websiteContent);
await mkdir("apps/website/public/schema", { recursive: true });
const publicAgent = resolve('apps/website/public/agent');
if (relative(resolve('.'), publicAgent).replaceAll('\\','/') !== 'apps/website/public/agent') throw Error('Unexpected generated agent destination.');
await rm(publicAgent, {recursive:true, force:true});
await mkdir(publicAgent, { recursive: true });
await cp("schema", "apps/website/public/schema", { recursive: true });
const agentManifest = JSON.parse(await readFile("packages/agent/manifest.json", "utf8"));
for (const { source } of agentManifest.files) {
  const destination = `apps/website/public/agent/${source}`;
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(`packages/agent/${source}`, destination);
}
if (isPublicSite) {
  const scopedMaterials = knowledge.materials.filter(item => isPublicMaterial(item.id));
  const materials = await Promise.all(scopedMaterials.map(async item => {
    const projected = { ...item, links: item.links.filter(isPublicMaterial) };
    if (!item.file.startsWith('dist/materials/')) return projected;
    const [kind, slug] = item.id.split(':');
    const urlPath = { component: `/components/${slug}`, recipe: `/docs/recipes/${slug}`, guide: `/docs/${slug}` }[kind];
    const original = await readFile(`packages/agent/${item.file}`);
    const body = urlPath ? Buffer.from(websiteContent.siteMarkdown(original.toString('utf8'), urlPath)) : original;
    const destination = `apps/website/public/agent/${item.file}`;
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, body);
    return { ...projected, bytes: body.length, sha256: createHash('sha256').update(body).digest('hex') };
  }));
  const capabilities = knowledge.capabilities.map(item => ({ ...item, materials: item.materials.filter(isPublicMaterial) }))
    .filter(item => item.status !== 'available' || item.materials.length > 0);
  const catalog = { ...knowledge, materials, capabilities };
  validateKnowledgeCatalog(catalog);
  await writeFile('apps/website/public/agent/dist/catalog.json', JSON.stringify(catalog, null, 2) + '\n');
} else {
  await cp('packages/agent/dist', 'apps/website/public/agent/dist', {recursive:true});
}
await copyFile('packages/agent/package.json', 'apps/website/public/agent/package.json');
const release = JSON.parse(
  await readFile("apps/website/src/release.json", "utf8"),
);
const guide = await readFile("docs/llms.txt", "utf8");
await writeFile(
  "apps/website/public/llms.txt",
  `${release.published ? "Release status: published." : "Release status: PREVIEW. Source release candidate; do not run the installation command until npm publication is verified."}\n\n${guide}`,
);
console.log("Built Flood packages and agent endpoints.");
