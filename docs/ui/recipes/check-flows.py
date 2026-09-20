"""Chromium smoke checks for the local interaction lab; not a Tauri/a11y certificate.
Requires Python Playwright plus Chromium. Run: python check-flows.py --output /tmp/flows
"""
import argparse
import json
import os
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser()
parser.add_argument('--output',type=Path,default=Path('/tmp/flood-flow-evidence'))
args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
root=Path(__file__).parent
html=(root/'flows.html').read_text()
for name in ['precision.css','flows.css']:
    html=html.replace(f'<link rel="stylesheet" href="{name}">','<style>\n'+(root/name).read_text()+'\n</style>')
html=html.replace('<script src="flows.js"></script>','<script>\n'+(root/'flows.js').read_text()+'\n</script>')
checks=[];errors=[];requests=[]
with sync_playwright() as p:
    executable=os.environ.get('FLOOD_CHROMIUM_PATH') or shutil.which('chromium')
    launch={'headless':True,'args':['--no-sandbox']}
    if executable: launch['executable_path']=executable
    browser=p.chromium.launch(**launch)
    page=browser.new_page(viewport={'width':1180,'height':900},accept_downloads=True)
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.on('request',lambda request:requests.append(request.url))
    def fresh(theme='light',width=1180):
        page.set_viewport_size({'width':width,'height':900})
        page.set_content(html)
        page.evaluate('(theme)=>document.body.dataset.theme=theme',theme)
    def expect(test,name):
        assert test,name
        checks.append(name)
    def snapshot(): return page.evaluate('window.flowLab.snapshot()')
    def modal(scenario='success'):
        fresh();page.locator('#tab-connect').click();page.select_option('#scenario',scenario);page.locator('#open-repos').click();page.wait_for_timeout(170)
    def choose(repo='1:101'): page.locator(f'input[name="repository"][value="{repo}"]').check()

    views=0
    for theme in ['light','dark']:
        for width in [1180,780,390,320]:
            for tab in ['menu','choice','connect']:
                fresh(theme,width);page.locator('#tab-'+tab).click()
                if tab=='menu':page.locator('#menu-trigger').click()
                if tab=='choice':page.locator('#combo-toggle').click()
                if tab=='connect':page.locator('#open-repos').click()
                page.wait_for_timeout(180)
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'),(theme,width,tab,'overflow')
                if tab=='connect':
                    box=page.locator('#repos-dialog').bounding_box()
                    assert box['x']>=0 and box['x']+box['width']<=width+1
                else:
                    layer=page.locator('#task-menu' if tab=='menu' else '#projects-popup')
                    assert layer.is_visible(),(tab,theme,width,'popup disappeared')
                    box=layer.bounding_box();assert box['x']>=0 and box['x']+box['width']<=width+1
                page.screenshot(path=str(args.output/f'{tab}-{theme}-{width}.png'))
                views+=1
    checks.append(f'{views} viewport states: 3 surfaces x 4 widths x 2 themes')
    fresh();page.locator('#menu-trigger').focus();page.keyboard.press('ArrowDown')
    expect(page.locator('[data-command="details"]').evaluate('(e)=>e===document.activeElement'),'menu keyboard entry')
    page.keyboard.press('End');page.keyboard.press('Enter')
    expect(page.locator('#delete-dialog').is_visible() and page.locator('#cancel-delete').evaluate('(e)=>e===document.activeElement'),'destructive dialog starts on cancel')
    page.keyboard.press('Escape');expect(page.locator('#menu-trigger').evaluate('(e)=>e===document.activeElement'),'dialog restores trigger')
    page.locator('#menu-trigger').click();page.locator('[data-command="pin"]').click()
    expect(page.locator('#pin-label').inner_text()=='Закреплена','local menu command applied')
    page.locator('#menu-trigger').click();page.keyboard.press('Escape')
    expect(not page.locator('#task-menu').is_visible(),'escape closes menu only')
    page.locator('#tab-choice').click();page.locator('#project-choice').fill('дизайн');page.keyboard.press('ArrowDown');page.keyboard.press('Enter')
    expect(snapshot()['chosenProject']=='Дизайн-система Flood','combobox commits active option')
    page.locator('#project-choice').fill('неттакого');expect(page.locator('#combo-empty').is_visible(),'combobox no results')
    page.keyboard.press('Escape');expect(page.locator('#project-choice').input_value()=='Дизайн-система Flood','Escape restores committed value')

    modal();choose();page.locator('#repo-query').fill('documentation')
    expect(page.locator('#hidden-selection').is_visible() and snapshot()['selected']=='1:101','filtered selection retained by stable installation/repo key')
    page.locator('#repo-query').fill('no-result-unique');expect(page.locator('#repo-empty').is_visible(),'repository no-results separate')
    page.locator('#reset-repo-filters').click();expect(page.locator('#repo-query').evaluate('(e)=>e===document.activeElement'),'reset restores query focus')
    page.locator('#repo-query').fill('flood-dev');page.keyboard.press('Enter');expect(snapshot()['operation']==0,'Enter in search does not connect')
    page.locator('#commit-repo').focus();page.keyboard.press('Tab')
    expect(page.locator('#close-repos').evaluate('(e)=>e===document.activeElement'),'modal wraps forward focus')
    page.keyboard.press('Shift+Tab');expect(page.locator('#commit-repo').evaluate('(e)=>e===document.activeElement'),'modal wraps reverse focus')
    page.mouse.click(5,5);expect(page.locator('#repos-dialog').is_visible(),'backdrop does not discard selection')
    page.locator('#commit-repo').evaluate('(e)=>{e.click();e.click();}')
    expect(snapshot()['operation']==1,'duplicate submission blocked')
    page.wait_for_timeout(720)
    expect(snapshot()['bound']=='tillwithered/flood-dev' and not page.locator('#repos-dialog').is_visible(),'commit binds exact selected identity')

    modal('catalog-error');expect(page.locator('#catalog-error').is_visible() and not page.locator('#repo-empty').is_visible(),'catalog error distinct from no-results')
    page.locator('#retry-catalog').click();expect(page.locator('#repo-options').is_visible(),'catalog retry')
    modal('write-error');choose();page.locator('#commit-repo').click();page.wait_for_timeout(720)
    expect(snapshot()['phase']=='failed' and snapshot()['selected']=='1:101','write failure preserves selection')
    page.locator('#commit-repo').click();page.wait_for_timeout(720);expect(snapshot()['bound']=='tillwithered/flood-dev','explicit retry succeeds in simulation')
    modal('unknown');choose();page.locator('#commit-repo').click();page.wait_for_timeout(720)
    expect(snapshot()['phase']=='unknown' and snapshot()['bound'] is None,'lost response is not declared success')
    expect(page.locator('#repo-query').is_disabled(),'uncertain operation target cannot change before reconciliation')
    page.locator('#commit-repo').click();page.wait_for_timeout(720)
    expect(snapshot()['bound']=='tillwithered/flood-dev' and snapshot()['operation']==1,'reconcile without second mutation')
    modal('revoked');choose();page.locator('#commit-repo').click()
    expect(snapshot()['operation']==0 and page.locator('#commit-repo').is_disabled(),'revoked access blocks commit')
    choose('2:201');expect(not page.locator('#commit-repo').is_disabled(),'different accessible source remains selectable')
    modal();choose();page.locator('#commit-repo').click();page.locator('#close-repos').click();page.wait_for_timeout(720)
    expect(snapshot()['bound']=='tillwithered/flood-dev' and page.locator('#open-repos').evaluate('(e)=>e===document.activeElement'),'close pending does not cancel outcome or steal focus')

    fresh();page.locator('[data-review="keep"]').click();page.locator('#review-note').fill('Меню принято для проверки');page.locator('#tab-choice').click();page.locator('[data-review="revise"]').click();page.locator('#tab-menu').click()
    expect(page.locator('#review-note').input_value()=='Меню принято для проверки','independent review notes')
    with page.expect_download() as download:page.locator('#export').click()
    payload=json.loads(Path(download.value.path()).read_text())
    expect(payload['reviews']['menu']['decision']=='keep' and payload['reviews']['choice']['decision']=='revise','local review export')
    fresh();page.locator('#tab-menu').focus();page.keyboard.press('End');expect(snapshot()['activeTab']=='connect','tab keyboard navigation')
    page.emulate_media(reduced_motion='reduce',forced_colors='active');page.locator('#open-repos').click()
    expect(page.locator('#repos-dialog').evaluate('(e)=>getComputedStyle(e).animationName')=='none','reduced motion removes dialog entrance')
    page.wait_for_timeout(180);page.screenshot(path=str(args.output/'forced-colors.png'))
    expect(not errors,'no JavaScript page errors')
    expect(not requests,'no external requests')
    browser.close()
report={'checks':checks,'views':views,'pageErrors':errors,'networkRequests':requests,'limitations':['Chromium only','No screen-reader audit','No Tauri/WebView2/WebKit','No real GitHub data or writes','No production build or native zoom test']}
(args.output/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({'groups':len(checks),'views':views,'pageErrors':errors,'networkRequests':requests},ensure_ascii=False))
