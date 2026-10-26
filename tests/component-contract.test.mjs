import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { readComponentContract, readRecipeSlugs } from "../scripts/component-contract.mjs";

const source = await readFile("packages/react/src/index.tsx", "utf8");
const catalog = JSON.parse(await readFile("apps/website/src/component-catalog.json", "utf8"));
test("recipe coverage detects added, duplicate and unsupported preview cases", () => {
  const recipe = 'function recipeFor(slug) { switch(slug) { case "button": return 1; case "input": case "textarea": return 2; default: return null; } }';
  assert.deepEqual(readRecipeSlugs(recipe), ["button", "input", "textarea"]);
  assert.deepEqual(readRecipeSlugs(recipe.replace('default:', 'case "notice": return 3; default:')), ["button", "input", "textarea", "notice"]);
  assert.throws(() => readRecipeSlugs(recipe.replace('case "input"', 'case "button"')), /duplicate/i);
  assert.throws(() => readRecipeSlugs(recipe.replace('case "input"', 'case label')), /literal|dynamic|unsupported/i);
});
const byName = (contract, name) => contract.find((entry) => entry.name === name);
const prop = (contract, name, key) => byName(contract, name).props.find((entry) => entry.name === key);

test("real component contracts resolve aliases, native inheritance and explicit defaults", () => {
  const contract = readComponentContract(source);
  assert.deepEqual(contract.map(entry => entry.name).sort(), catalog.map(entry => entry.name).sort());
  assert.match(prop(contract, "Button", "size").type, /"2xs".*"2xl"/);
  assert.equal(prop(contract, "Button", "loading").defaultValue, "false");
  assert.equal(prop(contract, "Button", "type").defaultValue, '"button"');
  assert.equal(prop(contract, "IconButton", "variant").defaultValue, '"subtle"');
  assert.equal(prop(contract, "IconButton", "label").required, true);
  assert.equal(prop(contract, "Field", "children").required, true);
  assert.match(prop(contract, "Field", "children").type, /FieldControlProps/);
  assert.equal(prop(contract, "Field", "id").defaultValue, undefined);
  assert.deepEqual(byName(contract, "Field").nativeProps, []);
  assert.match(byName(contract, "Input").nativeProps[0], /InputHTMLAttributes<HTMLInputElement>/);
  assert.equal(prop(contract, "CodeSnippet", "code").required, true);
  assert.match(byName(contract, "Select").nativeProps[0], /SelectHTMLAttributes<HTMLSelectElement>/);
  assert.deepEqual(prop(contract, "Select", "controlSize").options, ["sm", "md", "lg", "xl"]);
});

test("new optional props and new runtime component exports are discovered without a catalog edit", () => {
  const expanded = source.replace(/(export interface ButtonProps[\s\S]*?)(loading\?: boolean;)/, '$1$2\n  emphasis?: "quiet" | "loud";') + `
/** @since 0.2.3 */
export interface NoticeProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  message: string;
  tone?: "info" | "warning";
}
export const Notice = forwardRef<HTMLDivElement, NoticeProps>(function Notice(
  {message, tone = "info", ...props}, ref
) { return <div {...props} ref={ref}>{message}</div>; });
`;
  const contract = readComponentContract(expanded);
  assert.equal(contract.length, readComponentContract(source).length + 1);
  assert.equal(prop(contract, "Button", "emphasis").required, false);
  assert.equal(prop(contract, "IconButton", "emphasis").required, false);
  assert.equal(prop(contract, "Notice", "tone").defaultValue, '"info"');
  assert.equal(prop(contract, "Notice", "message").required, true);
  assert.match(byName(contract, "Notice").nativeProps[0], /^Omit<HTMLAttributes/);
});

test("direct functions, utility inheritance and destructuring aliases keep their contracts", () => {
  const value = `import {forwardRef as ref, type HTMLAttributes} from "react";
type Size = "small" | "large";
interface Base { size?: Size; content: string; removable?: boolean; }
interface Props extends Omit<Base, "removable"> { /** @since 0.2.3 */ active?: boolean; }
/** @since 0.2.3 */
export function Sample({size = "large", content: title, active = true}: Props) {return <p>{title}</p>;}
export const Compact = ref<HTMLDivElement, Pick<Base, "size">>(function Compact({size = "small"}, ref) {return <div ref={ref}/>;});`;
  const contract = readComponentContract(value);
  assert.equal(byName(contract, "Sample").since, "0.2.3");
  assert.equal(prop(contract, "Sample", "size").type, '"small" | "large"');
  assert.equal(prop(contract, "Sample", "content").required, true);
  assert.equal(prop(contract, "Sample", "title"), undefined);
  assert.equal(prop(contract, "Sample", "removable"), undefined);
  assert.equal(prop(contract, "Sample", "active").defaultValue, "true");
  assert.equal(prop(contract, "Sample", "active").since, "0.2.3");
  assert.equal(prop(contract, "Compact", "size").defaultValue, '"small"');
});

test("unsupported source contracts fail rather than silently documenting incomplete APIs", () => {
  assert.throws(() => readComponentContract('export const Widget = factory();'), /unsupported runtime export Widget/);
  assert.throws(() => readComponentContract('export class Widget {}'), /unsupported runtime export Widget/);
  assert.throws(() => readComponentContract('export * from "elsewhere";'), /wildcard export/);
  assert.throws(() => readComponentContract('interface Props extends Missing {} export function Widget(props: Props){return <div/>;}'), /unresolved props type Missing/);
  assert.throws(() => readComponentContract('interface Props extends Props {} export function Widget(props: Props){return <div/>;}'), /cyclic props inheritance/);
});

test("literal options and defaults track additive API changes without evaluating expressions", () => {
  const changed = source.replace('"2xl";', '"2xl" | "3xl";').replace('size = "md",', 'size = "lg",');
  const contract = readComponentContract(changed);
  assert.deepEqual(prop(contract, "Button", "size").options, ["2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl"]);
  assert.equal(prop(contract, "Button", "size").defaultLiteral, "lg");
  assert.equal(prop(contract, "Button", "size").defaultValue, '"lg"');
  assert.equal(prop(contract, "Button", "loading").defaultLiteral, false);
  assert.equal(prop(contract, "Heading", "level").defaultLiteral, 2);
  assert.deepEqual(prop(contract, "Stack", "gap").options, ["0", "1", "2", "3", "4", "6", "8", "12"]);
  const custom = readComponentContract('type Choice = "auto" | 2 | false; type Options = Choice | true; interface Props {mode?: Options; label?: string;} export function Example({mode = false,label = computeLabel()}: Props){return <div/>;}');
  assert.deepEqual(prop(custom, "Example", "mode").options, ["auto", 2, false, true]);
  assert.equal(prop(custom, "Example", "mode").defaultLiteral, false);
  assert.equal(prop(custom, "Example", "label").defaultLiteral, undefined);
  assert.equal(prop(custom, "Example", "label").defaultValue, "computeLabel()");
  assert.equal(prop(custom, "Example", "label").options, undefined);
});
