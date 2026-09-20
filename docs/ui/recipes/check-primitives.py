"""Local Chromium regression checks; not a production / screen-reader certificate.
Requires Python Playwright and Chromium. No app dependencies are installed.
"""
import argparse, json, os, shutil, re
from pathlib import Path
from playwright.sync_api import sync_playwright

args=argparse.ArgumentParser();args.add_argument('--output',type=Path,default=Path('/tmp/flood-primitives'));opt=args.parse_args();opt.output.mkdir(parents=True,exist_ok=True)
r=Path(__file__).parent
html=(r/'primitives.html').read_text()
for n in ['precision.css','primitives.css']:html=html.replace(f'<link rel="stylesheet" href="{n}">','<style>\n'+(r/n).read_text()+'\n</style>')
for n in ['primitive-icons.js','primitives.js']:html=html.replace(f'<script src="{n}"></script>','<script>\n'+(r/n).read_text()+'\n</script>')
checks=[];errors=[];network=[];views=0
with sync_playwright() as p:
    options={'headless':True,'args':['--no-sandbox']}
    executable=os.getenv('FLOOD_CHROMIUM_PATH') or shutil.which('chromium')
    if executable: options['executable_path']=executable
    b=p.chromium.launch(**options)
    context=b.new_context(viewport={'width':1180,'height':920},accept_downloads=True)
    page=context.new_page();page.set_default_timeout(2500);page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda req:network.append(req.url))
    def ok(value,label):
        assert value,label
        checks.append(label)
    def fresh(theme='light',width=1180):
        page.set_viewport_size({'width':width,'height':920});page.set_content(html)
        if theme=='dark': page.locator('#theme').click()
    def tab(name):page.locator('#tab-'+name).click()
    for theme in ['light','dark']:
        for width in [1180,780,414,320]:
            fresh(theme,width)
            for section in ['icons','choice','fields','geometry']:
                tab(section);page.wait_for_timeout(30)
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'),(section,theme,width,'overflow')
                page.screenshot(path=str(opt.output/f'{section}-{theme}-{width}.png'),full_page=True)
                views+=1
    ok(views==32,'32 section/theme/viewport renderings without page overflow')
    fresh();ok(page.locator('#icon-comparison svg').count()==16,'12 catalogue and 4 context SVGs rendered')
    ok(page.locator('#icon-comparison svg[stroke]').count()==0,'filled SVGs, not stroke paths recolored')
    for size in ['16','20','24']:
        page.select_option('#glyph-size',size)
        ok(abs(page.locator('.icon-catalog svg').first.bounding_box()['width']-int(size))<.1,'glyph size '+size)
    page.select_option('#icon-family','hero');tab('fields')
    ok(page.locator('[data-demo-icon="search"] svg').get_attribute('data-family')=='hero','family selection propagates to control example')
    tab('choice');ok(page.locator('#check-all').evaluate('(e)=>e.indeterminate'),'checkbox starts mixed')
    page.locator('#check-all').check();ok(page.locator('#check-children input:checked').count()==3,'mixed parent selects all children')
    page.locator('#check-all').uncheck();ok(page.locator('#check-children input:checked').count()==0,'checked parent clears all children')
    page.locator('#check-children input').first.focus();page.keyboard.press('Space');ok(page.locator('#check-all').evaluate('(e)=>e.indeterminate'),'Space toggles child and restores mixed parent')
    ok(page.locator('#check-children input').first.evaluate('(e)=>getComputedStyle(e.nextElementSibling).outlineWidth')=='2px','custom mark displays real keyboard focus')
    page.locator('input[name="order"][value="updated"]').focus();page.keyboard.press('ArrowDown')
    ok(page.locator('input[name="order"][value="title"]').is_checked(),'native radio arrow changes selection')
    ok(page.locator('input[name="order"]:checked').count()==1,'radio remains single-choice')
    page.locator('#switch-live').click();ok(page.locator('#switch-live').is_disabled(),'switch locks during pending')
    page.wait_for_timeout(650);ok(page.locator('#switch-live').is_checked(),'switch confirms local value')
    page.locator('#switch-fail').check();page.locator('#switch-live').click();page.wait_for_timeout(650)
    ok(page.locator('#switch-live').is_checked() and 'Не сохранено' in page.locator('#switch-feedback').inner_text(),'failed switch change preserves confirmed value')
    page.locator('#invalid-check').check();ok(page.locator('#check-error').is_hidden(),'checkbox error clears explicitly on valid value')
    tab('fields');page.select_option('#format-select','md');ok(page.locator('#format-error').is_hidden(),'select error clears on valid value')
    readonly=page.locator('input[readonly]');readonly.focus();ok(readonly.evaluate('(e)=>e===document.activeElement'),'readonly remains focusable')
    page.locator('#note-live').fill('Строка один');page.locator('#note-live').press('Enter');page.locator('#note-live').press('X');ok('\n' in page.locator('#note-live').input_value(),'textarea Enter inserts newline')
    before=page.locator('#save-demo').bounding_box();page.locator('#save-demo').evaluate('(e)=>{e.click();e.click();}')
    after=page.locator('#save-demo').bounding_box()
    ok(before['width']==after['width'] and before['height']==after['height'],'pending button preserves dimensions')
    ok(page.evaluate('primitiveLab.snapshot().saves')==1,'duplicate save prevented')
    page.wait_for_timeout(650)
    tab('geometry')
    for inset in ['4','6','10']:
        page.select_option('#inset',inset);page.locator('#measure').click()
        geometry=page.locator('#nested-correct').evaluate('''e=>{let c=e.firstElementChild,a=e.getBoundingClientRect(),b=c.getBoundingClientRect();return {left:b.left-a.left,top:b.top-a.top,right:a.right-b.right,bottom:a.bottom-b.bottom,r:parseFloat(getComputedStyle(c).borderTopLeftRadius)}}''')
        ok(all(abs(geometry[side]-int(inset))<.2 for side in ['left','top','right','bottom']) and geometry['r']==16-int(inset),'measured nested radius and all four insets '+inset)
    for selector,expected in [('#geometry-menu',7),('#geometry-field',7)]:
        value=page.locator(selector+' button').first.evaluate('(e)=>parseFloat(getComputedStyle(e).borderTopLeftRadius)')
        ok(value==expected,'actual child radius '+selector)
        rects=page.locator(selector).evaluate('''e=>{const c=e.querySelector('button'),a=e.getBoundingClientRect(),b=c.getBoundingClientRect();return {top:b.top-a.top,right:a.right-b.right}}''')
        wanted=7 if selector=='#geometry-menu' else 3
        ok(abs(rects['top']-wanted)<.2 and abs(rects['right']-wanted)<.2,'actual top/right inset '+selector)
    page.locator('#clear-joined').click();ok(page.locator('#joined-input').input_value()=='' and page.locator('#joined-input').evaluate('(e)=>e===document.activeElement'),'nested clear keeps focus in field')
    ok(page.locator('#geometry-field').evaluate('(e)=>getComputedStyle(e).overflow')=='visible','parent does not clip focus')
    page.locator('[data-review="revise"]').click();page.locator('#review-note').fill('Проверить вложенные радиусы');tab('icons');page.locator('[data-review="keep"]').click();tab('geometry')
    ok(page.locator('#review-note').input_value()=='Проверить вложенные радиусы','reviews remain scoped to section')
    with page.expect_download() as dl: page.locator('#export').click()
    payload=json.loads(Path(dl.value.path()).read_text());ok(payload['reviews']['geometry']['decision']=='revise' and payload['reviews']['icons']['decision']=='keep','local feedback JSON')
    fresh();page.locator('#tab-icons').focus();page.keyboard.press('End');ok(page.locator('#tab-geometry').get_attribute('aria-selected')=='true','tabs keyboard navigation')
    page.emulate_media(forced_colors='active',reduced_motion='reduce');tab('choice')
    ok(page.locator('#check-all').evaluate('(e)=>getComputedStyle(e).appearance')=='auto','forced colors restores native checkbox')
    ok(page.locator('#check-all').evaluate('(e)=>getComputedStyle(e).opacity')=='1','forced colors native checkbox remains visible')
    tab('fields');page.locator('#save-demo').click();ok(page.locator('.spinner-mini').evaluate('(e)=>getComputedStyle(e).animationName')=='none','reduced motion removes spinner animation')
    page.wait_for_timeout(650);page.emulate_media(forced_colors='none',reduced_motion='no-preference')
    # Stress content, not a claim of browser-native zoom.
    for theme in ['light','dark']:
        fresh(theme,414)
        page.evaluate('''()=>{const nodes=[...document.querySelectorAll('body *')];const sizes=nodes.map(n=>[n,parseFloat(getComputedStyle(n).fontSize),parseFloat(getComputedStyle(n).lineHeight)]);sizes.forEach(([n,f,l])=>{n.style.fontSize=f*2+'px';if(l)n.style.lineHeight=l*2+'px'});}''')
        for section in ['choice','fields','geometry']:
            tab(section);ok(page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'),'2x computed text stress '+theme+'/'+section)
    # Opaque-pair sampling of rendered values; alpha/scrim/native popup excluded.
    count=0
    def lum(color):
        channels=[int(v)/255 for v in re.findall(r'\d+',color)[:3]]
        linear=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in channels]
        return sum(a*b for a,b in zip(linear,[.2126,.7152,.0722]))
    def ratio(a,b):x,y=sorted([lum(a),lum(b)]);return (y+.05)/(x+.05)
    for theme in ['light','dark']:
        fresh(theme)
        values=page.evaluate('''()=>{const v=getComputedStyle(document.body);const names=['ink','muted','boundary','focus','on-ink','danger-text','panel','field','control-bg','control-hover','control-pressed','row-selected'];let out={};for(const name of names){const e=document.createElement('i');e.style.color=v.getPropertyValue('--'+name);document.body.append(e);out[name]=getComputedStyle(e).color;e.remove()}return out}''')
        for fg,threshold in [('ink',4.5),('muted',4.5),('focus',3)]:
            for bg in ['panel','field','control-bg','control-hover','control-pressed','row-selected']:
                assert ratio(values[fg],values[bg])>=threshold,(theme,fg,bg);count+=1
        for fg,bg,threshold in [('boundary','field',3),('boundary','panel',3),('on-ink','ink',4.5),('on-ink','danger-text',4.5),('danger-text','field',4.5)]:
            assert ratio(values[fg],values[bg])>=threshold,(theme,fg,bg);count+=1
    ok(count==46,'46 actual opaque foreground/background pairs')
    coarse=b.new_context(viewport={'width':414,'height':896},is_mobile=True,has_touch=True)
    touch=coarse.new_page();touch.set_content(html);touch.locator('#tab-choice').tap()
    ok(touch.locator('.choice').first.bounding_box()['height']>=44,'coarse pointer target minimum')
    touch.locator('#check-children input').nth(1).tap()
    ok(touch.locator('#check-children input').nth(1).is_checked(),'touch toggles actual checkbox input')
    touch.locator('#switch-live').tap();touch.wait_for_timeout(650)
    ok(touch.locator('#switch-live').is_checked(),'touch toggles confirmed switch')
    coarse.close()
    ok(not errors,'no JavaScript page errors');ok(not network,'no external network requests')
    b.close()
report={'groups':len(checks),'views':views,'opaquePairs':count,'checks':checks,'errors':errors,'requests':network,'limitations':['Chromium only','Not Tauri / iOS Safari / WebKit / WebView2','No screen reader or native zoom audit','No real backend','Heroicons 20 master is scaled at 16/24','No full native popup styling audit']}
(opt.output/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False,indent=2))
