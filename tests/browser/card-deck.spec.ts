import {expect, test} from "@playwright/test";

test("CardDeck keeps navigation focus and mounts only the accepted card", async ({page}, info) => {
  await page.goto("/components/card-deck");
  const deck = page.locator(".preview-stage").getByRole("group",{name:"Chart examples"});
  const previous = deck.getByRole("button",{name:"Previous card"});
  const next = deck.getByRole("button",{name:"Next card"});
  const trend = deck.getByRole("link",{name:"View line chart"});
  const volume = deck.getByRole("link",{name:"Explore the chart playground"});
  await expect(previous).toHaveAttribute("aria-disabled","true");
  await expect(trend).toBeVisible();
  await expect(volume).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await deck.screenshot({path:info.outputPath("card-deck.png")});

  await next.press("Enter");
  await expect(volume).toBeVisible();
  await expect(trend).toHaveCount(0);
  await expect(next).toBeFocused();
  await next.press("Enter");
  await expect(deck.getByRole("link",{name:"Read chart guide"})).toBeVisible();
  await expect(next).toHaveAttribute("aria-disabled","true");
  await expect(next).toBeFocused();
  await next.press("Enter");
  await expect(deck.getByRole("status")).toHaveText("Explore chart patterns, 3 / 3");

  await page.getByRole("checkbox",{name:"CardDeck prop loop"}).check();
  await page.getByRole("checkbox",{name:"CardDeck prop narrow"}).check();
  await page.getByRole("checkbox",{name:"CardDeck prop rtl"}).check();
  await page.emulateMedia({reducedMotion:"reduce"});
  await next.press("Enter");
  await expect(trend).toBeVisible();
  await expect(deck.locator(".flood-card-deck__content")).toHaveCSS("animation-name","none");
  expect(await deck.evaluate(node => node.scrollWidth-node.clientWidth)).toBeLessThanOrEqual(1);
  await previous.press("Enter");
  await expect(deck.getByRole("link",{name:"Read chart guide"})).toBeVisible();
  await deck.screenshot({path:info.outputPath("card-deck-narrow.png")});
});
