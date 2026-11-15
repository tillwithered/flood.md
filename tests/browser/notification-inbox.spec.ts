import {expect, test} from "@playwright/test";
import {chooseSelectOption, chooseStudioSheetOption} from "./select-helpers";

test("the notification trigger clears its unread dot without shifting and restores focus", async ({page}, info) => {
  await page.goto("/components/notification-trigger");
  const trigger = page.locator(".preview-stage .flood-notification-trigger");
  const dot = trigger.locator(".flood-notification-trigger__unread");
  await expect(trigger).toHaveAccessibleName("Notifications, 2 unread");
  await expect(dot).toHaveAttribute("aria-hidden","true");
  await page.evaluate(() => document.fonts.ready);
  await trigger.hover();
  await expect(dot).toBeVisible();
  await trigger.screenshot({path:info.outputPath("notification-trigger-hover.png")});
  const bounds = await trigger.boundingBox();
  await trigger.press("Enter");
  const panel = page.getByRole("dialog",{name:"Notifications",exact:true});
  await expect(panel).toBeVisible();
  const firstItem = panel.getByRole("listitem").first();
  expect((await panel.boundingBox())!.width).toBeLessThanOrEqual(320);
  expect((await firstItem.boundingBox())!.height).toBeLessThanOrEqual(44);
  const markAll = panel.getByRole("button",{name:"Mark all as read"});
  await expect.poll(() => panel.locator(".flood-notification-inbox__header").evaluate(header => {
    const filter = header.querySelector(".flood-segmented")!.getBoundingClientRect();
    const action = header.querySelector(".flood-button")!.getBoundingClientRect();
    return Math.abs(action.y + action.height / 2 - filter.y - filter.height / 2);
  })).toBeLessThan(1);
  await panel.screenshot({path:info.outputPath("notification-trigger-inbox.png")});
  await expect(trigger).toHaveAttribute("aria-expanded","true");
  await panel.getByRole("radio",{name:"Unread",exact:true}).check();
  await markAll.press("Enter");
  await expect(panel.getByRole("heading",{name:"No unread notifications"})).toBeVisible();
  await expect(trigger).toHaveAccessibleName("Notifications");
  await expect(dot).toHaveCount(0);
  expect(await trigger.boundingBox()).toEqual(bounds);
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
  await page.getByRole("checkbox",{name:"NotificationTrigger prop disabled"}).check();
  await expect(trigger).toBeDisabled();
});

test("a capped count keeps its exact accessible value and hides a zero dot", async ({page}, info) => {
  await page.goto("/components/count-badge");
  const badge = page.locator(".flood-count-badge");
  const choose = async (property:string, name:string, value:string) => {
    const select = page.getByRole("combobox",{name:`CountBadge prop ${name}`});
    if (await select.isVisible()) await chooseSelectOption(select,value);
    else await chooseStudioSheetOption(page,property,value);
  };
  await expect(badge.locator("bdi")).toHaveText("99+");
  await expect(badge.locator("bdi")).toHaveAttribute("aria-hidden","true");
  await expect(badge.locator(".flood-visually-hidden")).toHaveText("137 unread messages");
  await page.evaluate(()=>document.fonts.ready);
  await badge.locator("..").screenshot({path:info.outputPath("capped-count.png")});
  await choose("Presentation","presentation","dot");
  await expect(badge).toHaveAttribute("data-presentation","dot");
  await expect(badge.locator("bdi")).toHaveCount(0);
  await choose("Count","count","0");
  await expect(badge).toHaveCount(0);
  await page.getByRole("checkbox",{name:"CountBadge prop showZero"}).check();
  await expect(badge).toHaveCount(0);
  await choose("Presentation","presentation","count");
  await expect(badge.locator("bdi")).toHaveText("0");
});

test("reading an inbox item preserves the row geometry and action focus", async ({page}) => {
  await page.goto("/components/notification-list");
  const list = page.getByRole("list", {name:"Project notifications"});
  await expect(list).toHaveAttribute("data-dividers", "false");
  const item = list.getByRole("listitem").first();
  const link = item.getByRole("link", {name:"Maya mentioned you"});
  const markRead = item.getByRole("button", {name:"Mark as read"});
  await expect(link).toHaveAccessibleDescription("Unread");
  await page.evaluate(()=>document.fonts.ready);
  const before = await list.getByRole("listitem").evaluateAll(rows=>rows.map(row=>row.getBoundingClientRect().toJSON()));
  expect(before[1].top - before[0].bottom).toBeGreaterThan(0);
  const [stamp, command] = await Promise.all([item.getByText("09:24",{exact:true}).boundingBox(), markRead.boundingBox()]);
  expect(stamp!.y).toBeGreaterThan(command!.y);
  expect(stamp!.y + stamp!.height).toBeLessThanOrEqual(command!.y + command!.height);
  await markRead.focus();
  await markRead.press("Enter");
  const markUnread = item.getByRole("button", {name:"Mark as unread"});
  await expect(markUnread).toBeFocused();
  await expect(link).toHaveAccessibleDescription("");
  expect(await list.getByRole("listitem").evaluateAll(rows=>rows.map(row=>row.getBoundingClientRect().toJSON()))).toEqual(before);
  await expect(link).toHaveAttribute("href","/components/comment-thread");
  const starts = await list.getByRole("link").evaluateAll(links=>links.map(link=>link.getBoundingClientRect().left));
  expect(Math.max(...starts)-Math.min(...starts)).toBeLessThan(1);
});

test("the inbox keeps its media track and recovers focus when an unread row leaves", async ({page}, info) => {
  await page.goto("/components/notification-inbox");
  const inbox = page.getByRole("region", {name:"Project notifications"});
  const list = inbox.getByRole("list", {name:"Project notifications"});
  const unread = inbox.getByRole("radio",{name:"Unread"});
  const all = inbox.getByRole("radio",{name:"All"});
  await expect(list.getByRole("listitem")).toHaveCount(3);
  await unread.check();
  await expect(list.getByRole("listitem")).toHaveCount(2);
  await page.evaluate(() => document.fonts.ready);
  await inbox.screenshot({path:info.outputPath("notification-inbox-unread.png")});
  const remaining = list.getByRole("link", {name:"Export ready for approval"});
  const left = (await remaining.boundingBox())!.x;
  await list.getByRole("listitem").first().getByRole("button",{name:"Mark as read"}).press("Enter");
  await expect(list.getByRole("listitem")).toHaveCount(1);
  await expect(unread).toBeFocused();
  expect((await remaining.boundingBox())!.x).toBeCloseTo(left,0);
  await inbox.getByRole("button",{name:"Mark all as read"}).press("Enter");
  await expect(inbox.getByRole("heading",{name:"No unread notifications"})).toBeVisible();
  await expect(unread).toBeFocused();
  await expect(inbox.getByRole("button",{name:"Mark all as read"})).toBeDisabled();
  await inbox.screenshot({path:info.outputPath("notification-inbox-caught-up.png")});
  await all.check();
  await expect(list.getByRole("listitem")).toHaveCount(3);
});

test("loading and retry preserve the inbox filter and the title track", async ({page}, info) => {
  await page.goto("/components/notification-inbox");
  const inbox = page.getByRole("region",{name:"Project notifications"});
  const unread = inbox.getByRole("radio",{name:"Unread"});
  const state = page.getByRole("combobox",{name:"NotificationInbox prop state"});
  await unread.check();
  const title = inbox.getByRole("link",{name:"Maya mentioned you"});
  const acceptedBox = (await title.boundingBox())!;
  await chooseSelectOption(state,"loading");
  await expect(inbox.getByRole("status")).toHaveText("Loading notifications…");
  await expect(unread).toBeChecked();
  await expect(inbox.getByRole("list")).toHaveCount(0);
  await expect(inbox.getByRole("button",{name:"Mark all as read"})).toBeDisabled();
  const placeholder = inbox.locator(".flood-list-skeleton__line").first();
  const [titleTrack, timeTrack] = await Promise.all([
    placeholder.boundingBox(), inbox.locator(".flood-list-skeleton__metadata").first().boundingBox(),
  ]);
  expect(titleTrack!.x).toBeCloseTo(acceptedBox.x,0);
  expect(timeTrack!.x).toBeGreaterThan(titleTrack!.x + titleTrack!.width);
  expect(Math.abs(timeTrack!.y - titleTrack!.y)).toBeLessThan(8);
  await inbox.screenshot({path:info.outputPath("notification-loading.png")});
  await chooseSelectOption(state,"error");
  await expect(inbox.getByRole("heading",{name:"Could not load notifications."})).toBeVisible();
  await inbox.screenshot({path:info.outputPath("notification-error.png")});
  await inbox.getByRole("button",{name:"Try again"}).press("Enter");
  await expect(title).toBeVisible();
  await expect(unread).toBeFocused();
});

test("narrow inbox keeps the timestamp and read command on the copy track in both directions", async ({page}) => {
  await page.setViewportSize({width:1440,height:940});
  await page.goto("/components/notification-list");
  const list = page.getByRole("list",{name:"Project notifications"});
  const row = list.getByRole("listitem").first();
  const title = row.getByRole("link",{name:"Maya mentioned you"});
  await page.getByRole("checkbox",{name:"NotificationList prop constrainWidth"}).check();
  await page.getByRole("checkbox",{name:"NotificationList prop longTime"}).check();
  const time = row.getByText("14 November, 09:24",{exact:true});
  const action = row.getByRole("button",{name:"Mark as read"});
  await page.evaluate(()=>document.fonts.ready);
  for (const direction of ["ltr","rtl"]) {
    await list.evaluate((node,dir)=>node.setAttribute("dir",dir),direction);
    const [copy,trailing,stamp,button] = await Promise.all([
      row.locator(".flood-data-list-item__copy").boundingBox(),
      row.locator(".flood-data-list-item__trailing").boundingBox(),
      time.boundingBox(),action.boundingBox(),
    ]);
    expect(stamp!.y).toBeGreaterThan(copy!.y + copy!.height);
    if (direction === "rtl") {
      expect(stamp!.x + stamp!.width).toBeCloseTo(copy!.x + copy!.width,0);
      expect(button!.x).toBeCloseTo(trailing!.x,0);
    } else {
      expect(stamp!.x).toBeCloseTo(copy!.x,0);
      expect(button!.x + button!.width).toBeCloseTo(trailing!.x + trailing!.width,0);
    }
    expect(await row.evaluate(node=>node.scrollWidth <= node.clientWidth)).toBe(true);
  }
  await title.focus();
  await page.keyboard.press("Tab");
  await expect(action).toBeFocused();
  const height = (await row.boundingBox())!.height;
  await action.press("Enter");
  await expect(row.getByRole("button",{name:"Mark as unread"})).toBeFocused();
  expect((await row.boundingBox())!.height).toBe(height);
});
