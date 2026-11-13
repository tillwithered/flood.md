import {expect, test} from "@playwright/test";
import {chooseSelectOption, selectBridge} from "./select-helpers";

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
  await expect(drawer.getByRole("table", {name: "Request activity"})).toContainText("Regional roles exported");
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
