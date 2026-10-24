import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { componentSlugs, docPages } from "../../apps/website/routes.mjs";
import { chooseSelectOption } from "./select-helpers";

test("component props, preview, highlighted code and Markdown stay aligned", async ({ page }, info) => {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/components/button");
  await expect(page.locator(".workbench-title").getByRole("button", { name: "Copy for agent", exact: true })).toBeVisible();
  await chooseSelectOption(page.getByRole("combobox", { name: "Button prop variant", exact: true }), "subtle");
  await chooseSelectOption(page.getByRole("combobox", { name: "Button prop size", exact: true }), "lg");
  const button = page.locator(".preview-stage").getByRole("button", { name: "Save changes" });
  await expect(button).toHaveClass(/flood-button--subtle/);
  await expect(button).toHaveClass(/flood-button--lg/);
  const source = page.locator("#usage > .site-code-block");
  await expect(source.locator("code")).toContainText('variant="subtle"');
  await expect(source.locator("code")).toContainText('size="lg"');
  await expect(source).toHaveAttribute("data-highlighted", "true");
  await page.getByRole("button", { name: "Project UI", exact: true }).click();
  await expect(source.locator("code")).toContainText('from "@/ui/button"');
  await expect(source.locator("code")).toContainText('import "@/ui/styles.css"');
  await page.getByText("Project UI adapter files", { exact: true }).click();
  await expect(page.locator(".adapter-instructions")).toContainText('export { Button } from "@flood-md/react"');
  await expect(page.locator(".adapter-instructions")).toContainText("src/ui/stack.ts");
  await expect(page.locator(".adapter-instructions")).not.toContainText("src/ui/textarea.ts");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await source.scrollIntoViewIfNeeded();
  await expect(source).toHaveAttribute("data-highlighted", "true");
  await page.screenshot({ path: `.artifacts/lab-project-ui-${info.project.name}.png` });
  await page.getByRole("button", { name: "Copy for agent" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("## Optional project UI boundary");
  await page.getByRole("button", { name: "Package", exact: true }).click();
  await expect(source.locator("code")).toContainText('from "@flood-md/react"');
  const colors = await source.locator(".site-code-block__token").evaluateAll(nodes => [...new Set(nodes.map(node => getComputedStyle(node).color))]);
  expect(colors.length).toBeGreaterThan(2);
  await page.getByRole("checkbox", { name: "Button prop loading" }).check();
  await expect(button).toBeDisabled();
  await expect(button).toHaveAttribute("aria-busy", "true");
  await expect(source.locator("code")).toContainText("loading={true}");
  await page.getByRole("button", { name: "Copy for agent", exact: true }).click();
  const agentContext = await page.evaluate(() => navigator.clipboard.readText());
  expect(agentContext).toContain("# Button");
  expect(agentContext).toContain('variant="subtle"');
  expect(agentContext).toContain("loading={true}");
  expect(agentContext).toContain(new URL("/agent/DESIGN.md", page.url()).href);
  expect(agentContext).toContain("local source preview");
  for (const match of agentContext.matchAll(/(?:Page|Agent skill|Design contract|Canonical Markdown): (https?:\/\/\S+)/g)) {
    expect(new URL(match[1]).origin).toBe(new URL(page.url()).origin);
    expect((await page.request.get(match[1])).status()).toBe(200);
  }
  expect(agentContext).toContain(new URL("/components/button.md", page.url()).href);
  await expect(page.getByRole("button", { name: "Markdown", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Download .md", exact: true })).toHaveCount(0);
  await expect(button).toBeDisabled();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(button).toBeEnabled();
  await expect(button).toHaveClass(/flood-button--solid/);
  await expect(source.locator("code")).not.toContainText("loading={true}");
  await expect(page.getByRole("heading", { name: "Installation", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Connect Flood/ })).toHaveAttribute("href", "/docs/installation");
  await source.scrollIntoViewIfNeeded();
  await expect(source).toHaveAttribute("data-highlighted", "true");
  await page.screenshot({ path: `.artifacts/lab-code-${info.project.name}.png` });
  await page.getByRole("heading", { level: 1 }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `.artifacts/lab-button-${info.project.name}.png`, fullPage: true });
});

for (const slug of componentSlugs) {
  test(`every component has accessible default content and a meaningful live recipe: ${slug}`, async ({ page }) => {
    await page.goto(`/components/${slug}`);
    await expect(page.locator(".component-workbench")).toBeVisible();
    await expect(page.locator("#usage .site-code-block code")).toContainText("export function Example()");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, slug).toEqual([]);
  });
}

test("fields have a single contour and state controls preserve native interaction", async ({ page }, info) => {
  await page.goto("/components/input");
  const input = page.locator(".preview-stage").getByRole("textbox");
  await input.fill("A name worth keeping");
  await page.getByRole("checkbox", { name: "Input prop invalid", exact: true }).check();
  await expect(input).toHaveValue("A name worth keeping");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await page.getByRole("checkbox", { name: "Input prop readOnly", exact: true }).check();
  await expect(input).toHaveAttribute("readonly", "");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(input).toHaveValue("My project");
  await expect(input).not.toHaveAttribute("readonly");
  await page.goto("/components/textarea");
  const textarea = page.locator(".preview-stage textarea");
  await expect(textarea).toHaveCSS("resize", "none");
  const textareaBox = (await textarea.boundingBox())!;
  expect(textareaBox.width).toBeGreaterThan(info.project.name === "desktop" ? 400 : 250);
  const borders = await textarea.evaluate(node => { const css = getComputedStyle(node); return [css.borderTopColor, css.borderRightColor, css.borderBottomColor, css.borderLeftColor]; });
  expect(new Set(borders).size).toBe(1);
  await expect(page.getByRole("button", { name: "Reset", exact: true })).toHaveCSS("white-space", "nowrap");
  await page.screenshot({ path: `.artifacts/lab-textarea-${info.project.name}.png`, fullPage: true });
  await page.goto("/components/checkbox");
  const checkbox = page.locator(".preview-stage").getByRole("checkbox");
  await checkbox.focus();
  await page.keyboard.press("Space");
  await expect(checkbox).not.toBeChecked();
  await expect(checkbox).toBeFocused();
  await page.keyboard.press("Space");
  await expect(checkbox).toBeChecked();
  await expect(checkbox).toBeFocused();
});

test("Markdown is a real readable format with valid raw endpoints", async ({ page, request }) => {
  for (const doc of docPages) {
    const response = await request.get(`${doc.path}.md`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/markdown");
    expect(await response.text()).toBe(await readFile(`docs/${doc.file}`, "utf8"));
  }
  for (const slug of componentSlugs) {
    const response = await request.get(`/components/${slug}.md`);
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain("## API reference");
    expect(await response.text()).toContain(`from "@flood-md/react"`);
  }
  expect((await request.get("/components/missing.md")).status()).toBe(404);
  await page.goto("/docs/installation");
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "Copy for agent", exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("# Installation");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
