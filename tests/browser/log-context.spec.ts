import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("loading surrounding logs keeps the selected event and boundary focus in place", async ({page}, info) => {
  await page.goto("/components/log-context");
  const region = page.getByRole("region", {name:"Storage request context"});
  const selected = region.locator('[aria-current="true"]');
  const earlier = page.getByRole("button", {name:"Load earlier",exact:true});
  const scenario = page.getByRole("combobox", {name:/scenario/i});
  await expect(selected).toContainText("Upload exceeded size limit");
  await expect(region.getByRole("listitem")).toHaveCount(7);
  const disclosure = selected.getByRole("button", {name:"Show payload"});
  const [rowBox, timeBox, messageBox, buttonBox] = await Promise.all([
    selected.boundingBox(), selected.locator("time").boundingBox(),
    selected.getByText("Upload exceeded size limit").boundingBox(), disclosure.boundingBox(),
  ]);
  expect(buttonBox!.y).toBeGreaterThan(rowBox!.y);
  expect(buttonBox!.y + buttonBox!.height).toBeLessThan(rowBox!.y + rowBox!.height);
  const center = (box: {y:number; height:number}) => box.y + box.height / 2;
  expect(Math.abs(center(buttonBox!) - center(timeBox!))).toBeLessThanOrEqual(1);
  if (messageBox!.x > timeBox!.x + timeBox!.width) {
    expect(Math.abs(center(buttonBox!) - center(messageBox!))).toBeLessThanOrEqual(1);
  } else {
    expect(messageBox!.y).toBeGreaterThan(buttonBox!.y + buttonBox!.height);
  }

  const anchorPosition = () => selected.evaluate(row => row.getBoundingClientRect().top -
    row.closest(".flood-log-context__viewport")!.getBoundingClientRect().top);
  const expectPreservedPosition = async (position: number) => {
    await expect.poll(() => selected.evaluate((row, target) => {
      const viewport = row.closest(".flood-log-context__viewport") as HTMLElement;
      const bounds = viewport.getBoundingClientRect();
      const scale = bounds.height / viewport.offsetHeight;
      const offset = (row.getBoundingClientRect().top - bounds.top) / scale + viewport.scrollTop;
      const expectedScroll = Math.max(0, Math.min(viewport.scrollHeight - viewport.clientHeight, offset - target / scale));
      return Math.abs(viewport.scrollTop - expectedScroll);
    }, position)).toBeLessThanOrEqual(2);
  };
  const initialPosition = await anchorPosition();
  expect(initialPosition).toBeGreaterThanOrEqual(0);
  await expect.poll(() => region.evaluate(node => {
    const top = node.getBoundingClientRect().top;
    return Math.min(...Array.from(node.querySelectorAll("li"), row => Math.abs(row.getBoundingClientRect().top - top)));
  })).toBeLessThanOrEqual(1);
  await expect.poll(() => selected.evaluate(row => row.getBoundingClientRect().bottom -
    row.closest(".flood-log-context__viewport")!.getBoundingClientRect().bottom)).toBeLessThanOrEqual(1);
  await page.evaluate(() => document.fonts.ready);
  await region.screenshot({path:info.outputPath("log-context-start.png")});
  await chooseSelectOption(scenario,"Failed earlier");
  await expect(page.getByRole("alert").filter({hasText:"load earlier entries"})).toBeVisible();
  await earlier.press("Enter");
  await expect(region.getByRole("listitem")).toHaveCount(9);
  await expect(page.getByRole("button", {name:"No earlier entries",exact:true})).toBeFocused();
  await expectPreservedPosition(initialPosition);
  const positionAfterPrepend = await anchorPosition();

  await page.getByRole("button", {name:"Load later",exact:true}).press("Space");
  await expect(region.getByRole("listitem")).toHaveCount(10);
  await expect(page.getByRole("button", {name:"No later entries",exact:true})).toBeFocused();
  await expectPreservedPosition(positionAfterPrepend);
});
