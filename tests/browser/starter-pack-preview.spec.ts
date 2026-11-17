import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("StarterPackPreview shows full counts, samples and only populated recommendation groups", async ({page}, info) => {
  await page.goto("/components/starter-pack-preview");
  const stage = page.locator(".preview-stage");
  const preview = stage.getByRole("group", {name:"Independent type designers"});
  const people = preview.getByRole("list", {name:"6 people"});
  const feeds = preview.getByRole("list", {name:"3 feeds"});
  const scenario = page.getByRole("combobox", {name:"Scenario",exact:true});
  const surface = stage.locator(".flood-surface");
  await expect(preview.getByRole("heading")).toHaveText("Independent type designers");
  await expect(preview.getByText("Curated by Maya Chen")).toBeVisible();
  await expect(people).toBeVisible();
  const checkAvatarBacking = async () => {
    const surfaceFill = await surface.evaluate(node => getComputedStyle(node).backgroundColor);
    const faces = people.getByRole("img");
    await expect(faces).toHaveCount(5);
    for (const face of await faces.all()) {
      await expect(face).toHaveCSS("background-color", surfaceFill);
      await expect(face).toHaveCSS("background-image", /^linear-gradient/);
      await expect(face).toHaveCSS("border-inline-end-width", "0px");
    }
    const backingAlphas = await faces.evaluateAll(avatars => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d")!;
      return avatars.map(avatar => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = getComputedStyle(avatar).backgroundColor;
        context.fillRect(0, 0, 1, 1);
        return context.getImageData(0, 0, 1, 1).data[3];
      });
    });
    expect(backingAlphas).toEqual([255, 255, 255, 255, 255]);
    const labelClearance = await faces.evaluateAll(avatars => Math.min(
      ...avatars.slice(0, -1).map((avatar, index) => {
        const initials = avatar.querySelector(".flood-avatar__fallback")!;
        return avatars[index + 1].getBoundingClientRect().left - initials.getBoundingClientRect().right;
      }),
    ));
    expect(labelClearance).toBeGreaterThan(0);
  };
  await checkAvatarBacking();
  await expect(feeds.getByRole("listitem")).toHaveText(["Type workbench","Lettering in use","+1 more"]);
  await page.evaluate(() => document.fonts.ready);
  await surface.screenshot({path:info.outputPath("starter-pack-preview.png")});

  await page.getByRole("checkbox", {name:"StarterPackPreview prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox", {name:"StarterPackPreview prop surface"}),"overlay");
  await expect.poll(() => surface.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await expect(people).toBeVisible();
  await checkAvatarBacking();
  await expect(feeds).toBeVisible();
  await surface.screenshot({path:info.outputPath("starter-pack-preview-narrow.png")});

  await chooseSelectOption(scenario,"Feeds only");
  await expect(people).toHaveCount(0);
  await expect(feeds).toBeVisible();
  await chooseSelectOption(scenario,"Empty");
  await expect(preview.getByRole("list")).toHaveCount(0);
  await expect(preview.getByText("No recommendations yet.")).toBeVisible();
});
