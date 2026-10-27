import { test, expect, type Locator, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chooseSelectOption, selectBridge } from "./select-helpers";

type Component = { slug: string; name: string };
type Control = { kind: "select" | "checkbox" | "text"; label: string; prop: string; initial: string | boolean; values: Array<string | boolean> };
type StateResult = { prop: string; value: string | boolean; initial: string | boolean; codeChanged?: boolean; runtimeChanged?: boolean; observation?: string; error?: string };
const components = JSON.parse(readFileSync(resolve("apps/website/src/component-catalog.json"), "utf8")) as Component[];

async function closeOverlays(page: Page) {
  for (let attempt = 0; attempt < 4 && await page.locator('dialog[open], [popover]:popover-open').count(); attempt++) await page.keyboard.press("Escape");
  await expect(page.locator('dialog[open]')).toHaveCount(0);
}

async function sampleSignature(stage: Locator) {
  return stage.evaluate(root => JSON.stringify(Array.from(root.querySelectorAll<HTMLElement>("*")).map(node => {
    const css = getComputedStyle(node), box = node.getBoundingClientRect();
    const ignored = new Set(["id", "aria-controls", "aria-labelledby", "aria-describedby", "aria-activedescendant", "style"]);
    const attributes = Array.from(node.attributes).filter(attribute => !ignored.has(attribute.name)).map(attribute => [attribute.name, attribute.value]);
    return { tag: node.localName, attributes, text: Array.from(node.childNodes).filter(child => child.nodeType === Node.TEXT_NODE).map(child => child.textContent).join(""), width: Math.round(node.offsetWidth || box.width), height: Math.round(node.offsetHeight || box.height),
      disabled: node.matches(":disabled"), checked: node instanceof HTMLInputElement ? node.checked : undefined,
      readOnly: node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement ? node.readOnly : undefined,
      presentation: [css.display, css.visibility, css.fontSize, css.fontWeight, css.lineHeight, css.letterSpacing, css.color, css.backgroundColor, css.borderColor, css.borderStyle, css.borderRadius, css.padding, css.gap, css.objectFit, css.animationName] };
  })));
}

function observation(slug: string, prop: string, changed: boolean) {
  if (changed) return "Observed DOM, semantics or geometry changed.";
  if (slug === "link" && prop === "size") return "Context-dependent: text Link inherits its surrounding type size; size applies to button appearances.";
  if (["side", "align", "delay", "disableArchive", "icons", "shortcuts", "iconTrigger"].includes(prop) && ["menu", "tooltip", "popover"].includes(slug)) return "Deferred: placement, timing or item content requires opening/hovering the overlay; covered by dedicated overlay tests.";
  if ((slug === "toolbar" && prop === "loop") || (slug === "dialog" && prop === "closeOnOutsideClick") || (slug === "tabs" && prop === "activationMode")) return "Behavior-only option; static appearance should remain unchanged. Dedicated keyboard/overlay tests cover activation.";
  if (slug === "container" && prop === "size") return "Context-dependent: the preview may be narrower than every max-width limit.";
  return "No static runtime difference observed: inspect this state in the coverage report; code must still reflect the changed option.";
}

const affected = process.env.FLOOD_AFFECTED_COMPONENTS?.split(",");
for (const component of components.filter(component => !affected || affected.includes(component.slug))) {
  test(`all public playground control states: ${component.slug}`, async ({ page }, info) => {
    test.setTimeout(120_000);
    const errors: string[] = [], results: StateResult[] = [];
    page.on("pageerror", error => errors.push(error.message));
    const artifact = resolve(`.artifacts/catalog-variants/${info.project.name}/${component.slug}.json`);
    let controls: Control[] = [];
    try {
      await page.goto(`/components/${component.slug}`);
      const workbench = page.locator(".component-workbench"), stage = workbench.locator(".workbench-stage");
      const panel = workbench.locator(".workbench-controls"), code = page.locator("#usage .site-code-block code");
      await expect(workbench).toBeVisible();
      await expect(code).toContainText("export function Example()");
      await page.evaluate(() => new Promise<void>(done => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
      const baselineCode = (await code.textContent())!, baselineBox = (await stage.boundingBox())!, baselineSignature = await sampleSignature(stage);
      expect(baselineBox.width).toBeGreaterThan(0);
      expect(baselineBox.height).toBeGreaterThan(0);
      for (const control of await panel.getByRole("combobox").all()) {
        const label = (await control.getAttribute("aria-label"))!;
        const bridge = selectBridge(control), initial = await bridge.inputValue();
        const values = await bridge.locator("option").evaluateAll(nodes => (nodes as HTMLOptionElement[]).filter(node => !node.disabled).map(node => node.value));
        controls.push({ kind: "select", label, prop: label.split(" ").at(-1)!, initial, values });
      }
      for (const control of await panel.getByRole("checkbox").all()) {
        const label = (await control.getAttribute("aria-label"))!;
        controls.push({ kind: "checkbox", label, prop: label.split(" ").at(-1)!, initial: await control.isChecked(), values: [false, true] });
      }
      for (const control of await panel.getByRole("textbox").all()) {
        const label = (await control.getAttribute("aria-label"))!, initial = await control.inputValue();
        controls.push({ kind: "text", label, prop: label.split(" ").at(-1)!, initial, values: [...new Set([initial, "", "Flood audit"])] });
      }
      for (const control of controls) for (const value of control.values) {
        const result: StateResult = { prop: control.prop, value, initial: control.initial };
        results.push(result);
        await test.step(`${control.prop} = ${JSON.stringify(value)}`, async () => {
          try {
            await closeOverlays(page);
            await workbench.getByRole("button", { name: "Reset", exact: true }).click();
            await expect(code).toHaveText(baselineCode);
            const target = panel.getByRole(control.kind === "select" ? "combobox" : control.kind === "checkbox" ? "checkbox" : "textbox", { name: control.label, exact: true });
            if (control.kind === "select") await chooseSelectOption(target, String(value));
            else if (control.kind === "checkbox") { await target.setChecked(Boolean(value)); await expect(target).toBeChecked({ checked: Boolean(value) }); }
            else { await target.fill(String(value)); await expect(target).toHaveValue(String(value)); }
            await expect(code).toContainText("export function Example()");
            if (value !== control.initial) await expect.soft(code, `${component.slug}.${control.prop} must update its generated example`).not.toHaveText(baselineCode, { timeout: 2_000 });
            await page.evaluate(() => new Promise<void>(done => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
            const currentCode = (await code.textContent())!;
            result.codeChanged = currentCode !== baselineCode;
            const box = (await stage.boundingBox())!;
            expect.soft(Math.abs(box.width - baselineBox.width), `${component.slug}.${control.prop}: preview width must stay fixed`).toBeLessThanOrEqual(1);
            expect.soft(Math.abs(box.height - baselineBox.height), `${component.slug}.${control.prop}: preview height must stay fixed`).toBeLessThanOrEqual(1);
            result.runtimeChanged = await sampleSignature(stage) !== baselineSignature;
            result.observation = value === control.initial ? "Baseline option exercised." : observation(component.slug, control.prop, result.runtimeChanged);
            expect.soft(errors, `${component.slug}.${control.prop}: browser page errors`).toEqual([]);
          } catch (error) {
            result.error = error instanceof Error ? error.message : String(error);
            expect.soft(result.error, `${component.slug}.${control.prop} state could not be exercised`).toBeUndefined();
            await page.reload();
            await expect(workbench).toBeVisible();
            await expect(code).toContainText("export function Example()");
          }
        });
      }
      await closeOverlays(page);
      expect(errors, `${component.slug}: uncaught browser errors`).toEqual([]);
      expect((await code.textContent())!.trim().length).toBeGreaterThan(80);
    } finally {
      await mkdir(resolve(`.artifacts/catalog-variants/${info.project.name}`), { recursive: true });
      await writeFile(artifact, JSON.stringify({ component: component.slug, project: info.project.name, controlCount: controls.length, exercisedStates: results.length, errors, states: results }, null, 2));
    }
  });
}
