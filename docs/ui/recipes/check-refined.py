"""Focused desktop smoke/regression checks; not Tauri or a full WCAG audit.
Run with Python Playwright and Chromium. FLOOD_EVIDENCE overrides the output folder.
"""
import json
import os
import re
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

base = Path(__file__).parent
out = Path(os.environ.get('FLOOD_EVIDENCE', '/tmp/flood-controls-063-evidence'))
out.mkdir(parents=True, exist_ok=True)
html = (base/'primitives-refined.html').read_text(encoding='utf-8')
for ext, tag in [('css', '<link rel="stylesheet" href="primitives-refined.css">'), ('js', '<script src="primitives-refined.js"></script>')]:
    text = (base/f'primitives-refined.{ext}').read_text(encoding='utf-8')
    html = html.replace(tag, ('<style>'+text+'</style>') if ext=='css' else ('<script>'+text+'</script>'))
checks=[];errors=[];requests=[]
def check(ok,name):
    assert ok,name
    checks.append(name)
def luminance(rgb):
    c=[v/255 for v in rgb]
    c=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in c]
    return sum(v*w for v,w in zip(c,[.2126,.7152,.0722]))
def ratio(a,b):
    x,y=sorted([luminance(a),luminance(b)])
    return (y+.05)/(x+.05)
def hex_rgb(s):return [int(s[i:i+2],16) for i in (1,3,5)]

with sync_playwright() as p:
    launch={'args':['--no-sandbox'], 'ignore_default_args':['--hide-scrollbars']}
    executable=os.environ.get('FLOOD_CHROMIUM_PATH') or shutil.which('chromium')
    if executable:launch['executable_path']=executable
    browser=p.chromium.launch(**launch)
    page=browser.new_page(viewport={'width':1180,'height':940},accept_downloads=True)
    page.set_default_timeout(4000)
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('request',lambda r:requests.append(r.url))
    def fresh(theme='light',width=1180,height=940):
        page.emulate_media(forced_colors='none',reduced_motion='no-preference')
        page.set_viewport_size({'width':width,'height':height});page.set_content(html)
        page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
        page.mouse.move(1,1)
    def snap():return page.evaluate('refinedLab.snapshot()')
    def mode(value):
        page.locator('#scenario').click()
        index={'normal':0,'slow':1,'error':2,'race':3}[value]
        page.locator(f'#scenario-option-{index}').click()
    def geometry():
        return page.locator('#project-popup').evaluate('''e=>{const p=e.getBoundingClientRect(),s=e.firstElementChild,r=s.getBoundingClientRect();return {insets:[r.left-p.left,r.top-p.top,p.right-r.right,p.bottom-r.bottom],gutter:s.offsetWidth-s.clientWidth,scroll:s.scrollHeight>s.clientHeight,outer:getComputedStyle(e).overflow,inner:getComputedStyle(s).overflow,childRadius:getComputedStyle(s).borderRadius};}''')

    views=0
    for theme in ['light','dark']:
        for width in [960,1180,1440]:
            for tab in ['fields','selects','details']:
                fresh(theme,width);page.locator('#tab-'+tab).click()
                if tab=='fields':page.locator('#search').focus()
                if tab=='selects':page.locator('#sort').focus();page.keyboard.press('Enter')
                check(page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'{theme}/{width}/{tab}: page containment')
                if width==1180:page.screenshot(path=str(out/f'{tab}-{theme}.png'),full_page=True)
                views+=1
    fresh()
    check(page.locator('select').count()==0,'no native select, including demo configuration')
    check(page.locator('input[type=number]').count()==0,'numeric text input has no native spinner')
    page.locator('#reminder').fill('17');page.locator('#reminder').hover();page.mouse.wheel(0,100)
    check(page.locator('#reminder').input_value()=='17','wheel never changes minutes')
    page.locator('#reminder').fill('1e3');page.locator('#readonly').focus()
    check(page.locator('#reminder').get_attribute('aria-invalid')=='true' and page.locator('#reminder').input_value()=='1e3','invalid integer is explained, not silently clamped')
    page.locator('#reminder').fill('120');page.locator('#readonly').focus()
    check(page.locator('#reminder').get_attribute('aria-invalid')=='false','integer upper boundary accepted')
    check(page.locator('#readonly').get_attribute('readonly') is not None and page.locator('#readonly').evaluate('e=>e===document.activeElement'),'readonly remains focusable')
    check(page.locator('#unavailable').is_disabled(),'disabled semantics retained')
    for id in ['notes','review-note']:
        field=page.locator('#'+id);short=field.bounding_box()['height'];field.fill(('Длинная строка с контекстом\n')*40)
        h=field.bounding_box()['height']
        check(field.evaluate('e=>getComputedStyle(e).resize')=='none',id+': no browser resize handle')
        check(short<h<=240 and field.evaluate('e=>e.scrollHeight>e.clientHeight'),id+': grows then scrolls, text preserved')
        field.fill('Коротко');check(field.bounding_box()['height']==short,id+': shrinks after deletion')
    page.locator('#notes').press('End');page.locator('#notes').press('Enter');page.locator('#notes').press('a')
    check('\n' in page.locator('#notes').input_value(),'textarea Enter retains native editing')
    page.locator('#search').fill('Текст');page.locator('#clear-search').click()
    check(page.locator('#search').input_value()=='' and page.locator('#search').evaluate('e=>e===document.activeElement'),'clear restores input focus')
    before=page.locator('#save').bounding_box();page.locator('#save').click()
    check(snap()['saveCount']==0 and page.locator('#rule-name').get_attribute('aria-invalid')=='true','required validation')
    page.locator('#rule-name').fill('Дизайн');page.locator('#save').click();check(snap()['saveCount']==0,'duplicate name validation')
    page.locator('#rule-name').fill('Правило источников');page.locator('label:has(#fail-save)').click();page.locator('#save').evaluate('e=>{e.click();e.click()}')
    after=page.locator('#save').bounding_box()
    check(snap()['saveCount']==1 and snap()['saving'],'double submit blocked')
    check(before['width']==after['width'] and before['height']==after['height'],'pending button stable')
    page.wait_for_timeout(650)
    check('Не сохранено' in page.locator('#save-feedback').inner_text() and page.locator('#rule-name').input_value()=='Правило источников','failure preserves draft')
    page.locator('label:has(#fail-save)').click();page.locator('#save').click();page.wait_for_timeout(650)
    check('В демо сохранено' in page.locator('#save-feedback').inner_text(),'explicit retry succeeds in mock')

    # Focus geometry and measured contrast of core against both substrate and composited halo.
    for theme in ['light','dark']:
        fresh(theme);frame=page.locator('#search-frame');before=frame.bounding_box();page.locator('#search').focus()
        st=frame.evaluate('e=>({shadow:getComputedStyle(e).boxShadow,outline:getComputedStyle(e).outlineStyle,radius:getComputedStyle(e).borderRadius})')
        parts=re.split(r', (?![^()]*\))',st['shadow'])
        check(len(parts)==2 and all(' 0px 0px 0px ' in x for x in parts),theme+': two concentric zero-offset focus layers')
        check(st['outline']=='none' and frame.bounding_box()==before,theme+': no offset outline or geometry shift')
        check(page.locator('#search').evaluate('e=>getComputedStyle(e).boxShadow')=='none',theme+': one focus owner, no duplicate input ring')
        tokens=page.evaluate("Object.fromEntries(['focus-core','focus-halo','panel','surface','canvas'].map(k=>[k,getComputedStyle(document.documentElement).getPropertyValue('--'+k).trim()]))")
        core=hex_rgb(tokens['focus-core']);halo=[float(x) for x in re.findall(r'[\d.]+',tokens['focus-halo'])];alpha=halo[-1]/100
        for bg in ['panel','surface','canvas']:
            rgb=hex_rgb(tokens[bg]);mix=[a*alpha+b*(1-alpha) for a,b in zip(halo[:3],rgb)]
            check(ratio(core,rgb)>=3 and ratio(core,mix)>=3,theme+': focus core contrast on '+bg+' and its halo')
        page.locator('#tab-selects').click();page.locator('#sort').focus();page.keyboard.press('Enter')
        page.keyboard.press('ArrowDown')
        states=page.locator('#sort-options .option').evaluate_all('es=>es.map(e=>({border:getComputedStyle(e).borderWidth,outline:getComputedStyle(e).outlineStyle,shadow:getComputedStyle(e).boxShadow}))')
        check(all(x=={'border':'0px','outline':'none','shadow':'none'} for x in states),theme+': no border, outline or shadow on any option')
        check(page.locator('#sort-option-0').get_attribute('aria-selected')=='true' and page.locator('#sort-option-1').get_attribute('data-active')=='true',theme+': committed selection differs from keyboard active')
        page.keyboard.press('Escape');check(snap()['sort']=='updated',theme+': Escape preserves committed value')
        page.keyboard.press('Enter');page.keyboard.press('End');page.keyboard.press('Enter');check(snap()['sort']=='title',theme+': keyboard commits exact option')
        page.keyboard.press('Enter');page.keyboard.press('Home');page.keyboard.press('Tab');check(snap()['sort']=='title',theme+': Tab no silent commit')
        page.locator('#sort').click();page.locator('#sort-option-3').click(force=True);check(snap()['sort']=='title',theme+': disabled option ignored')
        page.locator('#measure').click();check('Зазор 6.0 px · inset 7.0 px · radius 7px' in page.locator('#metrics').inner_text(),theme+': measured gap6 inset7 radius7')
        page.keyboard.press('Escape');page.locator('#project').click();page.wait_for_timeout(520)
        g=geometry();check(g['outer']=='hidden' and g['inner']=='auto' and g['childRadius']=='7px',theme+': separate rounded shell and inset scroll viewport')
        check(all(abs(x-7)<.02 for x in g['insets']) and g['gutter']==10 and g['scroll'],theme+': real 10px scrollbar reserved within 7px inset')
        rail=page.locator('#project-popup .popup-scroll').bounding_box()
        page.mouse.move(rail['x']+rail['width']-5,rail['y']+20);page.mouse.down();page.mouse.move(rail['x']+rail['width']-5,rail['y']+rail['height']-2,steps=8);page.mouse.up()
        check(page.locator('#project-popup .popup-scroll').evaluate('e=>e.scrollTop>0') and page.locator('#project-popup').is_visible(),theme+': real thumb drag scrolls and does not close popup')
        page.screenshot(path=str(out/f'scroll-{theme}.png'))
        page.locator('#project').press('Escape');page.locator('#project').fill('Дизайн');page.wait_for_timeout(520);page.keyboard.press('ArrowDown');page.keyboard.press('Enter')
        check(snap()['committed']=='design',theme+': project selection by stable ID')

    mode('race');page.locator('#project').fill('Д');page.wait_for_timeout(220);page.locator('#project').fill('Источники');page.wait_for_timeout(1250)
    check(page.locator('[data-project]').count()==1 and page.locator('[data-project=sources]').is_visible(),'stale response cannot replace fresh answer')
    page.keyboard.press('Escape');mode('error');page.locator('#project').fill('Личный');page.wait_for_timeout(520)
    check(snap()['queryState']=='error' and snap()['committed']=='design','request error retains committed ID')
    mode('normal');page.locator('#retry').click();page.wait_for_timeout(350);check(page.locator('[data-project=personal]').is_visible(),'retry preserves failed query')
    page.locator('#project').fill('zzzz');page.wait_for_timeout(520);check('Ничего не найдено' in page.locator('#project-status').inner_text(),'no results distinct from error')
    page.locator('#project').press('Escape');page.locator('#project').dispatch_event('compositionstart');page.locator('#project').fill('Диз');n=snap()['request'];page.wait_for_timeout(520)
    check(snap()['request']==n,'IME composition does not issue requests');page.locator('#project').dispatch_event('compositionend');page.wait_for_timeout(520)
    check(page.locator('[data-project=design]').is_visible(),'IME completed query searches')
    page.locator('#tab-details').click()
    check(page.locator('#master-check').evaluate('e=>e.indeterminate'),'mixed semantics preserved')
    page.locator('label:has(#master-check)').click();check(page.locator('.child-check:checked').count()==2,'mixed to all via custom mark/label')
    page.locator('#master-check').focus();page.keyboard.press('Space');check(page.locator('.child-check:checked').count()==0,'checkbox Space toggles without JS keyboard emulation')
    page.locator('input[name=preference]').first.focus();page.keyboard.press('ArrowDown')
    check(page.locator('input[name=preference]:checked').count()==1 and page.locator('input[value=light]').is_checked(),'radio arrow keys preserve native semantics with custom visual')
    check(page.locator('.choice input').evaluate_all("es=>es.every(e=>getComputedStyle(e).opacity==='0' && e.nextElementSibling.classList.contains('choice-mark'))"),'no native checkbox/radio appearance')
    shape=page.locator('#nested').evaluate('e=>{const a=e.getBoundingClientRect(),b=e.firstElementChild.getBoundingClientRect();return {insets:[b.left-a.left,b.top-a.top,a.right-b.right,a.bottom-b.bottom],radius:getComputedStyle(e.firstElementChild).borderRadius}}')
    check(all(abs(x-6)<.01 for x in shape['insets']) and shape['radius']=='10px','B geometry retained')
    fresh();check(page.locator('button,input,textarea').evaluate_all("es=>es.filter(e=>e.getClientRects().length).every(e=>getComputedStyle(e).boxShadow==='none')"),'no resting bevel or shadow on controls')
    page.locator('[data-review=keep]').click();page.locator('#review-note').fill('Фокус');page.locator('#tab-selects').click();page.locator('[data-review=revise]').click()
    with page.expect_download() as d:page.locator('#export').click()
    data=json.loads(Path(d.value.path()).read_text())
    check(data['lab']=='0.6.3' and data['reviews']['fields']['note']=='Фокус' and data['reviews']['selects']['decision']=='revise','local feedback export per section')
    # Short viewport and end-of-list keyboard navigation.
    fresh('dark',960,540);page.locator('#tab-selects').click();page.locator('#project').click();page.wait_for_timeout(520)
    box=page.locator('#project-popup').bounding_box();check(box['y']>=12 and box['y']+box['height']<=528,'popup flips/clamps inside short viewport')
    for _ in range(7):page.locator('#project').press('ArrowDown')
    active=page.locator('#'+page.locator('#project').get_attribute('aria-activedescendant')).bounding_box();inner=page.locator('#project-popup .popup-scroll').bounding_box()
    check(active['y']>=inner['y']-1 and active['y']+active['height']<=inner['y']+inner['height']+1,'active option scrolls into inner viewport')
    fresh();page.emulate_media(forced_colors='active',reduced_motion='reduce');page.locator('#search').focus()
    check(page.locator('#search-frame').evaluate("e=>getComputedStyle(e).outlineWidth==='2px' && getComputedStyle(e).boxShadow==='none'"),'system high contrast retains a full visible focus fallback')
    page.locator('#tab-selects').click();page.locator('#sort').focus();page.keyboard.press('Enter');check(page.locator('#sort-popup').is_visible(),'custom select works in forced colors')
    check(not errors,'no JavaScript errors');check(not requests,'no network requests')
    browser.close()
report={'assertions':len(checks),'views':views,'checks':checks,'errors':errors,'requests':requests,'environment':'Chromium; hide-scrollbars disabled; page.set_content','not_tested':['Tauri','iOS Safari/WebKit/WebView2','screen reader','native 200% zoom','real backend','all color pairs/states']}
(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'assertions':len(checks),'views':views,'errors':errors,'requests':requests}))
