import {expect, test} from "@playwright/test";
import {chooseSelectOption, selectBridge} from "./select-helpers";

test.describe("request detail facts", () => {
  test.use({hasTouch:true,viewport:{width:320,height:760},reducedMotion:"reduce"});

  test("short fact pairs stay aligned and reflow with enlarged text", async ({page}) => {
    await page.goto("/playground/records");
    await page.getByRole("searchbox",{name:"Search requests"}).fill("REQ-115");
    await page.getByRole("button",{name:/REQ-115/}).click();
    const drawer = page.getByRole("dialog",{name:"Recover archived access settings"});
    const facts = drawer.locator(".flood-description-list");
    await expect(facts.locator("dt")).toHaveCount(3);
    await page.evaluate(()=>document.fonts.ready);
    const term = facts.getByText("Request ID",{exact:true});
    const value = facts.locator(".flood-copyable-value__text");
    const copy = facts.getByRole("button",{name:"Copy request ID"});
    const [label, id, owner] = await Promise.all([term.boundingBox(),value.boundingBox(),facts.getByText("Noah Park",{exact:true}).boundingBox()]);
    expect(id!.x).toBeGreaterThan(label!.x+label!.width);
    expect(id!.y+id!.height/2).toBeCloseTo(label!.y+label!.height/2,0);
    expect(owner!.x).toBeCloseTo(id!.x,0);
    await expect(copy).toHaveCSS("min-block-size","44px");
    await page.evaluate(()=>{document.documentElement.style.fontSize="32px";document.documentElement.dir="rtl";});
    const [enlargedLabel,enlargedValue] = await Promise.all([term.boundingBox(),facts.locator("dd").first().boundingBox()]);
    expect(enlargedValue!.y).toBeGreaterThan(enlargedLabel!.y+enlargedLabel!.height);
    expect(enlargedValue!.x+enlargedValue!.width).toBeCloseTo(enlargedLabel!.x+enlargedLabel!.width,0);
    expect(await facts.evaluate(node=>node.scrollWidth-node.clientWidth)).toBeLessThanOrEqual(1);
    await copy.scrollIntoViewIfNeeded();
    await expect(copy).toBeInViewport({ratio:1});
    await drawer.getByRole("button",{name:"Edit request"}).click();
    await expect(page.getByRole("dialog",{name:"Edit REQ-115"})).toBeVisible();
  });
});

test("bounded request rows keep their end clearance as the scrollbar comes and goes", async ({page}) => {
  await page.goto("/playground/records");
  const frame = page.locator(".request-table-frame");
  const table = frame.getByRole("table", {name: "Requests"});
  const rail = frame.locator(".flood-scroll-area__track--vertical");
  const search = page.getByRole("searchbox", {name: "Search requests"});
  for (const direction of ["ltr", "rtl"]) {
    await frame.evaluate((element, dir) => element.setAttribute("dir", dir), direction);
    await expect(rail).toBeVisible();
    const measure = () => table.evaluate((element, dir) => {
      const viewport = element.closest(".flood-scroll-area__viewport")!.getBoundingClientRect();
      const cell = element.querySelector("thead th:last-child")!;
      const bounds = cell.getBoundingClientRect();
      return {
        seam: dir === "rtl" ? bounds.left - viewport.left : viewport.right - bounds.right,
        padding: parseFloat(getComputedStyle(cell).paddingInlineEnd),
      };
    }, direction);
    const populated = await measure();
    expect(populated.seam).toBeCloseTo(0, 0);
    expect(populated.padding).toBeGreaterThan(16);
    await search.fill("REQ-105");
    await expect(rail).toHaveCount(0);
    expect(await measure()).toEqual(populated);
    await search.clear();
  }
});

test("clearing an empty request result returns focus to the original search", async ({page}) => {
  await page.goto("/playground/records");
  const search = page.getByRole("searchbox", {name:"Search requests"});
  await search.fill("NO-SUCH-REQUEST");
  const state = page.locator(".flood-no-results");
  await expect(state.getByRole("heading", {name:"No matching requests"})).toBeVisible();
  await expect(state.getByRole("button", {name:"Clear filters"})).toHaveCount(0);
  await chooseSelectOption(page.getByRole("combobox", {name:"Status"}), "active");
  await state.getByRole("button", {name:"Clear filters"}).press("Enter");
  await expect(state).toHaveCount(0);
  await expect(search).toHaveValue("");
  await expect(search).toBeFocused();
  await expect(page.getByRole("button", {name:/REQ-105/})).toBeVisible();
});

test("single-event periods connect in the request Drawer", async ({page}) => {
  await page.goto("/playground/records");
  await page.getByRole("searchbox",{name:"Search requests"}).fill("REQ-105");
  await page.getByRole("button",{name:/REQ-105/}).click();
  const history = page.getByRole("dialog").getByRole("region",{name:"Request activity"});
  const connectors = await history.locator(".flood-timeline__item").evaluateAll(nodes=>
    nodes.map(node=>getComputedStyle(node,"::before").content));
  expect(connectors).toEqual(['""','""',"none"]);
});

test("request edit returns to the same query, filter, scroll position and row", async ({page}) => {
  await page.goto("/playground/records");
  const workspace = page.getByRole("region", {name: "Request workspace"});
  const search = workspace.getByRole("searchbox", {name: "Search requests"});
  const filter = workspace.getByRole("combobox", {name: "Status"});
  const results = workspace.getByRole("region", {name: "Requests", exact: true});
  const opener = results.getByRole("button", {name: /REQ-117/});
  await search.fill("REQ-");
  await chooseSelectOption(filter, "active");
  await results.getByRole("button", {name: "Sort by Status"}).click();
  await opener.scrollIntoViewIfNeeded();
  const position = await results.evaluate(node => node.scrollTop);
  expect(position).toBeGreaterThan(0);
  await opener.press("Enter");
  const drawer = workspace.getByRole("dialog", {name: "Review regional account permissions"});
  await expect(drawer.getByRole("heading", {name: "Activity"})).toBeVisible();
  const activity = drawer.getByRole("region", {name: "Request activity"});
  await expect(activity).toContainText("Regional roles exported");
  await expect(drawer.getByRole("button", {name: "Edit request"})).toBeInViewport({ratio: 1});
  await expect(drawer.getByRole("button", {name: "Edit request"})).toBeFocused();
  await drawer.getByRole("button", {name: "Edit request"}).click();
  const editor = workspace.getByRole("dialog", {name: "Edit REQ-117"});
  await expect(editor.getByRole("textbox", {name: "Subject"})).toBeFocused();
  await editor.getByRole("textbox", {name: "Subject"}).fill("Discard this draft");
  await editor.getByRole("button", {name: "Cancel edit"}).click();
  await expect(drawer.getByRole("button", {name: "Edit request"})).toBeFocused();
  await drawer.getByRole("button", {name: "Edit request"}).click();
  const subject = editor.getByRole("textbox", {name: "Subject"});
  await expect(subject).toHaveValue("Review regional account permissions");
  await subject.fill("Review regional billing permissions");
  await editor.getByRole("button", {name: "Save changes"}).click();
  await expect(editor).toBeHidden();
  await expect(search).toHaveValue("REQ-");
  await expect(selectBridge(filter)).toHaveValue("active");
  await expect(results.getByRole("columnheader", {name: "Sort by Status"})).toHaveAttribute("aria-sort", "ascending");
  await expect(opener).toBeFocused();
  await expect(opener).toHaveAccessibleName("Review regional billing permissions, REQ-117");
  expect(await results.evaluate(node => node.scrollTop)).toBe(position);
  await opener.press("Enter");
  const updatedDrawer = workspace.getByRole("dialog", {name: "Review regional billing permissions"});
  const updatedActivity = updatedDrawer.getByRole("region", {name: "Request activity"});
  await expect(updatedActivity.getByText("Request updated", {exact:true})).toHaveCount(1);
  const disclosure = updatedActivity.getByRole("button", {name: "1 change", exact:true});
  await disclosure.press("Enter");
  await expect(updatedActivity.getByText("Review regional account permissions", {exact:true})).toBeVisible();
  await expect(updatedActivity.getByText("Review regional billing permissions", {exact:true})).toBeVisible();
  const [beforeTop, afterTop] = await updatedActivity.locator(".flood-value-change__content")
    .evaluateAll(values => values.map(value => value.getBoundingClientRect().top));
  expect(beforeTop).toBeCloseTo(afterTop, 0);
  await updatedDrawer.getByRole("button", {name:"Edit request"}).click();
  await editor.getByRole("button", {name:"Save changes"}).click();
  await expect(editor).toBeHidden();
  await opener.press("Enter");
  await expect(updatedActivity.getByText("Request updated", {exact:true})).toHaveCount(1);
});

test("a request leaving the filter returns focus to search and keeps its saved status", async ({page}) => {
  await page.goto("/playground/records");
  const workspace = page.getByRole("region", {name: "Request workspace"});
  const search = workspace.getByRole("searchbox", {name: "Search requests"});
  const filter = workspace.getByRole("combobox", {name: "Status"});
  const opener = workspace.getByRole("table", {name: "Requests"}).getByRole("button", {name: /REQ-105/});
  await search.fill("REQ-105");
  await chooseSelectOption(filter, "active");
  await workspace.getByRole("row", {name: /REQ-105/}).getByRole("cell", {name: "In progress"}).click();
  await workspace.getByRole("button", {name: "Edit request"}).click();
  const editor = workspace.getByRole("dialog", {name: "Edit REQ-105"});
  await chooseSelectOption(editor.getByRole("combobox", {name: "Status"}), "resolved");
  await editor.getByRole("button", {name: "Save changes"}).click();
  await expect(search).toBeFocused();
  await expect(search).toHaveValue("REQ-105");
  await expect(selectBridge(filter)).toHaveValue("active");
  await expect(opener).toHaveCount(0);
  await expect(workspace.getByRole("heading", {name: "No matching requests"})).toBeVisible();
  const toast = workspace.getByRole("region", {name: "Notifications"});
  await expect(toast.getByText("REQ-105 updated")).toBeVisible();
  await expect(toast.getByText("It no longer matches your search or filter.")).toBeVisible();
  await chooseSelectOption(filter, "resolved");
  await expect(opener).toBeVisible();
  await expect(workspace.getByRole("row", {name: /REQ-105/})).toContainText("Resolved");
});
