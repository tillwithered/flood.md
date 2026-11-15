import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

const storageKey = "flood:settings-workspace:v1";

test("settings validate, discard drafts and save both sections across reloads", async ({ page }) => {
  await page.goto("/playground/settings");
  const form = page.getByRole("form", { name: "Workspace settings" });
  const name = form.getByRole("textbox", { name: "Workspace name" });
  const timeZone = form.getByRole("combobox", { name: "Time zone" });
  const digest = form.getByRole("switch", { name: "Weekly summary" });
  const save = form.getByRole("button", { name: "Save settings" });
  const discard = form.getByRole("button", { name: "Discard changes" });

  await expect(name).toHaveValue("Studio North");
  await name.fill("   ");
  await save.click();
  await expect(name).toBeFocused();
  await expect(name).toHaveAccessibleDescription("Enter a workspace name.");
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();

  await chooseSelectOption(timeZone, "Asia/Tokyo");
  await digest.check();
  await discard.click();
  await expect(name).toHaveValue("Studio North");
  await expect(name).toBeFocused();
  await expect(timeZone).toContainText("UTC");
  await expect(digest).not.toBeChecked();
  await expect(discard).toBeDisabled();

  await name.fill("  Flood Workshop  ");
  await chooseSelectOption(timeZone, "Asia/Tokyo");
  await digest.check();
  await save.focus();
  await save.press("Enter");
  await expect(form.getByRole("status")).toHaveText("Settings saved.");
  await expect(save).toBeFocused();
  await expect(name).toHaveValue("Flood Workshop");

  await page.reload();
  await expect(name).toHaveValue("Flood Workshop");
  await expect(timeZone).toContainText("Asia/Tokyo");
  await expect(digest).toBeChecked();
});

test("settings retain a failed draft and leave a malformed snapshot untouched", async ({ page }) => {
  await page.goto("/playground/settings");
  const form = page.getByRole("form", { name: "Workspace settings" });
  const name = form.getByRole("textbox", { name: "Workspace name" });
  await name.fill("Retain this draft");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => { throw new Error("Write refused"); };
  });
  await form.getByRole("button", { name: "Save settings" }).click();
  await expect(form.getByText("Settings could not be saved. Try again.")).toBeVisible();
  await expect(name).toHaveValue("Retain this draft");
  await form.getByRole("button", { name: "Discard changes" }).click();
  await expect(name).toHaveValue("Studio North");
  await expect(form.getByText("Settings could not be saved. Try again.")).toHaveCount(0);

  await page.addInitScript(key => localStorage.setItem(key, "{malformed"), storageKey);
  await page.reload();
  await expect(page.getByText("Settings could not be loaded.")).toBeVisible();
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(form).toHaveCount(0);
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBe("{malformed");
});

test("settings share axes and adapt to their container", async ({ page }, info) => {
  await page.goto("/playground/settings");
  const form = page.getByRole("form", { name: "Workspace settings" });
  const name = form.getByRole("textbox", { name: "Workspace name" });
  const timeZone = form.getByRole("combobox", { name: "Time zone" });
  const switches = form.getByRole("switch");
  await expect(name).toBeVisible();
  const [nameBox, zoneBox, firstSwitch, secondSwitch] = await Promise.all([
    name.boundingBox(), timeZone.boundingBox(), switches.first().boundingBox(), switches.last().boundingBox(),
  ]);
  expect(nameBox!.x).toBeCloseTo(zoneBox!.x, 0);
  expect(nameBox!.x + nameBox!.width).toBeCloseTo(firstSwitch!.x + firstSwitch!.width, 0);
  expect(firstSwitch!.x).toBeCloseTo(secondSwitch!.x, 0);
  const label = form.locator(".flood-label").first();
  const labelBox = await label.boundingBox();
  if (info.project.name === "mobile") {
    expect(labelBox!.y + labelBox!.height).toBeLessThan(nameBox!.y);
  } else {
    expect(labelBox!.x).toBeLessThan(nameBox!.x);
    expect(labelBox!.y + labelBox!.height / 2).toBeCloseTo(nameBox!.y + nameBox!.height / 2, 0);
  }
  await form.screenshot({path:info.outputPath("settings-axes.png")});
});

test("a switch row keeps the help separate from its label and supports keyboard input", async ({ page }, info) => {
  await page.goto("/components/switch");
  await chooseSelectOption(page.getByRole("combobox", {name:"Switch prop layout"}), "row");
  await page.getByRole("checkbox", {name:"Switch prop description"}).check();
  const preview = page.getByRole("region", {name:"Preview canvas"});
  const control = preview.getByRole("switch", {name:"Email notifications", exact:true});
  await expect(control).toHaveAccessibleDescription("Receive an email when a review needs your attention.");
  await control.focus();
  await control.press("Space");
  await expect(control).not.toBeChecked();
  await expect(control).toBeFocused();
  await preview.locator(".flood-setting-row").screenshot({path:info.outputPath("switch-row.png")});
  await page.getByRole("checkbox",{name:"Switch prop readOnly",exact:true}).check();
  await expect(control).toHaveAttribute("aria-readonly","true");
  await control.focus();
  await control.press("Space");
  await expect(control).not.toBeChecked();
  await expect(control).toBeFocused();
  await preview.getByText("Email notifications",{exact:true}).click();
  await expect(control).not.toBeChecked();
});

test("SwitchGroup keeps switches on a shared edge and uses native group disabling", async ({page},info) => {
  await page.goto("/components/switch-group");
  const canvas = page.getByRole("region",{name:"Preview canvas"});
  const group = canvas.getByRole("group",{name:"Notifications",exact:true});
  const assignment = group.getByRole("switch",{name:"New assignments",exact:true});
  const digest = group.getByRole("switch",{name:"Weekly summary",exact:true});
  await expect(assignment).toBeChecked();
  await digest.press("Space");
  await expect(digest).toBeChecked();
  await expect(assignment).toBeChecked();
  await page.getByRole("checkbox",{name:"SwitchGroup prop narrow",exact:true}).check();
  await page.evaluate(()=>{document.documentElement.dir="rtl"; document.documentElement.style.fontSize="20px";});
  expect((await assignment.boundingBox())!.x).toBeCloseTo((await digest.boundingBox())!.x,0);
  expect(await group.evaluate(node=>node.scrollWidth-node.clientWidth)).toBeLessThanOrEqual(1);
  await group.screenshot({path:info.outputPath("switch-group-narrow.png")});
  await page.getByRole("checkbox",{name:"SwitchGroup prop disabled",exact:true}).check();
  await expect(group).toHaveAttribute("disabled","");
  await expect(assignment).toBeDisabled();
  await expect(digest).toBeDisabled();
  await expect(digest).toBeChecked();
});

test("form actions preserve native submit/reset and keep button geometry when feedback appears", async ({page}) => {
  await page.goto("/components/form-actions");
  await page.getByRole("checkbox",{name:"FormActions prop constrainWidth"}).check();
  const form=page.getByRole("form",{name:"Project settings"});
  const input=form.getByRole("textbox",{name:"Project name"});
  const reset=form.getByRole("button",{name:"Discard changes"});
  const save=form.getByRole("button",{name:"Save",exact:true});
  const status=form.getByRole("status");
  await input.fill("");
  await save.click();
  await expect(status).toBeEmpty();
  await expect(input).toBeFocused();
  await input.fill("Review");
  await input.press("Tab");
  await expect(reset).toBeFocused();
  await reset.press("Tab");
  await expect(save).toBeFocused();
  const buttonGeometry=()=>save.evaluate(node=>{
    const button=node.getBoundingClientRect();
    const frame=node.closest("form")!.getBoundingClientRect();
    return {x:button.x-frame.x,y:button.y-frame.y,width:button.width,height:button.height};
  });
  const before=await buttonGeometry();
  await save.press("Enter");
  await expect(status).toHaveText("Changes saved");
  await expect(save).toBeFocused();
  expect(await buttonGeometry()).toEqual(before);
  await reset.click();
  await expect(input).toHaveValue("Design system");
  await expect(status).toHaveText("Changes discarded");
});

test("form actions reserve feedback below full-width or inline buttons", async ({page}, info) => {
  await page.setViewportSize({width:1440,height:940});
  await page.goto("/components/form-actions");
  await page.getByRole("checkbox",{name:"FormActions prop constrainWidth"}).check();
  const layout=page.getByRole("combobox",{name:"FormActions prop layout"});
  const form=page.getByRole("form",{name:"Project settings"});
  const input=form.getByRole("textbox",{name:"Project name"});
  const reset=form.getByRole("button",{name:"Discard changes"});
  const save=form.getByRole("button",{name:"Save",exact:true});
  const status=form.getByRole("status");
  await page.evaluate(()=>document.fonts.ready);
  await chooseSelectOption(layout,"status-below");
  const size=()=>form.evaluate(node=>node.clientHeight);
  const height=await size();
  await save.click();
  await expect(status).toHaveText("Changes saved");
  expect(await size()).toBe(height);
  const geometry=async()=>Promise.all([save.boundingBox(),reset.boundingBox(),status.boundingBox(),form.boundingBox()]);
  const [inlineSave,inlineReset,inlineStatus]=await geometry();
  expect(inlineSave!.y).toBeCloseTo(inlineReset!.y,1);
  expect(inlineStatus!.x+inlineStatus!.width).toBeCloseTo(inlineSave!.x+inlineSave!.width,1);
  expect(inlineStatus!.y).toBeGreaterThan(inlineSave!.y+inlineSave!.height);
  await save.blur();
  await form.screenshot({path:info.outputPath("form-actions-status-below.png")});
  await chooseSelectOption(layout,"stacked");
  const [stackedSave,stackedReset,,host]=await geometry();
  expect(stackedSave!.width).toBeCloseTo(host!.width,1);
  expect(stackedReset!.width).toBeCloseTo(host!.width,1);
  expect(stackedSave!.y).toBeGreaterThan(stackedReset!.y+stackedReset!.height);
  await save.click();
  await expect(status).toHaveText("Changes saved");
  await save.blur();
  await form.screenshot({path:info.outputPath("form-actions-stacked.png")});
  await input.focus();
  await page.keyboard.press("Tab");
  await expect(reset).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(save).toBeFocused();
});

test("save status uses one announcement across saving, error and idle", async ({page}) => {
  await page.goto("/components/save-status");
  const phase=page.getByRole("combobox",{name:"SaveStatus prop state"});
  const status=page.locator(".flood-save-status");
  await chooseSelectOption(phase,"saving");
  await expect(status.getByRole("status")).toHaveCount(0);
  await expect(status).toHaveAttribute("role","status");
  await expect(status).toHaveText("Saving changes…");
  await expect(status.locator(".flood-spinner")).toBeVisible();
  await chooseSelectOption(phase,"error");
  await expect(status).toHaveText("Changes could not be saved");
  await expect(status.locator(".flood-spinner")).toHaveCount(0);
  await chooseSelectOption(phase,"idle");
  await expect(status).toBeEmpty();
  await page.getByRole("checkbox",{name:"SaveStatus prop announce"}).uncheck();
  await expect(status).not.toHaveAttribute("role");
});

test("setting group keeps switch semantics and gives long rows room on a narrow panel", async ({page}, info) => {
  await page.goto("/components/setting-group");
  const group=page.getByRole("region",{name:"Workspace preferences"});
  const view = group.getByRole("combobox",{name:"Default view"});
  const viewLabel = group.getByText("Default view",{exact:true});
  await expect(view).toHaveAccessibleDescription("Opens when you enter the workspace.");
  await chooseSelectOption(view,"activity");
  if (info.project.name !== "mobile") {
    expect((await view.boundingBox())!.x).toBeGreaterThan((await viewLabel.boundingBox())!.x + (await viewLabel.boundingBox())!.width);
    await group.screenshot({path:info.outputPath("setting-group-wide.png")});
  }
  await page.getByRole("checkbox",{name:"SettingGroup prop constrainWidth"}).check();
  expect((await view.boundingBox())!.y).toBeGreaterThan((await viewLabel.boundingBox())!.y);
  await expect(view).toContainText("Activity");
  const weekly=group.getByRole("switch",{name:"Weekly summary"});
  await expect(weekly).toHaveAccessibleDescription("Receive one email with the week's activity.");
  await weekly.focus();
  await weekly.press("Space");
  await expect(weekly).not.toBeChecked();
  await expect(weekly).toBeFocused();
  const zone=group.getByRole("link",{name:"Change time zone"});
  const docs=group.getByRole("link",{name:"Read docs"});
  const [zoneBox,docsBox,description,help]=await Promise.all([
    zone.boundingBox(),docs.boundingBox(),
    group.getByText("Used for dates in workspace activity.").boundingBox(),
    group.getByText("Help center",{exact:true}).boundingBox(),
  ]);
  expect(zoneBox!.y).toBeGreaterThan(description!.y + description!.height);
  expect(zoneBox!.x).toBeGreaterThan(description!.x);
  expect(docsBox!.y + docsBox!.height / 2).toBeCloseTo(help!.y + help!.height / 2,0);
  await expect(group).toHaveAttribute("data-dividers","false");
  await page.getByRole("checkbox",{name:"SettingGroup prop dividers"}).check();
  await expect(group).toHaveAttribute("data-dividers","true");
  await expect(group.locator(".flood-section__body > div.flood-setting-row").first()).toHaveCSS("border-top-style","solid");
  await page.getByRole("checkbox",{name:"SettingGroup prop dividers"}).uncheck();
  await group.screenshot({path:info.outputPath("setting-group-narrow.png")});
});

test("adaptive Field keeps feedback under its input and preserves its value when the panel stacks",async ({page}, info) => {
  await page.setViewportSize({width:1440,height:950});
  await page.goto("/components/field");
  await chooseSelectOption(page.getByRole("combobox",{name:"Field prop layout",exact:true}),"adaptive");
  const field = page.locator(".preview-stage .flood-field");
  const input = field.getByRole("textbox",{name:"Project name"});
  const hint = field.getByText("Visible to your team.");
  const warning = field.getByRole("alert");
  await expect(input).toHaveAccessibleDescription("Visible to your team. Enter a project name.");
  const [control, help, error] = await Promise.all([input.boundingBox(),hint.boundingBox(),warning.boundingBox()]);
  expect(control!.x).toBeGreaterThan(help!.x);
  expect(error!.x).toBeCloseTo(control!.x,0);
  expect(error!.y).toBeGreaterThanOrEqual(control!.y + control!.height);
  await field.screenshot({path:info.outputPath("adaptive-field-error-wide.png")});
  await input.fill("Studio North");
  await page.setViewportSize({width:320,height:900});
  await expect(input).toHaveValue("Studio North");
  const [narrowInput,narrowHint] = await Promise.all([input.boundingBox(),hint.boundingBox()]);
  expect(narrowInput!.y).toBeGreaterThanOrEqual(narrowHint!.y + narrowHint!.height);
  expect(narrowInput!.x).toBeCloseTo(narrowHint!.x,0);
  await input.clear();
  await input.blur();
  await field.screenshot({path:info.outputPath("adaptive-field-error-narrow.png")});
});

test("a long SettingRow value wraps alongside its action within a narrow panel", async ({page}) => {
  await page.goto("/components/setting-row");
  await page.getByRole("checkbox",{name:"SettingRow prop constrainWidth"}).check();
  await page.getByRole("checkbox",{name:"SettingRow prop longValue"}).check();
  const row = page.locator(".preview-stage .flood-setting-row");
  const [bounds,value,action] = await Promise.all([
    row.boundingBox(), row.getByText("https://flood.md/docs/installation").boundingBox(),
    row.getByRole("link",{name:"Open docs"}).boundingBox(),
  ]);
  expect(value!.height).toBeGreaterThan(24);
  expect(action!.y + action!.height / 2).toBeCloseTo(value!.y + value!.height / 2,0);
  expect(action!.x + action!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width + 1);
  await chooseSelectOption(page.getByRole("combobox",{name:"SettingRow prop valueOverflow",exact:true}),"truncate");
  const truncated = row.locator(".flood-truncated-text");
  await expect(truncated).toHaveAttribute("tabindex","0");
  expect((await truncated.boundingBox())!.height).toBeLessThan(value!.height);
  await truncated.focus();
  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toHaveText("https://flood.md/docs/installation");
  await page.keyboard.press("Escape");
  await expect(tooltip).toBeHidden();
  await expect(truncated).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(row.getByRole("link",{name:"Open docs",exact:true})).toBeFocused();
});

test("CopyableValue copies the full value from a constrained code presentation", async ({page}) => {
  await page.context().grantPermissions(["clipboard-read","clipboard-write"]);
  await page.goto("/components/copyable-value");
  await page.getByRole("checkbox",{name:"CopyableValue prop constrainWidth"}).check();
  await page.getByRole("checkbox",{name:"CopyableValue prop longValue"}).check();
  await chooseSelectOption(page.getByRole("combobox",{name:"CopyableValue prop appearance"}),"code");
  const component = page.locator(".flood-copyable-value");
  const copy = component.getByRole("button",{name:"Copy URL"});
  const value = "https://flood.md/docs/installation";
  await expect(component.locator("code")).toHaveText(value);
  expect(await component.evaluate(node => node.scrollWidth)).toBeLessThanOrEqual((await component.boundingBox())!.width + 1);
  const target = await copy.boundingBox();
  await copy.press("Enter");
  await expect(component.getByRole("status")).toHaveText("Copied");
  expect(await component.getByRole("button",{name:"Copied"}).boundingBox()).toEqual(target);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(value);
});

test("a clipped CopyableValue keeps the copy target and focus while a write resolves", async ({page}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {configurable:true, value:{
      writeText: (text: string) => new Promise<void>(resolve => {
        const state = document.documentElement.dataset;
        state.copyValue = text;
        state.copyCount = String(Number(state.copyCount ?? "0") + 1);
        document.addEventListener("finish-copy", () => resolve(), {once:true});
      }),
    }});
  });
  await page.goto("/components/copyable-value");
  const longValue = page.getByRole("checkbox", {name:"CopyableValue prop longValue"});
  await longValue.check();
  await page.getByRole("checkbox", {name:"CopyableValue prop constrainWidth"}).check();
  await chooseSelectOption(page.getByRole("combobox", {name:"CopyableValue prop appearance"}), "code");
  await chooseSelectOption(page.getByRole("combobox", {name:"CopyableValue prop overflow"}), "truncate");
  const component = page.locator(".flood-copyable-value");
  const fullValue = "https://flood.md/docs/installation";
  const text = component.locator("code");
  await expect(text).toHaveAttribute("tabindex", "0");
  await text.focus();
  await expect(component.getByRole("tooltip")).toHaveText(fullValue);
  await text.press("Escape");
  await expect(component.getByRole("tooltip")).toBeHidden();
  const copy = component.getByRole("button", {name:"Copy URL"});
  await page.keyboard.press("Tab");
  await expect(copy).toBeFocused();
  const bounds = await copy.boundingBox();
  await copy.press("Enter");
  await expect(copy).toHaveAttribute("aria-busy", "true");
  await expect(copy).toBeFocused();
  await copy.press("Space");
  await expect(page.locator("html")).toHaveAttribute("data-copy-count", "1");
  await expect(page.locator("html")).toHaveAttribute("data-copy-value", fullValue);
  expect(await copy.boundingBox()).toEqual(bounds);
  await longValue.evaluate(node => (node as HTMLElement).click());
  await page.evaluate(() => document.dispatchEvent(new Event("finish-copy")));
  await expect(copy).toBeEnabled();
  await expect(copy).toBeFocused();
  await expect(component.getByRole("status")).toBeEmpty();
});
