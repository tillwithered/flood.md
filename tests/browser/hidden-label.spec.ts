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
      const legendProbes: unknown[] = [];
      if (node.tagName === "LEGEND" && root) {
        // Connected isolated clones are needed for real native fieldset layout;
        // none of these comparisons mutate the React-owned heading or controls.
        const scope = root.cloneNode(false) as HTMLElement;
        scope.removeAttribute("id"); scope.setAttribute("aria-hidden", "true");
        for (const [property,value] of Object.entries({position:"absolute",left:"-10000px",top:"0",width:`${parent.getBoundingClientRect().width}px`,visibility:"hidden","pointer-events":"none"})) scope.style.setProperty(property,value,"important");
        document.body.append(scope);
        try {
          for (const variant of ["initial-hidden","hide-after-visible-layout","replace-hidden-legend","float-left","float-left-static","physical-dimensions","forced-layout","always-float-inline-start","always-float-left"]) {
            const host = parent.cloneNode(true) as HTMLElement;
            // Isolate native radio/form ownership as well as visual geometry.
            for (const element of [host,...Array.from(host.querySelectorAll("[id],[name],[form]"))]) { element.removeAttribute("id"); element.removeAttribute("name"); element.removeAttribute("form"); }
            let legend = host.querySelector("legend")!;
            const body = host.querySelector<HTMLElement>(":scope > .flood-fieldset__body");
            const initiallyHidden = variant === "initial-hidden";
            if (!initiallyHidden) {
              host.removeAttribute("data-hide-label"); legend.classList.remove("flood-visually-hidden");
              if (variant.startsWith("always-float")) {
                legend.style.cssFloat = variant === "always-float-left" ? "left" : "inline-start";
                legend.style.width = "100%";
                if (body) body.style.clear = "both";
              }
            }
            scope.append(host);
            const measure = () => {
              const computed = getComputedStyle(legend), hostBox = host.getBoundingClientRect(), bodyBox = body?.getBoundingClientRect();
              return {legend:rect(legend),host:rect(host),bodyTop:bodyBox ? bodyBox.top-hostBox.top : null,
                computed:Object.fromEntries(["position","float","width","height","inline-size","block-size","max-height","max-block-size","line-height","margin-top","margin-bottom","margin-block-end"].map(property => [property,computed.getPropertyValue(property)])),inlineStyle:legend.getAttribute("style")};
            };
            const before = measure();
            if (!initiallyHidden) { host.setAttribute("data-hide-label","true"); legend.classList.add("flood-visually-hidden"); }
            if (variant.startsWith("always-float")) legend.style.removeProperty("width");
            if (variant === "replace-hidden-legend") { const replacement = legend.cloneNode(true) as HTMLLegendElement; legend.replaceWith(replacement); legend = replacement; }
            if (variant === "float-left" || variant === "float-left-static") legend.style.cssFloat = "left";
            if (variant === "float-left-static") legend.style.position = "static";
            if (variant === "physical-dimensions") Object.assign(legend.style,{width:"1px",height:"1px",minWidth:"0",minHeight:"0",maxWidth:"1px",maxHeight:"1px",margin:"0",marginBlockEnd:"0",clip:"rect(0px, 0px, 0px, 0px)"});
            if (variant === "forced-layout") { void host.offsetHeight; void legend.offsetHeight; void getComputedStyle(legend).height; }
            legendProbes.push({variant,before,after:measure()}); host.remove();
          }
        } finally { scope.remove(); }
      }
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
        legendProbes,
      };
    });
    if (titleDiagnostics.legendProbes.length) await info.attach(`hidden-legend-${slug}.json`,{body:JSON.stringify({component,project:info.project.name,playwrightTitleBox,...titleDiagnostics},null,2),contentType:"application/json"});
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
