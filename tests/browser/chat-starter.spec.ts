import { expect, test } from "@playwright/test";

const url = (process.env.FLOOD_NEXT_TEST_URL ?? "http://127.0.0.1:3001") + "/chat-starter";

test("the chat starter streams a response and reloads the saved conversation", async ({ page }, testInfo) => {
  await page.goto(url);
  const draft = page.getByRole("textbox", { name: "Message", exact: true });
  await expect(draft).toBeEnabled();
  const emptyArt = page.locator(".flood-character-avatar__drawing");
  const emptyMarkup = await emptyArt.innerHTML();
  await page.reload();
  await expect(draft).toBeEnabled();
  expect(await emptyArt.innerHTML()).toBe(emptyMarkup);

  await page.getByRole("button", { name: "Draft a launch update" }).click();
  await expect(page.getByRole("button", { name: "Stop response" })).toBeEnabled();
  await expect(page.locator(".flood-typing-indicator")).toContainText("Flood is typing");
  await expect(page.getByRole("article", { name: "You" })).toContainText("Draft a launch update");
  await expect(page.getByRole("article", { name: "Flood" })).toContainText("share where the examples fall short.");
  await expect(page.getByRole("button", { name: "Copy response" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Latest messages" })).toHaveCount(0);
  const figures = await page.locator(".flood-character-avatar__drawing").evaluateAll(arts => arts.map(art => art.innerHTML));
  expect(figures).toHaveLength(2);
  expect(figures[0]).not.toBe(figures[1]);
  await page.screenshot({ path: testInfo.outputPath("chat-starter.png") });

  await page.reload();
  await expect(page.getByRole("article", { name: "Flood" })).toContainText("share where the examples fall short.");
  await page.getByRole("button", { name: "New chat" }).click();
  await expect(page.getByRole("heading", { name: "Start a conversation" })).toBeVisible();
  await expect(draft).toBeFocused();
  await draft.fill("A second discussion");
  await draft.press("Enter");
  await expect(page.getByRole("button", { name: "Stop response" })).toBeEnabled();
  await page.getByRole("button", { name: "Stop response" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Response stopped" })).toHaveCount(1);
  await expect(draft).toBeFocused();
});

test("new text stays below a reader who scrolled away and can be reached by keyboard", async ({ page }) => {
  await page.addInitScript(() => {
    const messages = Array.from({ length: 18 }, (_, index) => ({
      id: String(index), role: index % 2 === 0 ? "user" : "assistant",
      text: `Message ${index + 1}\nA longer explanation that can take up space as the interface gets narrower.`,
    }));
    localStorage.setItem("flood-chat-starter-v1", JSON.stringify([{ id: "existing", messages }]));
  });
  await page.goto(url);
  const viewport = page.getByRole("region", { name: "Messages" });
  await expect.poll(() => viewport.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
  const draft = page.getByRole("textbox", { name: "Message", exact: true });
  await viewport.evaluate(node => { node.scrollTop = 40; });
  const jump = page.getByRole("button", { name: "Latest messages" });
  await expect(jump).toBeVisible();
  await draft.fill("What's new?");
  await draft.press("Enter");
  await expect(page.getByRole("button", { name: "Stop response" })).toBeEnabled();
  await expect.poll(() => viewport.evaluate(node => node.scrollTop)).toBeLessThan(60);
  await jump.focus();
  await jump.press("Enter");
  await expect(viewport).toBeFocused();
  await expect(jump).toHaveCount(0);
  await expect.poll(() => viewport.evaluate(node => node.scrollHeight - node.clientHeight - node.scrollTop)).toBeLessThanOrEqual(4);
});
