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
  if (name === "react") {
    for (const path of ["dist/foundations.css", "dist/fonts/InterVariable.woff2", "dist/fonts/LICENSE.txt"])
      assert.ok(packed.files.some((file) => file.path === path), `Missing ${path}`);
  }
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
      devDependencies: { "@types/react": "19.3.0", "@types/react-dom": "19.3.0" },
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
import { createElement, createRef, type ComponentPropsWithRef } from 'react';
import { ScrollArea, type ScrollAreaProps, Select, type SelectProps, type HeadingProps, type TextProps, type InputProps, type IconButtonProps, type CodeSnippetProps } from '@flood-md/react';
const heading: HeadingProps = {level: 3, size: 'large'};
const display: HeadingProps = {level: 1, size: 'display'};
const lead: TextProps = {as: 'p', size: 'lead'};
const snippet: CodeSnippetProps = {code: 'npm install example', id: 'command'};
// @ts-expect-error CodeSnippet requires literal code content.
const badSnippet: CodeSnippetProps = {id: 'missing-code'};
const input: InputProps = {size: 30, controlSize: 'xl', status: 'warning', readOnly: true};
// @ts-expect-error Field status has a closed semantic vocabulary.
const badStatus: InputProps = {status: 'orange'};
const select: SelectProps = {size: 4, multiple: true, defaultValue: ['team'], controlSize: 'xl', invalid: true};
const scroll: ScrollAreaProps = {orientation: 'both', contentInset: 'scrollbar', style: {maxHeight: '12rem'}, 'aria-label': 'History'};
const scrollRef = createRef<HTMLDivElement>();
const scrollElement = createElement(ScrollArea, {...scroll, ref: scrollRef});
// @ts-expect-error Only the documented scroll axes are supported.
const badScroll: ScrollAreaProps = {orientation: 'diagonal'};
const scrollRole: TokenName = 'sys.scrollbar.size';
const selectRef = createRef<HTMLSelectElement>();
const referencedSelect: ComponentPropsWithRef<typeof Select> = {ref: selectRef, name: 'visibility'};
const selectElement = createElement(Select, {...referencedSelect, onChange: event => { const options: HTMLOptionsCollection = event.currentTarget.options; void options; }});
// @ts-expect-error Visual control size cannot replace native select list size.
const badSelect: SelectProps = {size: 'xl'};
const icon: IconButtonProps = {label: 'Add item', size: '2xl'};
// @ts-expect-error Visual size must not replace the native input size attribute.
const badInput: InputProps = {size: 'xl'};
// @ts-expect-error Icon-only actions require a name.
const badIcon: IconButtonProps = {size: 'md'};
// @ts-expect-error Unknown roles must be rejected rather than widened to string.
const typo: TokenName = 'sys.color.content.defalt';
void css; void typo;
void heading; void display; void lead; void snippet; void badSnippet; void input; void icon; void badInput; void badIcon;
void select; void referencedSelect; void selectElement; void badSelect;
void scroll; void scrollElement; void badScroll; void scrollRole;
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
  await writeFile(join(root, "react-compat.mjs"), `
import {createElement as h} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {FloodRoot, Heading, Field, Input, Select, ScrollArea, IconButton} from '@flood-md/react';
const html=renderToStaticMarkup(h(FloodRoot,null,
  h(Heading,{level:1},'Ready'),
  h(ScrollArea,{'aria-label':'History',style:{maxHeight:'12rem'}},'Local activity'),
  h(Field,{label:'Name',required:true},p=>h(Input,{...p,name:'name'})),
  h(Field,{label:'Visibility',required:true},p=>h(Select,{...p,name:'visibility',defaultValue:'team'},h('option',{value:'private'},'Private'),h('option',{value:'team'},'Team'))),
  h(IconButton,{label:'Add'},'+')));
if(!html.includes('data-flood-theme="dark"')||!html.includes('required=""')||!html.includes('aria-label="Add"')||!html.includes('flood-scroll-area__viewport')||!html.includes('<select')||!html.includes('selected=""')) throw Error('React compatibility render');
`);
  for (const reactVersion of ["19.3.1", "18.3.1"]) {
    if (reactVersion === "18.3.1")
      npm(["install", "--ignore-scripts", "--no-audit", "--no-fund", `react@${reactVersion}`, `react-dom@${reactVersion}`], root);
    const compatibility = spawnSync(process.execPath, ["react-compat.mjs"], { cwd: root, encoding: "utf8" });
    assert.equal(compatibility.status, 0, compatibility.stderr);
  }
  console.log(
    "Clean consumer: four tarballs, font/license, typed props, CLI doctor and React 18/19 foundation SSR pass.",
  );
} finally {
  await rm(root, { recursive: true, force: true });
}
