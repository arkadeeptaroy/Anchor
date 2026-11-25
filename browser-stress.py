"""Browser stress checks. Requires Python Playwright and Chromium."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, os
ROOT=Path(__file__).resolve().parent
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path=os.getenv('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1440,'height':1000})
    errors=[];requests=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('request',lambda r:requests.append(r.url) if r.url.startswith(('http:','https:')) else None)
    page.set_content((ROOT/'index.html').read_text(),wait_until='load')
    page.add_style_tag(content='*,*::before,*::after{animation-duration:0s!important;transition:none!important;scroll-behavior:auto!important}')
    page.evaluate('''()=>{
      window.stress={checks:0};const $=s=>document.querySelector(s),all=s=>Array.from(document.querySelectorAll(s));
      const ok=(x,msg)=>{if(!x)throw Error(msg);stress.checks++};
      const click=s=>{const el=$(s);if(!el)throw Error('Missing '+s);el.click()};
      const change=(s,v,event='change')=>{const el=$(s);el.value=v;el.dispatchEvent(new Event(event,{bubbles:true}))};
      const cases={search:[4,'catalog'],shipping:[1,'checkout'],mobile:[2,'navigation'],dark:[1,'theme'],coupon:[2,'checkout'],sort:[2,'sorting']};
      const wait=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r))));
      const run=async s=>{change('#demo-scenario',s);click('#run-demo');await wait();ok(!$('#run-demo').disabled,'run finished '+s);ok($('.cmp-guarded').dataset.scenario===s,'scenario '+s)};
      const statuses=()=>all('.cmp-status').map(e=>e.textContent.trim());const labels=n=>n+' regression'+(n===1?'':'s');
      const reset=()=>{click('#anchor-top');click('[data-action=defaults]');click('#close-drawer')};
      const toggle=()=>{click('#anchor-top');click('#enable-anchor');click('#close-drawer')};
      const names=()=>all('.cmp-guarded .cmp-search .cmp-product b').map(e=>e.textContent);
      const amounts=()=>all('.cmp-guarded .cmp-amount strong').map(e=>e.textContent);
      Object.assign(stress,{ok,run,change,click,cases,reset,statuses});
    }''')
    result=page.evaluate('''async()=>{const {ok,run,change,click,cases,reset,statuses}=stress;const $=s=>document.querySelector(s),all=s=>Array.from(document.querySelectorAll(s));const names=()=>all('.cmp-guarded .cmp-search .cmp-product b').map(e=>e.textContent);const amounts=()=>all('.cmp-guarded .cmp-amount strong').map(e=>e.textContent);const label=n=>n+' regression'+(n===1?'':'s');
      for(const [s,[n,target]] of Object.entries(cases)){
        await run(s);ok(statuses().join()===label(n)+',0 regressions',s+' initial');ok($('.cmp-guarded .cmp-accept').textContent==='Request passed',s+' acceptance');
        click('#anchor-top');click('#enable-anchor');click('#close-drawer');ok(statuses().join()===label(n)+','+label(n),s+' off');ok($('#review-card [data-action=apply]').disabled,s+' unsafe blocked');reset();ok(statuses()[1]==='0 regressions',s+' defaults');
        click('#anchor-top');click('[data-lock='+target+']');click('#close-drawer');ok($('.cmp-guarded .cmp-accept').textContent==='Request failed',s+' target locked');ok($('#review-card [data-action=apply]').disabled,s+' acceptance gate');reset();
        click('#review-card [data-action=review]');click('[data-drawer=checks]');ok(all('.test-row').length===15,s+' checks');ok(!$('#drawer-footer [data-action=apply]').disabled,s+' safe apply');click('#drawer-footer [data-action=apply]');ok($('#review-card [data-action=apply]').disabled,s+' applied');
        for(const v of ['baseline','candidate','guarded','compare']){click('[data-version='+v+']');ok($('#compare-panel').hidden===(v!=='compare'),s+' '+v);if(v!=='compare')ok(all('#store .product-art img').length>0,'imagery')}
        await run(s);
        if(s==='dark')for(const pref of ['light','dark','light','dark']){change('#compare-theme',pref);ok($('.cmp-guarded .cmp-store').dataset.theme===pref,'theme');ok(getComputedStyle($('.cmp-guarded .cmp-store')).filter==='none','original colors');ok(getComputedStyle($('.cmp-unprotected .cmp-store')).filter==='invert(1)','inversion')}
        if(s==='coupon')for(const code of ['SAVE10','save10',' SAVE10 ','INVALID','','<script>alert(1)</script>']){change('#compare-coupon',code,'input');ok(amounts()[2]===(code.trim().toUpperCase()==='SAVE10'?'−₹300':'−₹0'),'coupon');ok(amounts()[1]==='₹99','shipping preserved')}
        if(s==='sort')for(const order of ['asc','desc','default']){change('#compare-sort',order);ok(names().join()===(order==='asc'?'Desk lamp,Everyday backpack,Studio headphones':'Studio headphones,Everyday backpack,Desk lamp'),'sort direction');ok(all('.cmp-unprotected .cmp-search .cmp-product b').length===2,'missing product visible');ok(all('.cmp-guarded .cmp-search .cmp-product small').every(e=>e.textContent.startsWith('₹')),'INR');ok(all('.cmp-unprotected .cmp-search .cmp-product small').every(e=>e.textContent.startsWith('$')),'wrong currency')}
        if(s==='search')for(const [query,expected] of [['lamp','Desk lamp'],['HEAD','Studio headphones'],['xyz',''],['','Studio headphones,Everyday backpack,Desk lamp']]){change('#compare-search',query,'input');ok(names().join()===expected,'search')}
        if(s==='mobile'){click('#compare-mobile');ok(all('.cmp-guarded .cmp-links span').length===4,'desktop');click('#compare-mobile');ok(all('.cmp-guarded .cmp-links span').map(e=>e.textContent).join()==='Catalog,Cart','mobile')}
        if(['shipping','coupon','mobile'].includes(s)){click('#qty-minus');click('#qty-minus');ok($('#qty-minus').disabled,'empty lower bound');ok(amounts().at(-1)==='₹0','empty total');for(let i=0;i<9;i++)click('#qty-plus');ok($('#qty-plus').disabled,'max upper bound');ok($('#compare-qty').textContent==='9','max qty')}
      }
      // 60 rapid scenario changes and identical-input updates, with explicit render completion.
      const keys=Object.keys(cases);for(let i=0;i<60;i++){await run(keys[i%keys.length]);ok(statuses()[1]==='0 regressions','repeat gate');change('#compare-user',['guest','verified','unverified'][i%3]);click('#qty-plus');click('#qty-minus');ok(statuses()[1]==='0 regressions','repeat inputs')}
      return stress.checks;
    }''')
    print('Interaction assertions:',result,flush=True)
    for width in [320,360,390,768,1024,1280,1440,1920]:
        page.set_viewport_size({'width':width,'height':900})
        page.evaluate('''async()=>{for(const s of Object.keys(stress.cases)){await stress.run(s);stress.ok(document.documentElement.scrollWidth<=innerWidth+1,'overflow '+innerWidth+' '+s);stress.ok(document.querySelector('.cmp-guarded').getBoundingClientRect().width>0,'panel '+s)}}''')
        if width==390:
            page.evaluate("async()=>{await stress.run('dark')}")
            page.screenshot(path=str(ROOT.parent/'Anchor-v4-mobile.png'),full_page=True)
    checks=page.evaluate('stress.checks')
    assert not errors,errors
    assert not requests,requests
    b.close()
print(json.dumps({'status':'PASS','browser_assertions':checks+2,'repeat_cycles':60,'responsive_scenario_viewports':48,'javascript_errors':len(errors),'external_network_requests':len(requests)},indent=2))
