import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for(const [slug,component,name,role,wrapper] of [
  ["input","Input","Project name","textbox",true],
  ["input-group","InputGroup","Website","textbox",true],
  ["textarea","Textarea","Project note","textbox",true],
  ["select","Select","Project visibility","combobox",true],
  ["field","Field","Project name","textbox",false],
  ["fieldset","Fieldset","Notifications","group",false],
  ["radio-group","RadioGroup","Visibility","radiogroup",false],
  ["checkbox-group","CheckboxGroup","Notifications","group",false],
  ["segmented-control","SegmentedControl","Time range","radiogroup",false],
] as const){
  test(`${component} can hide its external label without losing its accessible name or reserving a row`,async({page},info)=>{
    await page.goto(`/components/${slug}`);
    const stage=page.locator(".preview-stage"),host=stage.locator(".flood-field, .flood-fieldset").first();
    const title=host.locator(":scope > .flood-label, :scope > .flood-legend");
    const before=(await host.boundingBox())!;
    const choice=stage.getByRole(role,{name,exact:true});await expect(choice).toHaveCount(1);
    await page.getByRole("checkbox",{name:`${component} ${wrapper?"Field wrapper":"prop"} hideLabel`,exact:true}).check();
    await expect(choice).toHaveCount(1);await expect(title).toHaveClass(/flood-visually-hidden/);
    const playwrightTitleBox = await title.boundingBox();
    const titleDiagnostics = await title.evaluate(node => {
      const style = getComputedStyle(node), parent = node.parentElement!, root = node.closest(".flood-root");
      const rect = (element: Element) => { const box = element.getBoundingClientRect(); return {x:box.x,y:box.y,width:box.width,height:box.height,top:box.top,bottom:box.bottom}; };
      const range = document.createRange(); range.selectNodeContents(node); const textBox = range.getBoundingClientRect();
      return {
        tag:node.tagName,className:node.className,domBox:rect(node),
        clientRects:Array.from(node.getClientRects(), box => ({x:box.x,y:box.y,width:box.width,height:box.height})),
        textBox:{x:textBox.x,y:textBox.y,width:textBox.width,height:textBox.height},
        offsetHeight:(node as HTMLElement).offsetHeight,clientHeight:node.clientHeight,scrollHeight:node.scrollHeight,
        computed:Object.fromEntries([
          "position","display","width","height","inline-size","block-size",
          "min-width","max-width","min-height","max-height","min-inline-size","max-inline-size","min-block-size","max-block-size",
          "font-size","line-height","margin-top","margin-bottom","margin-block-start","margin-block-end","padding-top","padding-bottom",
          "top","bottom","inset-block-start","inset-block-end","overflow","clip","clip-path","white-space","box-sizing","transform",
        ].map(property => [property,style.getPropertyValue(property)])),
        parent:{tag:parent.tagName,className:parent.className,hideLabel:parent.getAttribute("data-hide-label"),role:parent.getAttribute("role"),box:rect(parent)},
        bodyBox:parent.querySelector(":scope > .flood-fieldset__body") ? rect(parent.querySelector(":scope > .flood-fieldset__body")!) : null,
        root:root ? {className:root.className,foundations:root.getAttribute("data-flood-foundations"),theme:root.getAttribute("data-flood-theme")} : null,
        stylesheets:Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'), link => link.href),
      };
    });
    expect(playwrightTitleBox?.height ?? Infinity, JSON.stringify({component,project:info.project.name,playwrightTitleBox,...titleDiagnostics},null,2)).toBeLessThanOrEqual(1);
    expect((await host.boundingBox())!.height).toBeLessThan(before.height-2);
    const box=(await host.boundingBox())!;
    const content=slug==="input-group"? (await host.locator(":scope > .flood-input-group").boundingBox())! : role==="textbox"||role==="combobox"? (await choice.boundingBox())! : (await host.locator(":scope > .flood-fieldset__body").boundingBox())!;
    expect(content.y-box.y).toBeCloseTo(0,1);
    if(role==="textbox"){
      await choice.focus();await expect(choice).toBeFocused();
      if(slug==="field")await expect(choice).toHaveAttribute("required","");
    }
    if(slug==="field"){
      await expect(choice).toHaveAccessibleDescription(/Visible to your team.*Enter a project name/);
      for(const label of ["hint","error"]){await page.getByRole("checkbox",{name:`Field prop ${label}`,exact:true}).uncheck();expect((await choice.boundingBox())!.y-(await host.boundingBox())!.y).toBeCloseTo(0,1)}
    }
    expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
    await expect(page.locator("#usage .site-code-block code")).toContainText("hideLabel");
    if(slug==="segmented-control"||slug==="input")await page.locator(".component-workbench").screenshot({path:`.artifacts/hidden-${slug}-${info.project.name}.png`});
    await page.getByRole("checkbox",{name:`${component} ${wrapper?"Field wrapper":"prop"} hideLabel`,exact:true}).uncheck();
    await expect(title).not.toHaveClass(/flood-visually-hidden/);await expect(choice).toHaveCount(1);
  });
}
