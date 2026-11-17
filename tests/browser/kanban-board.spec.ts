import {expect, test, type Page} from "@playwright/test";
import {chooseSelectOption,chooseStudioSheetOption} from "./select-helpers";

async function chooseKanbanOption(page: Page, property: string, label: string, value: string) {
  await page.getByRole("region",{name:/^(Release board|Project portfolio)$/}).waitFor();
  if (await page.evaluate(()=>window.matchMedia("(max-width: 36rem) and (pointer: coarse)").matches)) {
    await chooseStudioSheetOption(page,label,value);
  } else {
    await chooseSelectOption(page.getByRole("combobox",{name:`KanbanBoard prop ${property}`,exact:true}),value);
  }
}

test("KanbanBoard keeps open and contained lanes compact without changing card targets", async ({page}, info) => {
  await page.goto("/components/kanban-board");
  const board=page.getByRole("region",{name:"Release board"});
  const backlog=board.getByRole("group",{name:"Backlog"});
  const first=backlog.locator(".flood-kanban-board__card").first();
  const grip=backlog.getByRole("button",{name:"Move Usage reports",exact:true});
  await expect(board).toHaveAttribute("data-appearance","open");
  await expect(backlog).toHaveCSS("padding-inline-start","0px");
  const header=backlog.getByText("Backlog",{exact:true});
  const title=backlog.getByRole("button",{name:"Usage reports",exact:true});
  const checkTextTrack=async()=>{
    const [label,button]=await Promise.all([header.boundingBox(),title.boundingBox()]);
    expect(Math.abs(label!.x-button!.x)).toBeLessThan(1);
  };
  await checkTextTrack();
  const before=await grip.boundingBox();
  await chooseKanbanOption(page,"appearance","Appearance","contained");
  await expect(backlog).toHaveCSS("padding-inline-start","8px");
  await checkTextTrack();
  const outerRadius=await backlog.evaluate(node=>parseFloat(getComputedStyle(node).borderTopLeftRadius));
  const innerRadius=await first.evaluate(node=>parseFloat(getComputedStyle(node).borderTopLeftRadius));
  const [laneBox,cardBox]=await Promise.all([backlog.boundingBox(),first.boundingBox()]);
  expect(Math.abs(outerRadius-innerRadius-(cardBox!.x-laneBox!.x))).toBeLessThan(1);
  const after=await grip.boundingBox();
  expect(after!.width).toBe(before!.width);
  expect(after!.height).toBe(before!.height);
  await expect(board.getByRole("group",{name:"Done"}).getByText("No cards")).toBeVisible();
  await board.screenshot({path:info.outputPath("kanban-contained.png")});
});

test("KanbanBoard supports keyboard drops into an empty lane and preserves the source on rejection", async ({page}, info) => {
  await page.goto("/components/kanban-board");
  const board = page.getByRole("region", {name:"Release board"});
  const source = board.getByRole("button", {name:"Move Usage reports"});
  const done = board.getByRole("group", {name:"Done"});
  await source.focus();
  await source.press("Space");
  await expect(source).toHaveAttribute("aria-pressed", "true");
  await source.press("ArrowRight");
  await source.press("ArrowRight");
  await expect(done).toHaveAttribute("data-drop-end", "true");
  await page.screenshot({path:info.outputPath("kanban-keyboard.png")});
  await source.press("Enter");
  await expect(done.getByRole("button", {name:"Move Usage reports"})).toBeFocused();
  await expect(done.getByText("No cards")).toHaveCount(0);
  await page.getByRole("checkbox", {name:"KanbanBoard prop rejectMoves"}).check();
  await source.focus();
  await source.press("Space");
  await source.press("ArrowLeft");
  await source.press("Enter");
  await expect(board.getByRole("status").filter({hasText:"This release is locked."})).toBeVisible();
  await expect(done.getByRole("button", {name:"Move Usage reports"})).toBeFocused();
});

test("KanbanBoard provides a concrete cross-column action without pickup", async ({page}, info) => {
  await page.goto("/components/kanban-board");
  const board = page.getByRole("region", {name:"Release board"});
  const action = board.getByRole("button", {name:"Move options for Usage reports"});
  await action.press("Enter");
  const menu = page.getByRole("menu", {name:"Move options for Usage reports"});
  await expect(menu.getByRole("menuitem", {name:"Move earlier"})).toHaveAttribute("aria-disabled","true");
  await menu.getByRole("menuitem", {name:"Move later"}).click();
  const backlog = board.getByRole("group", {name:"Backlog"});
  await expect(backlog.getByRole("heading").last()).toHaveText("Usage reports");
  await action.press("Enter");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem", {name:"Backlog"})).toHaveCount(0);
  await page.screenshot({path:info.outputPath("kanban-move-menu.png")});
  await menu.getByRole("menuitem", {name:"In progress"}).click();
  const lane = board.getByRole("group", {name:"In progress"});
  await expect(lane.getByRole("heading").last()).toHaveText("Usage reports");
  await expect(lane.getByRole("button", {name:"Move Usage reports"})).toBeFocused();
  const movedTitle=lane.getByRole("button",{name:"Usage reports",exact:true});
  await movedTitle.press("Enter");
  const details=page.getByRole("dialog",{name:"Usage reports"});
  await expect(details).toBeVisible();
  await expect(details.getByText("In progress",{exact:true})).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(movedTitle).toBeFocused();
});

test("KanbanBoard inserts a dragged card before a visible target without changing lane geometry", async ({page}, info) => {
  test.skip(info.project.name === "mobile", "Desktop board fits both lanes for this pointer interaction");
  await page.goto("/components/kanban-board");
  const board = page.getByRole("region", {name:"Release board"});
  const source = board.getByRole("button", {name:"Move Usage reports"});
  const lane = board.getByRole("group", {name:"In progress"});
  const card = lane.locator(".flood-kanban-board__card");
  await expect(card).toBeVisible();
  const origin = (await source.boundingBox())!;
  const target = (await card.boundingBox())!;
  await page.mouse.move(origin.x + origin.width / 2, origin.y + origin.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width / 2, target.y + 6, {steps:8});
  await expect(card).toHaveAttribute("data-drop-before", "true");
  expect(await card.boundingBox()).toEqual(target);
  await page.screenshot({path:info.outputPath("kanban-pointer.png")});
  await page.mouse.up();
  await expect(lane.getByRole("heading").first()).toHaveText("Usage reports");
  await expect(source).toBeFocused();
});

test("KanbanBoard keeps touch pickup on the handle and card swipes available for scrolling", async ({page, browserName}, info) => {
  test.skip(info.project.name !== "mobile" || browserName !== "chromium", "Uses the touch project and Chromium input protocol");
  await page.goto("/components/kanban-board");
  await chooseKanbanOption(page,"dragActivation","Drag activation","card");
  const board = page.getByRole("region",{name:"Release board"});
  const lane = board.getByRole("group", {name:"Backlog"});
  const source = lane.getByRole("button", {name:"Move Saved filters"});
  const target = lane.locator(".flood-kanban-board__card").first();
  await source.scrollIntoViewIfNeeded();
  const origin = (await source.boundingBox())!;
  const bounds = (await target.boundingBox())!;
  const touch = await page.context().newCDPSession(page);
  try {
    await touch.send("Input.dispatchTouchEvent", {type:"touchStart", touchPoints:[{
      x:origin.x + origin.width / 2, y:origin.y + origin.height / 2, id:1,
    }]});
    await touch.send("Input.dispatchTouchEvent", {type:"touchMove", touchPoints:[{
      x:bounds.x + bounds.width / 2, y:bounds.y + 6, id:1,
    }]});
    await expect(target).toHaveAttribute("data-drop-before", "true");
    await page.screenshot({path:info.outputPath("kanban-touch.png")});
    await touch.send("Input.dispatchTouchEvent", {type:"touchEnd", touchPoints:[]});
    await expect(lane.getByRole("heading").first()).toHaveText("Saved filters");

    const viewport=board.locator(".flood-kanban-board__scroll");
    const scrollBefore=await viewport.evaluate(node=>node.scrollLeft);
    const surface=(await target.boundingBox())!;
    const swipe={x:surface.x+surface.width-10,y:surface.y+5,id:2};
    await touch.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[swipe]});
    for (const delta of [20,50,90]) {
      await touch.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{...swipe,x:swipe.x-delta}]});
    }
    await touch.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
    await expect.poll(()=>viewport.evaluate(node=>node.scrollLeft)).toBeGreaterThan(scrollBefore);
    await expect(board).not.toHaveAttribute("data-moving","pointer");
  } finally {
    await touch.detach();
  }
});

test("KanbanBoard project cards keep smaller headings and unfilled icons with optional details", async ({page}, info) => {
  await page.goto("/components/kanban-board");
  const compactTitle=page.getByRole("heading", {name:"Usage reports",exact:true});
  const compactSize=await compactTitle.evaluate(node=>parseFloat(getComputedStyle(node).fontSize));
  await chooseKanbanOption(page,"cardLayout","Card layout","project");
  const board=page.getByRole("region",{name:"Project portfolio"});
  const title=board.getByRole("heading",{name:"Self-serve billing",exact:true});
  const card=board.locator(".flood-kanban-board__card").filter({has:page.getByRole("heading",{name:"Self-serve billing",exact:true})});
  const icon=card.locator(".flood-kanban-board__project-icon");
  await expect(icon.locator("svg")).toBeVisible();
  const [glyph,target]=await Promise.all([
    icon.boundingBox(),
    card.getByRole("button",{name:"Move Self-serve billing",exact:true}).boundingBox(),
  ]);
  expect(Math.abs(glyph!.y+glyph!.height/2-(target!.y+target!.height/2))).toBeLessThan(1);
  await expect(icon).toHaveCSS("background-color","rgba(0, 0, 0, 0)");
  await expect(title).toHaveCSS("font-size","14px");
  expect(await title.evaluate(node=>parseFloat(getComputedStyle(node).fontSize))).toBeLessThan(compactSize);
  await expect(card.getByText("At risk",{exact:true})).toBeVisible();
  await expect(card.locator("time")).toHaveAttribute("datetime","2026-11-24");
  await expect(card.getByRole("img",{name:"Maya Chen"})).toBeVisible();
  const sparse=board.locator(".flood-kanban-board__card").filter({hasText:"Archive older reports"});
  await expect(sparse.locator(".flood-card__footer")).toHaveCount(0);
  await page.screenshot({path:info.outputPath("kanban-project.png")});
  await page.getByRole("button",{name:"Reference Alt R"}).click();
  const example=page.getByRole("dialog",{name:"Component reference"}).locator("pre").first();
  await expect(example).toContainText('cardLayout="project"');
  await expect(example).toContainText("icon: <CreditCard />");
  await expect(example).toContainText('from "lucide-react"');
});

test("KanbanBoard card pickup preserves text selection, title actions and Escape", async ({page}, info) => {
  test.skip(info.project.name==="mobile","Uses mouse pickup across visible project lanes");
  await page.goto("/components/kanban-board");
  await chooseKanbanOption(page,"cardLayout","Card layout","project");
  await chooseKanbanOption(page,"dragActivation","Drag activation","card");
  const board=page.getByRole("region",{name:"Project portfolio"});
  const sourceTitle=board.getByRole("button",{name:"Self-serve billing",exact:true});
  const source=board.locator(".flood-kanban-board__card").filter({has:page.getByRole("button",{name:"Self-serve billing",exact:true})});
  const destination=board.getByRole("group",{name:"In progress"});
  const target=destination.locator(".flood-kanban-board__card").first();
  const description=source.getByText("Let workspace admins update payment methods and invoices.");
  await source.scrollIntoViewIfNeeded();
  const text=(await description.boundingBox())!;
  await page.mouse.move(text.x+1,text.y+8);
  await page.mouse.down();
  await page.mouse.move(text.x+95,text.y+8,{steps:5});
  await page.mouse.up();
  await expect.poll(()=>page.evaluate(()=>window.getSelection()?.toString())).toContain("workspace");
  await expect(board).not.toHaveAttribute("data-moving","pointer");
  await page.evaluate(()=>window.getSelection()?.removeAllRanges());

  const drag=async()=>{
    const origin=(await source.boundingBox())!;
    const bounds=(await target.boundingBox())!;
    await page.mouse.move(origin.x+6,origin.y+6);
    await page.mouse.down();
    await page.mouse.move(bounds.x+bounds.width/2,bounds.y+6,{steps:8});
    await expect(target).toHaveAttribute("data-drop-before","true");
  };
  await drag();
  await page.keyboard.press("Escape");
  await expect(board).not.toHaveAttribute("data-moving","pointer");
  await page.mouse.up();
  await expect(board.getByRole("group",{name:"Planned"}).getByRole("button",{name:"Self-serve billing",exact:true})).toBeVisible();

  await drag();
  await page.screenshot({path:info.outputPath("kanban-project-drag.png")});
  await page.mouse.up();
  await expect(destination.getByRole("heading").first()).toHaveText("Self-serve billing");
  await expect(destination.getByRole("button",{name:"Move Self-serve billing",exact:true})).toBeFocused();
  await sourceTitle.click();
  const details=page.getByRole("dialog",{name:"Self-serve billing"});
  await expect(details.getByText("In progress",{exact:true})).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sourceTitle).toBeFocused();
});
