const assert=require('node:assert/strict');const e=require('./engine');
const baseline=JSON.stringify(e.BASE);const expectedFailures={search:4,shipping:1,mobile:2,dark:1,coupon:2,sort:2};
const expectedBlocked={search:2,shipping:1,mobile:2,dark:1,coupon:1,sort:2};
const locks=e.FEATURES.map(f=>f.id), combinations=2**locks.length;let evaluated=0;
for(const s of e.SCENARIOS){
  const r=e.evaluate(s.id,s.locks);
  assert(r.baseline.regression.every(t=>t.passed));assert(!r.baseline.acceptance.passed);
  assert.equal(r.regressionsBefore,expectedFailures[s.id]);assert.equal(r.regressionsAfter,0);assert(r.safe);assert(r.before.acceptance.passed);assert(r.after.acceptance.passed);assert.equal(r.blocked,expectedBlocked[s.id]);
  assert.equal(e.evaluate(s.id,[]).regressionsAfter,r.regressionsBefore);
  assert.equal(e.evaluate(s.id,locks).safe,false);
  console.log(`${s.title}: ${r.regressionsBefore} -> ${r.regressionsAfter} regression failures; ${r.blocked} blocked patch(es).`);
  for(let i=0;i<combinations;i++){
    const selected=locks.filter((_,j)=>i&(1<<j));const r=e.evaluate(s.id,selected);evaluated++;
    assert.equal(r.safe,r.after.regression.every(t=>t.passed)&&r.after.acceptance.passed);
    for(const p of r.classified){assert.equal(p.blocked,!!r.protectedFiles[p.file]?.length);if(p.blocked)assert.equal(r.guarded[p.file],e.BASE[p.file]);}
    for(const f of Object.keys(r.protectedFiles))assert.equal(r.guarded[f],e.BASE[f]);
    assert.deepEqual(r.guarded,e.apply(e.BASE,r.classified.filter(p=>!p.blocked)));
    assert.equal(JSON.stringify(e.BASE),baseline);
  }
}
const shipping=e.evaluate('shipping',['catalog']);assert(shipping.classified.find(p=>p.file==='pricing.js').reasons.some(x=>!x.direct));
const coupon=e.evaluate('coupon',['checkout']);assert(coupon.classified.find(p=>p.file==='shipping.js').reasons.some(x=>!x.direct));
assert.throws(()=>e.apply(e.BASE,[{file:'auth.js',old:'not present',new:'x'}]),/exactly once/);
assert.throws(()=>e.apply(e.BASE,[{file:'unknown.js',old:'x',new:'y'}]),/Unknown file/);
assert.throws(()=>e.apply(e.BASE,[{file:'constructor',old:'x',new:'y'}]),/Unknown file/);
assert.throws(()=>e.apply(e.BASE,[{file:'auth.js',old:'',new:'x'}]),/Invalid patch context/);
assert.throws(()=>e.apply({'x.js':'aa'},[{file:'x.js',old:'a',new:'b'}]),/exactly once/);
assert.throws(()=>e.load({'a.js':"require('./missing.js')"}),/Unresolved import/);
assert.throws(()=>e.load({'a.js':"require('./b.js')",'b.js':"require('./a.js')"}),/Circular dependency/);
assert.throws(()=>e.evaluate('unknown',[]),/Unknown scenario/);
let seed=0xABCDEF12;function rand(n){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n}
const cartCases=1000;let inputCases=0;
for(const s of e.SCENARIOS){
  const m=e.load(e.evaluate(s.id,s.locks).guarded);
  for(let i=0;i<cartCases;i++){
    const items=Array.from({length:rand(9)},()=>({price:rand(10000),qty:1+rand(9)}));
    if(i<5)items.splice(0,items.length,...(i===0?[]:[{price:[0,1,1999,2000,2001][i],qty:1}]));
    const code=['SAVE10','save10',' SAVE10 ','INVALID',''][rand(5)];
    const subtotal=items.reduce((a,b)=>a+b.price*b.qty,0),shipping=subtotal===0||(s.id==='shipping'&&subtotal>=2000)?0:99;
    const discount=s.id==='coupon'&&code.trim().toUpperCase()==='SAVE10'?Math.round(subtotal*.10):0;
    assert.deepEqual(m['checkout.js'].quote(items,code),{subtotal,shipping,discount,total:subtotal+shipping-discount});
    const user=[null,{guest:true},{id:1,verified:false},{id:1,verified:true}][rand(4)];assert.equal(m['auth.js'].canCheckout(user),Boolean(user&&user.id&&user.verified));
    const term=['lamp','xyz','HEAD','', ' ', 'back'][rand(6)];const all=e.load(e.BASE)['catalog.js'].search('');const found=s.id==='search'?all.filter(p=>p.name.toLowerCase().includes(term.toLowerCase())):all;
    assert.deepEqual(m['catalog.js'].search(term),found);
    const sort=['asc','desc','default'][rand(3)],original=JSON.stringify(found);const desired=[...found];if(s.id==='sort'&&sort!=='default')desired.sort((a,b)=>sort==='asc'?a.price-b.price:b.price-a.price);
    assert.deepEqual(m['sorting.js'].order(found,sort),desired);assert.equal(JSON.stringify(found),original);
    assert.equal(m['appearance.js'].surfaceFilter(),'none');assert.equal(m['theme.js'].resolveTheme('light'),'light');assert.equal(m['theme.js'].resolveTheme('dark'),s.id==='dark'?'dark':'light');
    const mobile=!!rand(2);assert.deepEqual(m['navigation.js'].links(mobile),s.id==='mobile'&&mobile?['Catalog','Cart']:['Home','Catalog','Cart','Account']);
    inputCases++;
  }
}
// Repeat deterministic evaluation under changing selections to catch state leaks.
for(let i=0;i<1000;i++){const s=e.SCENARIOS[rand(e.SCENARIOS.length)],selected=locks.filter(()=>rand(7)<3);const a=e.evaluate(s.id,selected),b=e.evaluate(s.id,selected);assert.deepEqual(a.guarded,b.guarded);assert.equal(a.safe,b.safe);assert.equal(JSON.stringify(e.BASE),baseline)}
console.log(`PASS: ${evaluated} exhaustive scenario/lock combinations; ${inputCases} seeded input cases; 1000 repeatability cycles (2000 evaluations); 8 invalid-input checks; ${e.TESTS.length} regression checks plus one acceptance check per scenario.`);
