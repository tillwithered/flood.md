import {test, expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {readFile} from "node:fs/promises";
import {readAgentWorkflows} from "../../scripts/agent-workflows.mjs";

test("Skills reader and raw guides serve the canonical versioned workflow sources", async ({page, request}, info) => {
  const index=await readAgentWorkflows();
  await page.goto("/docs/skills");
  await expect(page.getByRole("heading", {level:1, name:"Skills", exact:true})).toBeVisible();
  const content=page.locator(".markdown-content");
  for(const workflow of index.workflows) {
    await expect(content.locator(`a[href="/agent/${workflow.guide}"]`)).toHaveText("Read skill");
    const response=await request.get(`/agent/${workflow.guide}`);
    expect(response.status()).toBe(200);
    expect(await response.text()).toBe(await readFile(`packages/agent/${workflow.guide}`,"utf8"));
  }
  const generated=JSON.parse(await readFile("apps/website/src/generated/content.json","utf8"));
  expect(await (await request.get("/docs/skills.md")).text()).toBe(generated.docs["skills.md"]);
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await page.screenshot({path:`.artifacts/skills-reader-${info.project.name}.png`});
});

test("Workspace recipe source and live composition stay linked and readable", async ({page, request}) => {
  const source=(await readFile("apps/website/src/recipes/workspace-review.tsx","utf8")).trimEnd();
  const response=await request.get("/docs/recipes/workspace-review.md");
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain('```tsx\n'+source+'\n```');
  await page.goto("/docs/recipes/workspace-review");
  await page.getByRole("link", {name:"Try the local example", exact:true}).click();
  const form=page.getByRole("form", {name:"Workspace review settings"});
  await expect(form).toBeVisible();
  await form.getByRole("button", {name:"Accept locally"}).click();
  await expect(page.getByText("Accepted in this session", {exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
