"""Focused 0.5.1 regression checks; requires Python Playwright and Chromium.
Not a production/Tauri or complete accessibility test. No application dependencies.
Run: python check-repository-metadata.py --output /tmp/flood-repository-metadata
"""
import argparse
import json
import os
import re
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--output', type=Path, default=Path('/tmp/flood-repository-metadata'))
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
root = Path(__file__).parent
html = (root / 'flows.html').read_text(encoding='utf-8')
for name in ('precision.css', 'flows.css'):
    html = html.replace(f'<link rel="stylesheet" href="{name}">', '<style>\n' + (root/name).read_text(encoding='utf-8') + '\n</style>')
html = html.replace('<script src="flows.js"></script>', '<script>\n' + (root/'flows.js').read_text(encoding='utf-8') + '\n</script>')
checks, errors, requests = [], [], []

def luminance(rgb):
    c = [v / 255 for v in rgb]
    c = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055)**2.4 for v in c]
    return sum(a*b for a, b in zip(c, (.2126, .7152, .0722)))

def ratio(a, b):
    low, high = sorted((luminance(a), luminance(b)))
    return (high + .05) / (low + .05)

with sync_playwright() as pw:
    executable = os.environ.get('FLOOD_CHROMIUM_PATH') or shutil.which('chromium')
    launch = {'headless': True, 'args': ['--no-sandbox']}
    if executable:
        launch['executable_path'] = executable
    browser = pw.chromium.launch(**launch)
    page = browser.new_page(viewport={'width': 414, 'height': 896}, device_scale_factor=2)
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('request', lambda r: requests.append(r.url))

    def expect(value, name):
        assert value, name
        checks.append(name)

    def fresh(theme='light', width=414, scenario='success'):
        page.emulate_media(reduced_motion='reduce', forced_colors='none')
        page.set_viewport_size({'width': width, 'height': 896})
        page.set_content(html)
        page.evaluate('(theme) => document.body.dataset.theme = theme', theme)
        page.locator('#tab-connect').click()
        page.select_option('#scenario', scenario)
        page.locator('#open-repos').click()

    def row(key):
        return page.locator('.repo-option').filter(has=page.locator(f'input[value="{key}"]'))

    def snapshot():
        return page.evaluate('window.flowLab.snapshot()')

    def geometry():
        return page.locator('.repo-option').evaluate_all('''rows => rows.every(row => {
          const heading = row.querySelector('.repo-heading').getBoundingClientRect();
          const description = row.querySelector('.repo-description').getBoundingClientRect();
          const flags = row.querySelector('.repo-flags').getBoundingClientRect();
          return description.top >= heading.bottom - 1 && flags.bottom <= heading.bottom + 1
            && flags.left >= heading.left - 1 && flags.right <= heading.right + 1
            && row.scrollWidth <= row.clientWidth + 1;
        })''')

    views = 0
    for theme in ('light', 'dark'):
        for width in (1180, 780, 414, 390, 320):
            fresh(theme, width)
            page.locator('#repo-archived').check()
            expect(geometry(), f'{theme}/{width}: heading flags before description, no row overflow')
            expect(page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), f'{theme}/{width}: no page overflow')
            row('1:101').locator('input').check()
            page.locator('#commit-repo').click()
            page.wait_for_function('window.flowLab.snapshot().bound === "tillwithered/flood-dev"')
            page.locator('#open-repos').click()
            page.locator('#repo-archived').check()
            expect(row('1:101').locator('[data-kind="visibility"]').inner_text() == 'Приватный', f'{theme}/{width}: bound keeps visibility')
            expect(row('1:101').locator('[data-kind="binding"]').is_visible(), f'{theme}/{width}: bound marker present')
            expect(row('1:104').locator('[data-kind="visibility"]').inner_text() == 'Публичный' and row('1:104').locator('[data-kind="archive"]').is_visible(), f'{theme}/{width}: archive keeps visibility')
            expect(geometry(), f'{theme}/{width}: compound metadata wraps above description')
            if width in (414, 1180):
                page.locator('#repo-query').fill('flood')
                row('2:201').locator('input').check()
                page.locator('#repo-scroll').evaluate('(el) => el.scrollTop = 0')
                page.locator('#repos-dialog').screenshot(path=str(args.output/f'dialog-{theme}-{width}.png'))
                if width == 414:
                    for key, label in (('1:101', 'connected'), ('1:102', 'public'), ('2:201', 'selected')):
                        row(key).screenshot(path=str(args.output/f'row-{theme}-{label}.png'))
            views += 1

        # Check opaque metadata text against the actual parent in rest/selected states.
        fresh(theme)
        for selected in (False, True):
            if selected:
                row('2:201').locator('input').check()
            style = row('2:201').locator('.repo-meta-tag').evaluate('''el => {
              let parent=el;
              while(parent && getComputedStyle(parent).backgroundColor === 'rgba(0, 0, 0, 0)') parent=parent.parentElement;
              return {fg:getComputedStyle(el).color, bg:getComputedStyle(parent).backgroundColor};
            }''')
            fg = [float(x) for x in re.findall(r'[\d.]+', style['fg'])][:3]
            bg = [float(x) for x in re.findall(r'[\d.]+', style['bg'])][:3]
            expect(ratio(fg, bg) >= 4.5, f'{theme}: metadata text contrast, selected={selected}')

    fresh()
    row('2:201').locator('input').check()
    page.locator('#repo-query').fill('documentation')
    expect(snapshot()['selected'] == '2:201' and page.locator('#hidden-selection').is_visible(), 'filter retains stable selection')
    page.locator('#repo-query').fill('no-results-05')
    expect(page.locator('#repo-empty').is_visible(), 'no-results unchanged')
    page.locator('#reset-repo-filters').click()
    page.locator('#repo-query').press('Enter')
    expect(snapshot()['operation'] == 0, 'Enter in search does not commit')
    row('2:201').locator('input').focus()
    page.keyboard.press('Tab')
    expect(row('2:201').locator('.repo-meta-tag').count() == 1 and row('2:201').locator('.repo-meta-tag button,.repo-meta-tag a,[tabindex]').count() == 0, 'markers are not additional controls')
    page.locator('#commit-repo').evaluate('(el) => { el.click(); el.click(); }')
    page.wait_for_function('window.flowLab.snapshot().bound === "flood-team/flood-dev"')
    expect(snapshot()['operation'] == 1, 'double submit remains blocked')

    fresh(scenario='revoked')
    row('1:101').locator('input').check()
    page.locator('#commit-repo').click()
    expect(row('1:101').locator('[data-kind="access"]').inner_text() == 'Нет доступа' and row('1:101').locator('[data-kind="visibility"]').inner_text() == 'Приватный', 'revocation does not erase privacy')
    expect(snapshot()['operation'] == 0 and row('1:101').locator('input').is_disabled(), 'revoked target remains blocked')
    fresh(scenario='unknown')
    row('1:101').locator('input').check()
    page.locator('#commit-repo').click()
    page.wait_for_function('window.flowLab.snapshot().phase === "unknown"')
    expect(page.locator('#repo-options [data-kind="binding"]').count() == 0, 'unknown outcome not labelled connected')
    page.locator('#commit-repo').click()
    page.wait_for_function('window.flowLab.snapshot().bound === "tillwithered/flood-dev"')
    expect(snapshot()['operation'] == 1, 'reconciliation without duplicate write')

    fresh(width=390)
    page.locator('#repo-query').fill('workspace-experiments')
    expect(row('2:204').locator('.repo-name').inner_text().endswith('very-long-repository-name'), 'long owner/name retained')
    # Absolute per-element values avoid cascading multiplication; not native browser zoom.
    page.evaluate('''() => {
      const elements=[...document.querySelectorAll('#repos-dialog, #repos-dialog *')];
      const sizes=elements.map(el=>{const s=getComputedStyle(el);return [el,parseFloat(s.fontSize),parseFloat(s.lineHeight)];});
      for(const [el,font,line] of sizes){el.style.fontSize=(font*2)+'px';if(Number.isFinite(line))el.style.lineHeight=(line*2)+'px';}
    }''')
    expect(geometry(), 'double text size: metadata still before prose and no row overflow')
    page.locator('#repos-dialog').screenshot(path=str(args.output/'long-name-double-text.png'))
    fresh('dark')
    row('2:201').locator('input').check()
    page.emulate_media(forced_colors='active')
    expect(row('2:201').locator('.repo-meta-tag').evaluate('(el)=>getComputedStyle(el).color') == row('2:201').evaluate('(el)=>getComputedStyle(el).color'), 'forced colors keeps selected metadata legible')
    page.locator('#repos-dialog').screenshot(path=str(args.output/'forced-colors.png'))
    expect(not errors, 'no JavaScript errors')
    expect(not requests, 'no external requests')
    browser.close()

report = {'checks': checks, 'viewportStates': views, 'pageErrors': errors, 'networkRequests': requests,
          'limitations': ['Chromium only', 'No real GitHub writes', 'No Tauri/WebKit/screen reader', 'Text resize is not native zoom']}
(args.output/'repository-metadata-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'checks':len(checks),'viewportStates':views,'errors':errors,'requests':requests},ensure_ascii=False))
