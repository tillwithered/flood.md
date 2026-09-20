from playwright.sync_api import sync_playwright
from pathlib import Path
import json, os, shutil, tempfile, argparse
parser=argparse.ArgumentParser();parser.add_argument('--output');args=parser.parse_args()
root=Path(args.output or tempfile.mkdtemp(prefix='flood-ui-check-'));(root/'evidence').mkdir(parents=True,exist_ok=True)
recipes=Path(__file__).resolve().parent
html=(recipes/'precision.html').read_text().replace('<link rel="stylesheet" href="precision.css">','<style>'+ (recipes/'precision.css').read_text()+'</style>').replace('<script src="precision.js"></script>','<script>'+ (recipes/'precision.js').read_text()+'</script>')
report={'views':[], 'behavior':[], 'page_errors':[]}
with sync_playwright() as p:
    executable=os.environ.get('FLOOD_CHROMIUM_PATH') or shutil.which('chromium')
    browser=p.chromium.launch(executable_path=executable,headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1180,'height':960},device_scale_factor=1)
    page.on('pageerror',lambda e:report['page_errors'].append(str(e)))
    page.set_content(html)
    assert page.locator('#type-flat').inner_text()==page.locator('#type-hierarchy').inner_text()
    report['behavior'].append('A/B typography has identical content')
    for theme in ['light','dark']:
        if page.locator('body').get_attribute('data-theme')!=theme:page.locator('#theme').click()
        for width in [1180,780,390,320]:
            page.set_viewport_size({'width':width,'height':960})
            for panel in ['type','list','controls','states']:
                page.locator('#tab-'+panel).click()
                overflow=page.evaluate('document.documentElement.scrollWidth>innerWidth')
                assert not overflow, (theme,width,panel)
                report['views'].append([theme,width,panel,'no page overflow'])
                if width==1180 or (width==390 and theme=='light'):
                    page.screenshot(path=str(root/f'evidence/{panel}-{theme}-{width}.png'),full_page=True)
    page.set_viewport_size({'width':1180,'height':960})
    page.locator('#tab-list').click()
    page.locator('.task-row input').nth(0).check()
    page.locator('.task-row input').nth(1).check()
    initial=page.locator('#task-list').inner_text()
    page.locator('#compact').click()
    assert page.locator('#task-list').inner_text()==initial
    assert page.locator('.task-row input:checked').count()==2
    page.locator('#noise').click()
    assert page.locator('#task-list').inner_text()==initial
    page.locator('#task-search').fill('zzzzzzz')
    assert page.locator('#empty').is_visible()
    assert 'скрыто фильтром: 2' in page.locator('#selected-count').inner_text()
    page.locator('#empty-clear').click()
    assert page.locator('#task-search').evaluate('e=>document.activeElement===e')
    assert page.locator('.task-row input:checked').count()==2
    page.locator('#noise').click()
    before=page.locator('.task-row').nth(3).bounding_box()
    page.locator('.task-row').nth(3).hover()
    after=page.locator('.task-row').nth(3).bounding_box()
    assert before==after,(before,after)
    report['behavior'] += ['18 rows preserve all content through density/noise', 'selection survives no-results and clear; focus restored', 'row hover preserves geometry']
    page.locator('#tab-controls').click()
    page.locator('#controls-aligned input').fill('не терять ввод')
    assert page.locator('#controls-uneven input').input_value()=='не терять ввод'
    page.locator('#controls-aligned .filter-btn').click()
    assert page.locator('#controls-uneven .filter-btn').get_attribute('aria-pressed')=='true'
    page.locator('#project-name').fill('')
    page.locator('#validate').click()
    assert page.locator('#project-name').get_attribute('aria-invalid')=='true'
    assert page.locator('#project-name').evaluate('e=>e===document.activeElement')
    box=page.locator('#save').bounding_box()
    page.locator('#save').click()
    busy=page.locator('#save').bounding_box()
    assert box==busy,(box,busy)
    page.wait_for_timeout(780)
    assert 'Демо завершено' in page.locator('#save-status').inner_text()
    assert box==page.locator('#save').bounding_box()
    report['behavior'] += ['synced comparison inputs and filter','invalid input gets focus without clearing data','pending and complete keep button geometry']
    page.locator('[data-vote="keep"]').click()
    page.locator('#review-note').fill('Ровный ряд оставить')
    page.locator('#tab-type').click()
    page.locator('[data-vote="revise"]').click()
    page.locator('#review-note').fill('Проверить ритм текста')
    page.locator('#tab-controls').click()
    assert page.locator('#review-note').input_value()=='Ровный ряд оставить'
    with page.expect_download() as d:page.locator('#export').click()
    out=d.value.path()
    data=json.loads(Path(out).read_text())
    assert data['decisions']['type']['decision']=='revise'
    assert data['decisions']['controls']['decision']=='keep'
    report['behavior'].append('per-section reviews preserve notes and export valid JSON')
    page.locator('#tab-type').focus();page.keyboard.press('ArrowRight')
    assert page.locator('#tab-list').get_attribute('aria-selected')=='true'
    assert page.locator('#tab-list').evaluate('e=>e.matches(":focus-visible")')
    page.keyboard.press('End');assert page.locator('#tab-states').get_attribute('aria-selected')=='true'
    report['behavior'].append('tabs ArrowRight / End update active panel and focus')
    for theme in ['light','dark']:
        page.locator('body').evaluate('(e,t)=>e.dataset.theme=t',theme)
        page.emulate_media(forced_colors='active',reduced_motion='reduce')
        for panel in ['type','list','controls','states']:
            page.locator('#tab-'+panel).click()
            assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
        page.locator('#tab-states').click()
        page.screenshot(path=str(root/f'evidence/forced-{theme}.png'),full_page=True)
    report['behavior'].append('forced-colors and reduced-motion render without overflow')
    browser.close()
assert not report['page_errors'],report['page_errors']
(root/'evidence/report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))
