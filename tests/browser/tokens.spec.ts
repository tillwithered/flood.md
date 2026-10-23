import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { compileTokens } from "../../scripts/token-compiler.mjs";

const css = await readFile("packages/tokens/dist/foundations.css", "utf8");
const scope = 'data-flood-foundations="neutral" data-flood-theme="dark"';

test("experimental foundation CSS is opt-in and resolves real source colors", async ({ page }) => {
  await page.setContent(`<style>${css}
    .probe { background:var(--flood-sys-color-surface-canvas, rgb(1, 2, 3)); color:var(--flood-sys-color-content-default, rgb(4, 5, 6)); }
    </style><div id="outside" class="probe">Outside</div>
    <section ${scope}><div id="inside" class="probe">Inside</div></section>`);
  await expect(page.locator("#outside")).toHaveCSS("background-color", "rgb(1, 2, 3)");
  await expect(page.locator("#inside")).toHaveCSS("background-color", "rgb(24, 24, 24)");
  await expect(page.locator("#inside")).toHaveCSS("color", "rgb(255, 255, 255)");
});

test("scope boundaries rebind aliases for reference and semantic overrides", async ({ page }) => {
  const source = JSON.parse(await readFile("packages/tokens/src/tokens.json", "utf8"));
  source.sets.shared.comp = { text: { label: { color: {
    ...structuredClone(source.sets.theme.dark.sys.color.content.default),
    $value: "{sys.color.content.default}",
  } } } };
  const withComponent = compileTokens(source, "browser-fixture").css;
  await page.setContent(`<style>${withComponent}.probe { color:var(--flood-comp-text-label-color); }</style>
    <section ${scope} style="--flood-sys-color-content-default:rgb(10, 20, 30)">
      <div id="outer" class="probe">Outer</div>
      <section ${scope} style="--flood-ref-color-neutral-0:rgb(40, 50, 60)"><div id="inner" class="probe">Inner</div></section>
    </section>`);
  await expect(page.locator("#outer")).toHaveCSS("color", "rgb(10, 20, 30)");
  await expect(page.locator("#inner")).toHaveCSS("color", "rgb(40, 50, 60)");
});
