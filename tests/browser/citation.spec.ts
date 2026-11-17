import {expect, test} from "@playwright/test";

test("SourceList shares the cited destination and keeps unavailable evidence readable", async ({page}) => {
  await page.goto("/components/source-list");
  const sources = page.getByRole("list", {name:"Sources", exact:true});
  const title = "Web search · Output and citations";
  const sourceLink = sources.getByRole("link", {name:title, exact:true});
  const marker = page.getByRole("button", {name:`1 ${title}`, exact:true});
  const href = await sourceLink.getAttribute("href");
  await marker.press("Enter");
  const citation = page.getByRole("dialog", {name:title, exact:true});
  await expect(citation.getByRole("link", {name:title})).toHaveAttribute("href", href!);
  await page.keyboard.press("Escape");
  await expect(marker).toBeFocused();
  await page.getByRole("checkbox", {name:"SourceList prop narrow"}).check();
  await page.getByRole("checkbox", {name:"SourceList prop showUnavailable"}).check();
  const inaccessible = sources.getByRole("listitem").filter({hasText:"Update the client during a response"});
  await expect(inaccessible).toBeVisible();
  await expect(inaccessible.getByRole("link")).toHaveCount(0);
  const secondTitle = inaccessible.getByText("Update the client during a response", {exact:true});
  expect((await secondTitle.boundingBox())!.x).toBeCloseTo((await sourceLink.boundingBox())!.x, 0);
  await expect.poll(() => sources.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
});

test("Citation opens from running text and returns focus without moving the paragraph", async ({page}) => {
  await page.goto("/components/citation");
  const citation = page.getByRole("button", {name:"1 Warehouse exception policy"});
  const paragraph = page.locator("p").filter({has:citation});
  const dialog = page.getByRole("dialog", {name:"Warehouse exception policy"});
  const before = await paragraph.boundingBox();
  expect(before).not.toBeNull();

  await citation.press("Enter");
  await expect(dialog.getByRole("link", {name:"Warehouse exception policy"})).toBeFocused();
  await expect(dialog.getByText("Attach a photo", {exact:false})).toBeVisible();
  expect(await paragraph.boundingBox()).toEqual(before);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(citation).toBeFocused();
  expect(await paragraph.boundingBox()).toEqual(before);
});
