import {expect, test} from "@playwright/test";

test("record actions stay anchored and a swipe only reveals them", async ({page}) => {
  await page.goto("/components/swipe-actions");
  const row = page.locator(".flood-swipe-actions").first();
  const trigger = row.getByRole("button", {name:"Actions for Design review"});
  const archive = row.getByRole("button", {name:"Archive"});
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(archive).toHaveCount(0);
  const start = await trigger.boundingBox();
  const rowStart = await row.boundingBox();
  const content = await row.locator(".flood-swipe-actions__content").boundingBox();
  if (!start || !rowStart || !content) throw new Error("Swipe preview failed to layout");

  const x = content.x + content.width * 0.65;
  const y = content.y + content.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 16, y, {steps:4});
  await page.mouse.up();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");

  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 66, y, {steps:8});
  await page.mouse.up();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(archive).toBeVisible();
  await expect(page.getByText("Archived", {exact:true})).toHaveCount(0);
  await expect.poll(async () => (await trigger.boundingBox())?.x).toBe(start.x);
  expect((await row.boundingBox())?.height).toBe(rowStart.height);
  await archive.focus();
  await page.keyboard.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Tab");
  await expect(row.getByRole("button", {name:"Mark as read"})).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(archive).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Archived", {exact:true})).toBeVisible();
});

test("touch direction separates a vertical gesture from action disclosure", async ({browser}, info) => {
  test.skip(info.project.name !== "mobile", "Covered at the touch viewport.");
  const context = await browser.newContext({viewport:{width:390,height:844}, hasTouch:true, reducedMotion:"reduce"});
  try {
    const page = await context.newPage();
    await page.goto((process.env.FLOOD_WEBSITE_TEST_URL ?? "http://127.0.0.1:4173") + "/components/swipe-actions");
    const row = page.locator(".flood-swipe-actions").first();
    const trigger = row.getByRole("button", {name:"Actions for Design review"});
    await expect(trigger).toBeVisible();
    await page.waitForFunction(() => !!document.querySelector<HTMLDivElement>(".flood-swipe-actions__rail")?.inert);
    const touch = await context.newCDPSession(page);
    async function drag(dx: number, dy: number) {
      const box = await row.locator(".flood-swipe-actions__content").boundingBox();
      if (!box) throw new Error("Swipe preview failed to layout");
      const x = Math.round(box.x + box.width * 0.7);
      const y = Math.round(box.y + box.height / 2);
      await touch.send("Input.dispatchTouchEvent", {type:"touchStart", touchPoints:[{x,y}]});
      for (const progress of [0.25, 0.5, 0.75, 1]) {
        await touch.send("Input.dispatchTouchEvent", {
          type:"touchMove", touchPoints:[{x:Math.round(x + dx * progress),y:Math.round(y + dy * progress)}],
        });
      }
      await touch.send("Input.dispatchTouchEvent", {type:"touchEnd", touchPoints:[]});
    }
    await drag(-8, 52);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await drag(-64, 0);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(row.getByRole("button", {name:"Archive"})).toBeVisible();
    await expect(row).toHaveCSS("transition-duration", "0s");
  } finally {
    await context.close();
  }
});
