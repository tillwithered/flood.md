import {expect, test} from "@playwright/test";
import {mkdir, writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {build} from "vite";
import {chooseSelectOption,chooseStudioSheetOption} from "./select-helpers";

test("QueryPlan keeps estimates and measured loops distinct during keyboard inspection", async ({page}, info) => {
  await page.goto("/components/query-plan");
  const plan = page.getByRole("group",{name:"File search execution plan"});
  const details = plan.locator(".flood-query-plan__details");
  const heap = plan.getByRole("treeitem",{name:"Bitmap Heap Scan files"});
  const index = plan.getByRole("treeitem",{name:"Bitmap Index Scan files_project_idx"});
  await expect(details.getByRole("heading")).toHaveText("Nested Loop");
  await expect(index).toBeHidden();
  await heap.click();
  await expect(details.getByRole("heading")).toHaveText("Bitmap Heap Scan");
  await expect(details.getByText("64",{exact:true})).toBeVisible();
  await heap.press("ArrowRight");
  await expect(heap).toHaveAttribute("aria-expanded","true");
  await heap.press("ArrowDown");
  await expect(index).toBeFocused();
  await index.press("Enter");
  await expect(index).toBeFocused();
  await expect(index).toHaveAttribute("aria-selected","true");
  await expect(details.getByText("0.019 ms",{exact:true})).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:info.outputPath("query-plan.png")});

  await page.getByRole("checkbox",{name:/Estimate only|QueryPlan prop estimateOnly/}).check();
  await expect(details.getByRole("heading")).toHaveText("Bitmap Index Scan");
  await expect(details.getByText("Estimated cost")).toBeVisible();
  await expect(details.getByText("Time per loop")).toHaveCount(0);
  await page.screenshot({path:info.outputPath("query-plan-estimate.png")});

  await page.getByRole("checkbox",{name:/^Empty$|QueryPlan prop empty/}).check();
  await expect(plan.getByText("No query plan.")).toBeVisible();
  await expect(plan.getByRole("tree")).toHaveCount(0);
});

test("TimestampLink makes comment metadata a stable native fragment link", async ({page}, info) => {
  await page.goto("/components/timestamp-link");
  const stage = page.locator(".preview-stage");
  const target = stage.locator("#export-review");
  const link = target.getByRole("link",{name:/9:30 AM.*Maya Chen/});
  const text = target.getByText("The original export is attached to the review.");
  await expect(link.locator("time")).toHaveAttribute("datetime","2026-11-14T09:30:00Z");
  await expect(link).toHaveCSS("text-decoration-line","underline");
  await expect(stage.getByText("9:46 AM")).toHaveCount(1);
  await expect(stage.getByRole("link")).toHaveCount(1);
  await page.evaluate(()=>document.fonts.ready);
  const initial = await text.boundingBox();
  await page.screenshot({path:info.outputPath("timestamp-link.png")});

  await link.focus();
  await expect(link).toBeFocused();
  expect(await text.boundingBox()).toEqual(initial);
  await page.screenshot({path:info.outputPath("timestamp-link-focused.png")});
  await link.press("Enter");
  await expect(page).toHaveURL(/#export-review$/);
  await expect(target).toBeFocused();
});

test("ChangeRegion marks a block without shifting text when review state changes", async ({page}, info) => {
  await page.goto("/components/change-region");
  const group = page.locator(".preview-stage #handoff-launch-check");
  const paragraph = group.getByText(/Before publishing/);
  const paragraphBox = () => paragraph.boundingBox();
  const marker = () => group.evaluate(node=>{
    const style = getComputedStyle(node,"::before");
    return {width:parseFloat(style.width),content:style.content};
  });
  await expect(group).toHaveAccessibleName("Launch check edited by Maya Chen");
  await expect(group).not.toHaveAttribute("aria-current");
  await page.evaluate(()=>document.fonts.ready);
  const position = await paragraphBox();
  const initial = await marker();
  expect(initial.width).toBeGreaterThan(0);
  await page.screenshot({path:info.outputPath("change-region.png")});

  const state = page.getByRole("combobox",{name:/^(State|ChangeRegion prop state)$/});
  const chooseState = async (value:string) => {
    if (await state.isVisible()) await chooseSelectOption(state,value);
    else await chooseStudioSheetOption(page,"State",value);
  };
  await chooseState("active");
  await expect(group).toHaveAttribute("aria-current","true");
  expect((await marker()).width).toBeGreaterThan(initial.width);
  expect(await paragraphBox()).toEqual(position);

  const surface = page.getByRole("combobox",{name:/^(Surface|ChangeRegion prop surface)$/});
  if (await surface.isVisible()) await chooseSelectOption(surface,"overlay");
  else await chooseStudioSheetOption(page,"Surface","overlay");
  await page.getByRole("checkbox",{name:/^(Narrow width|ChangeRegion prop narrow)$/}).check();
  await page.screenshot({path:info.outputPath("change-region-active.png")});
  const narrow = await paragraphBox();
  await chooseState("unmarked");
  await expect(group).not.toHaveAttribute("role");
  await expect(group).not.toHaveAttribute("aria-label");
  expect((await marker()).content).toBe("none");
  expect(await paragraphBox()).toEqual(narrow);

  await chooseState("changed");
  await group.evaluate(node=>node.setAttribute("dir","rtl"));
  expect(await group.evaluate(node=>getComputedStyle(node,"::before").right)).toBe("0px");
  await page.emulateMedia({forcedColors:"active"});
  expect(await group.evaluate(node=>getComputedStyle(node,"::before").forcedColorAdjust)).toBe("none");
});

test("CollectionCover keeps its geometry across artwork counts and unavailable thumbnails", async ({page}, info) => {
  await page.goto("/components/collection-cover");
  const cover = page.locator(".preview-stage .flood-collection-cover");
  const tiles = cover.locator(".flood-file-thumbnail");
  await expect(cover).toHaveAttribute("aria-hidden","true");
  await expect(tiles.locator("img[data-ready]")).toHaveCount(3);
  await expect(tiles.nth(1).locator("img")).toHaveCSS("object-fit","contain");
  const dimensions = () => cover.evaluate(node=>({width:node.clientWidth,height:node.clientHeight}));
  const initial = await dimensions();
  await page.screenshot({path:info.outputPath("collection-cover.png")});
  await page.getByRole("checkbox",{name:/^(Unavailable thumbnail|CollectionCover prop missingThumbnail)$/}).check();
  await expect(tiles.first().locator("img")).toHaveCount(0);
  await expect(tiles.first().locator("svg")).toBeVisible();
  expect(await dimensions()).toEqual(initial);

  const count = page.getByRole("combobox",{name:/^(Count|CollectionCover prop count)$/});
  const chooseCount = async (value:string) => {
    if (await count.isVisible()) await chooseSelectOption(count,value);
    else await chooseStudioSheetOption(page,"Count",value);
  };
  for (const total of [2,1,0]) {
    await chooseCount(String(total));
    await expect(tiles).toHaveCount(total);
    expect(await dimensions()).toEqual(initial);
  }
  await expect(cover.locator(".flood-collection-cover__empty svg")).toBeVisible();
  await page.screenshot({path:info.outputPath("collection-cover-empty.png")});
});

test("CollectionCard has one destination while copy stays independent", async ({page}, info) => {
  await page.addInitScript(()=>{
    Object.defineProperty(navigator.clipboard,"writeText",{value:async (value:string)=>{
      document.documentElement.dataset.clipboard = value;
    }});
  });
  await page.goto("/components/collection-card");
  const card = page.locator(".preview-stage .flood-collection-card").filter({hasText:"Chart studies"});
  const link = card.getByRole("link",{name:"Chart studies",exact:true});
  await expect(card.getByRole("link")).toHaveCount(1);
  await expect(card.locator(".flood-file-thumbnail img[data-ready]")).toHaveCount(3);
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:info.outputPath("collection-card.png")});

  const copy = card.getByRole("button",{name:"Copy Chart studies link"});
  await link.focus();
  await page.keyboard.press("Tab");
  await expect(copy).toBeFocused();
  await copy.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-clipboard","https://flood.md/docs/charts");
  await expect(page).toHaveURL(/\/components\/collection-card$/);

  const cover = card.locator(".flood-collection-cover");
  await cover.scrollIntoViewIfNeeded();
  const box = (await cover.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page).toHaveURL(/\/docs\/charts$/);
});

test("PolicyEvaluation keeps evidence and the reported route together across decisions", async ({page}, info) => {
  await page.goto("/components/policy-evaluation");
  const panel = page.locator(".preview-stage .flood-policy-evaluation");
  const checks = panel.getByRole("list",{name:"Rule checks"});
  const status = checks.locator(".flood-badge");
  await expect(panel.getByRole("heading",{name:"Finance review required"})).toBeVisible();
  await expect(status).toHaveText(["Matched","Matched","Skipped"]);
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:info.outputPath("policy-finance.png")});

  const scenario = page.getByRole("combobox",{name:"Scenario",exact:true});
  const chooseScenario = async (value:string) => {
    if (await scenario.isVisible()) await chooseSelectOption(scenario,value);
    else await chooseStudioSheetOption(page,"Scenario",value);
  };
  await chooseScenario("default route");
  await expect(panel.getByRole("heading",{name:"Budget owner review required"})).toBeVisible();
  await expect(status).toHaveText(["Matched","No match","Matched"]);
  await expect(checks.getByText("Submitted amount is $2,200")).toBeVisible();

  await chooseScenario("missing data");
  await page.getByRole("checkbox",{name:/^(Narrow width|PolicyEvaluation prop narrow)$/}).check();
  await expect(panel.getByRole("heading",{name:"Approval route unavailable"})).toBeVisible();
  await expect(status).toHaveText(["Matched","Unavailable","Skipped"]);
  await expect(checks.getByText("Amount was not provided")).toBeVisible();
  const amount = checks.getByRole("listitem").filter({hasText:"Amount was not provided"});
  const [criterion,evidence] = await Promise.all([
    amount.locator(".flood-data-list-item__title").boundingBox(),
    amount.locator(".flood-data-list-item__description").boundingBox(),
  ]);
  expect(evidence!.width).toBeGreaterThan(criterion!.width);
  expect(await panel.evaluate(node=>node.scrollWidth)).toBeLessThanOrEqual(await panel.evaluate(node=>node.clientWidth));
  await page.screenshot({path:info.outputPath("policy-unavailable.png")});
});

test("GenerationPreview preserves its frame through partial, ready and retry states", async ({page}, info) => {
  await page.goto("/components/generation-preview");
  const card = page.locator(".preview-stage .flood-generation-preview");
  const frame = card.locator(".flood-generation-preview__frame");
  await expect(frame).toHaveAttribute("aria-busy","true");
  await expect(frame.locator(".flood-skeleton")).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
  const dimensions = () => frame.evaluate(node=>({
    width:node.getBoundingClientRect().width,height:node.getBoundingClientRect().height,
  }));
  const initial = await dimensions();
  await page.getByRole("checkbox",{name:/^(Partial|GenerationPreview prop partial)$/i}).check();
  await expect(frame.getByRole("img",{name:"Partial render of the weekly visits chart"})).toBeVisible();
  await expect(frame).toHaveAttribute("aria-busy","true");
  expect(await dimensions()).toEqual(initial);
  await page.screenshot({path:info.outputPath("generation-partial.png")});

  const phase = page.getByRole("combobox",{name:/^(State|GenerationPreview prop state)$/});
  const choosePhase = async (value:string) => {
    if (await phase.isVisible()) await chooseSelectOption(phase,value);
    else await chooseStudioSheetOption(page,"State",value);
  };
  await choosePhase("ready");
  await expect(frame.getByRole("img",{name:"Weekly visits with a filled trend line"})).toBeVisible();
  await expect(frame).not.toHaveAttribute("aria-busy");
  await expect(card.getByRole("status")).toHaveText("Ready");
  expect(await dimensions()).toEqual(initial);
  await page.screenshot({path:info.outputPath("generation-ready.png")});

  await choosePhase("failed");
  await expect(card.getByRole("status")).toHaveText("The export timed out.");
  await expect(frame.getByRole("img")).toHaveCount(0);
  expect(await dimensions()).toEqual(initial);
  await page.screenshot({path:info.outputPath("generation-failed.png")});
  await card.getByRole("button",{name:"Retry"}).click();
  const stop = card.getByRole("button",{name:"Stop"});
  await expect(stop).toBeFocused();
  await expect(frame).toHaveAttribute("aria-busy","true");
  await stop.press("Enter");
  await expect(card.getByRole("status")).toHaveText("Generation cancelled");
  await expect(card.getByRole("button",{name:"Retry"})).toBeFocused();
  expect(await dimensions()).toEqual(initial);
});

test("FeedAttribution keeps provenance and original authorship on the same text axis", async ({page}, info) => {
  await page.goto("/components/feed-attribution");
  const stage = page.locator(".preview-stage");
  const attribution = stage.locator(".flood-feed-attribution");
  const link = attribution.getByRole("link",{name:/Reposted by Bluesky/});
  const author = stage.getByText("U.S. Consumer Product Safety Commission",{exact:true});
  const icon = attribution.locator(".flood-icon");
  await expect(link).toHaveAttribute("href","https://bsky.app/profile/bsky.app");
  await expect(icon).toHaveAttribute("aria-hidden","true");
  await page.evaluate(()=>document.fonts.ready);
  expect((await link.boundingBox())!.x).toBeCloseTo((await author.boundingBox())!.x,0);
  await stage.screenshot({path:info.outputPath("feed-attribution.png")});

  const surface = page.getByRole("combobox",{name:/^Surface$|^FeedAttribution prop surface$/});
  if (await surface.isVisible()) await chooseSelectOption(surface,"overlay");
  else await chooseStudioSheetOption(page,"Surface","overlay");
  await page.getByRole("checkbox",{name:/^Narrow width$|^FeedAttribution prop narrow$/}).check();
  await link.focus();
  await expect(link).toBeFocused();
  expect(await attribution.evaluate(node=>node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await stage.screenshot({path:info.outputPath("feed-attribution-overlay.png")});

  const before = (await link.boundingBox())!.x;
  await page.getByRole("checkbox",{name:/^Show icon$|^FeedAttribution prop showIcon$/}).uncheck();
  await expect(icon).toHaveCount(0);
  expect((await link.boundingBox())!.x).toBeCloseTo(before,0);
  await page.getByRole("checkbox",{name:/^Link to source$|^FeedAttribution prop linked$/}).uncheck();
  await expect(link).toHaveCount(0);
  await expect(attribution).toHaveText(/Reposted by Bluesky/);
});

test("FeedUpdate keeps the reading position on arrival and focuses the accepted posts", async ({page}, info) => {
  await page.goto("/components/feed-update");
  const stage = page.locator(".preview-stage");
  const frame = stage.locator("[data-feed-example]");
  const viewport = frame.getByRole("region",{name:"Team posts"});
  const updates = page.getByRole("combobox",{name:/^(Updates|FeedUpdate prop updates)$/});
  const chooseUpdates = async (value:string) => {
    if (await updates.isVisible()) await chooseSelectOption(updates,value);
    else await chooseStudioSheetOption(page,"Updates",value);
  };
  await chooseUpdates("0");
  await page.evaluate(()=>document.fonts.ready);
  await viewport.evaluate(node=>{node.scrollTop = 40;});
  const geometry = () => viewport.evaluate(node=>({
    position:node.scrollTop,height:node.clientHeight,total:node.scrollHeight,
  }));
  const before = await geometry();
  expect(before.position).toBeGreaterThan(0);

  await chooseUpdates("3");
  const load = frame.getByRole("button",{name:"Load 3 new posts"});
  await expect(load).toBeVisible();
  await expect(frame.getByRole("status").filter({hasText:"New posts available"})).toHaveCount(1);
  expect(await geometry()).toEqual(before);
  const [control, readingArea] = await Promise.all([load.boundingBox(),viewport.boundingBox()]);
  expect(control!.y + control!.height).toBeLessThan(readingArea!.y);
  await page.screenshot({path:info.outputPath("feed-update-waiting.png"),animations:"disabled"});

  const placement = page.getByRole("combobox",{name:/^(Placement|FeedUpdate prop placement)$/});
  const choosePlacement = async (value:string) => {
    if (await placement.isVisible()) await chooseSelectOption(placement,value);
    else await chooseStudioSheetOption(page,"Placement",value);
  };
  await choosePlacement("overlay");
  await chooseUpdates("unknown");
  await expect(frame.getByRole("button",{name:"Load new posts",exact:true})).toBeVisible();
  expect(await geometry()).toEqual(before);
  await choosePlacement("header");
  await chooseUpdates("3");

  const pending = page.getByRole("checkbox",{name:/^(Pending|FeedUpdate prop pending)$/i});
  await pending.check();
  await load.focus();
  await expect(load).toHaveAttribute("aria-busy","true");
  await page.keyboard.press("Enter");
  await expect(frame.getByRole("list",{name:"New posts"})).toHaveCount(0);
  await expect(load).toBeFocused();
  await pending.uncheck();
  await load.focus();
  await page.keyboard.press("Enter");
  const newPosts = frame.getByRole("list",{name:"New posts"});
  await expect(newPosts.locator("#feed-first-new-post")).toBeFocused();
  await expect(newPosts.getByText("The revised mockups are ready for review.")).toBeVisible();
  await expect(load).toHaveCount(0);
  await page.screenshot({path:info.outputPath("feed-update-accepted.png")});
});

test("EnvironmentVariableList distinguishes sealed, referenced and copyable values", async ({page}, info) => {
  await page.addInitScript(()=>{
    Object.defineProperty(navigator.clipboard,"writeText",{value:async (value:string)=>{
      document.documentElement.dataset.clipboard = value;
    }});
  });
  await page.goto("/components/environment-variable-list");
  const preview = page.locator(".preview-stage");
  const production = preview.getByRole("list",{name:"Production variables"});
  const row = (list: typeof production, name:string) => list.getByRole("listitem").filter({hasText:name});
  await expect(row(production,"WEBHOOK_SIGNING_KEY")).toContainText("Sealed");
  await expect(row(production,"DATABASE_URL")).toContainText("Postgres / PRIVATE_URL");
  await expect(row(production,"ASSET_PREFIX")).toContainText("Empty value");
  await expect(production.getByRole("button")).toHaveCount(1);
  await page.evaluate(()=>document.fonts.ready);
  const tracks = await production.getByRole("listitem").evaluateAll(rows=>rows.map(item=>{
    const name = item.querySelector(".flood-data-list-item__title")!.getBoundingClientRect();
    const value = item.querySelector(".flood-data-list-item__details")!.getBoundingClientRect();
    return {nameX:name.x,valueX:value.x};
  }));
  const columns = info.project.name === "desktop";
  expect(tracks.every(track=>track.valueX === tracks[0].valueX && (track.valueX > track.nameX) === columns)).toBe(true);
  await page.screenshot({path:info.outputPath("variables-production.png")});

  const scenario = page.getByRole("combobox",{name:"Scenario",exact:true});
  const chooseScenario = async (value:string) => {
    if (await scenario.isVisible()) await chooseSelectOption(scenario,value);
    else await chooseStudioSheetOption(page,"Scenario",value);
  };
  await chooseScenario("Preview");
  await page.getByRole("checkbox",{name:/^(Narrow width|EnvironmentVariableList prop narrow)$/}).check();
  const variables = preview.getByRole("list",{name:"Preview variables"});
  const url = row(variables,"PUBLIC_APP_URL");
  const value = "https://review-portal-migration.preview.studio.example";
  const text = url.getByRole("code");
  await expect(text).toHaveText(value);
  await expect.poll(()=>text.evaluate(node=>node.scrollWidth > node.clientWidth)).toBe(true);
  await text.focus();
  await expect(page.getByRole("tooltip").filter({hasText:value})).toBeVisible();
  await page.screenshot({path:info.outputPath("variables-preview.png")});
  await page.keyboard.press("Escape");
  await url.getByRole("button",{name:"Copy PUBLIC_APP_URL value"}).click();
  await expect(page.locator("html")).toHaveAttribute("data-clipboard",value);

  await chooseScenario("Empty");
  await expect(preview.getByText("No environment variables.")).toBeVisible();
  await expect(preview.getByRole("button")).toHaveCount(0);
});

test("ConnectionDetails switches the visible parameters and the exact clipboard value together", async ({page}, info) => {
  await page.addInitScript(()=>{
    Object.defineProperty(navigator.clipboard,"writeText",{value:async (value:string)=>{
      document.documentElement.dataset.clipboard = value;
    }});
  });
  await page.goto("/components/connection-details");
  const panel = page.locator(".preview-stage section").filter({has:page.getByRole("heading",{name:"Connect to Postgres"})});
  const method = panel.getByRole("combobox",{name:"Connection method",exact:true});
  const copy = panel.getByRole("button",{name:"Copy connection string",exact:true});
  const clipboard = page.locator("html");
  const direct = "postgresql://postgres:[PASSWORD]@db.studio.example:5432/studio?sslmode=require";
  const transaction = "postgresql://postgres.studio:[PASSWORD]@pooler.studio.example:6543/studio?sslmode=require";
  await expect(panel.getByText(direct,{exact:true})).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:info.outputPath("connection-direct.png")});
  await copy.click();
  await expect(clipboard).toHaveAttribute("data-clipboard",direct);

  await chooseSelectOption(method,"transaction");
  await expect(panel.getByText(direct,{exact:true})).toHaveCount(0);
  await expect(panel.getByText("6543",{exact:true})).toBeVisible();
  await expect(panel.getByText(transaction,{exact:true})).toBeVisible();
  await copy.click();
  await expect(clipboard).toHaveAttribute("data-clipboard",transaction);
  await page.screenshot({path:info.outputPath("connection-transaction.png")});

  const scenario = page.getByRole("combobox",{name:"Scenario",exact:true});
  const chooseScenario = async (value:string) => {
    if (await scenario.isVisible()) await chooseSelectOption(scenario,value);
    else await chooseStudioSheetOption(page,"Scenario",value);
  };
  await chooseScenario("single");
  await expect(method).toHaveCount(0);
  await expect(panel.getByText(direct,{exact:true})).toBeVisible();
  await chooseScenario("empty");
  await expect(panel.getByText("No connection methods available.")).toBeVisible();
  await expect(copy).toHaveCount(0);
});

test("ConnectionDetails withholds endpoint data for blocked or removed profiles", async ({page}, info) => {
  await page.addInitScript(()=>{
    Object.defineProperty(navigator.clipboard,"writeText",{value:async (value:string)=>{
      document.documentElement.dataset.clipboard = value;
    }});
  });
  await page.goto("/components/connection-details");
  const panel = page.locator(".preview-stage .flood-surface");
  const method = panel.getByRole("combobox",{name:"Connection method",exact:true});
  const copy = panel.getByRole("button",{name:"Copy connection string",exact:true});
  const scenario = page.getByRole("combobox",{name:"Scenario",exact:true});
  const chooseScenario = async (value:string) => {
    if (await scenario.isVisible()) await chooseSelectOption(scenario,value);
    else await chooseStudioSheetOption(page,"Scenario",value);
  };
  await expect(copy).toBeVisible();
  await chooseScenario("ipv4-only");
  await expect(method).toHaveText("Direct connection");
  await expect(method).toHaveAccessibleDescription(/This endpoint requires IPv6/);
  await expect(panel.getByText("db.studio.example")).toHaveCount(0);
  await expect(copy).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await panel.screenshot({path:info.outputPath("connection-ipv4-only.png"),animations:"disabled"});

  await chooseSelectOption(method,"transaction");
  await expect(panel.getByText(/Disable prepared statements/)).toBeVisible();
  await expect(copy).toBeVisible();
  await chooseScenario("pooler removed");
  await expect(method).toHaveText("Choose a connection method");
  await expect(method).toHaveAccessibleDescription(/The selected method is unavailable/);
  await expect(copy).toHaveCount(0);

  const narrow = page.getByRole("checkbox",{name:"ConnectionDetails prop narrow"});
  if (await narrow.isVisible()) {
    await narrow.check();
    await chooseSelectOption(page.getByRole("combobox",{name:"ConnectionDetails prop surface"}),"overlay");
  }
  await panel.screenshot({path:info.outputPath("connection-profile-removed.png"),animations:"disabled"});
  await chooseSelectOption(method,"session");
  await expect(copy).toBeVisible();
  await expect(panel.getByText("pooler.studio.example",{exact:true})).toBeVisible();
  await expect(panel.getByText("6543",{exact:true})).toHaveCount(0);
  await copy.click();
  await expect(page.locator("html")).toHaveAttribute("data-clipboard",
    "postgresql://postgres.studio:[PASSWORD]@pooler.studio.example:5432/studio?sslmode=require");
});

test("PriorityIndicator keeps each urgency level on the same axis and reveals compact labels", async ({page}, info) => {
  await page.goto("/components/priority-indicator");
  const queue = page.getByRole("table",{name:"Triage queue"});
  const priorities = queue.locator(".flood-priority-indicator");
  await expect(priorities).toHaveText(["Urgent","High","Medium","Low","No priority"]);
  await expect(priorities.first()).not.toHaveAttribute("tabindex");
  await page.evaluate(()=>document.fonts.ready);
  await queue.screenshot({path:info.outputPath("priority-label.png")});

  const presentation = page.getByRole("combobox",{name:"PriorityIndicator prop presentation",exact:true});
  const choosePresentation = async (value:string) => {
    if (await presentation.isVisible()) await chooseSelectOption(presentation,value);
    else await chooseStudioSheetOption(page,"Presentation",value);
  };
  await choosePresentation("chip");
  await expect(priorities.first()).toHaveAttribute("data-presentation","chip");
  await queue.screenshot({path:info.outputPath("priority-chip.png")});

  await choosePresentation("icon");
  const marks = priorities.locator(".flood-status-indicator__mark");
  const geometry = await marks.evaluateAll(nodes=>nodes.map(node=>{
    const {x,width} = node.getBoundingClientRect();
    return {x,width};
  }));
  expect(geometry).toHaveLength(5);
  expect(geometry.every(mark=>mark.x===geometry[0].x && mark.width===geometry[0].width)).toBe(true);
  await priorities.last().focus();
  await expect(page.getByRole("tooltip").filter({hasText:"No priority"})).toBeVisible();
  await page.screenshot({path:info.outputPath("priority-icon.png")});
});

test("HighlightText marks literal matches in the component and the catalog", async ({page}, info) => {
  await page.setViewportSize({width:1440,height:940});
  await page.goto("/components/highlight-text");
  const text = page.locator(".preview-stage .flood-highlight-text");
  const select = page.getByRole("combobox",{name:"HighlightText prop query",exact:true});
  await expect(text.locator("mark")).toHaveText(["Export","export"]);
  await page.evaluate(()=>document.fonts.ready);
  await text.locator("..").screenshot({path:info.outputPath("highlight-text.png")});
  await page.getByRole("checkbox",{name:"HighlightText prop caseSensitive",exact:true}).check();
  await expect(text.locator("mark")).toHaveText(["export"]);
  await chooseSelectOption(select,"[PDF]");
  await expect(text.locator("mark")).toHaveText(["[PDF]"]);
  await expect(text).toHaveText("Export settings are included in the monthly export [PDF].");
  await expect(text).not.toHaveAttribute("tabindex");
  await chooseSelectOption(select,"none");
  await expect(text.locator("mark")).toHaveCount(0);
  await page.goto("/components");
  const search = page.locator("main .catalog-search").getByRole("searchbox");
  await search.fill("panel");
  const result = page.locator('main a.catalog-card[href="/components/tabs"]');
  await expect(result.locator("mark")).toHaveText(["panel"]);
  await expect(result).toHaveAccessibleName(/Tabs.*panels/i);
  await result.screenshot({path:info.outputPath("highlight-catalog.png")});
  await search.fill("");
  await expect(result.locator("mark")).toHaveCount(0);
});

test("ReplyAudience updates only the accepted policy and preserves the composer draft", async ({page}, info) => {
  await page.goto("/components/reply-audience");
  const stage = page.locator(".preview-stage");
  const field = stage.getByRole("textbox",{ name:"Post" });
  const publish = stage.getByRole("button",{ name:"Publish" });
  const trigger = stage.getByRole("button",{ name:/^Who can reply:/ });
  const menu = page.getByRole("menu",{ name:"Who can reply" });
  const option = (name:string) => menu.getByRole("menuitemradio",{name,exact:true});
  const accept = page.getByRole("checkbox",{name:/^Accept changes$|^ReplyAudience prop accept$/});

  await field.fill("The export is ready for review.");
  await expect(trigger).toHaveAccessibleName("Who can reply: Anyone can reply");
  const before = await publish.boundingBox();
  await trigger.press("Enter");
  await expect(option("Anyone can reply")).toHaveAttribute("aria-checked", "true");
  await expect(option("Invited reviewers")).toHaveAttribute("aria-disabled", "true");
  await option("Members only").press("Enter");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAccessibleName("Who can reply: Members only");
  await expect(field).toHaveValue("The export is ready for review.");
  expect((await publish.boundingBox())?.x).toBeCloseTo(before!.x, 0);
  await page.evaluate(()=>document.fonts.ready);
  await stage.screenshot({path:info.outputPath("reply-audience.png")});

  await accept.uncheck();
  await page.getByRole("checkbox",{name:/^Narrow width$|^ReplyAudience prop narrow$/}).check();
  expect(await stage.locator("form").evaluate(node=>node.scrollWidth-node.clientWidth)).toBeLessThanOrEqual(1);
  expect((await publish.boundingBox())!.y).toBeCloseTo((await trigger.boundingBox())!.y, 0);
  await trigger.click();
  await expect(option("Members only")).toHaveAttribute("aria-checked", "true");
  await menu.evaluate(async node=>{ await Promise.all(node.getAnimations().map(animation=>animation.finished)); });
  await page.screenshot({path:info.outputPath("reply-audience-open.png")});
  await option("Replies off").click();
  await expect(trigger).toHaveAccessibleName("Who can reply: Members only");
  await expect(field).toHaveValue("The export is ready for review.");
  await publish.click();
  await expect(field).toHaveValue("");
});

test("NotificationSubscription keeps the last accepted mode and the same opener width", async ({page}) => {
  await page.goto("/components/notification-subscription");
  const trigger = page.getByRole("button",{name:/^Notifications for Export permissions:/});
  const option = (name:string) => page.getByRole("menuitemradio",{name,exact:true});
  const accept = page.getByRole("checkbox",{name:"NotificationSubscription prop accept",exact:true});
  const width = (await trigger.boundingBox())!.width;
  await trigger.press("Enter");
  await expect(option("Mentions & replies")).toHaveAttribute("aria-checked","true");
  await option("Muted").click();
  await expect(trigger).toHaveAccessibleName("Notifications for Export permissions: Muted");
  await expect(trigger).toBeFocused();
  expect((await trigger.boundingBox())!.width).toBeCloseTo(width,0);
  await accept.uncheck();
  await trigger.press("Enter");
  await expect(option("Muted")).toHaveAttribute("aria-checked","true");
  await option("All updates").click();
  await expect(trigger).toHaveAccessibleName("Notifications for Export permissions: Muted");
  await expect(trigger).toBeFocused();
  await page.getByRole("checkbox",{name:"NotificationSubscription prop disabled",exact:true}).check();
  await expect(trigger).toBeDisabled();
});

test("ParticipantPopover opens a complete roster and restores focus on dismissal", async ({page}) => {
  await page.goto("/components/participant-popover");
  const trigger = page.getByRole("button",{name:/^Subscribers/});
  const panel = page.getByRole("dialog",{name:"Subscribers",exact:true});
  const list = panel.getByRole("list",{name:"Subscribers",exact:true});
  const roster = page.getByRole("combobox",{name:"ParticipantPopover prop roster",exact:true});
  const chooseRoster = async (value:string) => {
    if (await roster.isVisible()) await chooseSelectOption(roster,value);
    else await chooseStudioSheetOption(page,"Roster",value);
  };
  await trigger.press("Enter");
  await expect(list.getByRole("listitem")).toHaveCount(2);
  await expect(list.getByText("Issue owner",{exact:true})).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
  await chooseRoster("Full roster");
  await page.getByRole("checkbox",{name:"ParticipantPopover prop narrow",exact:true}).check();
  await trigger.press("Enter");
  await expect(list.getByRole("listitem")).toHaveCount(8);
  const viewport = panel.locator(".flood-participant-popover__viewport");
  await list.getByText("Noah Patel",{exact:true}).scrollIntoViewIfNeeded();
  expect(await viewport.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await chooseRoster("Empty");
  await trigger.press("Enter");
  await expect(panel.getByText("No subscribers",{exact:true})).toBeVisible();
});

test("ThreadTrigger opens the attached replies and reflects a posted first reply", async ({page}, info) => {
  await page.goto("/components/thread-trigger");
  const stage = page.locator(".preview-stage");
  const trigger = stage.getByRole("button", { name: /^2 replies/ });
  const panel = page.getByRole("dialog", { name: "Replies", exact: true });
  await expect(trigger).toContainText("Unread");
  await expect(trigger.locator("time")).toHaveAttribute("datetime", "2026-11-16T10:42:00Z");
  await expect(trigger.getByRole("img")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({ path: info.outputPath("thread-trigger.png") });
  await page.getByRole("checkbox", { name: /^Narrow width$|^ThreadTrigger prop narrow$/ }).check();
  expect(await trigger.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await trigger.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(panel.getByText("Found the original export.")).toBeVisible();
  await panel.evaluate(async node => { await Promise.all(node.getAnimations().map(animation => animation.finished)); });
  await page.screenshot({ path: info.outputPath("thread-trigger-open.png") });
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();

  const replies = page.getByRole("combobox", { name: /^Replies$|^ThreadTrigger prop replies$/ });
  if (await replies.isVisible()) await chooseSelectOption(replies, "None");
  else await chooseStudioSheetOption(page, "Replies", "None");
  const start = stage.getByRole("button", { name: "Reply", exact: true });
  await expect(start.locator("time")).toHaveCount(0);
  await start.press("Enter");
  const firstReplyPanel = page.getByRole("dialog", { name: "Reply", exact: true });
  await firstReplyPanel.getByRole("textbox", { name: "Reply" }).fill("The export is attached.");
  await firstReplyPanel.getByRole("button", { name: "Send" }).click();
  await expect(firstReplyPanel.getByText("The export is attached.")).toBeVisible();
  await expect(stage.getByRole("button", { name: "1 reply", exact: true })).toHaveAttribute("aria-expanded", "true");
});

test("GroupReadReceipt opens confirmed readers and falls back to delivery metadata when empty", async ({page}, info) => {
  await page.goto("/components/group-read-receipt");
  const stage = page.locator(".preview-stage");
  const trigger = stage.getByRole("button", { name: "Read by 2", exact: true });
  const panel = page.getByRole("dialog", { name: "Read by", exact: true });
  const list = panel.getByRole("list", { name: "Read by", exact: true });
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveClass(/flood-button--ghost/);
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({ path: info.outputPath("group-read-receipt.png") });
  await page.getByRole("checkbox", { name: /^Narrow width$|^GroupReadReceipt prop narrow$/ }).check();
  await trigger.press("Enter");
  await expect(list.getByRole("listitem")).toHaveCount(2);
  await expect(list.getByText("Sam Rivera", { exact: true })).toBeVisible();
  await expect(list.getByText("10:42", { exact: true })).toBeVisible();
  await expect(trigger).toBeFocused();
  await panel.evaluate(async node => { await Promise.all(node.getAnimations().map(animation => animation.finished)); });
  await page.screenshot({ path: info.outputPath("group-read-receipt-open.png") });
  await page.keyboard.press("Tab");
  await expect(panel.getByRole("region", { name: "Read by", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();

  const readers = page.getByRole("combobox", { name: /^Readers$|^GroupReadReceipt prop readers$/ });
  if (await readers.isVisible()) await chooseSelectOption(readers, "None");
  else await chooseStudioSheetOption(page, "Readers", "None");
  await expect(stage.getByRole("button", { name: /^Read by/ })).toHaveCount(0);
  await expect(stage.locator(".flood-message-receipt")).toHaveText("Delivered");
  await expect(stage.getByText("10:24", { exact: true })).toBeVisible();
});

test("MessageReceipt distinguishes delivered, read, and failed for the same outgoing message", async ({page}) => {
  await page.goto("/components/message-receipt");
  const stage = page.locator(".preview-stage");
  const receipt = stage.locator(".flood-message-receipt");
  const state = page.getByRole("combobox",{name:"MessageReceipt prop state",exact:true});
  const chooseState = async (value:string) => {
    if (await state.isVisible()) await chooseSelectOption(state,value);
    else await chooseStudioSheetOption(page,"State",value);
  };
  await expect(receipt).toHaveText("Delivered");
  await expect(stage.getByRole("status")).toHaveCount(0);
  const deliveryGlyph = await receipt.locator("svg").innerHTML();
  await chooseState("read");
  await expect(receipt).toHaveText("Read");
  expect(await receipt.locator("svg").innerHTML()).not.toBe(deliveryGlyph);
  await page.getByRole("checkbox",{name:"MessageReceipt prop announce",exact:true}).check();
  await page.getByRole("checkbox",{name:"MessageReceipt prop narrow",exact:true}).check();
  await chooseState("failed");
  await expect(stage.getByRole("status")).toHaveText("Not sent");
  await expect(receipt).not.toHaveAttribute("tabindex");
  await expect(stage.locator("time")).toHaveText("10:24");
  await expect(stage.getByText("The original export is ready for review.")).toBeVisible();
});

test("TypingIndicator reserves the editor position and respects reduced motion", async ({page}) => {
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/components/typing-indicator");
  const stage = page.locator(".preview-stage");
  const indicator = stage.locator(".flood-typing-indicator");
  const draft = stage.getByRole("textbox",{name:"Message",exact:true});
  await expect(indicator).toContainText("Maya Chen is typing");
  await expect(indicator.locator(".flood-typing-indicator__dots > span").first()).toHaveCSS("animation-name","none");
  await draft.fill("About the export");
  const initialY = (await draft.boundingBox())!.y;
  const participants = page.getByRole("combobox",{name:"TypingIndicator prop participants",exact:true});
  if (await participants.isVisible()) await chooseSelectOption(participants,"Nobody");
  else await chooseStudioSheetOption(page,"Participants","Nobody");
  await expect(indicator).toBeEmpty();
  expect((await draft.boundingBox())!.y).toBeCloseTo(initialY,0);
  await expect(draft).toHaveValue("About the export");
  await page.getByRole("checkbox",{name:"TypingIndicator prop reserveSpace",exact:true}).uncheck();
  await expect(indicator).toHaveCount(0);
});

test("UnreadMarker stays on the first unread message and clears without replacing comments", async ({page}) => {
  await page.goto("/components/unread-marker");
  const thread = page.getByRole("list",{name:"Release discussion",exact:true});
  const marker = thread.locator(".flood-unread-marker");
  const message = thread.locator("#new-export-message");
  await expect(thread.getByRole("article")).toHaveCount(3);
  await expect(marker).toHaveText("New messages");
  await expect(message.locator("xpath=preceding-sibling::*[1]")).toHaveText("New messages");
  await expect(marker).not.toHaveAttribute("tabindex");
  const originalMessage = await message.elementHandle();
  await page.getByRole("checkbox",{name:"UnreadMarker prop narrow",exact:true}).check();
  await page.getByRole("checkbox",{name:"UnreadMarker prop localized",exact:true}).check();
  const badge = (await marker.boundingBox())!;
  const content = (await message.locator(".flood-comment__message").boundingBox())!;
  expect(badge.x).toBeCloseTo(content.x,0);
  expect(badge.x + badge.width).toBeLessThanOrEqual(content.x + content.width + 1);
  await page.getByRole("checkbox",{name:"UnreadMarker prop allRead",exact:true}).check();
  await expect(marker).toHaveCount(0);
  expect(await originalMessage!.evaluate(node => node.isConnected)).toBe(true);
});

test("QuotedPost keeps its source link separate and drops the excerpt when the source is unavailable", async ({page}) => {
  await page.goto("/components/quoted-post");
  const comment = page.locator(".preview-stage").getByRole("article");
  const quote = comment.locator("blockquote");
  const original = comment.getByRole("link",{name:"View original",exact:true});
  const source = "https://bsky.social/about/blog/10-31-2025-building-healthier-social-media-update";
  await expect(quote).toHaveAttribute("cite",source);
  await expect(original).toHaveAttribute("href",source);
  await expect(quote.getByRole("link")).toHaveCount(0);
  await page.getByRole("checkbox",{name:"QuotedPost prop narrow",exact:true}).check();
  expect(await quote.evaluate(element => element.scrollWidth)).toBeLessThanOrEqual(await quote.evaluate(element => element.clientWidth));
  await original.focus();
  await expect(original).toBeFocused();
  await page.getByRole("checkbox",{name:"QuotedPost prop unavailable",exact:true}).check();
  await expect(comment.getByText("Quoted post unavailable",{exact:true})).toBeVisible();
  await expect(comment.getByText("I’d keep this in mind", {exact:false})).toBeVisible();
  await expect(comment.getByText("Bluesky Team",{exact:true})).toHaveCount(0);
  await expect(quote).toHaveCount(0);
  await expect(original).toHaveCount(0);
});

test("QuotedPost embeds provenance within the author row on narrow surfaces", async ({page}, info) => {
  await page.goto("/components/quoted-post");
  const appearance = page.getByRole("combobox",{name:/^Appearance$|^QuotedPost prop appearance$/});
  if (await appearance.isVisible()) await chooseSelectOption(appearance,"embedded");
  else await chooseStudioSheetOption(page,"Appearance","embedded");
  const surface = page.getByRole("combobox",{name:/^Surface$|^QuotedPost prop surface$/});
  if (await surface.isVisible()) await chooseSelectOption(surface,"overlay");
  else await chooseStudioSheetOption(page,"Surface","overlay");
  await page.getByRole("checkbox",{name:/^Narrow width$|^QuotedPost prop narrow$/}).check();
  const embedded = page.locator(".preview-stage .flood-quoted-post[data-appearance='embedded']");
  const author = embedded.getByText("Bluesky Team",{exact:true});
  const link = embedded.locator(".flood-author-meta").getByRole("link",{name:"Bluesky blog",exact:true});
  const quote = embedded.locator("blockquote");
  await expect(embedded).toHaveCSS("border-inline-start-width","0px");
  await expect(embedded.locator("time")).toHaveAttribute("datetime","2025-10-31");
  await expect(link).toHaveAttribute("href",await quote.getAttribute("cite") ?? "");
  await page.evaluate(()=>document.fonts.ready);
  expect((await author.boundingBox())?.x).toBeCloseTo((await quote.boundingBox())?.x ?? 0);
  await page.screenshot({path:info.outputPath("quoted-post-embedded.png")});
  await link.focus();
  await expect(link).toBeFocused();

  await page.getByRole("checkbox",{name:/^Unavailable source$|^QuotedPost prop unavailable$/}).check();
  await expect(embedded.getByText("Quoted post unavailable",{exact:true})).toBeVisible();
  await expect(embedded.getByRole("link")).toHaveCount(0);
  await expect(embedded.locator("time")).toHaveCount(0);
  await expect(quote).toHaveCount(0);
});

test("ReplyReference reaches the original comment and removes protected content when unavailable", async ({page}) => {
  await page.goto("/components/reply-reference");
  const thread = page.getByRole("list",{name:"Attachment review",exact:true});
  const reference = thread.locator(".flood-reply-reference");
  const original = thread.locator("#review-request");
  const link = reference.getByRole("link",{name:"In reply to Maya Chen",exact:true});
  await expect(link).toHaveAttribute("href","#review-request");
  await link.press("Enter");
  await expect(page).toHaveURL(/#review-request$/);
  await expect(original).toBeFocused();
  await page.getByRole("checkbox",{name:"ReplyReference prop narrow",exact:true}).check();
  const excerpt = reference.locator(".flood-truncated-text");
  await expect(excerpt).toHaveAttribute("tabindex","0");
  await excerpt.focus();
  await expect(page.getByRole("tooltip")).toHaveText("Could you include the original attachment before we send this for review?");
  await page.getByRole("checkbox",{name:"ReplyReference prop unavailable",exact:true}).check();
  await expect(reference.getByText("Original message unavailable")).toBeVisible();
  await expect(reference.getByRole("link")).toHaveCount(0);
  await expect(excerpt).toHaveCount(0);
  await expect(original).toHaveCount(0);
});

test("Mention wraps in a narrow comment and keeps one link to the resolved profile", async ({page}) => {
  await page.goto("/components/mention");
  const stage = page.locator(".preview-stage");
  const knob = (name:string) => page.getByRole("checkbox",{name:`Mention prop ${name}`,exact:true});
  const mention = stage.locator(".flood-mention");
  await expect(mention.getByRole("link",{name:"@bsky.app",exact:true})).toHaveAttribute("href","https://bsky.app/profile/bsky.app");
  await knob("narrow").check();
  await knob("alias").check();
  const alias = mention.getByRole("link",{name:"@BlueskyProtocolDocumentation (@bsky.app)",exact:true});
  await expect(alias).toBeVisible();
  await alias.focus();
  await expect(alias).toBeFocused();
  expect(await alias.locator("bdi").evaluate(element => element.getClientRects().length)).toBeGreaterThan(1);
  await knob("rtl").check();
  await expect(mention.locator("bdi")).toHaveCSS("direction","rtl");
  await knob("linked").uncheck();
  await expect(mention.getByRole("link")).toHaveCount(0);
  await expect(mention).toHaveText("@فريق بلوسكاي");
});

test("DeploymentHistory keeps the active deployment visible until its replacement takes over", async ({page}) => {
  await page.goto("/components/deployment-history");
  const history = page.getByRole("list",{name:"Production deployments",exact:true});
  const newest = history.getByRole("listitem").filter({hasText:"Validate export permissions"});
  const previous = history.getByRole("listitem").filter({hasText:"Stabilize preview exports"});
  const scenario = page.getByRole("combobox",{name:"Scenario",exact:true});
  const selectScenario = async (value:string) => {
    if (await scenario.isVisible()) await chooseSelectOption(scenario,value);
    else await chooseStudioSheetOption(page,"Scenario",value);
  };
  const newestStatus = newest.locator(".flood-status-indicator__label");
  const previousStatus = previous.locator(".flood-status-indicator__label");
  await expect(newestStatus).toHaveText("Failed");
  await expect(newest.getByText("Health check timed out.")).toBeVisible();
  await expect(previousStatus).toHaveText("Active");
  const originalAction = await newest.getByRole("button",{name:"Copy deployment ID run-42"}).elementHandle();
  await page.getByRole("checkbox",{name:"DeploymentHistory prop narrow",exact:true}).check();
  await selectScenario("Building");
  await expect(newestStatus).toHaveText("Building");
  await expect(previousStatus).toHaveText("Active");
  await expect(newest.getByText("Health check timed out.")).toHaveCount(0);
  await selectScenario("Active");
  await expect(newestStatus).toHaveText("Active");
  await expect(previousStatus).toHaveText("Superseded");
  expect(await originalAction!.evaluate(node => node.isConnected)).toBe(true);
  await selectScenario("Empty");
  await expect(history.getByText("No deployments yet")).toBeVisible();
});

test("CommitList copies the full hash while keeping the short hash and commit destination", async ({page}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {value:{writeText: async (value:string) => {
      document.documentElement.dataset.testClipboard = value;
    }}});
  });
  await page.goto("/components/commit-list");
  const history = page.getByRole("list",{name:"Commits",exact:true});
  const firstRow = history.getByRole("listitem").first();
  const copy = firstRow.getByRole("button",{name:/Copy commit hash e709326/});
  const message = firstRow.getByRole("link",{name:/add sentry/});
  const fullHash = "e7093263eba6e9df48a73e9673f400bfaee2efff";
  await expect(message).toHaveAttribute("href",`https://github.com/supabase/supabase/commit/${fullHash}`);
  await page.getByRole("checkbox",{name:"CommitList prop narrow",exact:true}).check();
  const date = await firstRow.locator("time").boundingBox();
  expect((await copy.boundingBox())!.y).toBeGreaterThanOrEqual(date!.y + date!.height);
  const width = (await copy.boundingBox())!.width;
  await copy.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-test-clipboard",fullHash);
  await expect(firstRow.getByRole("status")).toHaveText("Copied");
  const copied = firstRow.getByRole("button",{name:/Copied: Copy commit hash e709326/});
  await expect(copied).toBeFocused();
  expect((await copied.boundingBox())!.width).toBeCloseTo(width,0);
  await expect(firstRow.locator(".flood-git-ref")).toContainText("e709326");
  await page.getByRole("checkbox",{name:"CommitList prop empty",exact:true}).check();
  await expect(history.getByText("No commits in this release")).toBeVisible();
});

test("GitRef preserves a clipped branch suffix and keeps deployment metadata visible", async ({page}) => {
  await page.goto("/components/git-ref");
  const deployments = page.getByRole("list",{name:"Deployments",exact:true});
  const branch = deployments.getByRole("listitem").filter({hasText:"Preview"});
  const value = branch.locator(".flood-truncated-text");
  await expect(deployments.getByRole("listitem")).toHaveCount(3);
  await page.getByRole("checkbox",{name:"GitRef prop narrow",exact:true}).check();
  await expect(value).toHaveAttribute("tabindex","0");
  await expect(value.locator("span").last()).toHaveText("import-preview");
  await value.focus();
  await expect(page.getByRole("tooltip")).toHaveText("feature/billing/reconciliation/import-preview");
  await expect(branch.getByText("Preview",{exact:true})).toBeVisible();
  await expect(deployments.locator(".flood-truncated-text").filter({hasText:"v0.2.15"})).not.toHaveAttribute("tabindex");
});

test("CheckRunList distinguishes a missing required report from a skipped check", async ({page},info) => {
  await page.goto("/components/check-run-list");
  const list = page.getByRole("list",{name:"Checks for this revision",exact:true});
  const item = (name:string) => list.getByRole("listitem").filter({hasText:name});
  const browser = item("Browser tests");
  const evidence = browser.getByRole("link",{name:"Browser tests",exact:true});
  const snapshots = item("Visual snapshots");
  await expect(browser).toContainText("Failed");
  await expect(browser).toContainText("Blocks merge");
  await expect(snapshots).toContainText("Skipped");
  await expect(snapshots.getByText("Blocks merge")).toHaveCount(0);
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:info.outputPath("check-run-list.png")});
  await evidence.focus();
  await evidence.press("Enter");
  await expect(page).toHaveURL(/#browser-check-log$/);
  await expect(page.locator("#browser-check-log")).toBeFocused();

  const choose = async (label:string,value:string) => {
    const control = page.getByRole("combobox",{name:new RegExp(`^${label}$|^CheckRunList prop ${label.toLowerCase()}$`)});
    if (await control.isVisible()) await chooseSelectOption(control,value);
    else await chooseStudioSheetOption(page,label,value);
  };
  await choose("Scenario","Missing report");
  await expect(item("Package verification")).toContainText("Not reported");
  await expect(item("Package verification")).toContainText("Blocks merge");
  await expect(browser).toContainText("Running");
  await choose("Surface","overlay");
  await page.getByRole("checkbox",{name:/^Narrow width$|^CheckRunList prop narrow$/}).check();
  expect(await list.evaluate(node=>node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  const result = item("Package verification").locator(".flood-status-indicator__label");
  expect(await result.evaluate(node=>node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  const title = item("Package verification").locator(".flood-data-list-item__title .flood-inline");
  expect(Math.abs((await result.boundingBox())!.y - (await title.boundingBox())!.y)).toBeLessThan(6);
  await page.screenshot({path:info.outputPath("check-run-list-narrow.png")});
  await choose("Scenario","Ready");
  await expect(list.getByText("Blocks merge")).toHaveCount(0);
  await expect(snapshots).toContainText("Skipped");
  await page.getByRole("checkbox",{name:/^Empty$|^CheckRunList prop empty$/}).check();
  await expect(list.getByText("No checks reported.")).toBeVisible();
});

test("ChangedFileList keeps review independent from navigation to the actual diff", async ({page},info) => {
  await page.goto("/components/changed-file-list");
  const list = page.getByRole("list",{name:"Files in export review",exact:true});
  const panel = list.getByRole("link",{name:/ReviewPanel\.tsx$/});
  const reviewed = list.getByRole("checkbox",{name:/ReviewPanel\.tsx$/});
  const fixture = list.getByRole("checkbox",{name:/review-fixture\.ts$/});
  await expect(fixture).toBeChecked();
  await expect(panel).toHaveAttribute("href","#changed-file-panel");
  await page.evaluate(()=>document.fonts.ready);
  await list.screenshot({path:info.outputPath("changed-file-list.png")});
  const initial = await panel.boundingBox();
  await reviewed.focus();
  await reviewed.press("Space");
  await expect(reviewed).toBeChecked();
  await expect(reviewed).toBeFocused();
  await expect(page).not.toHaveURL(/#changed-file-panel$/);
  expect((await panel.boundingBox())!.x).toBeCloseTo(initial!.x,0);
  expect((await panel.boundingBox())!.y).toBeCloseTo(initial!.y,0);
  await panel.focus();
  await panel.press("Enter");
  await expect(page).toHaveURL(/#changed-file-panel$/);
  await expect(page.locator("#changed-file-panel")).toBeFocused();
  await expect(page.getByRole("table",{name:"ReviewPanel changes"})).toBeVisible();

  await page.getByRole("checkbox",{name:/^Narrow width$|^ChangedFileList prop narrow$/}).check();
  expect(await list.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  const anchor = (await panel.boundingBox())!;
  const control = (await reviewed.boundingBox())!;
  expect(control.y + control.height / 2).toBeCloseTo(anchor.y + anchor.height / 2,-1);
  await list.screenshot({path:info.outputPath("changed-file-list-narrow.png")});
  await page.getByRole("checkbox",{name:/^Review controls$|^ChangedFileList prop reviewable$/}).uncheck();
  await expect(list.getByRole("checkbox")).toHaveCount(0);
  await expect(list.getByText("Reviewed",{exact:true})).toHaveCount(2);
  await page.getByRole("checkbox",{name:/^Empty$|^ChangedFileList prop empty$/}).check();
  await expect(list.getByText("No changed files.")).toBeVisible();
});

test("FilePath shortens the directory before the file name and reveals the exact path", async ({page},info) => {
  await page.goto("/components/file-path");
  const stage = page.locator(".preview-stage");
  const path = stage.locator(".flood-file-path");
  const line = path.locator(".flood-file-name__line");
  const directory = path.locator(".flood-file-path__directory");
  const name = path.locator(".flood-file-path__name");
  const exact = "packages/workspace/src/views/export/ReviewPanel.tsx";
  await expect(line).toHaveAttribute("tabindex","0");
  await expect(name).toHaveText("ReviewPanel.tsx");
  expect(await directory.evaluate(node => node.scrollWidth - node.clientWidth)).toBeGreaterThan(0);
  expect(await name.locator("span").evaluateAll(nodes => nodes.every(node => node.scrollWidth <= node.clientWidth))).toBe(true);
  await page.evaluate(()=>document.fonts.ready);
  await stage.screenshot({path:info.outputPath("file-path.png")});
  await line.focus();
  await expect(page.getByRole("tooltip")).toHaveText(exact);

  const platform = page.getByRole("combobox",{name:/^Platform$|^FilePath prop platform$/});
  if (await platform.isVisible()) await chooseSelectOption(platform,"Windows");
  else await chooseStudioSheetOption(page,"Platform","Windows");
  await page.getByRole("checkbox",{name:/^Linked$|^FilePath prop linked$/}).check();
  const windowsPath = "C:\\work\\packages\\workspace\\src\\views\\export\\ReviewPanel.tsx";
  const link = stage.getByRole("link",{name:windowsPath,exact:true});
  await expect(link).toHaveAttribute("href","#reviewed-path");
  await link.focus();
  await expect(page.getByRole("tooltip")).toHaveText(windowsPath);
  await page.screenshot({path:info.outputPath("file-path-tooltip.png"),animations:"disabled"});
  await link.press("Enter");
  await expect(page).toHaveURL(/#reviewed-path$/);
  await expect(stage.locator("#reviewed-path")).toBeFocused();
});

test("TruncatedText adds disclosure and a Tab stop only while clipped", async ({page}) => {
  await page.goto("/components/truncated-text");
  const text = page.locator(".preview-stage .flood-truncated-text");
  const narrow = page.getByRole("checkbox",{name:"TruncatedText prop constrainWidth",exact:true});
  await expect(text).toHaveAttribute("tabindex","0");
  await text.hover();
  await expect(page.getByRole("tooltip")).toHaveText("Workspace activity export for October 2026.csv");
  await narrow.uncheck();
  await expect(text).not.toHaveAttribute("tabindex");
  await expect(page.getByRole("tooltip")).toBeHidden();
});

for (const zoom of ["100%", "125%", "75%"]) test(`TruncatedText centers the tooltip on each side at ${zoom}`, async ({page}, info) => {
  await page.setViewportSize({width:1440,height:900});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/components/truncated-text");
  const text = page.locator(".preview-stage .flood-truncated-text");
  const sideControl = page.getByRole("combobox",{name:"TruncatedText prop tooltipSide"});
  const tooltip = page.getByRole("tooltip");
  if (zoom !== "100%") await chooseSelectOption(page.getByRole("combobox",{name:"Canvas zoom",exact:true}),zoom.slice(0,-1));
  for (const side of ["bottom","top","left","right"]) {
    await chooseSelectOption(sideControl,side);
    if (zoom === "75%") await text.hover();
    else await text.focus();
    await expect(tooltip).toBeVisible();
    await expect.poll(async () => {
      const [anchor, hint] = await Promise.all([text.boundingBox(),tooltip.boundingBox()]);
      if (!anchor || !hint) return Infinity;
      const vertical = side === "bottom" || side === "top";
      return Math.abs(vertical ? anchor.x + anchor.width / 2 - hint.x - hint.width / 2
        : anchor.y + anchor.height / 2 - hint.y - hint.height / 2);
    }).toBeLessThan(1);
    await expect(tooltip).toHaveAttribute("data-side", side);
    await expect.poll(async () => {
      const [anchor, hint] = await Promise.all([text.boundingBox(),tooltip.boundingBox()]);
      if (!anchor || !hint) return Infinity;
      const gap = {bottom:hint.y - anchor.y - anchor.height,top:anchor.y - hint.y - hint.height,
        right:hint.x - anchor.x - anchor.width,left:anchor.x - hint.x - hint.width}[side]!;
      return Math.abs(gap - 8 * parseInt(zoom,10) / 100);
    }).toBeLessThan(1);
    await page.locator(".preview-stage").screenshot({path:info.outputPath(`truncated-text-${side}.png`)});
    await page.keyboard.press("Escape");
    await expect(tooltip).toBeHidden();
  }
});

test("MetricGroup shows real zero, loading and unavailable without moving the value row", async ({page}, info) => {
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/components/metric-group");
  const group=page.getByRole("group",{name:"API performance",exact:true});
  const requests=group.locator("dl").filter({has:page.getByText("Requests",{exact:true})});
  const latency=group.locator("dl").filter({hasText:"P95 response time"});
  const availability=group.locator("dl").filter({has:page.getByText("Availability",{exact:true})});
  const value=(item:typeof requests)=>item.locator(".flood-metric__value");
  const valueHeight=()=>value(latency).evaluate(node=>node.clientHeight);
  await expect(value(requests)).toHaveText("1.2M");
  await page.evaluate(()=>document.fonts.ready);
  const height=await valueHeight();
  const scenario=page.getByRole("combobox",{name:"Scenario",exact:true});
  if (await scenario.isVisible()) await chooseSelectOption(scenario,"mixed");
  else await chooseStudioSheetOption(page,"Scenario","mixed");
  await expect(value(requests)).toHaveText("0");
  await expect(latency).toHaveAttribute("aria-busy","true");
  await expect(value(latency).locator(".flood-visually-hidden")).toHaveText("Loading");
  await expect(value(latency).locator(".flood-skeleton")).toHaveCSS("animation-name","none");
  await expect(latency.getByText("8% lower",{exact:true})).toBeHidden();
  await expect(value(availability)).toContainText("—");
  await expect(value(availability).locator(".flood-visually-hidden")).toHaveText("Unavailable");
  expect(await valueHeight()).toBe(height);
  await group.screenshot({path:info.outputPath("metric-group-mixed.png")});
});

test("MetricGroup keeps clipped labels on one line and aligns its values", async ({page}, info) => {
  await page.setViewportSize({width:1440,height:940});
  await page.goto("/components/metric-group");
  const group = page.getByRole("group",{name:"API performance",exact:true});
  await expect(group.locator("dl")).toHaveCount(3);
  await page.evaluate(()=>document.fonts.ready);
  const valueLocations = () => group.locator(".flood-metric__value").evaluateAll(nodes=>nodes.map(node=>{
    const {x,y}=node.getBoundingClientRect();
    return {x,y};
  }));
  const labels = group.locator("dt .flood-truncated-text");
  const shortLabel = labels.filter({hasText:/^P95 response time$/});
  await expect(shortLabel).not.toHaveAttribute("tabindex");
  await group.screenshot({path:info.outputPath("metric-group-short-labels.png")});
  await page.getByRole("checkbox",{name:"MetricGroup prop longLabel"}).check();
  const longLabel = labels.filter({hasText:/^P95 response time across all regions$/});
  await expect(longLabel).toHaveAttribute("tabindex","0");
  await expect(longLabel).toHaveCSS("text-overflow","ellipsis");
  expect(await longLabel.evaluate(node=>node.clientHeight)).toBe(await labels.first().evaluate(node=>node.clientHeight));
  const rhythm = await longLabel.locator("xpath=ancestor::dl").evaluate(item=>{
    const label=item.querySelector("dt")!.getBoundingClientRect();
    const value=item.querySelector(".flood-metric__value")!.getBoundingClientRect();
    const trend=item.querySelector(".flood-metric__trend")!.getBoundingClientRect();
    return [value.top-label.bottom,trend.top-value.bottom];
  });
  expect(rhythm[1]).toBeGreaterThan(0);
  expect(rhythm[0]).toBeGreaterThan(rhythm[1]);
  const wide=await valueLocations();
  expect(wide[0].y).toBeCloseTo(wide[1].y,1);
  expect(wide[0].y).toBeCloseTo(wide[2].y,1);
  expect(wide[2].x).toBeGreaterThan(wide[1].x);
  await chooseSelectOption(page.getByRole("combobox",{name:"MetricGroup prop appearance"}),"panel");
  await expect(group).toHaveClass(/flood-metric-group__panel/);
  await group.screenshot({path:info.outputPath("metric-group-panel.png")});
  await longLabel.focus();
  await expect(page.getByRole("tooltip").filter({hasText:"P95 response time across all regions"})).toBeVisible();
  await page.locator(".preview-stage").screenshot({path:info.outputPath("metric-group-label-tooltip.png")});
  await page.keyboard.press("Escape");
  await page.getByRole("checkbox",{name:"MetricGroup prop narrow"}).check();
  const narrow=await valueLocations();
  expect(narrow[2].x).toBeCloseTo(narrow[0].x,1);
  expect(narrow[2].y).toBeGreaterThan(narrow[1].y);
  expect(narrow[1].y).toBeGreaterThan(narrow[0].y);
  await group.screenshot({path:info.outputPath("metric-group-narrow.png")});

  await page.getByRole("checkbox",{name:"MetricGroup prop narrow"}).uncheck();
  await chooseSelectOption(page.getByRole("combobox",{name:"MetricGroup prop layout"}),"rows");
  const valueEdges = () => group.locator(".flood-metric__value").evaluateAll(nodes=>nodes.map(node=>{
    const {right,top}=node.getBoundingClientRect();
    return {right,top};
  }));
  const rows = await valueEdges();
  expect(rows[1].right).toBeCloseTo(rows[0].right,1);
  expect(rows[2].right).toBeCloseTo(rows[0].right,1);
  expect(rows[2].top).toBeGreaterThan(rows[1].top);
  expect((await longLabel.boundingBox())!.x).toBeLessThan((await group.getByText("186", {exact:false}).boundingBox())!.x);
  await group.screenshot({path:info.outputPath("metric-group-rows.png")});
  await chooseSelectOption(page.getByRole("combobox",{name:"Scenario",exact:true}),"loading");
  const pending = await valueEdges();
  expect(pending.map(edge=>edge.top-pending[0].top)).toEqual(rows.map(edge=>edge.top-rows[0].top));
  const trendSkeleton = (await group.locator(".flood-metric__trend-placeholder").boundingBox())!;
  expect(trendSkeleton.x+trendSkeleton.width).toBeCloseTo(pending[1].right,1);
  await group.screenshot({path:info.outputPath("metric-group-rows-loading.png")});
  await chooseSelectOption(page.getByRole("combobox",{name:"Scenario",exact:true}),"ready");
  await page.getByRole("checkbox",{name:"MetricGroup prop narrow"}).check();
  const stackedValue = group.locator(".flood-metric__value").nth(1);
  await expect(longLabel).toHaveAttribute("tabindex","0");
  expect((await stackedValue.boundingBox())!.y).toBeGreaterThan((await longLabel.boundingBox())!.y);
  expect((await stackedValue.boundingBox())!.x).toBeCloseTo((await longLabel.boundingBox())!.x,1);
  await group.screenshot({path:info.outputPath("metric-group-rows-narrow.png")});

  await page.getByRole("checkbox",{name:"MetricGroup prop longValue",exact:true}).check();
  await chooseSelectOption(page.getByRole("combobox",{name:"MetricGroup prop size",exact:true}),"lg");
  await expect(stackedValue).toHaveText("1,234.56 ms");
  const measure = await stackedValue.evaluate(node => ({
    width: node.clientWidth, scrollWidth: node.scrollWidth,
    height: node.clientHeight, lineHeight: parseFloat(getComputedStyle(node).lineHeight),
  }));
  expect(measure.height).toBeCloseTo(measure.lineHeight,0);
  expect(measure.scrollWidth).toBeLessThanOrEqual(measure.width + 1);
  await longLabel.focus();
  await expect(page.getByRole("tooltip").filter({hasText:"P95 response time across all regions"})).toBeVisible();
  await page.keyboard.press("Escape");
});

test("MetricDelta keeps its period outside both treatments and allows a favorable decrease", async ({page}, info) => {
  await page.goto("/components/metric-delta");
  const comparison = page.locator(".preview-stage .flood-metric-delta");
  const period = comparison.getByText("vs last week", {exact:true});
  await expect(comparison.locator(".flood-badge")).toHaveCount(0);
  await expect(period).toBeVisible();
  await comparison.screenshot({path:info.outputPath("metric-delta-plain.png")});
  await chooseSelectOption(page.getByRole("combobox",{name:"MetricDelta prop tone"}),"success");
  await chooseSelectOption(page.getByRole("combobox",{name:"MetricDelta prop variant"}),"chip");
  await expect(comparison).toHaveAttribute("data-tone", "success");
  await expect(comparison.locator(".flood-badge")).toContainText("8% lower");
  await expect(comparison.locator(".flood-badge")).not.toContainText("vs last week");
  await expect(period).toBeVisible();
  await comparison.screenshot({path:info.outputPath("metric-delta-chip.png")});
});

test("MetricCard keeps the comparison readable and reflows a named plot within its surface", async ({page}, info) => {
  await page.goto("/components/metric-card");
  const card = page.locator(".preview-stage .flood-metric-card");
  const metric = card.locator("dl");
  const plot = card.getByRole("img",{name:/six months of revenue/i});
  const value = metric.getByText("$24,580",{exact:true});
  const change = metric.getByText("12.8% higher",{exact:true});
  const context = metric.getByText("vs last month",{exact:true});
  await expect(plot).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
  expect((await plot.boundingBox())!.x).toBeGreaterThan((await value.boundingBox())!.x);
  expect((await plot.boundingBox())!.y).toBeLessThan((await metric.boundingBox())!.y + (await metric.boundingBox())!.height);
  expect(await change.evaluate(node=>getComputedStyle(node).color)).not.toBe(await context.evaluate(node=>getComputedStyle(node).color));
  await card.screenshot({path:info.outputPath("metric-card-inline.png")});
  const treatment = page.getByRole("combobox",{name:"MetricCard prop comparisonStyle",exact:true});
  await chooseSelectOption(treatment,"chip");
  await expect(metric.locator(".flood-metric-delta .flood-badge")).toContainText("12.8% higher");
  await card.screenshot({path:info.outputPath("metric-card-chip.png")});

  const chart = card.locator(".flood-metric-card__chart");
  const state = page.getByRole("combobox",{name:"MetricCard prop state",exact:true});
  const readyHeight = (await card.boundingBox())!.height;
  const readyChart = (await chart.boundingBox())!;
  await chooseSelectOption(state,"loading");
  await expect(chart).toHaveAttribute("aria-busy","true");
  await expect(chart.locator(".flood-skeleton")).toBeVisible();
  await expect(plot).toHaveCount(0);
  await expect(change).toBeHidden();
  expect((await card.boundingBox())!.height).toBeCloseTo(readyHeight,0);
  expect((await chart.boundingBox())!.y).toBeCloseTo(readyChart.y,0);
  await card.screenshot({path:info.outputPath("metric-card-loading.png")});
  await chooseSelectOption(state,"ready");
  await expect(plot).toBeVisible();
  const chartState = page.getByRole("combobox",{name:"MetricCard prop chartState",exact:true});
  await chooseSelectOption(chartState,"loading");
  await expect(value).toBeVisible();
  await expect(plot).toHaveCount(0);
  await expect(chart.locator(".flood-skeleton")).toBeVisible();
  await chooseSelectOption(chartState,"ready");
  await chooseSelectOption(state,"loading");
  await expect(plot).toBeVisible();
  await expect(value).toHaveCount(0);
  await chooseSelectOption(chartState,"follow metric");
  await chooseSelectOption(state,"ready");

  await page.getByRole("checkbox",{name:"MetricCard prop narrow",exact:true}).check();
  await page.evaluate(()=>{document.documentElement.dir="rtl"; document.documentElement.style.fontSize="20px";});
  expect((await plot.boundingBox())!.y).toBeGreaterThan((await metric.boundingBox())!.y + (await metric.boundingBox())!.height);
  expect((await plot.boundingBox())!.width).toBeCloseTo((await metric.boundingBox())!.width,0);
  expect(await card.evaluate(node=>node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await expect(value).toBeVisible();

  await chooseSelectOption(page.getByRole("combobox",{name:"MetricCard prop layout",exact:true}),"stacked");
  expect((await plot.boundingBox())!.width).toBeCloseTo((await metric.boundingBox())!.width,0);
  await card.screenshot({path:info.outputPath("metric-card-stacked.png")});
  await page.getByRole("checkbox",{name:"MetricCard prop showChartLabel",exact:true}).check();
  await expect(chart.getByText("Six-month trend",{exact:true})).toBeVisible();
  const labeledCard = (await card.boundingBox())!;
  const labeledChart = (await chart.boundingBox())!;
  await card.screenshot({path:info.outputPath("metric-card-labeled-ready.png")});
  await chooseSelectOption(chartState,"loading");
  await expect(value).toBeVisible();
  const placeholder = chart.locator(".flood-skeleton");
  await expect(placeholder).toBeVisible();
  expect((await card.boundingBox())!.height).toBeCloseTo(labeledCard.height,0);
  expect((await placeholder.boundingBox())!.height).toBeCloseTo(labeledChart.height,0);
  await card.screenshot({path:info.outputPath("metric-card-labeled-loading.png")});
  await page.getByRole("checkbox",{name:"MetricCard prop showChart",exact:true}).uncheck();
  await expect(card.locator(".flood-metric-card__chart")).toHaveCount(0);
  await expect(context).toBeVisible();
});

test("supporting facts wrap with their icons and stay attached to the record title", async ({page}, info) => {
  await page.goto("/components/metadata-list");
  const facts = page.getByRole("list",{name:"Project details",exact:true});
  await expect(facts.getByRole("listitem")).toHaveCount(2);
  await expect(facts.locator("time")).toHaveAttribute("datetime","2026-11-14");
  await expect(facts.locator(".flood-icon[aria-hidden='true']")).toHaveCount(2);
  await page.getByRole("checkbox",{name:"MetadataList prop narrow",exact:true}).check();
  await page.getByRole("checkbox",{name:"MetadataList prop longValue",exact:true}).check();
  await page.evaluate(()=>{document.documentElement.dir="rtl";document.documentElement.style.fontSize="20px";});
  await page.evaluate(()=>document.fonts.ready);
  const placement = await facts.evaluate(list => {
    const first = list.querySelector("li")!;
    const value = first.querySelector(".flood-metadata-list__value")!;
    const glyph = first.querySelector(".flood-icon")!;
    const valueBox = value.getBoundingClientRect();
    const glyphBox = glyph.getBoundingClientRect();
    return {
      wrapped: valueBox.height > parseFloat(getComputedStyle(value).lineHeight),
      readingOrder: glyphBox.left > valueBox.right,
      aligned: Math.abs(glyphBox.top + glyphBox.height / 2 - valueBox.top - parseFloat(getComputedStyle(value).lineHeight) / 2) < 1,
      overflow: list.scrollWidth - list.clientWidth,
    };
  });
  expect(placement).toEqual({wrapped:true,readingOrder:true,aligned:true,overflow:0});
  await facts.screenshot({path:info.outputPath("metadata-list-narrow.png")});

  await page.goto("/components/data-list-item");
  await page.getByRole("checkbox",{name:"DataListItem prop showDetails",exact:true}).check();
  const row = page.locator(".preview-stage .flood-data-list-item");
  const details = row.getByRole("list",{name:"Design system details",exact:true});
  const title = row.getByRole("link",{name:"Design system",exact:true});
  const action = row.getByRole("button",{name:"Manage",exact:true});
  await expect(details.getByRole("listitem")).toHaveText(["Design team","8 members"]);
  expect((await details.boundingBox())!.x).toBeCloseTo((await title.boundingBox())!.x,0);
  await title.focus();
  await page.keyboard.press("Tab");
  await expect(action).toBeFocused();
});

test("AuthorMeta places short dates inline and reveals clipped names", async ({page}, info) => {
  await page.goto("/components/author-meta");
  const author = page.locator(".preview-stage .flood-author-meta");
  const name = author.locator(".flood-author-meta__name");
  const time = author.locator("time");
  await expect(name).toHaveText("Maya Chen");
  const [stackedName, stackedTime] = await Promise.all([name.boundingBox(), time.boundingBox()]);
  expect(stackedTime!.y).toBeGreaterThan(stackedName!.y + stackedName!.height / 2);
  await author.screenshot({path:info.outputPath("author-stacked.png")});
  await chooseSelectOption(page.getByRole("combobox",{name:"AuthorMeta prop metadataPlacement"}),"inline");
  const [inlineName, inlineTime] = await Promise.all([name.boundingBox(), time.boundingBox()]);
  expect(inlineTime!.x).toBeGreaterThan(inlineName!.x + inlineName!.width);
  expect(inlineTime!.y).toBeLessThan(inlineName!.y + inlineName!.height);
  await author.screenshot({path:info.outputPath("author-inline.png")});
  await page.getByRole("checkbox",{name:"AuthorMeta prop longName"}).check();
  await page.getByRole("checkbox",{name:"AuthorMeta prop constrainWidth"}).check();
  await chooseSelectOption(page.getByRole("combobox",{name:"AuthorMeta prop nameOverflow"}),"truncate");
  const truncated = name.locator(".flood-truncated-text");
  await expect(truncated).toHaveAttribute("tabindex","0");
  await truncated.focus();
  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toHaveText("Alexandra Konstantinova");
  await expect.poll(async () => {
    const [hint, label] = await Promise.all([tooltip.boundingBox(), name.boundingBox()]);
    return hint!.y + hint!.height < label!.y;
  }).toBe(true);
  const stage = page.locator(".preview-stage");
  await stage.screenshot({path:info.outputPath("author-clipped.png")});
  await page.keyboard.press("Escape");
  await expect(tooltip).toBeHidden();
});

test("AvatarGroup separates faces on request and keeps the overflow count", async ({page}, info) => {
  await page.goto("/components/avatar-group");
  const group = page.getByRole("list", {name:"Project collaborators"});
  const first = group.getByRole("img",{name:"Alex Morgan"});
  const second = group.getByRole("img",{name:"Sam Lee"});
  const gap = async () => {
    const [a,b] = await Promise.all([first.boundingBox(),second.boundingBox()]);
    return b!.x - (a!.x + a!.width);
  };
  await expect(first).toBeVisible();
  expect(await gap()).toBeLessThan(0);
  await chooseSelectOption(page.getByRole("combobox",{name:"AvatarGroup prop spacing"}),"separated");
  expect(await gap()).toBeGreaterThan(0);
  await expect(group.getByRole("img",{name:"1 more person"})).toBeVisible();
  await group.screenshot({path:info.outputPath("avatar-separated.png")});
});

test("AvatarGroup preserves localized presence in visible and overflow identities", async ({page}, info) => {
  await page.goto("/components/avatar-group");
  const group = page.getByRole("list", {name:"Project collaborators"});
  await page.getByRole("checkbox", {name:"AvatarGroup prop presence"}).check();
  const online = group.getByRole("img", {name:"Alex Morgan, Online"});
  const away = group.getByRole("img", {name:"Sam Lee, Away"});
  await expect(group.getByRole("img", {name:"June Park, Busy"})).toBeVisible();
  await expect(group.getByRole("img", {name:"Robin Smith, Offline"})).toBeVisible();
  const marker = online.locator(".flood-avatar__presence");
  for (const dir of ["ltr", "rtl"]) {
    await group.evaluate((node, direction) => node.setAttribute("dir", direction), dir);
    const [mark, next] = await Promise.all([marker.boundingBox(), away.boundingBox()]);
    expect(dir === "ltr" ? next!.x - (mark!.x + mark!.width) : mark!.x - (next!.x + next!.width)).toBeGreaterThan(0);
  }
  await group.evaluate(node => node.setAttribute("dir", "ltr"));
  await group.screenshot({path:info.outputPath("avatar-group-presence.png")});
  await chooseSelectOption(page.getByRole("combobox",{name:"AvatarGroup prop overflowPresentation"}),"popover");
  await group.getByRole("button", {name:"Show 1 more person"}).click();
  const list = page.getByRole("dialog", {name:"More people"});
  await expect(list.getByText("Mika Chen", {exact:true})).toBeVisible();
  await expect(list.locator('[data-presence="online"]')).toBeVisible();
  await expect(list.getByText("Online", {exact:true})).toBeAttached();
});

test("AvatarGroup reveals only hidden people without moving its trigger", async ({page}) => {
  await page.goto("/components/avatar-group");
  const group = page.locator(".preview-stage").getByRole("list",{name:"Project collaborators"});
  await expect(group.getByRole("img",{name:"1 more person"})).toBeVisible();
  await chooseSelectOption(page.getByRole("combobox",{name:"AvatarGroup prop overflowPresentation"}),"popover");
  await page.getByRole("checkbox",{name:"AvatarGroup prop manyPeople"}).check();
  await page.getByRole("checkbox",{name:"AvatarGroup prop longNames"}).check();
  const toggle = group.getByRole("button",{name:"Show 8 more people"});
  const position = await toggle.boundingBox();
  await toggle.press("Enter");
  const panel = page.getByRole("dialog",{name:"More people"});
  await expect(panel.getByRole("listitem")).toHaveCount(8);
  await expect(panel.getByText("Mika Chen de la Cruz Fitzgerald",{exact:true})).toBeVisible();
  await expect(panel.getByText("Alex Morgan",{exact:true})).toHaveCount(0);
  const viewport = panel.locator(".flood-avatar-group__people-viewport");
  await expect(viewport).toHaveAttribute("data-scrollbars","overlay");
  expect(await viewport.evaluate(node => node.scrollHeight > node.clientHeight)).toBe(true);
  expect(await toggle.boundingBox()).toEqual(position);
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(toggle).toBeFocused();
});

test("AvatarGroup fit keeps one row and returns focus when every person fits", async ({page}, info) => {
  await page.setViewportSize({width:1440,height:900});
  await page.goto("/components/avatar-group");
  const group = page.locator(".preview-stage").getByRole("list",{name:"Project collaborators"});
  await chooseSelectOption(page.getByRole("combobox",{name:"AvatarGroup prop max"}),"5");
  await chooseSelectOption(page.getByRole("combobox",{name:"AvatarGroup prop layout"}),"fit");
  await chooseSelectOption(page.getByRole("combobox",{name:"AvatarGroup prop overflowPresentation"}),"popover");
  await expect(group.getByRole("img")).toHaveCount(5);
  await group.screenshot({path:info.outputPath("avatar-fit-wide.png")});
  await page.getByRole("checkbox",{name:"AvatarGroup prop constrainWidth"}).check();
  const trigger = group.getByRole("button",{name:/^Show .* more/});
  await expect(trigger).toBeVisible();
  const visible = await group.getByRole("img").count();
  expect(visible).toBeGreaterThan(0);
  expect(visible).toBeLessThan(5);
  const geometry = await group.evaluate(node=>{
    const boxes = [...node.querySelectorAll(":scope > li:not([aria-hidden])")].map(item=>item.getBoundingClientRect());
    return {rows:new Set(boxes.map(box=>box.top)).size,overflow:node.scrollWidth-node.clientWidth};
  });
  expect(geometry).toEqual({rows:1,overflow:0});
  await group.screenshot({path:info.outputPath("avatar-fit-narrow.png")});
  await trigger.press("Enter");
  const people = page.getByRole("dialog",{name:"More people"});
  await expect(people.getByRole("listitem")).toHaveCount(5-visible);
  await expect(people.getByText("Mika Chen",{exact:true})).toBeVisible();
  await expect(trigger).toBeFocused();
  await page.locator(".preview-stage").screenshot({path:info.outputPath("avatar-fit-overflow.png")});
  await group.evaluate(node=>{node.parentElement!.style.inlineSize="20rem";});
  await expect(people).toHaveCount(0);
  await expect(group.getByRole("img")).toHaveCount(5);
  await expect(group).toBeFocused();
});

test("ExpandableText fits its action inline and keeps keyboard focus as text reflows", async ({page}, info) => {
  await page.goto("/components/expandable-text");
  const preview = page.locator(".preview-stage .flood-expandable-text");
  const passage = preview.locator(":scope > p");
  const copy = passage.locator(".flood-expandable-text__copy");
  const toggle = preview.getByRole("button", {name:/^Show (more|less)$/});
  await page.getByRole("checkbox", {name:"ExpandableText prop constrainWidth"}).check();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toHaveAttribute("aria-controls", await passage.getAttribute("id") as string);
  const fullText = await passage.locator(".flood-expandable-text__accessible").textContent();
  const collapsed = (await passage.boundingBox())!.height;
  const lastLine = await copy.evaluate(node=>Array.from(node.getClientRects()).at(-1)!.toJSON());
  const action = (await toggle.boundingBox())!;
  expect(Math.abs(lastLine.y+lastLine.height/2-action.y-action.height/2)).toBeLessThan(4);
  expect(action.x).toBeGreaterThan(lastLine.right);
  await preview.screenshot({path:info.outputPath("expandable-text-inline.png")});
  await toggle.press("Enter");
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  expect((await passage.boundingBox())!.height).toBeGreaterThan(collapsed);
  await expect(copy).toHaveText(fullText!);
  await toggle.press("Space");
  expect((await passage.boundingBox())!.height).toBeCloseTo(collapsed, 0);
  if (info.project.name === "desktop") {
    await preview.evaluate(node=>{node.parentElement!.style.inlineSize="36rem";});
    await expect(toggle).toHaveCount(0);
    await expect(passage).toBeFocused();
    await expect(copy).toHaveText(fullText!);
  }
  await page.getByRole("checkbox", {name:"ExpandableText prop shortText"}).check();
  await expect(toggle).toHaveCount(0);
});

test("a long Comment ends its excerpt with an inline disclosure", async ({page}, info) => {
  await page.goto("/components/comment");
  await page.getByRole("checkbox", {name:"Comment prop longMessage"}).check();
  const comment = page.locator(".preview-stage .flood-comment");
  const excerpt = comment.locator(".flood-expandable-text");
  const passage = excerpt.locator(":scope > p");
  const more = excerpt.getByRole("button", {name:"Show more"});
  await expect(more).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  for (const width of [134, 328]) {
    await excerpt.evaluate((node, width) => {node.style.inlineSize = `${width}px`;}, width);
    await expect.poll(() => passage.evaluate(node => {
      const copy = node.querySelector(".flood-expandable-text__copy")!;
      const lastLine = Array.from(copy.getClientRects()).at(-1)!;
      const action = node.querySelector("button")!.getBoundingClientRect();
      const lineHeight = Number.parseFloat(getComputedStyle(node).lineHeight);
      return Math.abs(lastLine.y + lastLine.height / 2 - action.y - action.height / 2) < 4
        && node.clientHeight <= lineHeight * 3 + 1
        && node.scrollWidth <= node.clientWidth;
    })).toBe(true);
  }
  await excerpt.evaluate(node => {node.style.removeProperty("inline-size");});
  await comment.screenshot({path:info.outputPath("comment-inline-disclosure.png")});
  await more.press("Enter");
  const less = excerpt.getByRole("button", {name:"Show less"});
  await expect(less).toBeFocused();
  await less.press("Space");
  await expect(more).toBeFocused();
});

test("value changes keep both sides readable and distinguish additions and removals", async ({page}, info) => {
  await page.goto("/components/value-change");
  const change = page.locator(".flood-value-change");
  const scenario = page.getByRole("combobox",{name:"Change",exact:true});
  await expect(change.locator(".flood-visually-hidden")).toHaveText(["Before ","After "]);
  await change.evaluate(node => node.setAttribute("dir","rtl"));
  await expect(change.locator(".flood-value-change__arrow")).toHaveCSS("scale","-1 1");
  await change.evaluate(node => node.removeAttribute("dir"));
  await chooseSelectOption(scenario,"assignee");
  await page.getByRole("checkbox",{name:"ValueChange prop constrainWidth"}).check();
  await expect(change).toContainText("Alexandra Konstantinova");
  await expect(change).toContainText("Release operations team");
  expect(await change.evaluate(node=>node.scrollWidth <= node.clientWidth)).toBe(true);
  await chooseSelectOption(page.getByRole("combobox",{name:"ValueChange prop layout"}),"stacked");
  await expect(change.getByText("Before",{exact:true})).toBeVisible();
  await expect(change.getByText("After",{exact:true})).toBeVisible();
  await expect(change.locator(".flood-value-change__arrow")).toHaveCount(0);
  await change.screenshot({path:info.outputPath("value-change-stacked.png")});
  await chooseSelectOption(page.getByRole("combobox",{name:"ValueChange prop layout"}),"adaptive");
  const sides = change.locator(".flood-value-change__label--adaptive");
  await expect(sides.first()).toBeVisible();
  await expect(change.locator(".flood-value-change__arrow")).toBeHidden();
  const [previous,current] = await change.locator(".flood-value-change__content").evaluateAll(nodes =>
    nodes.map(node=>({start:node.getBoundingClientRect().x,top:node.getBoundingClientRect().top})));
  expect(previous.start).toBeCloseTo(current.start,0);
  expect(current.top).toBeGreaterThan(previous.top);
  await change.screenshot({path:info.outputPath("value-change-adaptive-narrow.png")});
  await page.getByRole("checkbox",{name:"ValueChange prop constrainWidth"}).uncheck();
  await expect(change.locator(".flood-value-change__arrow")).toBeVisible();
  await expect(sides.first()).toBeHidden();
  await chooseSelectOption(scenario,"added");
  await expect(change.getByText("Added",{exact:true})).toBeVisible();
  await expect(change.locator('[data-side="before"]')).toHaveCount(0);
  await chooseSelectOption(scenario,"removed");
  await expect(change.getByText("Removed",{exact:true})).toBeVisible();
  await expect(change.locator('[data-side="after"]')).toHaveCount(0);
});

test("named changes keep native term associations in a narrow list", async ({page}) => {
  await page.goto("/components/change-list");
  const changes = page.locator('dl[aria-label="Project changes"]');
  await chooseSelectOption(page.getByRole("combobox",{name:"ChangeList prop valueLayout"}),"adaptive");
  await page.getByRole("checkbox",{name:"ChangeList prop constrainWidth"}).check();
  await expect(changes.locator("dt")).toHaveText(["Owner","Due date","Budget","Reminder"]);
  await expect(changes.locator("dd").first()).toContainText("Maya Chen");
  await expect(changes.locator("dd").first()).toContainText("Sam Rivera");
  await expect(changes.locator("dd").first().locator(".flood-value-change__label--adaptive")).toHaveText(["Before","After"]);
  await expect(changes.locator("dd").first().locator(".flood-value-change__arrow")).toBeHidden();
  await expect(changes.locator("dd").last()).toContainText("Added");
  expect(await changes.evaluate(node=>node.scrollWidth <= node.clientWidth)).toBe(true);
});

test("Grid caps automatic columns while still shrinking and honoring explicit columns", async ({page}, testInfo) => {
  await page.setViewportSize({width:1440,height:940});
  await page.goto("/components/grid");
  const grid = page.locator(".preview-stage .flood-grid");
  const option = (prop:string, value:string) => chooseSelectOption(page.getByRole("combobox",{name:`Grid prop ${prop}`,exact:true}),value);
  await option("minItemWidth","10rem");
  await option("maxColumns","2");
  await grid.evaluate(node=>node.style.inlineSize="40rem");
  const rows = () => grid.locator(":scope > .flood-surface").evaluateAll(nodes=>
    new Set(nodes.map(node=>node.getBoundingClientRect().top)).size);
  expect(await rows()).toBe(2);
  await grid.screenshot({path:testInfo.outputPath("grid-limit-two.png")});
  await grid.evaluate(node=>node.style.inlineSize="18rem");
  expect(await rows()).toBe(3);
  await option("columns","3");
  expect(await rows()).toBe(1);
});

test("activity connectors adapt to surfaces and honor breaks between periods", async ({page}, testInfo) => {
  await page.setViewportSize({width:1440,height:940});
  await page.goto("/components/activity-timeline");
  const timeline = page.getByRole("region",{name:"Export activity"});
  const groups = timeline.locator(":scope > .flood-activity-timeline__group");
  const tail = groups.first().locator(".flood-timeline__item").last();
  const heading = groups.last().getByRole("heading");
  const style = (locator:typeof tail) => locator.evaluate(node=>{
    const line = getComputedStyle(node,"::before");
    return {content:line.content, display:line.display, color:line.borderInlineStartColor, border:line.borderInlineStartStyle};
  });
  const option = (prop:string,value:string) =>
    chooseSelectOption(page.getByRole("combobox",{name:`ActivityTimeline prop ${prop}`,exact:true}),value);
  await expect(groups).toHaveCount(2);
  await page.evaluate(()=>document.fonts.ready);
  const colors = new Set();
  for (const surface of ["canvas","default","raised","overlay"]) {
    await option("surface",surface);
    const connector = await style(heading);
    expect(connector.border).toBe("solid");
    expect(connector.content).toBe('""');
    expect(connector.color).toBe((await style(tail)).color);
    colors.add(connector.color);
    if (surface === "canvas" || surface === "raised") {
      await timeline.screenshot({path:testInfo.outputPath(`activity-${surface}.png`)});
    }
  }
  expect(colors.size).toBeGreaterThan(1);
  await option("periodConnector","dashed");
  expect((await style(heading)).border).toBe("dashed");
  expect((await style(tail)).border).toBe("dashed");
  await option("periodConnector","none");
  expect((await style(heading)).content).toBe("none");
  expect((await style(tail)).display).toBe("none");
});

test("audit timeline discloses field changes independently", async ({page}, testInfo) => {
  await page.setViewportSize({width:1440,height:940});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/components/audit-timeline");
  const timeline = page.getByRole("region",{name:"Request history"});
  const first = timeline.getByRole("button",{name:"2 changes",exact:true});
  const second = timeline.getByRole("button",{name:"1 change",exact:true});
  const limit = timeline.getByText("$0",{exact:true});
  await expect(timeline.getByRole("button")).toHaveCount(2);
  await expect(timeline.getByText("Maya Chen created the request",{exact:true})).toBeVisible();
  await expect(limit).toBeHidden();
  await page.evaluate(()=>document.fonts.ready);
  await timeline.screenshot({path:testInfo.outputPath("audit-timeline-closed.png")});
  await first.press("Enter");
  await expect(limit).toBeVisible();
  await expect(second).toHaveAttribute("aria-expanded","false");
  await page.getByRole("checkbox",{name:"AuditTimeline prop constrainWidth",exact:true}).check();
  await expect(limit).toBeVisible();
  const [trigger, changes] = await Promise.all([first.boundingBox(),timeline.locator("dl").first().boundingBox()]);
  expect(trigger!.width).toBeLessThan(changes!.width);
  await page.locator(".preview-stage").screenshot({path:testInfo.outputPath("audit-timeline-narrow.png")});
  await second.press("Space");
  await expect(timeline.getByText("Added",{exact:true})).toBeVisible();
  await first.press("Enter");
  await expect(first).toBeFocused();
  await expect(limit).toBeHidden();
  await expect(second).toHaveAttribute("aria-expanded","true");
  await page.getByRole("checkbox",{name:"AuditTimeline prop empty",exact:true}).check();
  await expect(timeline.getByText("No activity yet",{exact:true})).toBeVisible();
  await expect(timeline.getByRole("button")).toHaveCount(0);
});

test("Collapsible fit keeps the panel width and shortens the trigger", async ({page}, testInfo) => {
  await page.setViewportSize({width:1440,height:940});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/components/collapsible");
  await chooseSelectOption(page.getByRole("combobox",{name:"Collapsible prop variant"}),"flush");
  const trigger = page.getByRole("button",{name:"Advanced settings",exact:true});
  await trigger.press("Enter");
  const panel = page.locator(".preview-stage .flood-disclosure__panel");
  await expect(panel).toBeVisible();
  const fullWidth = (await trigger.boundingBox())!.width;
  const panelWidth = (await panel.boundingBox())!.width;
  await page.getByRole("checkbox",{name:"Collapsible prop fitTrigger",exact:true}).check();
  expect((await trigger.boundingBox())!.width).toBeLessThan(fullWidth);
  expect((await panel.boundingBox())!.width).toBeCloseTo(panelWidth,0);
  await page.locator(".preview-stage .flood-disclosure").screenshot({path:testInfo.outputPath("collapsible-fit.png")});
});

test("long change labels get their own lines in a tight activity event", async ({page}) => {
  await page.setViewportSize({width:1440,height:940});
  await page.goto("/components/activity-timeline");
  const knob = (prop:string) => page.getByRole("checkbox",{name:`ActivityTimeline prop ${prop}`,exact:true});
  const change = page.locator(".preview-stage .flood-value-change");
  const arrow = change.locator(".flood-value-change__arrow");
  await expect(arrow).toBeVisible();
  await knob("longLabels").check();
  await knob("constrainWidth").check();
  await expect(arrow).toBeHidden();
  await page.evaluate(()=>document.fonts.ready);
  for (const direction of ["ltr","rtl"]) {
    await change.evaluate((node,dir)=>node.setAttribute("dir",dir),direction);
    const sides = await change.locator(".flood-value-change__value").evaluateAll(rows=>rows.map(row=>{
      const label = row.querySelector(".flood-value-change__label--adaptive")!;
      const range = document.createRange(); range.selectNodeContents(label);
      const content = row.querySelector(".flood-value-change__content")!.getBoundingClientRect();
      return {label:label.getBoundingClientRect().bottom,value:content.top,end:content.bottom,lines:range.getClientRects().length};
    }));
    expect(sides.map(side=>side.lines)).toEqual([1,1]);
    sides.forEach(side=>expect(side.value).toBeGreaterThan(side.label));
    expect(sides[1].label).toBeGreaterThan(sides[0].end);
  }
});

test("description grid reflows facts without changing term order or losing long values", async ({page}) => {
  await page.setViewportSize({width:1440,height:940});
  await page.goto("/components/description-list");
  const list = page.locator('dl[aria-label="Project details"]');
  await chooseSelectOption(page.getByRole("combobox",{name:"DescriptionList prop layout"}),"grid");
  const columns = () => list.evaluate(node => new Set(Array.from(node.children,cell=>cell.getBoundingClientRect().x)).size);
  await expect.poll(columns).toBe(3);
  await page.getByRole("checkbox",{name:"DescriptionList prop constrainWidth"}).check();
  await page.getByRole("checkbox",{name:"DescriptionList prop longValue"}).check();
  await expect.poll(columns).toBe(1);
  await expect(list.locator("dt")).toHaveText(["Project","Version","Owner"]);
  await expect(list.locator("dd").last()).toHaveText("design-system-maintainers@a-very-long-example-company.example");
  expect(await list.evaluate(node=>node.scrollWidth <= node.clientWidth)).toBe(true);
});

test("Metric exposes the unit alongside the value with quieter typography", async ({page}) => {
  await page.goto("/components/metric");
  const metric = page.locator(".preview-stage .flood-metric");
  const value = metric.locator(".flood-metric__value");
  await expect(value).toHaveText("$24,580");
  await page.getByRole("checkbox",{name:"Metric prop showUnit"}).check();
  await expect(metric.locator("dt")).toHaveText("Transfer speed",{useInnerText:true});
  await expect(value).toHaveText("124 MB/s");
  const [unitSize,valueSize] = await value.evaluate(node => [
    getComputedStyle(node.querySelector(".flood-metric__unit")!).fontSize,
    getComputedStyle(node).fontSize,
  ]);
  expect(parseFloat(unitSize)).toBeLessThan(parseFloat(valueSize));
});

let fixture: Promise<string>;
test.use({reducedMotion: "reduce"});

test("DataList aligns selectable and unavailable rows and keeps its geometry on selection", async ({page}, info) => {
  await page.goto("/components/data-list");
  const stage = page.locator(".preview-stage");
  const rows = stage.getByRole("listitem");
  const selection = page.getByRole("checkbox",{name:"DataList prop selectable"});
  const reserve = page.getByRole("checkbox",{name:"DataList prop reserveSelectionSpace"});
  await selection.check();
  await reserve.check();
  await page.getByRole("checkbox",{name:"DataList prop narrow"}).check();
  await page.getByRole("checkbox",{name:"DataList prop dividers"}).uncheck();
  const first = rows.nth(0);
  const selectFirst = first.getByRole("checkbox",{name:"Select Design system"});
  const edges = () => rows.evaluateAll(items => items.map(item =>
    item.querySelector(".flood-data-list-item__copy")!.getBoundingClientRect().left,
  ));
  const starts = await edges();
  expect(starts.every(start=>Math.abs(start - starts[0]) < 1)).toBe(true);
  await expect(rows.nth(1).getByRole("checkbox",{name:"Select Website"})).toBeDisabled();
  await expect(rows.nth(2).getByRole("checkbox")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  const rect = await first.boundingBox();
  await selectFirst.press("Space");
  await expect(selectFirst).toBeChecked();
  await expect(selectFirst).toBeFocused();
  await expect(first).toHaveAttribute("data-selected","true");
  expect(await first.boundingBox()).toEqual(rect);
  await first.getByRole("button",{name:"Manage"}).click();
  await expect(selectFirst).toBeChecked();
  const [actions, trailing] = await Promise.all([
    first.locator(".flood-data-list-item__actions").boundingBox(),
    first.locator(".flood-data-list-item__trailing").boundingBox(),
  ]);
  expect(actions!.x + actions!.width).toBeCloseTo(trailing!.x + trailing!.width,0);
  await stage.getByRole("list").screenshot({path:info.outputPath("data-list-selection.png")});
  await selection.uncheck();
  expect(await edges()).toEqual(starts);
  const titleInset = (row: typeof first) => row.evaluate(item =>
    item.querySelector(".flood-data-list-item__copy")!.getBoundingClientRect().left - item.getBoundingClientRect().left,
  );
  const inset = await titleInset(first);
  await page.goto("/components/list-skeleton");
  await page.getByRole("checkbox",{name:"ListSkeleton prop reserveSelectionSpace"}).check();
  const placeholder = page.locator(".preview-stage .flood-data-list-item").first();
  expect(await titleInset(placeholder)).toBeCloseTo(inset,0);
  await expect(placeholder.locator("input")).toHaveCount(0);
});

test("a narrow record list gives the title room and keeps the action on the trailing edge", async ({page}) => {
  await page.setViewportSize({width:1440,height:940});
  await page.goto("/components/data-list-item");
  await page.getByRole("checkbox",{name:"DataListItem prop longTitle"}).check();
  const row = page.locator(".preview-stage .flood-data-list-item");
  const action = row.getByRole("button",{name:"Manage"});
  await expect(row).toHaveCSS("display","flex");
  await page.getByRole("checkbox",{name:"DataListItem prop narrow"}).check();
  await expect(row).toHaveCSS("display","grid");
  for (const direction of ["ltr","rtl"]) {
    await row.evaluate((node,dir)=>node.setAttribute("dir",dir),direction);
    const [bounds,copy,metadata,button,media] = await Promise.all([
      row.boundingBox(), row.locator(".flood-data-list-item__copy").boundingBox(),
      row.getByText("Updated today").boundingBox(), action.boundingBox(),
      row.locator(".flood-data-list-item__media").boundingBox(),
    ]);
    expect(copy!.width).toBeGreaterThan(200);
    expect(media!.y).toBeCloseTo(copy!.y,0);
    expect(metadata!.y).toBeGreaterThan(copy!.y + copy!.height);
    const start = direction === "rtl" ? (box: NonNullable<typeof copy>)=>box.x + box.width : (box: NonNullable<typeof copy>)=>box.x;
    const end = direction === "rtl" ? (box: NonNullable<typeof copy>)=>box.x : (box: NonNullable<typeof copy>)=>box.x + box.width;
    expect(start(metadata!)).toBeCloseTo(start(copy!),0);
    expect(end(button!)).toBeCloseTo(end(bounds!),0);
  }
  await row.getByRole("link").focus();
  await page.keyboard.press("Tab");
  await expect(action).toBeFocused();
  await page.getByRole("checkbox",{name:"DataListItem prop showMetadata"}).uncheck();
  await expect(row).toHaveCSS("display","flex");
});

async function renderFixture() {
  const directory = resolve(`.artifacts/content-rows-${process.pid}`);
  const entry = resolve(directory, "entry.mjs");
  const file = (path: string) => JSON.stringify(resolve(path).replaceAll("\\", "/"));
  await mkdir(directory, {recursive: true});
  await writeFile(entry, `
    import React from ${file("node_modules/react/index.js")};
    import {createRoot} from ${file("node_modules/react-dom/client.js")};
    import {Accordion, AuthorMeta, Avatar, Badge, Button, CommentThread, CopyButton, DataList, DataListItem, DescriptionList, Drawer, Field, FloodRoot, Heading, Input, Link, Section, Select, SettingRow, Stack, StatusIndicator} from ${file("packages/react/dist/index.js")};
    import ${file("packages/react/dist/styles.css")};
    const h = React.createElement;
    const row = (layout) => h(DataListItem, {
      layout, media: h(Avatar, {name:"Maya Chen", size:"sm", decorative:true}),
      title:"Maya Chen",
      description:"I checked the export again and the attachment still looks incomplete. Could you compare it with the original before review?",
      actions:h(React.Fragment, null, h(Button,{size:"sm",variant:"subtle"},"Reply"),h(Button,{size:"sm",variant:"ghost"},"Copy link")),
    });
    const list = (name, layout) => h(DataList, {"aria-label": name, density:"compact"}, row(layout));
    const inspectorItems = [
      {value:"general",title:"General",content:h(Field,{label:"Workspace name",children: props=>h(Input,{...props,defaultValue:"Flood Studio"})})},
      {value:"preferences",title:"Preferences",content:h(Field,{label:"Time zone",children: props=>h(Select,{...props,defaultValue:"utc"},h("option",{value:"utc"},"UTC"),h("option",{value:"pst"},"Pacific"))})},
    ];
    createRoot(document.querySelector("#app")).render(h(FloodRoot,null,
      h(Stack,{gap:"4", style:{maxInlineSize:"44rem"}},
        list("History", "content"),
        h(Drawer,{title:"Review comments",trigger: props=>h(Button,props,"Open review")},
          h(Stack,{gap:"4"},list("Existing rows"),list("Authored rows","content"))),
        h(Drawer,{title:"Workspace settings",size:"sm",trigger: props=>h(Button,props,"Open settings")},
          h(Stack,{gap:"4"},
            h(Accordion,{label:"Settings sections",variant:"flush",expansionMode:"multiple",defaultValue:["general","preferences"],items:inspectorItems}),
            h(SettingRow,{label:"Documentation",description:"Guides for configuring your workspace.",action:h(Link,{href:"/docs",variant:"subtle",size:"sm"},"Open docs")}))),
        h(Drawer,{title:"Attachment review",size:"sm",trigger: props=>h(Button,props,"Open attachment review")},
          h(Stack,{gap:"4"},
            h(DescriptionList,{"aria-label":"Attachment details",layout:"columns",items:[
              {id:"status",term:"Status",description:h(StatusIndicator,{label:"Needs review",tone:"warning",presentation:"chip",size:"sm"})},
              {id:"format",term:"Format",description:"PDF"},
            ]}),
            h(DataList,{"aria-label":"Reviewers",density:"compact"},h(DataListItem,{
              title:h(AuthorMeta,{name:"Sam Rivera",metadata:"Reviewer",size:"sm"}),
              metadata:h(Badge,{size:"sm",variant:"outline"},"Platform"),
            })),
            h(Section,{title:"Comments",headingSize:"group"},
              h(CommentThread,{"aria-label":"Comments",items:[
                {id:"maya",author:{name:"Maya Chen",metadata:h("time",{dateTime:"2026-11-14T10:24:00"},"10:24")},
                  actions:h(CopyButton,{iconOnly:true,size:"sm",variant:"ghost",copyLabel:"Copy message",value:"I checked the export."}),
                  body:"I checked the export. Please include the original attachment before review."},
                {id:"sam",author:{name:"Sam Rivera",metadata:h("time",{dateTime:"2026-11-14T11:05:00"},"11:05")},
                  body:"I have the original. I’ll attach it before approval."},
              ]})))))));
  `);
  const result = await build({
    configFile: false,
    logLevel: "silent",
    define: {"process.env.NODE_ENV": JSON.stringify("production")},
    build: {write: false, cssCodeSplit: false, lib: {entry, formats: ["iife"], name: "ContentRows"}},
  });
  const output = (Array.isArray(result) ? result : [result]).flatMap(item => "output" in item ? item.output : []);
  const css = output.flatMap(item => item.type === "asset" && item.fileName.endsWith(".css") ? [item.source] : []).join("");
  const js = output.flatMap(item => item.type === "chunk" ? [item.code] : []).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><main id="app"></main><script>${js}</script></body></html>`;
}

test("content rows keep their author and actions aligned inside a narrow drawer", async ({page}, testInfo) => {
  fixture ??= renderFixture();
  await page.route("**/__content-rows.html", async route => route.fulfill({contentType: "text/html", body: await fixture}));
  await page.goto("/__content-rows.html");
  await page.getByRole("button", {name: "Open review"}).click();
  const drawer = page.getByRole("dialog", {name: "Review comments"});
  const row = drawer.getByRole("list", {name: "Authored rows"}).getByRole("listitem");
  const copy = row.locator(".flood-data-list-item__copy");
  const avatar = row.locator(".flood-data-list-item__media");
  const reply = row.getByRole("button", {name: "Reply"});
  await expect(reply).toBeVisible();
  const [copyBox, avatarBox, replyBox] = await Promise.all([copy.boundingBox(), avatar.boundingBox(), reply.boundingBox()]);
  expect(avatarBox!.y).toBeCloseTo(copyBox!.y, 0);
  expect(replyBox!.x).toBeCloseTo(copyBox!.x, 0);
  expect(replyBox!.y).toBeGreaterThan(copyBox!.y + copyBox!.height);
  await expect(drawer.getByRole("list", {name: "Existing rows"}).getByRole("listitem")).toHaveCSS("display", "flex");
  await reply.focus();
  await page.keyboard.press("Tab");
  await expect(row.getByRole("button", {name: "Copy link"})).toBeFocused();
  await drawer.screenshot({path: testInfo.outputPath("narrow-drawer.png"), animations: "disabled"});
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", {name: "Open review"})).toBeFocused();
  const history = page.getByRole("list", {name: "History"});
  await expect(history.getByRole("listitem")).toHaveCSS("display", testInfo.project.name === "desktop" ? "flex" : "grid");
  await history.screenshot({path: testInfo.outputPath("history-width.png"), animations: "disabled"});
});

test("flush sections share the field axis inside Drawer", async ({page}, testInfo) => {
  fixture ??= renderFixture();
  await page.route("**/__content-rows.html", async route => route.fulfill({contentType: "text/html", body: await fixture}));
  await page.goto("/__content-rows.html");
  await page.getByRole("button", {name: "Open settings"}).click();
  const drawer = page.getByRole("dialog", {name: "Workspace settings"});
  const trigger = drawer.getByRole("button", {name: "General"});
  const name = drawer.getByRole("textbox", {name: "Workspace name"});
  await expect(name).toBeVisible();
  const [triggerBox, nameBox] = await Promise.all([trigger.boundingBox(), name.boundingBox()]);
  expect(nameBox!.x).toBeCloseTo(triggerBox!.x, 0);
  await expect(drawer.getByText("Time zone", {exact: true})).toBeVisible();
  await expect(drawer.getByRole("link", {name:"Open docs"})).toBeVisible();
  await drawer.screenshot({path: testInfo.outputPath("inspector-sections.png"), animations: "disabled"});
  await trigger.click();
  await expect(name).toBeHidden();
});

test("authored messages and states compose in a narrow review Drawer", async ({page}, testInfo) => {
  fixture ??= renderFixture();
  await page.route("**/__content-rows.html", async route => route.fulfill({contentType: "text/html", body: await fixture}));
  await page.goto("/__content-rows.html");
  await page.getByRole("button", {name: "Open attachment review"}).click();
  const drawer = page.getByRole("dialog", {name: "Attachment review"});
  const comment = drawer.getByRole("article").first();
  const author = comment.getByText("Maya Chen");
  const body = comment.getByText("I checked the export.", {exact:false});
  await expect(author).toBeVisible();
  const [authorBox, bodyBox] = await Promise.all([author.boundingBox(), body.boundingBox()]);
  expect(bodyBox!.x).toBeCloseTo(authorBox!.x, 0);
  await expect(comment.locator("time")).toHaveAttribute("datetime", "2026-11-14T10:24:00");
  await expect(drawer.getByRole("list", {name:"Comments"}).getByRole("listitem")).toHaveCount(2);
  await expect(drawer.getByRole("article").last().locator("footer")).toHaveCount(0);
  const chip = drawer.locator(".flood-status-indicator");
  await expect(chip).toHaveText("Needs review");
  expect((await chip.boundingBox())!.width).toBeLessThan(150);
  const positions = await drawer.locator(".flood-description-list__item").evaluateAll(items => items.map(item => {
    const term = item.querySelector("dt")!.getBoundingClientRect();
    const value = item.querySelector("dd")!.getBoundingClientRect();
    return {termX:term.x, valueX:value.x, termY:term.y, valueY:value.y};
  }));
  expect(positions).toHaveLength(2);
  expect(positions[0].valueX).toBeGreaterThan(positions[0].termX);
  expect(positions[0].valueX).toBeCloseTo(positions[1].valueX, 0);
  expect(positions[0].valueY).toBeCloseTo(positions[0].termY, 0);
  await drawer.screenshot({path: testInfo.outputPath("attachment-review.png"), animations: "disabled"});
});
