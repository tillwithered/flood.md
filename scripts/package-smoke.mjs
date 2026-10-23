import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { initProject, doctor } from "../packages/cli/lib/index.mjs";

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run through npm run test:packages.");
function npm(args, cwd = process.cwd()) {
  const result = spawnSync(process.execPath, [npmCli, ...args], {
    cwd,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return result.stdout;
}
await mkdir(".artifacts", { recursive: true });
const archives = [];
for (const name of ["tokens", "react", "agent", "cli"]) {
  const [packed] = JSON.parse(
    npm([
      "pack",
      `./packages/${name}`,
      "--pack-destination",
      ".artifacts",
      "--json",
    ]),
  );
  assert.ok(packed.files.some((file) => file.path === "LICENSE"));
  archives.push(resolve(".artifacts", packed.filename));
}
const root = await mkdtemp(join(tmpdir(), "flood-consumer-"));
try {
  await writeFile(
    join(root, "package.json"),
    JSON.stringify({
      name: "clean-flood-consumer",
      private: true,
      type: "module",
      dependencies: { react: "19.3.1", "react-dom": "19.3.1" },
    }),
  );
  await initProject(root, {
    installer: () =>
      npm(
        ["install", "--ignore-scripts", "--no-audit", "--no-fund", ...archives],
        root,
      ),
  });
  await doctor(root);
  await writeFile(
    join(root, "check.mjs"),
    `import {createElement} from 'react'; import {renderToStaticMarkup} from 'react-dom/server'; import {Button} from '@flood-md/react'; import {tokenNames} from '@flood-md/tokens/foundations'; import {readFileSync} from 'node:fs'; if(!renderToStaticMarkup(createElement(Button,null,'Ready')).includes('Ready')) throw Error('render failed'); const css=readFileSync(new URL(import.meta.resolve('@flood-md/react/styles.css')),'utf8'); if(!css.includes('@flood-md/tokens/tokens.css')) throw Error('missing token import'); if(tokenNames['sys.color.content.default']!=='--flood-sys-color-content-default') throw Error('foundation import failed'); for(const name of ['foundations.css','foundations.manifest.json','neutral.dark.tokens.json']) readFileSync(new URL(import.meta.resolve('@flood-md/tokens/'+name)));`,
  );
  const result = spawnSync(process.execPath, ["check.mjs"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  await writeFile(
    join(root, "foundation-types.mts"),
    `import { tokenNames, type TokenName } from '@flood-md/tokens/foundations';
const name: TokenName = 'sys.color.content.default';
const css: '--flood-sys-color-content-default' = tokenNames[name];
// @ts-expect-error Unknown roles must be rejected rather than widened to string.
const typo: TokenName = 'sys.color.content.defalt';
void css; void typo;
`,
  );
  const types = spawnSync(
    process.execPath,
    [
      resolve("node_modules/typescript/bin/tsc"),
      join(root, "foundation-types.mts"),
      "--noEmit",
      "--strict",
      "--skipLibCheck",
      "--module",
      "NodeNext",
      "--moduleResolution",
      "NodeNext",
      "--types",
      "node",
      "--typeRoots",
      resolve("node_modules/@types"),
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(types.status, 0, types.stdout || types.stderr);
  const cli = spawnSync(
    process.execPath,
    [join(root, "node_modules/@flood-md/cli/bin/flood.mjs"), "doctor"],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(cli.status, 0, cli.stderr);
  await readFile(join(root, "node_modules/@flood-md/react/dist/index.d.ts"));
  console.log(
    "Clean consumer: all four npm tarballs installed; published component renders; installed CLI doctor passes.",
  );
} finally {
  await rm(root, { recursive: true, force: true });
}
