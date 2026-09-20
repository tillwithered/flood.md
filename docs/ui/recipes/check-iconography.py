"""Chromium smoke checks for Flood iconography lab 0.6.5; not production/a11y certification."""
import json, os, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

base=Path(__file__).parent
html=(base/"iconography.html").read_text()
out=Path(os.environ.get("FLOOD_EVIDENCE","/tmp/flood-iconography-evidence"));out.mkdir(parents=True,exist_ok=True)
checks=[]
def check(ok,name): assert ok,name; checks.append(name)

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get("FLOOD_CHROMIUM_PATH") or shutil.which("chromium"),args=["--no-sandbox"])
    page=browser.new_page(viewport={"width":1180,"height":920})
    errors=[];requests=[]
    page.on("pageerror",lambda e:errors.append(str(e)))
    page.on("request",lambda r:requests.append(r.url))
    def fresh(theme="light",width=1180):
        page.set_viewport_size({"width":width,"height":920});page.set_content(html);page.evaluate("(t)=>document.documentElement.dataset.theme=t",theme)
    views=0
    for theme in ["light","dark"]:
        for width in [960,1180,1440]:
            for tab in ["map","actions","tooltip","scale"]:
                fresh(theme,width);page.locator("#tab-"+tab).click();page.wait_for_timeout(20)
                check(page.evaluate("document.documentElement.scrollWidth<=innerWidth+1"),f"{theme}/{width}/{tab} no overflow")
                if width==1180: page.screenshot(path=str(out/f"{tab}-{theme}.png"),full_page=True)
                views+=1
    fresh();page.locator("#tab-actions").click();buttons=page.locator("#live-toolbar .icon-btn")
    check(buttons.count()==7,"toolbar action count")
    box=buttons.first.bounding_box();glyph=buttons.first.locator("svg").bounding_box()
    check(round(box["width"])==36 and round(box["height"])==36,"target 36")
    check(round(glyph["width"])==16 and round(glyph["height"])==16,"glyph 16")
    check(buttons.first.evaluate("(e)=>getComputedStyle(e).boxShadow")=="none","rest no shadow")
    page.locator("#tab-actions").focus();page.keyboard.press("Tab");page.wait_for_timeout(150)
    check(page.locator("#flood-tooltip").is_visible(),"focus tooltip")
    page.keyboard.press("Escape");check(not page.locator("#flood-tooltip").is_visible(),"escape tooltip")
    page.locator("#pin-demo").click();check(page.locator("#pin-demo").get_attribute("aria-pressed")=="true","selected toggle")
    fresh();page.locator("#tab-tooltip").click();target=page.locator("#panel-tooltip [data-tip]").first;target.hover()
    page.wait_for_timeout(300);check(not page.locator("#flood-tooltip").is_visible(),"hover delay not early")
    page.wait_for_timeout(190);check(page.locator("#flood-tooltip").is_visible(),"hover tooltip shown")
    tip=page.locator("#flood-tooltip").bounding_box();tb=target.bounding_box()
    side=page.locator("#flood-tooltip").get_attribute("data-side")
    gap=tb["y"]-(tip["y"]+tip["height"]) if side=="top" else tip["y"]-(tb["y"]+tb["height"])
    check(abs(gap-6)<=1,"tooltip gap6")
    check(page.locator("#flood-tooltip").evaluate("(e)=>getComputedStyle(e).boxShadow")=="none","tooltip no shadow")
    check(not errors,"no JS errors");check(not requests,"no external requests")
    browser.close()

(out/"report.json").write_text(json.dumps({"assertions":len(checks),"views":views,"errors":errors,"requests":requests,"limits":["Chromium only","No Tauri/WebView2/Safari/SR/native zoom","No production migration"]},ensure_ascii=False,indent=2))
print(json.dumps({"assertions":len(checks),"views":views,"errors":errors,"requests":requests},ensure_ascii=False))
