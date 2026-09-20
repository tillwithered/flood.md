"""Focused Chromium checks for lab 0.6.4, not a production/a11y certification.
Needs separately installed Python Playwright and Chromium. No app dependencies.
Run: FLOOD_EVIDENCE=/tmp/flood-boolean python check-boolean.py
"""
import json
import os
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE=Path(__file__).parent
OUT=Path(os.environ.get('FLOOD_EVIDENCE','/tmp/flood-boolean-evidence'))
OUT.mkdir(parents=True,exist_ok=True)
html=(BASE/'boolean-controls.html').read_text()
for name in ['primitives-refined','boolean-controls']:
    html=html.replace(f'<link rel="stylesheet" href="{name}.css">','<style>'+ (BASE/(name+'.css')).read_text()+'</style>')
html=html.replace('<script src="boolean-controls.js"></script>','<script>'+ (BASE/'boolean-controls.js').read_text()+'</script>')
checks=[];errors=[];requests=[];views=0

def check(ok,name):
    assert ok,name
    checks.append(name)

def ratio(a,b):
    def lum(v):
        parts=[int(v[i:i+2],16)/255 for i in (1,3,5)]
        linear=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in parts]
        return sum(x*w for x,w in zip(linear,[.2126,.7152,.0722]))
    x,y=sorted([lum(a),lum(b)]);return (y+.05)/(x+.05)

with sync_playwright() as p:
    executable=os.environ.get('FLOOD_CHROMIUM_PATH') or shutil.which('chromium')
    launch={'headless':True,'args':['--no-sandbox'],'ignore_default_args':['--hide-scrollbars']}
    if executable:launch['executable_path']=executable
    browser=p.chromium.launch(**launch)
    page=browser.new_page(viewport={'width':1180,'height':950},accept_downloads=True)
    page.set_default_timeout(4000)
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('request',lambda r:requests.append(r.url))
    def fresh(theme='light',width=1180):
        page.emulate_media(forced_colors='none',reduced_motion='no-preference')
        page.set_viewport_size({'width':width,'height':950});page.set_content(html)
        if theme=='dark':page.locator('#theme').click()
        page.mouse.move(0,0)
    def snap():return page.evaluate('booleanLab.snapshot()')
    def go(tab):page.locator('#tab-'+tab).click()
    def phase(value):page.wait_for_function('(p)=>booleanLab.snapshot().switch.phase===p',arg=value)
    def focus(id):page.locator('#'+id).focus()

    for theme in ['light','dark']:
        for width in [960,1180,1440]:
            fresh(theme,width)
            for tab in ['checkbox','radio','switch','geometry']:
                go(tab)
                check(page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),f'layout {theme}/{width}/{tab}')
                if width==1180:page.screenshot(path=str(OUT/f'{tab}-{theme}.png'),full_page=True)
                views+=1
    fresh()
    check(snap()['master']=={'checked':False,'mixed':True},'master starts mixed')
    focus('cb-master');page.keyboard.press('Space')
    check(all(x['checked'] for x in snap()['children']) and not snap()['master']['mixed'],'Space mixed to all')
    page.keyboard.press('Space')
    check(not any(x['checked'] for x in snap()['children']) and not snap()['master']['checked'],'Space all to none')
    check(not page.locator('#cb-disabled').is_checked(),'master excludes disabled option')
    page.locator('#cb-source-label').click()
    check(snap()['master']['mixed'] and page.locator('#cb-source').is_checked(),'label hit toggles a child, master recomputed')
    page.locator('#cb-source').uncheck()
    page.locator('#cb-form button[type="submit"]').click()
    check(page.locator('#cb-error').inner_text()!='' and page.locator('#cb-master').evaluate('(e)=>e===document.activeElement'),'empty group validates and receives focus without selecting')
    page.keyboard.press('Space')
    check(page.locator('#cb-error').inner_text()=='' and all(x['checked'] for x in snap()['children']),'valid choice clears group error')
    page.locator('#cb-reset').click()
    check(snap()['master']['mixed'],'reset restores mixed')
    check(page.locator('#checkbox-matrix td').count()==24,'24 checkbox specimens')
    check(page.locator('#radio-matrix td').count()==16,'16 radio specimens')
    check(page.locator('#switch-matrix td').count()==22,'22 switch specimens')
    check(page.locator('.b-state-table input,.b-state-table button,[role="checkbox"]').count()==0,'state tables have no fake interactive controls')

    go('radio')
    check(snap()['radio'] is None,'radio has no hidden default')
    page.locator('#radio-form button[type="submit"]').click()
    check(snap()['radio'] is None and page.locator('#radio-focus').evaluate('(e)=>e===document.activeElement'),'radio group error focuses without selecting')
    page.keyboard.press('Space');page.keyboard.press('ArrowDown')
    check(snap()['radio']=='all' and page.locator('input[name="start"]:checked').count()==1,'native radio arrows keep single choice')
    page.keyboard.press('ArrowDown');page.keyboard.press('ArrowDown')
    check(snap()['radio']=='focus','radio arrows skip disabled and wrap')
    check(page.locator('#radio-error').inner_text()=='' and not page.locator('#radio-disabled').is_checked(),'radio error clears, disabled never selected')
    page.keyboard.press('Tab')
    check(page.locator('#radio-form button[type="submit"]').evaluate('(e)=>e===document.activeElement'),'Tab exits radio group')
    page.locator('#radio-form button[type="submit"]').click()
    check('В демо применено' in page.locator('#radio-result').inner_text(),'radio explicit apply')
    page.locator('#radio-reset').click();check(snap()['radio'] is None,'radio reset restores no choice')

    go('switch');focus('save-position');label=page.locator('#save-position-label').inner_text()
    page.keyboard.press('Space')
    check(snap()['switch']['phase']=='pending' and not page.locator('#save-position').is_checked(),'switch keeps confirmed off while pending')
    check(page.locator('#save-position').get_attribute('aria-disabled')=='true' and not page.locator('#save-position').evaluate('(e)=>e.disabled'),'pending remains focusable but guarded')
    page.keyboard.press('Space');page.locator('#save-position').evaluate('(e)=>{e.click();e.click()}')
    check(snap()['switch']['writes']==1,'switch repeat activation cannot duplicate write')
    phase('idle')
    check(page.locator('#save-position').is_checked() and snap()['switch']['confirmed'],'success confirms on')
    check(page.locator('#save-position').evaluate('(e)=>e===document.activeElement'),'completion retains focus')
    page.locator('#outcome-error').check();focus('save-position');page.keyboard.press('Space')
    check(page.locator('#save-position').is_checked(),'off request preserves confirmed on')
    phase('error')
    check(snap()['switch']['confirmed'] and 'выключить' in page.locator('#switch-feedback').inner_text(),'failure retains on and explains requested off')
    page.locator('#outcome-success').check();page.locator('#switch-retry').click()
    check(page.locator('#save-position').evaluate('(e)=>e===document.activeElement'),'retry moves focus away from disappearing button')
    phase('idle');check(not snap()['switch']['confirmed'],'retry repeats captured off intention')
    page.locator('#switch-reset').click();page.locator('#outcome-unknown').check()
    focus('save-position');page.keyboard.press('Space');phase('unknown')
    check(not snap()['switch']['confirmed'] and snap()['switch']['writes']==1,'unknown is not declared success')
    page.keyboard.press('Space');check(snap()['switch']['writes']==1,'unknown value cannot be toggled before reconciliation')
    page.locator('#switch-reconcile').click();phase('idle')
    check(snap()['switch']['confirmed'] and snap()['switch']['reads']==1 and snap()['switch']['writes']==1,'read-only reconciliation, no duplicate write')
    check(page.locator('#save-position-label').inner_text()==label,'switch label remains stable across all outcomes')
    page.locator('#switch-reset').click();focus('save-position');page.keyboard.press('Space');go('checkbox');phase('idle')
    check(page.locator('#tab-checkbox').evaluate('(e)=>e===document.activeElement') and snap()['switch']['confirmed'],'completion in hidden panel never steals focus or loses value')

    go('geometry');page.locator('#measure').click()
    check('Inset: край 2.0 / сверху 2.0 / снизу 2.0' in page.locator('#measurements').inner_text(),'switch measured border-inclusive inset2')
    def geometry():return page.evaluate('''()=>{
      const input=document.querySelector('#geometry-check'),mark=input.nextElementSibling,choice=input.closest('.b-choice'),text=document.querySelector('#geometry-check-label');
      const m=mark.getBoundingClientRect(),c=choice.getBoundingClientRect(),t=text.getBoundingClientRect();
      const sw=document.querySelector('#geometry-switch').nextElementSibling,s=sw.getBoundingClientRect(),b=sw.firstElementChild.getBoundingClientRect();
      return {mark:[m.width,m.height],radius:getComputedStyle(mark).borderRadius,target:[c.width,c.height],gap:t.left-m.right,offset:m.top-t.top,track:[s.width,s.height],thumb:[b.width,b.height],left:b.left-s.left,right:s.right-b.right};}''')
    before=geometry()
    check(before['mark']==[18,18] and before['radius']=='5px' and before['gap']==10 and before['offset']==1,'checkbox size/R5/gap10/first-line alignment')
    check(before['track']==[36,20] and before['thumb']==[16,16] and before['right']==2,'switch on geometry')
    page.locator('#geometry-switch').uncheck();page.wait_for_timeout(160)
    check(geometry()['left']==2,'switch off geometry')
    page.locator('#geometry-check').check();page.locator('#long-text').click()
    after=geometry()
    check(after['mark']==before['mark'] and after['target'][1]>=before['target'][1],'long label grows target, not mark')
    page.locator('#targets').click()
    check(page.locator('body').evaluate('(e)=>e.classList.contains("b-targets")'),'target overlay works')
    page.locator('#targets').click()
    page.keyboard.press('Tab');focus('geometry-check')
    styles=page.locator('#geometry-check').evaluate('''e=>({input:getComputedStyle(e).boxShadow,mark:getComputedStyle(e.nextElementSibling).boxShadow,outline:getComputedStyle(e).outlineStyle})''')
    check(styles['input']=='none' and styles['outline']=='none' and styles['mark']!='none','one focus owner, no system ring')
    focus('theme');page.mouse.move(0,0)
    check(page.locator('.b-choice .b-mark').evaluate_all('(els)=>els.filter(e=>e.getClientRects().length).every(e=>getComputedStyle(e).boxShadow==="none")'),'no decorative control shadow at rest')
    check(page.locator('select,input[type="number"]').count()==0,'no system select/number steppers introduced')
    check(page.locator('#review-note').evaluate('(e)=>getComputedStyle(e).resize')=='none','no resize grip')
    check(page.locator('svg[stroke],svg path[stroke]').count()==0,'check is genuine filled SVG, no stroke icons')

    # Tokens inherited from the verified 0.6.3 file. Test relevant opaque pairs only.
    for theme in ['light','dark']:
        fresh(theme)
        t=page.evaluate('''()=>{const s=getComputedStyle(document.documentElement);return Object.fromEntries(['ink','on-ink','muted','panel','canvas','surface','selected','hover','boundary','danger','focus-core'].map(k=>[k,s.getPropertyValue('--'+k).trim()]));}''')
        for bg in ['panel','canvas','surface','selected','hover']:
            for fg,minimum in [('ink',4.5),('muted',4.5),('boundary',3),('focus-core',3),('danger',3)]:
                check(ratio(t[fg],t[bg])>=minimum,f'contrast {theme}: {fg}/{bg} >= {minimum}')
        check(ratio(t['on-ink'],t['ink'])>=4.5,f'contrast {theme}: selected glyph')
        check(ratio(t['danger'],t['panel'])>=4.5,f'contrast {theme}: error text on panel')

    fresh();focus('tab-checkbox');page.keyboard.press('End');check(snap()['activeTab']=='geometry','tab End and focus routing')
    page.locator('[data-review="keep"]').click();page.locator('#review-note').fill('Геометрия');go('checkbox');page.locator('[data-review="revise"]').click();go('geometry')
    check(page.locator('#review-note').input_value()=='Геометрия','reviews preserved per panel')
    with page.expect_download() as d:page.locator('#export').click()
    payload=json.loads(Path(d.value.path()).read_text())
    check(payload['reviews']['geometry']['decision']=='keep' and payload['reviews']['checkbox']['decision']=='revise','export matches local reviews')
    page.emulate_media(forced_colors='active',reduced_motion='reduce');page.keyboard.press('Tab');focus('geometry-check')
    check(page.locator('#geometry-check').evaluate('(e)=>getComputedStyle(e.nextElementSibling).outlineStyle')=='solid','forced-colors focus fallback')
    check(page.locator('#geometry-switch').evaluate('(e)=>getComputedStyle(e.nextElementSibling.firstElementChild).transitionDuration')=='0s','reduced motion removes thumb movement animation')
    page.screenshot(path=str(OUT/'forced-colors.png'),full_page=True)

    # Stress is absolute 2x computed type, not a claimed native browser zoom test.
    fresh('dark',960);go('geometry')
    page.evaluate('''()=>{const nodes=[...document.querySelectorAll('main *')].map(e=>{const c=getComputedStyle(e);return[e,parseFloat(c.fontSize),parseFloat(c.lineHeight)]});for(const[e,f,l]of nodes){e.style.fontSize=f*2+'px';if(Number.isFinite(l))e.style.lineHeight=l*2+'px';}}''')
    check(page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'2x type stress, no page overflow')
    ctx=browser.new_context(viewport={'width':1180,'height':950},has_touch=True,is_mobile=True)
    touch=ctx.new_page();touch.set_content(html)
    check(touch.locator('label[for="cb-date"]').bounding_box()['height']>=44,'coarse pointer label target >=44')
    touch.locator('#cb-date-label').tap()
    check(touch.locator('#cb-date').is_checked(),'touch label activation')
    ctx.close()
    check(not errors,'no page JavaScript errors');check(not requests,'no external requests')
    browser.close()
report={'assertions':len(checks),'desktopViews':views,'checks':checks,'pageErrors':errors,'networkRequests':requests,'limits':['Chromium only','No Tauri/Safari/screen reader/native zoom','No production changes or real network','Static sheets do not exhaust all state combinations']}
(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({k:report[k] for k in ['assertions','desktopViews','pageErrors','networkRequests']}))
