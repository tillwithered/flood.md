import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { docPages, componentSlugs, pageMetadata, pagePaths } from "../apps/website/routes.mjs";
import { componentMarkdown, catalogMarkdown } from "../apps/website/component-docs.mjs";
import { allDocPages, siteOrigin } from "../apps/website/site-guides.mjs";
import { isPublicSite } from "../apps/website/site-scope.mjs";
import { loadComponentContractInputs, readComponentContract, readRecipeSlugs } from "./component-contract.mjs";
import { readAgentWorkflows } from './agent-workflows.mjs';
import { readWebsiteDocument } from './website-documents.mjs';

const catalog = JSON.parse(await readFile("apps/website/src/component-catalog.json", "utf8"));
const componentInputs = await loadComponentContractInputs("packages/react/src/index.tsx");
const contract = readComponentContract(componentInputs.source, componentInputs.modules);
const recipes = readRecipeSlugs(await readFile("apps/website/src/component-workbench.tsx", "utf8"));
const release = JSON.parse(await readFile("apps/website/src/release.json", "utf8"));
const highlights = JSON.parse(await readFile("apps/website/src/release-highlights.json", "utf8"));
for (const [version, items] of Object.entries(highlights)) {
  if (!/^\d+\.\d+\.\d+$/.test(version) || !Array.isArray(items) || items.length > 3 ||
      items.some(slug => !catalog.some(component => component.slug === slug)) || new Set(items).size !== items.length) {
    throw new Error(`Invalid website search highlights for ${version}`);
  }
}
const same = (left, right) => JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
if (!same(contract.map(item => item.name), catalog.map(item => item.name))) throw new Error("Every public component needs catalog content; stale or undocumented exports block the build");
if (!same(recipes, catalog.map(page => page.slug))) throw new Error("Component catalog and live recipes differ");
export const componentContracts = catalog.map(page => {
  if (!Array.isArray(page.notes) || !page.notes.length || page.notes.some(note => typeof note !== "string" || !note.trim())) {
    throw new Error(`${page.slug}: add usable design notes to the component catalog`);
  }
  const api = contract.find(item => item.name === page.name);
  const rows = api.props.filter(prop => prop.name !== "className" && prop.name !== "style").map(prop => [
    prop.name + (prop.since ? ` · ${prop.since}` : ""), prop.type,
    prop.defaultValue ?? (prop.required ? "Required" : "—"),
  ]);
  if (api.nativeProps.length) rows.push(["Native HTML props", api.nativeProps.join("; "), "Forwarded"]);
  return { ...page, api: rows, contract: api };
});
const pages = componentContracts.filter(page => componentSlugs.includes(page.slug));

export function siteMarkdown(content, path) {
  if (!isPublicSite) return content;
  return content.replace(/(?<!!)\[([^\]\n]+)\]\(([^)\s]+)\)/g, (link, label, target) => {
    const url = URL.parse(target, siteOrigin + path);
    if (!url) return link;
    const destination = url.pathname.replace(/\.md$/, "");
    const inCatalog = /^\/(?:components\/|docs\/recipes\/|playground(?:\/|$))/.test(destination);
    return url.origin === siteOrigin && inCatalog && !pagePaths.has(destination) ? label : link;
  });
}

const root = "apps/website/public";
await mkdir(`${root}/docs`, { recursive: true });
await mkdir(`${root}/components`, { recursive: true });
const documents = {};
export const agentDocuments = [];
const workflowIndex=await readAgentWorkflows();
for (const doc of allDocPages) {
  const content = await readWebsiteDocument(doc.file, {workflows: workflowIndex});
  for (const pin of content.matchAll(/@flood-md\/(?:tokens|react|agent|cli)@(\d+\.\d+\.\d+)/g)) {
    if (pin[1] !== release.version) throw new Error(`${doc.file}: stale install version ${pin[1]} (release ${release.version})`);
  }
  if (!doc.websiteOnly) agentDocuments.push({ ...doc, content });
  const destination = `${root}${doc.path}.md`;
  if (!docPages.includes(doc)) {
    await rm(destination, { force: true });
    continue;
  }
  documents[doc.file] = siteMarkdown(content, doc.path);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, documents[doc.file]);
}
await writeFile(`${root}/components.md`, catalogMarkdown(pages));
for (const page of componentContracts) {
  const path = `/components/${page.slug}`;
  if (pagePaths.has(path)) await writeFile(`${root}${path}.md`, siteMarkdown(componentMarkdown(page), path));
  else await rm(`${root}${path}.md`, { force: true });
}
await mkdir("apps/website/src/generated", { recursive: true });
await writeFile("apps/website/src/generated/content.json", JSON.stringify({ version: release.version, docs: documents, components: pages }, null, 2) + "\n");
await writeFile("apps/website/src/generated/component-summaries.json", JSON.stringify(
  pages.map(({ slug, name, group, description }) => ({ slug, name, group, description })),
) + "\n");
await writeFile("apps/website/src/generated/routes.json", JSON.stringify(
  Object.fromEntries([...pagePaths].map(path => [path, pageMetadata(path)])),
) + "\n");
console.log(`Built ${pages.length} component pages and API contracts for ${release.version} from source.`);
