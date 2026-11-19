import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("method columns line up and clipped paths disclose the full route", async ({ page }) => {
  await page.goto("/components/endpoint-label");
  await page.getByRole("checkbox", { name: "EndpointLabel prop narrow" }).check();
  const list = page.getByRole("list", { name: "Requests" });
  const methods = list.locator(".flood-endpoint-label__method");
  const widths = await methods.evaluateAll(items => items.map(item => item.getBoundingClientRect().width));
  expect(widths).toHaveLength(4);
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(1);
  const paths = list.locator(".flood-endpoint-label__path .flood-truncated-text");
  await expect(paths.first()).not.toHaveAttribute("tabindex");
  const longPath = paths.nth(1);
  await expect(longPath).toHaveAttribute("tabindex", "0");
  await longPath.focus();
  await expect(page.getByRole("tooltip")).toHaveText("/rest/v1/projects/{project_id}/review-requests/{request_id}/attachments");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toBeHidden();
  await chooseSelectOption(page.getByRole("combobox", { name: "EndpointLabel prop overflow" }), "wrap");
  await expect(paths).toHaveCount(0);
  const beforeExtension = await methods.evaluateAll(items => items.map(item => item.getBoundingClientRect().width));
  await page.getByRole("checkbox", {name:"EndpointLabel prop extension"}).check();
  const extension = methods.last().locator(".flood-truncated-text");
  await expect(extension).toHaveAttribute("tabindex", "0");
  await extension.focus();
  await expect(page.getByRole("tooltip")).toHaveText("Report-Delta");
  const after = await methods.evaluateAll(items => items.map(item => item.getBoundingClientRect().width));
  expect(after).toEqual(beforeExtension);
  expect(await list.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
});

test("HTTP method labels preserve extension case in a dedicated column", async ({page}, info) => {
  await page.goto("/components/http-method");
  const stage = page.locator(".preview-stage");
  const table = stage.getByRole("table", {name:"HTTP requests"});
  const methods = table.locator(".flood-http-method");
  await expect(methods).toHaveText(["GET","POST","PROPFIND","Report-Delta"]);
  await expect(methods.last()).toHaveAttribute("dir", "ltr");
  await expect(methods.last()).not.toHaveClass(/flood-badge/);
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({path:info.outputPath("http-method.png")});
  await chooseSelectOption(page.getByRole("combobox", {name:"HttpMethod prop variant"}), "outline");
  await chooseSelectOption(page.getByRole("combobox", {name:"HttpMethod prop surface"}), "overlay");
  await page.getByRole("checkbox", {name:"HttpMethod prop narrow"}).check();
  await expect(methods.last()).toHaveAttribute("data-variant", "outline");
  await expect(methods.last()).toHaveText("Report-Delta");
  await expect.poll(() => table.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await stage.screenshot({path:info.outputPath("http-method-mobile.png")});
});

test("HTTP status keeps the response code visible alongside its optional reason", async ({ page }) => {
  await page.goto("/components/http-status");
  const row = page.getByRole("list", { name: "Requests" }).getByRole("listitem").nth(2);
  const status = row.locator(".flood-http-status");
  await expect(status).toContainText("HTTP 429");
  await expect(status.getByText("Too many requests")).toHaveCount(0);
  await page.getByRole("checkbox", { name: "HttpStatus prop showReason" }).check();
  await expect(status.getByText("Too many requests")).toBeVisible();
  await expect(status.getByText("429", { exact: false })).toBeVisible();
  expect(await row.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
});

test("request rows keep response, timeout, and in-flight outcomes distinct at narrow widths", async ({page}) => {
  await page.goto("/components/http-request-row");
  const list = page.getByRole("list", {name:"Recent requests"});
  const rows = list.getByRole("listitem");
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0).locator(".flood-http-status")).toContainText("HTTP 201");
  await expect(rows.nth(0).getByText("242 ms", {exact:true})).toBeVisible();
  await expect(rows.nth(1).getByText("No response", {exact:true}).filter({visible:true})).toBeVisible();
  await expect(rows.nth(2).getByText("In progress", {exact:true}).filter({visible:true})).toBeVisible();
  await expect(rows.nth(2).locator(".flood-http-request-row__duration")).toHaveCount(0);

  await page.getByRole("checkbox", {name:/narrow/i}).check();
  const path = rows.first().locator(".flood-endpoint-label__path .flood-truncated-text");
  await expect(path).toHaveAttribute("tabindex","0");
  await path.focus();
  await expect(page.getByRole("tooltip")).toHaveText("/api/v2/organizations/studio-north/workspaces/customer-portal/exports/monthly");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toBeHidden();
  await expect(path).toBeFocused();
  expect(await list.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
});

test("exchange details preserve the selected side and distinguish omitted and empty captures", async ({page}) => {
  await page.goto("/components/http-exchange-details");
  const stage = page.locator(".preview-stage");
  const request = stage.getByRole("tab", {name:"Request",exact:true});
  const response = stage.getByRole("tab", {name:"Response",exact:true});
  const responsePanel = stage.getByRole("tabpanel", {name:"Response",exact:true});
  const scenario = page.getByRole("combobox", {name:/scenario/i});
  await expect(stage.getByRole("tabpanel", {name:"Request",exact:true})).toContainText("application/json");
  await request.press("ArrowRight");
  await expect(response).toBeFocused();
  await expect(responsePanel.locator("dt", {hasText:"vary"})).toHaveCount(2);
  await expect(responsePanel.locator("code")).toContainText('"status": "queued"');

  await chooseSelectOption(scenario,"Headers only");
  await expect(response).toHaveAttribute("aria-selected","true");
  await expect(responsePanel.getByRole("heading", {name:"Body"})).toHaveCount(0);
  await chooseSelectOption(scenario,"Empty body");
  await expect(responsePanel.getByText("Empty body.", {exact:true})).toBeVisible();
  await chooseSelectOption(scenario,"Pending");
  await expect(responsePanel.getByText("Waiting for a response.", {exact:true})).toBeVisible();
  await expect(responsePanel.locator("dt")).toHaveCount(0);
  await chooseSelectOption(scenario,"No response");
  await expect(responsePanel.getByText("The request ended without a response.", {exact:true})).toBeVisible();
});
