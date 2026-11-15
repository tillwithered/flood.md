import {expect, test} from "@playwright/test";
import {mkdir, writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {build} from "vite";
import {chooseSelectOption,chooseStudioSheetOption} from "./select-helpers";

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
