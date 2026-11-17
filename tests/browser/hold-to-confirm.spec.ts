import {expect, test} from "@playwright/test";

test("holding confirms only on release and leaving the button cancels the attempt", async ({page}) => {
  await page.goto("/components/hold-to-confirm");
  const trigger = page.getByRole("button", {name:"Discard draft"});
  const result = page.getByText("Draft discarded.", {exact:true});
  const dialog = page.getByRole("alertdialog");
  const box = await trigger.boundingBox();
  if (!box) throw new Error("Confirmation trigger has no bounds");
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await page.mouse.move(x, y);
  await page.mouse.down();
  await expect(trigger).toHaveAttribute("data-holding", "");
  expect(await trigger.boundingBox()).toEqual(box);
  await page.mouse.move(x, box.y - 10);
  await page.mouse.move(x, y);
  await page.mouse.up();
  await expect(trigger).not.toHaveAttribute("data-holding", "");
  await expect(dialog).not.toBeVisible();
  await expect(result).not.toBeVisible();

  await page.mouse.down();
  await expect(trigger).toHaveAttribute("data-holding", "");
  await page.keyboard.press("Escape");
  await page.mouse.up();
  await expect(dialog).not.toBeVisible();
  await expect(result).not.toBeVisible();

  await page.mouse.down();
  await expect(trigger).toHaveAttribute("data-holding", "");
  await expect.poll(() => trigger.locator(".flood-hold-to-confirm__progress").evaluate(
    element => element.getAnimations()[0]?.playState,
  )).toBe("finished");
  await expect(result).not.toBeVisible();
  await expect(dialog).not.toBeVisible();
  await page.mouse.up();
  await expect(result).toBeVisible();
  await expect(dialog).not.toBeVisible();
});

test.describe("touch activation", () => {
  test.use({hasTouch:true, reducedMotion:"reduce"});

  test("a tap opens the dialog and a touch hold waits for release", async ({page}) => {
    await page.goto("/components/hold-to-confirm");
    const trigger = page.getByRole("button", {name:"Discard draft"});
    const dialog = page.getByRole("alertdialog");
    const outcome = page.getByText("Draft discarded.", {exact:true});
    await trigger.tap();
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", {name:"Cancel"}).tap();
    await expect(dialog).not.toBeVisible();

    const box = await trigger.boundingBox();
    if (!box) throw new Error("Confirmation trigger has no bounds");
    const touchPoints = [{x: box.x + box.width / 2, y: box.y + box.height / 2}];
    const client = await page.context().newCDPSession(page);
    await client.send("Input.dispatchTouchEvent", {type:"touchStart", touchPoints});
    await expect(trigger).toHaveAttribute("data-holding", "");
    const progress = trigger.locator(".flood-hold-to-confirm__progress");
    await expect(progress).toHaveCSS("animation-timing-function","steps(1)");
    await expect.poll(() => progress.evaluate(element => element.getAnimations()[0]?.playState)).toBe("finished");
    await expect(outcome).not.toBeVisible();
    await client.send("Input.dispatchTouchEvent", {type:"touchEnd", touchPoints:[]});
    await expect(outcome).toBeVisible();
    await expect(dialog).not.toBeVisible();
  });
});

test("ordinary activation reviews the action in a dialog with cancel focus", async ({page}) => {
  await page.goto("/components/hold-to-confirm");
  const trigger = page.getByRole("button", {name:"Discard draft"});
  const dialog = page.getByRole("alertdialog", {name:"Discard this draft?"});
  const outcome = page.getByText("Draft discarded.", {exact:true});

  await trigger.click();
  await expect(dialog.getByRole("button", {name:"Cancel"})).toBeFocused();
  await expect(outcome).not.toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();

  await page.keyboard.press("Space");
  await expect(dialog.getByRole("button", {name:"Cancel"})).toBeFocused();
  await dialog.getByRole("button", {name:"Discard draft"}).click();
  await expect(outcome).toBeVisible();
  await expect(dialog).not.toBeVisible();
});
