import { Fragment, createElement, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Copy, Plus } from "lucide-react";
import * as Flood from "@flood-md/react";
import type { ComponentPage } from "./component-catalog";
import "./component-workbench.css";
import { importStatements } from "../project-imports.mjs";
import release from "./release.json";

type Values = Record<string, string | boolean>;
type Knob = { name: string; label?: string; options?: string[]; initial: string | boolean };
type Binding = { expression: string; value: unknown };
type ElementRecipe = { tag: string; props?: Record<string, unknown>; children?: Array<ElementRecipe | string | Binding>; field?: ElementRecipe };
const element = (tag: string, props: Record<string, unknown> = {}, ...children: Array<ElementRecipe | string | Binding>): ElementRecipe => ({ tag, props, children });
const binding = (expression: string, value: unknown): Binding => ({ expression, value });
const sizes = ["2xs", "xs", "sm", "md", "lg", "xl", "2xl"];
const spaces = ["0", "1", "2", "3", "4", "6", "8", "12"];
const variants = ["solid", "subtle", "outline", "ghost"];
const select = (name: string, options: string[], initial: string): Knob => ({ name, options, initial });
const toggle = (name: string, initial = false): Knob => ({ name, initial });
const knobs: Record<string, Knob[]> = {
  button: [select("variant", variants, "solid"), select("size", sizes, "md"), toggle("disabled"), toggle("loading")],
  "icon-button": [select("variant", variants, "subtle"), select("size", sizes, "md"), toggle("disabled"), toggle("loading")],
  input: [select("controlSize", ["sm", "md", "lg", "xl"], "md"), toggle("invalid"), toggle("disabled"), toggle("readOnly")],
  select: [select("controlSize", ["sm", "md", "lg", "xl"], "md"), toggle("invalid"), toggle("disabled")],
  textarea: [select("controlSize", ["sm", "md", "lg", "xl"], "md"), toggle("invalid"), toggle("disabled"), toggle("readOnly")],
  checkbox: [toggle("checked", true), toggle("disabled")],
  radio: [toggle("checked", true), toggle("disabled")],
  switch: [toggle("checked", true), toggle("disabled")],
  text: [select("size", ["lead", "body", "compact", "label", "helper"], "body"), select("tone", ["default", "subtle", "error", "success", "warning", "info"], "default")],
  heading: [select("size", ["display", "large", "page", "section"], "page"), select("level", ["1", "2", "3", "4", "5", "6"], "2")],
  stack: [select("gap", spaces, "4")],
  inline: [select("gap", spaces, "4"), select("align", ["start", "center", "end", "baseline"], "center")],
  surface: [select("elevation", ["default", "raised", "overlay"], "default"), select("padding", spaces, "6")],
  "icon-slot": [select("size", sizes, "md"), { name: "label", initial: "" }],
  "code-snippet": [{ name: "code", initial: `npx @flood-md/cli@${release.version} init` }, toggle("copyAction", true)],
  field: [toggle("required", true), toggle("error", true), toggle("hint", true)],
  link: [], divider: [], "flood-root": [],
};
function componentKnobs(component: ComponentPage): Knob[] {
  return (knobs[component.slug] ?? []).map(knob => {
    const prop = component.contract?.props.find(item => item.name === knob.name);
    const options = knob.options && prop?.options?.length ? prop.options.map(String) : knob.options;
    const value = prop?.defaultLiteral;
    const initial = value === undefined ? knob.initial : typeof knob.initial === "boolean" ? (typeof value === "boolean" ? value : knob.initial) : String(value);
    return { ...knob, options, initial };
  });
}
const initialValues = (component: ComponentPage): Values => Object.fromEntries(componentKnobs(component).map(knob => [knob.name, knob.initial]));
const registry = { ...Flood, Plus, ArrowRight, Copy } as unknown as Record<string, Parameters<typeof createElement>[0]>;
const isBinding = (value: unknown): value is Binding => Boolean(value && typeof value === "object" && "expression" in value && "value" in value);

function renderRecipe(node: ElementRecipe, extraProps: Record<string, unknown> = {}): ReactNode {
  const props = Object.fromEntries(Object.entries(node.props ?? {}).map(([key, value]) => [key, isBinding(value) ? value.value : value]));
  const tag = registry[node.tag] ?? node.tag;
  if (node.field) return createElement(tag, props, ((control: Record<string, unknown>) => renderRecipe(node.field!, control)) as unknown as ReactNode);
  return createElement(tag, { ...extraProps, ...props }, ...(node.children ?? []).map((child, index) => typeof child === "string" ? child : isBinding(child) ? child.value as ReactNode : createElement(Fragment, { key: index }, renderRecipe(child))));
}

function printRecipe(node: ElementRecipe, imports: Set<string>, icons: Set<string>, depth = 0): string {
  if (node.tag in Flood) imports.add(node.tag);
  if (["Plus", "ArrowRight", "Copy"].includes(node.tag)) icons.add(node.tag);
  const pad = "  ".repeat(depth);
  const props = Object.entries(node.props ?? {}).filter(([key, value]) => value !== undefined && !(value === false && ["disabled", "loading", "invalid", "readOnly", "required"].includes(key))).map(([key, value]) => {
    if (isBinding(value)) return `${key}={${value.expression}}`;
    return typeof value === "string" && !/[\\"<>&\n\r]/.test(value) ? `${key}=${JSON.stringify(value)}` : `${key}={${JSON.stringify(value)}}`;
  }).join(" ");
  const open = `<${node.tag}${props ? ` ${props}` : ""}>`;
  if (node.field) {
    const child = printRecipe(node.field, imports, icons, depth + 2).trimStart().replace(`<${node.field.tag}`, `<${node.field.tag} {...control}`);
    return `${pad}${open}\n${pad}  {(control) => (\n${"  ".repeat(depth + 2)}${child}\n${pad}  )}\n${pad}</${node.tag}>`;
  }
  const children = node.children ?? [];
  if (!children.length) return `${pad}${open.slice(0, -1)} />`;
  const printText = (text: string) => /^[^<>{}&\n\r]+$/.test(text) && text.trim() === text ? text : `{${JSON.stringify(text)}}`;
  if (children.length === 1 && typeof children[0] === "string") return `${pad}${open}${printText(children[0])}</${node.tag}>`;
  return `${pad}${open}\n${children.map((child) => typeof child === "string" ? `${pad}  ${printText(child)}` : isBinding(child) ? `${pad}  {${child.expression}}` : printRecipe(child, imports, icons, depth + 1)).join("\n")}\n${pad}</${node.tag}>`;
}

interface PreviewActions {
  status: string;
  setStatus: (status: string) => void;
  checked: (value: boolean) => void;
  copy: () => void;
}

function recipeFor(slug: string, values: Values, actions: PreviewActions): ElementRecipe {
  const v = values;
  const text = (value: string) => element("Text", { as: "p", size: "compact" }, value);
  const status = element("Text", { as: "p", size: "compact", role: "status" }, binding("status", actions.status));
  const action = binding('() => setStatus("Action completed locally.")', () => actions.setStatus("Action completed locally."));
  const choice = {
    checked: binding("checked", Boolean(v.checked)), disabled: Boolean(v.disabled),
    onChange: binding("(event) => setChecked(event.currentTarget.checked)", (event: { currentTarget: { checked: boolean } }) => actions.checked(event.currentTarget.checked)),
  };
  switch (slug) {
    case "button": return element("Stack", { gap: "4" }, element("Inline", {}, element("Button", { variant: v.variant, size: v.size, disabled: v.disabled, loading: v.loading, onClick: action }, "Save changes")), status);
    case "icon-button": return element("Stack", { gap: "4" }, element("Inline", {}, element("IconButton", { label: "Add idea", variant: v.variant, size: v.size, disabled: v.disabled, loading: v.loading, onClick: action }, element("Plus"))), status);
    case "input": case "textarea": return { tag: "Field", props: { label: slug === "input" ? "Project name" : "Project note", hint: v.invalid ? undefined : "Changes stay in this preview.", error: v.invalid ? "Please review this value." : undefined }, field: element(slug === "input" ? "Input" : "Textarea", { controlSize: v.controlSize, invalid: v.invalid, disabled: v.disabled, readOnly: v.readOnly, defaultValue: slug === "input" ? "My project" : "A calm place for the next idea." }) };
    case "select": return { tag: "Field", props: { label: "Project visibility", hint: v.invalid ? undefined : "Choose who can discover this project.", error: v.invalid ? "Please choose a visibility." : undefined }, field: element("Select", { name: "visibility", controlSize: v.controlSize, invalid: v.invalid, disabled: v.disabled, defaultValue: "private" }, element("option", { value: "private" }, "Private"), element("option", { value: "team" }, "Team"), element("option", { value: "public" }, "Public")) };
    case "checkbox": return element("Checkbox", { ...choice, label: "Receive project updates", name: "updates" });
    case "switch": return element("Switch", { ...choice, label: "Email notifications", name: "notifications" });
    case "radio": return element("fieldset", { style: { margin: 0, padding: 0, border: 0 } }, element("legend", {}, "Project visibility"), element("Stack", { gap: "2" }, element("Radio", { label: "Private", name: "workbench-visibility", value: "private", disabled: v.disabled, checked: binding("checked", Boolean(v.checked)), onChange: binding("() => setChecked(true)", () => actions.checked(true)) }), element("Radio", { label: "Public", name: "workbench-visibility", value: "public", disabled: v.disabled, checked: binding("!checked", !v.checked), onChange: binding("() => setChecked(false)", () => actions.checked(false)) })));
    case "text": return element("Text", { as: "p", size: v.size, tone: v.tone }, "A calm foundation for your next idea.");
    case "heading": return element("Heading", { size: v.size, level: Number(v.level) }, "Room for ideas.");
    case "stack": return element("Stack", { gap: v.gap }, text("One shared foundation."), text("A clear rhythm between things."), element("Button", { variant: "subtle", onClick: action }, "Try an action"), status);
    case "inline": return element("Inline", { gap: v.gap, align: v.align }, element("Button", { onClick: action }, "Save changes"), element("Button", { variant: "subtle", onClick: binding('() => setStatus("Cancelled locally.")', () => actions.setStatus("Cancelled locally.")) }, "Cancel"), status);
    case "surface": return element("Surface", { elevation: v.elevation, padding: v.padding }, element("Stack", { gap: "2" }, element("Heading", { size: "section", level: 2 }, "Your workspace"), text("A surface gives related content a shared place.")));
    case "icon-slot": return element("IconSlot", { size: v.size, label: v.label || undefined }, element("ArrowRight"));
    case "code-snippet": return element("Stack", { gap: "3" }, element("CodeSnippet", { code: String(v.code), ...(v.copyAction ? { action: binding(`<Button variant="subtle" size="sm" onClick={copy}>Copy</Button>`, createElement(Flood.Button, { variant: "subtle", size: "sm", onClick: actions.copy }, "Copy")) } : {}) }), ...(v.copyAction ? [status] : []));
    case "field": return { tag: "Field", props: { label: "Project name", required: v.required, hint: v.hint ? "Visible to your team." : undefined, error: v.error ? "Enter a project name." : undefined }, field: element("Input", { name: "project", defaultValue: "" }) };
    case "divider": return element("Stack", { gap: "4" }, text("Workspace"), element("Divider"), text("Account"));
    case "flood-root": return element("Surface", { padding: "6" }, element("Stack", { gap: "2" }, element("Heading", { size: "section", level: 2 }, "Neutral. Dark. Local."), text("This composition uses FloodRoot without changing the document theme.")));
    case "link": return element("Link", { href: "/docs/installation" }, "Read the installation guide");
    default: return text("Choose a component to explore.");
  }
}

export function ComponentWorkbench({ component, onCodeChange, onImportsChange, importMode = "package" }: { component: ComponentPage; onCodeChange: (code: string) => void; onImportsChange?: (names: string[]) => void; importMode?: "package" | "project" }) {
  const id = useId();
  const [state, setState] = useState(() => ({ slug: component.slug, values: initialValues(component) }));
  const [status, setStatus] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const values = state.slug === component.slug ? state.values : initialValues(component);
  const change = (name: string, value: string | boolean) => { setState({ slug: component.slug, values: { ...values, [name]: value } }); setStatus(""); };
  const callback = useRef(onCodeChange);
  const importsCallback = useRef(onImportsChange);
  useEffect(() => { callback.current = onCodeChange; }, [onCodeChange]);
  useEffect(() => { importsCallback.current = onImportsChange; }, [onImportsChange]);
  useEffect(() => { setStatus(""); }, [component.slug]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(String(values.code)); setStatus("Copied command."); }
    catch { setStatus("Select the code and copy it manually."); }
  };
  const recipe = recipeFor(component.slug, values, { status, setStatus, checked: (checked) => change("checked", checked), copy });
  const imports = new Set<string>(["FloodRoot"]), icons = new Set<string>();
  const jsx = printRecipe(element("FloodRoot", {}, recipe), imports, icons, 2);
  if (component.slug === "code-snippet" && values.copyAction) imports.add("Button");
  let preamble = "";
  const usesChecked = ["checkbox", "radio", "switch"].includes(component.slug);
  const usesStatus = ["button", "icon-button", "stack", "inline"].includes(component.slug) || (component.slug === "code-snippet" && Boolean(values.copyAction));
  if (usesChecked) preamble += `  const [checked, setChecked] = useState(${JSON.stringify(Boolean(values.checked))});\n`;
  if (usesStatus) preamble += '  const [status, setStatus] = useState("");\n';
  if (component.slug === "code-snippet" && values.copyAction) preamble += `  async function copy() {\n    try {\n      await navigator.clipboard.writeText(${JSON.stringify(String(values.code))});\n      setStatus("Copied command.");\n    } catch {\n      setStatus("Select the code and copy it manually.");\n    }\n  }\n`;
  const stylesheet = importMode === "project" ? "@/ui/styles.css" : "@flood-md/react/styles.css";
  const code = '"use client";\n\n' + (usesChecked || usesStatus ? 'import { useState } from "react";\n' : "") + importStatements([...imports].sort(), importMode) + "\n" + (icons.size ? `import { ${[...icons].sort().join(", ")} } from "lucide-react";\n` : "") + `import "${stylesheet}";\n\nexport function Example() {\n` + preamble + `  return (\n${jsx}\n  );\n}\n`;
  useEffect(() => { callback.current(code); importsCallback.current?.([...imports].sort()); }, [code]);

  return <section className="component-workbench" aria-label={`${component.name} live playground`}>
    <div className="workbench-title"><div><span className="workbench-eyebrow">LIVE PLAYGROUND</span><p>Adjust the props. Copy the matching example.</p></div><Flood.Button variant="subtle" size="sm" onClick={() => { setState({ slug: component.slug, values: initialValues(component) }); setStatus(""); setResetKey((key) => key + 1); }}>Reset</Flood.Button></div>
    <div className="workbench-stage preview-stage" ref={stage} key={component.slug + resetKey}><Flood.FloodRoot>{renderRecipe(recipe)}</Flood.FloodRoot></div>
    <div className="workbench-controls" aria-label={`${component.name} API controls`}>
      {componentKnobs(component).map((knob) => typeof knob.initial === "boolean" ?
        <div className="workbench-control workbench-control--toggle" key={knob.name}>
          <Flood.Checkbox id={`${id}-${knob.name}`} label={knob.label ?? knob.name} aria-label={`${component.name} prop ${knob.name}`} checked={Boolean(values[knob.name])} onChange={(event) => change(knob.name, event.currentTarget.checked)} />
        </div> :
        <label className="workbench-control" htmlFor={`${id}-${knob.name}`} key={knob.name}>
          <span>{knob.label ?? knob.name}</span>
          {knob.options ? <Flood.Select controlSize="sm" id={`${id}-${knob.name}`} aria-label={`${component.name} prop ${knob.name}`} value={String(values[knob.name])} onChange={(event) => change(knob.name, event.currentTarget.value)}>{knob.options.map((option) => <option value={option} key={option}>{option}</option>)}</Flood.Select> : <Flood.Input controlSize="sm" id={`${id}-${knob.name}`} aria-label={`${component.name} prop ${knob.name}`} type="text" value={String(values[knob.name])} placeholder={knob.name === "label" ? "Decorative without a label" : undefined} onChange={(event) => change(knob.name, event.currentTarget.value)} />}
        </label>)}
      {!componentKnobs(component).length && <p className="workbench-explanation">{component.slug === "divider" ? "A native separator. Spacing belongs to its parent layout." : component.slug === "flood-root" ? "The neutral dark scope has no theme switch. Native div attributes remain available." : "A native anchor. Navigation uses href; it has no Button variants."}</p>}
    </div>
    {(["input", "textarea", "select"].includes(component.slug)) && <div className="workbench-controls"><Flood.Button variant="subtle" size="sm" disabled={Boolean(values.disabled)} onClick={() => stage.current?.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select")?.focus()}>Focus control</Flood.Button></div>}
    <p className="workbench-footnote">Reset restores the example; interactions stay local.</p>
  </section>;
}
