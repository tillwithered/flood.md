import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("meeting availability gives attendees local dates and distinct availability states", async ({page}) => {
  await page.goto("/components/meeting-availability");
  const list = page.getByRole("list", {name:"Attendee availability"});
  const attendee = (name: string) => list.getByRole("listitem").filter({hasText:name});
  await expect(attendee("Maya Chen")).toContainText(/Nov 16, 11:00.*11:45.*GMT-5/);
  await expect(attendee("Sam Rivera")).toContainText("Busy");
  await expect(attendee("Aiko Tanaka")).toContainText(/Nov 17, 1:00.*1:45.*GMT\+9/);
  await expect(attendee("Aiko Tanaka")).toContainText("Outside work hours");
  await expect(attendee("Jules Martin")).toContainText("Not shared");
  await expect(attendee("Jules Martin")).not.toContainText(/Nov|GMT/);
  const indicators = list.locator(".flood-data-list-item__metadata");
  const offsets = await indicators.evaluateAll(items => items.map(item => item.getBoundingClientRect().left));
  expect(Math.max(...offsets) - Math.min(...offsets)).toBeLessThanOrEqual(1);

  const scenario = page.getByRole("combobox", {name:/scenario/i});
  await chooseSelectOption(scenario,"Across midnight");
  await expect(attendee("Sam Rivera")).toContainText(/Nov 16.*11:30.*Nov 17.*12:15/);
  await expect(attendee("Aiko Tanaka")).toContainText("Available");
  expect(await list.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await chooseSelectOption(scenario,"No attendees");
  await expect(page.getByText("No attendees.", {exact:true})).toBeVisible();
});
