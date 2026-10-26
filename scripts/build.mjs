import { readFile, writeFile, mkdir, copyFile, cp } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname } from "node:path";
import { compileTokens } from "./token-compiler.mjs";

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
const componentStyles = await Promise.all(["foundations", "content-elements", "navigation-layout", "form-controls", "feedback-actions", "editable", "tag-input"].map(name => readFile(`packages/react/src/${name}.css`, "utf8")));
await writeFile("packages/react/dist/foundations.css", componentStyles.join("\n"));
await cp("packages/react/src/fonts", "packages/react/dist/fonts", { recursive: true });
for (const name of ["tokens", "react", "agent", "cli"])
  await copyFile("LICENSE", `packages/${name}/LICENSE`);
await mkdir("apps/website/public/schema", { recursive: true });
await mkdir("apps/website/public/agent", { recursive: true });
await cp("schema", "apps/website/public/schema", { recursive: true });
const agentManifest = JSON.parse(await readFile("packages/agent/manifest.json", "utf8"));
for (const { source } of agentManifest.files) {
  const destination = `apps/website/public/agent/${source}`;
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(`packages/agent/${source}`, destination);
}
const release = JSON.parse(
  await readFile("apps/website/src/release.json", "utf8"),
);
const guide = await readFile("docs/llms.txt", "utf8");
await writeFile(
  "apps/website/public/llms.txt",
  `${release.published ? "Release status: published." : "Release status: PREVIEW. Source release candidate; do not run the installation command until npm publication is verified."}\n\n${guide}`,
);
console.log("Built Flood packages and agent endpoints.");
await import("./build-website-content.mjs");
