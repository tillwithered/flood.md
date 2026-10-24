import { mkdir, readFile, writeFile } from "node:fs/promises";
import { docPages, componentSlugs } from "../apps/website/routes.mjs";
import { componentMarkdown, catalogMarkdown } from "../apps/website/component-docs.mjs";
import { readComponentContract, readRecipeSlugs } from "./component-contract.mjs";

const catalog = JSON.parse(await readFile("apps/website/src/component-catalog.json", "utf8"));
const contract = readComponentContract(await readFile("packages/react/src/index.tsx", "utf8"));
const recipes = readRecipeSlugs(await readFile("apps/website/src/component-workbench.tsx", "utf8"));
const release = JSON.parse(await readFile("apps/website/src/release.json", "utf8"));
const same = (left, right) => JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
if (!same(contract.map(item => item.name), catalog.map(item => item.name))) throw new Error("Every public component needs catalog content; stale or undocumented exports block the build");
if (!same(componentSlugs, catalog.map(page => page.slug)) || !same(recipes, componentSlugs)) throw new Error("Component routes, catalog and live recipes differ");
const pages = catalog.map(page => {
  const api = contract.find(item => item.name === page.name);
  const rows = api.props.filter(prop => prop.name !== "className" && prop.name !== "style").map(prop => [
    prop.name + (prop.since ? ` · ${prop.since}` : ""), prop.type,
    prop.defaultValue ?? (prop.required ? "Required" : "—"),
  ]);
  if (api.nativeProps.length) rows.push(["Native HTML props", api.nativeProps.join("; "), "Forwarded"]);
  return { ...page, api: rows, contract: api };
});
const root = "apps/website/public";
await mkdir(`${root}/docs`, { recursive: true });
await mkdir(`${root}/components`, { recursive: true });
const documents = {};
for (const doc of docPages) {
  const content = await readFile(`docs/${doc.file}`, "utf8");
  for (const pin of content.matchAll(/@flood-md\/(?:tokens|react|agent|cli)@(\d+\.\d+\.\d+)/g)) {
    if (pin[1] !== release.version) throw new Error(`${doc.file}: stale install version ${pin[1]} (release ${release.version})`);
  }
  documents[doc.file] = content;
  await writeFile(`${root}${doc.path}.md`, content);
}
await writeFile(`${root}/components.md`, catalogMarkdown(pages));
for (const page of pages) await writeFile(`${root}/components/${page.slug}.md`, componentMarkdown(page));
await mkdir("apps/website/src/generated", { recursive: true });
await writeFile("apps/website/src/generated/content.json", JSON.stringify({ version: release.version, docs: documents, components: pages }, null, 2) + "\n");
console.log(`Built ${pages.length} component pages and API contracts for ${release.version} from source.`);
