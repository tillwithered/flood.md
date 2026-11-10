import {expect, test} from "@playwright/test";
import {chooseSelectOption, selectBridge} from "./select-helpers";

test("request edit returns to the same query, filter, scroll position and row", async ({page}) => {
  await page.goto("/playground/records");
  const workspace = page.getByRole("region", {name: "Request workspace"});
  const search = workspace.getByRole("searchbox", {name: "Search requests"});
  const filter = workspace.getByRole("combobox", {name: "Status"});
  const results = workspace.getByRole("region", {name: "Request results"});
  const opener = results.getByRole("button", {name: /Open REQ-117/});
  await search.fill("REQ-");
  await chooseSelectOption(filter, "active");
  await opener.scrollIntoViewIfNeeded();
  const position = await results.evaluate(node => node.scrollTop);
  expect(position).toBeGreaterThan(0);
  await opener.click();
  const drawer = workspace.getByRole("dialog", {name: "Review regional account permissions"});
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
  await expect(opener).toBeFocused();
  await expect(opener).toHaveAccessibleName("Open REQ-117 Review regional billing permissions");
  expect(await results.evaluate(node => node.scrollTop)).toBe(position);
});

test("a request leaving the filter returns focus to search and keeps its saved status", async ({page}) => {
  await page.goto("/playground/records");
  const workspace = page.getByRole("region", {name: "Request workspace"});
  const search = workspace.getByRole("searchbox", {name: "Search requests"});
  const filter = workspace.getByRole("combobox", {name: "Status"});
  const opener = workspace.getByRole("button", {name: /Open REQ-105/});
  await search.fill("REQ-105");
  await chooseSelectOption(filter, "active");
  await opener.click();
  await workspace.getByRole("button", {name: "Edit request"}).click();
  const editor = workspace.getByRole("dialog", {name: "Edit REQ-105"});
  await chooseSelectOption(editor.getByRole("combobox", {name: "Status"}), "resolved");
  await editor.getByRole("button", {name: "Save changes"}).click();
  await expect(search).toBeFocused();
  await expect(search).toHaveValue("REQ-105");
  await expect(selectBridge(filter)).toHaveValue("active");
  await expect(opener).toHaveCount(0);
  await expect(workspace.getByRole("heading", {name: "No matching requests"})).toBeVisible();
  await expect(workspace.getByText("REQ-105 updated and no longer matches the current search or filter.")).toBeVisible();
  await chooseSelectOption(filter, "resolved");
  await expect(opener).toBeVisible();
  await expect(workspace.getByRole("listitem").filter({
    has: page.getByRole("button", {name: /Open REQ-105/}),
  })).toContainText("Resolved");
});
