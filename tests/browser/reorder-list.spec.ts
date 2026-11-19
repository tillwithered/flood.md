import {expect, test} from "@playwright/test";

test("ReorderList claims keyboard placement, cancels safely and restores focus after rejection",async ({page},info)=>{
  await page.goto("/components/reorder-list");
  const list=page.getByRole("list",{name:"Page sections"});
  const overview=list.getByRole("button",{name:"Reorder Overview"});
  const features=list.getByRole("button",{name:"Reorder Features"});
  await overview.focus();
  await overview.press("Space");
  await expect(overview).toHaveAttribute("aria-pressed","true");
  await overview.press("ArrowDown");
  await expect(list.locator('[data-flood-reorder-id="features"]')).toHaveAttribute("data-placement","after");
  await list.screenshot({path:info.outputPath("reorder-keyboard.png")});
  await overview.press("Escape");
  await expect(overview).toBeFocused();
  await expect(list.locator("[data-placement]")).toHaveCount(0);
  await expect(list.getByRole("button").first()).toHaveAccessibleName("Reorder Overview");

  await overview.press("Space");
  await overview.press("ArrowDown");
  await overview.press("Enter");
  await expect(list.getByRole("button").first()).toHaveAccessibleName("Reorder Features");
  await expect(overview).toBeFocused();
  await page.getByRole("checkbox",{name:"ReorderList prop rejectMoves"}).check();
  await features.press("Space");
  await features.press("ArrowDown");
  await features.press("Enter");
  await expect(page.getByRole("status").filter({hasText:"The section order is locked for review."})).toBeVisible();
  await expect(list.getByRole("button").first()).toHaveAccessibleName("Reorder Features");
  await expect(features).toBeFocused();
});

test("ReorderList supports the inside target with pointer capture",async ({page,browserName},info)=>{
  await page.goto("/components/reorder-list");
  const list=page.getByRole("list",{name:"Page sections"});
  const handle=list.getByRole("button",{name:"Reorder Pricing"});
  await expect(handle).toBeVisible();
  const origin=(await handle.boundingBox())!;
  const archive=(await list.locator('[data-flood-reorder-id="archive"]').boundingBox())!;
  const start={x:origin.x+origin.width/2,y:origin.y+origin.height/2};
  const end={x:archive.x+archive.width/2,y:archive.y+archive.height/2};
  const touch = info.project.name==="mobile" && browserName==="chromium";
  if (touch) {
    const device=await page.context().newCDPSession(page);
    await device.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{...start,id:1}]});
    await device.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{...end,id:1}]});
    await expect(list.locator('[data-flood-reorder-id="archive"]')).toHaveAttribute("data-placement","inside");
    await page.screenshot({path:info.outputPath("reorder-touch.png")});
    await device.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
    await device.detach();
  } else {
    await page.mouse.move(start.x,start.y);
    await page.mouse.down();
    await page.mouse.move(end.x,end.y,{steps:5});
    await expect(list.locator('[data-flood-reorder-id="archive"]')).toHaveAttribute("data-placement","inside");
    await page.screenshot({path:info.outputPath("reorder-pointer.png")});
    await page.mouse.up();
  }
  await expect(list.locator('[data-flood-reorder-id="pricing"]')).toHaveAttribute("data-nested","true");
  await expect(list.getByRole("button").last()).toHaveAccessibleName("Reorder Pricing");
  await expect(handle).toBeFocused();
});
