const assert=require('node:assert/strict');const e=require('./engine');
for(const s of e.SCENARIOS){
  const r=e.evaluate(s.id,s.locks);
  assert(r.baseline.regression.every(t=>t.passed));assert(!r.baseline.acceptance.passed);
  assert(r.regressionsBefore>0);assert.equal(r.regressionsAfter,0);assert(r.safe);assert(r.before.acceptance.passed);assert(r.after.acceptance.passed);
  assert.equal(e.evaluate(s.id,[]).regressionsAfter,r.regressionsBefore);
  assert.equal(e.evaluate(s.id,e.FEATURES.map(x=>x.id)).safe,false);
  console.log(`${s.title}: ${r.regressionsBefore} unguarded regression failures; ${r.regressionsAfter} guarded; ${r.blocked} blocked file(s).`);
}
const shipping=e.evaluate('shipping',['catalog']);assert(shipping.classified.find(p=>p.file==='pricing.js').blocked);assert(shipping.classified.find(p=>p.file==='pricing.js').reasons.some(x=>!x.direct));
assert.throws(()=>e.apply(e.BASE,[{file:'auth.js',old:'not present',new:'x'}]),/exactly once/);
assert.throws(()=>e.apply(e.BASE,[{file:'unknown.js',old:'x',new:'y'}]),/Unknown file/);
for(const s of e.SCENARIOS){for(let i=0;i<16;i++){const locks=e.FEATURES.filter((f,j)=>i&(1<<j)).map(f=>f.id);const r=e.evaluate(s.id,locks);assert(r.safe===(r.regressionsAfter===0&&r.after.acceptance.passed));}}
console.log('All engine checks passed (48 lock combinations).');
