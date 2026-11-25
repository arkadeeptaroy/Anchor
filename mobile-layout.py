"""Responsive layout and touch interaction checks for the standalone workspace."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
VIEWPORTS = [(320, 568), (360, 640), (375, 667), (390, 844), (393, 852),
             (414, 896), (430, 932), (540, 720), (600, 800), (768, 1024),
             (820, 1180), (900, 1200), (667, 375), (844, 390), (932, 430), (1024, 480)]
SCENARIOS = ['search', 'shipping', 'mobile', 'dark', 'coupon', 'sort']
HTML = (ROOT / 'index.html').read_text()
AUDIT = r'''async (scenarios) => {
  const $ = s => document.querySelector(s);
  const all = s => [...document.querySelectorAll(s)];
  const failures = [];
  let checks = 0, screens = 0;
  const ok = (value, message) => { checks++; if (!value) failures.push(message); };
  const visible = e => e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
  const wait = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const click = s => { const e = $(s); if (!e) throw Error('Missing '+s); e.click(); };
  const change = (s,v) => { const e=$(s);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true})); };
  const bounds = e => e.getBoundingClientRect();
  const painted = e => {
    const r=bounds(e);let x={left:r.left,right:r.right,top:r.top,bottom:r.bottom};
    for(let p=e.parentElement;p&&p!==document.body&&p!==document.documentElement;p=p.parentElement){
      const style=getComputedStyle(p),b=bounds(p);
      if(/^(auto|scroll|hidden|clip)$/.test(style.overflowX)){x.left=Math.max(x.left,b.left+p.clientLeft);x.right=Math.min(x.right,b.left+p.clientLeft+p.clientWidth)}
      if(/^(auto|scroll|hidden|clip)$/.test(style.overflowY)){x.top=Math.max(x.top,b.top+p.clientTop);x.bottom=Math.min(x.bottom,b.top+p.clientTop+p.clientHeight)}
    }
    return x;
  };
  const name = e => e.id || e.dataset.tab || e.dataset.version || e.dataset.drawer || e.className || e.tagName;
  const containers = '.topbar,.main-tabs,.demo-toolbar,.version-switch,.preview-bottom,.compare-controls,.compare-intro,.compare-metrics,.compare-results,.cmp-version,.cmp-head,.cmp-brand,.cmp-section-title,.cmp-auth,.cmp-product,.cmp-cart,.shop-header,.store-nav,.shop-section-title,.shop-grid,.cartbox,.code-head,.drawer-tabs,.drawer-header,.drawer-footer,.drawer-scroll,.summary-strip,.modal,.scenario-chips,.review-card,.review-actions,.composer-bar,.popover';
  function audit(label) {
    screens++;
    window.scrollTo(0,0);
    const dialog = !$('#modal').hidden ? $('.modal') : !$('#overlay').hidden ? $('.drawer') : null;
    const root = dialog || document;
    ok(document.documentElement.scrollWidth <= innerWidth + 1, label+' page width');
    for (const e of all(containers)) {
      if (!visible(e) || (dialog && !dialog.contains(e))) continue;
      ok(e.scrollWidth <= e.clientWidth + 2, label+' overflow '+name(e)+' '+e.scrollWidth+'/'+e.clientWidth);
    }
    let items=[...root.querySelectorAll('button,input,select,textarea,a[data-shop]')].filter(visible);
    // The source-file strip scrolls horizontally by design.
    items=items.filter(e=>!e.closest('#file-list'));
    const pop=!$('#project-pop').hidden?$('#project-pop'):!$('#example-pop').hidden?$('#example-pop'):null;
    if(pop) items=items.filter(e=>pop.contains(e));
    const rects=items.map(e=>({e,r:bounds(e),paint:painted(e)}));
    for(const {e,r} of rects){
      ok(r.width>0 && r.height>0 && r.left>=-1 && r.right<=innerWidth+1,label+' bounds '+name(e)+' '+r.left+'..'+r.right);
      if(e.matches('.topbar button,.demo-run,#demo-scenario,.version-switch button,.compare-tests,.compare-controls select,.compare-controls input:not([type=checkbox]),.quantity-control button,.drawer-tabs button,.drawer-footer button,.drawer .switch input,#close-drawer,#close-modal,.scenario-chip,.composer-bar button,.tool-tile,.mobile-device,.preview-anchor,.cmp-checkout')){
        ok(r.height>=43,label+' short target '+name(e)+' '+r.height);if(e.matches('.topbar button,.quantity-control button,.drawer .switch input,#close-drawer,#close-modal,.composer-bar .icon-button,.composer-bar .send'))ok(r.width>=43,label+' narrow target '+name(e)+' '+r.width);
      }
    }
    for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){
      const {e:a,paint:x}=rects[i],{e:b,paint:y}=rects[j];
      if(a.contains(b)||b.contains(a))continue;
      const overlap=Math.min(x.right,y.right)-Math.max(x.left,y.left)>1&&Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top)>1;
      ok(!overlap,label+' overlapping '+name(a)+' / '+name(b));
    }
  }
  for(const scenario of scenarios){
    click('[data-tab=preview]');change('#demo-scenario',scenario);click('#run-demo');await wait();
    ok($('.cmp-guarded').dataset.scenario===scenario,scenario+' run');
    ok($('.cmp-guarded .cmp-status').textContent.trim()==='0 regressions',scenario+' gate');
    audit(scenario+' compare');
    for(const v of ['baseline','candidate','guarded']){
      click('[data-version='+v+']');audit(scenario+' '+v);
      click('#mobile-device');audit(scenario+' '+v+' device');click('#mobile-device');
    }
    click('[data-version=compare]');
    click('#anchor-top');audit(scenario+' protection');
    click('[data-drawer=review]');audit(scenario+' review');
    click('[data-drawer=checks]');audit(scenario+' checks');click('#close-drawer');
  }
  for(const view of ['chat','files','code','more']){
    click('[data-tab='+view+']');audit(view);
    ok(all('.main-tabs .active').length===1 && $('.main-tabs .active').dataset.tab===view,view+' active nav');
  }
  click('[data-tab=code]');click('#diff-mode');audit('full source');click('#diff-mode');
  click('#project-menu');audit('project menu');click('#project-menu');
  click('[data-tab=chat]');click('#examples');audit('examples');click('#examples');
  click('#publish');audit('publish modal');click('#close-modal');
  click('[data-tab=preview]');
  click('#project-menu');click('#project-pop [data-action=theme]');ok(document.body.classList.contains('light'),'light appearance');audit('light comparison');
  click('#anchor-top');audit('light protection');click('#close-drawer');
  click('#project-menu');click('#project-pop [data-action=theme]');ok(!document.body.classList.contains('light'),'dark appearance');
  return {checks,screens,failures};
}'''


def touch_paths(page):
    """Use real pointer/touch hit-testing for key paths rather than DOM click only."""
    actions = 0
    def tap(selector):
        nonlocal actions
        page.locator(selector).first.tap(timeout=4000)
        actions += 1

    tap('[data-tab=preview]')
    page.locator('#demo-scenario').select_option('dark')
    tap('#run-demo')
    page.wait_for_function("document.querySelector('.cmp-guarded').dataset.scenario === 'dark'")
    page.locator('#compare-theme').select_option('light')
    assert page.locator('.cmp-guarded .cmp-store').get_attribute('data-theme') == 'light'
    tap('#qty-plus')
    assert page.locator('#compare-qty').inner_text() == '3'
    tap('#anchor-top')
    assert page.locator('#overlay').is_visible()
    tap('#enable-anchor')
    assert page.locator('#enable-anchor').is_checked() is False
    tap('[data-action=defaults]')
    tap('[data-drawer=review]')
    tap('[data-drawer=checks]')
    tap('#close-drawer')
    assert not page.locator('#overlay').is_visible()
    tap('[data-tab=chat]')
    assert page.locator('#chat').is_visible() and not page.locator('#main-area').is_visible()
    tap('#examples')
    assert page.locator('#example-pop').is_visible()
    tap('#example-pop [data-scenario=shipping]')
    assert not page.locator('#example-pop').is_visible()
    tap('[data-scenario=shipping]')
    tap('#send')
    page.wait_for_function("document.querySelector('.cmp-guarded').dataset.scenario === 'shipping'")
    assert page.locator('#main-area').is_visible() and not page.locator('#chat').is_visible()
    tap('[data-version=guarded]')
    tap('#mobile-device')
    assert page.locator('#mobile-device').get_attribute('aria-pressed') == 'true'
    tap('[data-tab=code]')
    tap('[data-file="sorting.js"]')
    assert page.locator('#code-filename').inner_text() == 'sorting.js'
    tap('#diff-mode')
    tap('[data-tab=files]')
    tap('[data-tab=more]')
    tap('[data-tab=preview]')
    tap('#publish')
    assert page.locator('#modal').is_visible()
    tap('#close-modal')
    assert not page.locator('body').evaluate("e => e.classList.contains('dialog-open')")
    return actions


def main():
    reports, errors, requests = [], [], []
    touch_checks = 0
    rotation_checks = 0
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, executable_path=os.getenv('CHROMIUM_PATH', '/usr/bin/chromium'), args=['--no-sandbox'])
        for width, height in VIEWPORTS:
            page = browser.new_page(viewport={'width': width, 'height': height}, is_mobile=True, has_touch=True, device_scale_factor=1, reduced_motion='reduce')
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.on('request', lambda request: requests.append(request.url) if request.url.startswith(('http:', 'https:')) else None)
            page.set_content(HTML, wait_until='load')
            result = page.evaluate(AUDIT, SCENARIOS)
            result['viewport'] = f'{width}x{height}'
            reports.append(result)
            print(json.dumps({'viewport': result['viewport'], 'screens': result['screens'], 'checks': result['checks'], 'failures': result['failures'][:15]}), flush=True)
            if result['failures']:
                break
            if width in (320, 390, 932):
                touch_checks += touch_paths(page)
            if width == 390:
                page.locator('[data-tab=chat]').tap()
                page.set_viewport_size({'width': 1280, 'height': 900})
                page.wait_for_function("document.querySelector('.main-tabs .active').dataset.tab === 'preview'")
                assert page.locator('#main-area').is_visible() and page.locator('#chat').is_visible()
                page.set_viewport_size({'width': 844, 'height': 390})
                page.wait_for_function("matchMedia('(max-width:900px)').matches")
                assert page.locator('#main-area').is_visible() and not page.locator('#chat').is_visible()
                rotation_checks += 2
            page.close()
        browser.close()
    failures = [f for r in reports for f in r['failures']]
    print(json.dumps({'viewports': len(reports), 'screens': sum(r['screens'] for r in reports), 'geometry_assertions': sum(r['checks'] for r in reports), 'touch_actions': touch_checks, 'resize_checks': rotation_checks, 'overlap_or_layout_failures': len(failures), 'javascript_errors': errors, 'external_requests': requests}), flush=True)
    assert not failures, failures[:20]
    assert not errors, errors
    assert not requests, requests

if __name__ == '__main__':
    main()
