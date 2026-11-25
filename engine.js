/* FeatureLock: deterministic, local proof of concept. All executable code is a bundled fixture. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FeatureLock = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const BASE = {
    'auth.js': `function canCheckout(user) {
  return Boolean(user && user.id && user.verified);
}
module.exports = { canCheckout };`,
    'pricing.js': `function subtotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}
function formatPrice(amount) {
  return '\u20b9' + amount.toLocaleString('en-IN');
}
module.exports = { subtotal, formatPrice };`,
    'catalog.js': `const { formatPrice } = require('./pricing.js');
const products = [
  { id: 1, name: 'Studio headphones', price: 2499 },
  { id: 2, name: 'Everyday backpack', price: 1499 },
  { id: 3, name: 'Desk lamp', price: 899 }
];
function search(query) {
  return products;
}
module.exports = { search, formatPrice };`,
    'checkout.js': `const { subtotal } = require('./pricing.js');
const { shippingFee } = require('./shipping.js');
function quote(items, coupon = '') {
  const amount = subtotal(items);
  const shipping = shippingFee(amount);
  const discount = 0;
  return { subtotal: amount, shipping, discount, total: amount + shipping - discount };
}
module.exports = { quote };`,
    'navigation.js': `function links(mobile = false) {
  return ['Home', 'Catalog', 'Cart', 'Account'];
}
module.exports = { links };`,
    'shipping.js': `function shippingFee(amount) {
  return amount > 0 ? 99 : 0;
}
module.exports = { shippingFee };`,
    'theme.js': `function resolveTheme(preference) {
  return 'light';
}
module.exports = { resolveTheme };`,
    'appearance.js': `function surfaceFilter() {
  return 'none';
}
module.exports = { surfaceFilter };`,
    'sorting.js': `function order(items, mode) {
  return [...items];
}
module.exports = { order };`
  };
  const FEATURES = [
    { id: 'auth', name: 'Authentication', file: 'auth.js', detail: 'Identity and access checks' },
    { id: 'catalog', name: 'Product catalog', file: 'catalog.js', detail: 'Product listing and search' },
    { id: 'checkout', name: 'Checkout', file: 'checkout.js', detail: 'Cart totals and shipping' },
    { id: 'navigation', name: 'Navigation', file: 'navigation.js', detail: 'Storefront routes' },
    { id: 'shipping', name: 'Shipping policy', file: 'shipping.js', detail: 'Delivery charges' },
    { id: 'theme', name: 'Theme', file: 'theme.js', detail: 'Light and dark mode' },
    { id: 'appearance', name: 'Visual integrity', file: 'appearance.js', detail: 'Original colors and product photography' },
    { id: 'sorting', name: 'Catalog sorting', file: 'sorting.js', detail: 'Product order and sorting' }
  ];
  const SCENARIOS = [
    { id: 'search', title: 'Add product search', prompt: 'Add a search field to the catalog so customers can find products by name. Leave checkout, sign-in and navigation unchanged.', target: 'catalog', sample: 'lamp', locks: ['auth','checkout','navigation','shipping','theme','appearance','sorting'],
      patches: [
        { file: 'catalog.js', old: 'return products;', new: "return products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));", intent: 'Requested: filter products by search term' },
        { file: 'auth.js', old: 'return Boolean(user && user.id && user.verified);', new: 'return Boolean(user);', intent: 'Unrequested: simplify session check' },
        { file: 'navigation.js', old: "return ['Home', 'Catalog', 'Cart', 'Account'];", new: "return ['Home', 'Catalog', 'Account'];", intent: 'Unrequested: simplify navigation links' }
      ], acceptance: { name: 'Search returns only matching products', file: 'catalog.js', test: m => m['catalog.js'].search('lamp').map(p=>p.name).join() === 'Desk lamp' && m['catalog.js'].search('xyz').length === 0 }
    },
    { id: 'shipping', title: 'Offer free shipping', prompt: 'Offer free shipping on orders of \u20b92,000 or more. Keep product prices, authentication and navigation unchanged.', target: 'checkout', sample: '', locks: ['auth','catalog','navigation','shipping','theme','appearance','sorting'],
      patches: [
        { file: 'checkout.js', old: 'const shipping = shippingFee(amount);', new: 'const shipping = amount >= 2000 ? 0 : shippingFee(amount);', intent: 'Requested: waive shipping for qualifying orders' },
        { file: 'pricing.js', old: 'sum + item.price * item.qty', new: 'sum + item.price', intent: 'Unrequested: alter shared subtotal calculation' }
      ], acceptance: { name: 'Free shipping on qualifying orders', file: 'checkout.js', test: m => m['checkout.js'].quote([{price:2500,qty:1}]).shipping === 0 && m['checkout.js'].quote([{price:999,qty:1}]).shipping === 99 }
    },
    { id: 'mobile', title: 'Simplify mobile navigation', prompt: 'Use a compact two-link mobile navigation with Catalog and Cart. Preserve the desktop links, login and checkout.', target: 'navigation', sample: '', locks: ['auth','catalog','checkout','shipping','theme','appearance','sorting'],
      patches: [
        { file: 'navigation.js', old: "return ['Home', 'Catalog', 'Cart', 'Account'];", new: "return mobile ? ['Catalog', 'Cart'] : ['Home', 'Catalog', 'Cart', 'Account'];", intent: 'Requested: compact mobile menu' },
        { file: 'checkout.js', old: 'total: amount + shipping - discount', new: 'total: amount - discount', intent: 'Unrequested: omit shipping from total' },
        { file: 'auth.js', old: 'return Boolean(user && user.id && user.verified);', new: 'return Boolean(user && user.id);', intent: 'Unrequested: bypass verification check' }
      ], acceptance: { name: 'Mobile navigation has exactly two requested links', file: 'navigation.js', test: m => m['navigation.js'].links(true).join(',') === 'Catalog,Cart' }
    },
    { id: 'dark', title: 'Enable dark mode', prompt: 'Enable an optional dark mode for the storefront. Preserve product photos and the existing light mode.', target: 'theme', sample: '', locks: ['auth','catalog','checkout','navigation','shipping','appearance','sorting'],
      patches: [
        { file: 'theme.js', old: "return 'light';", new: "return preference === 'dark' ? 'dark' : 'light';", intent: 'Requested: select the dark palette when enabled' },
        { file: 'appearance.js', old: "return 'none';", new: "return 'invert(1)';", intent: 'Unrequested: invert the entire storefront, including photos and light mode' }
      ], acceptance: { name: 'Dark mode can be enabled and disabled', file: 'theme.js', test: m => m['theme.js'].resolveTheme('dark')==='dark' && m['theme.js'].resolveTheme('light')==='light' }
    },
    { id: 'coupon', title: 'Add discount code', prompt: 'Apply a 10% discount to the subtotal with code SAVE10. Keep existing shipping fees and invalid-code behavior unchanged.', target: 'checkout', sample: '', locks: ['auth','catalog','navigation','shipping','theme','appearance','sorting'],
      patches: [
        { file: 'checkout.js', old: 'const discount = 0;', new: "const discount = String(coupon).trim().toUpperCase() === 'SAVE10' ? Math.round(amount * 0.10) : 0;", intent: 'Requested: apply SAVE10 to the subtotal' },
        { file: 'shipping.js', old: 'return amount > 0 ? 99 : 0;', new: 'return 0;', intent: 'Unrequested: remove shipping charges on every order' }
      ], acceptance: { name: 'SAVE10 applies exactly 10% to subtotal', file: 'checkout.js', test: m => m['checkout.js'].quote([{price:1000,qty:2}], 'SAVE10').discount===200 && m['checkout.js'].quote([{price:1000,qty:2}], 'BAD').discount===0 }
    },
    { id: 'sort', title: 'Sort products by price', prompt: 'Add price sorting from low to high and high to low. Preserve all products and INR prices.', target: 'sorting', sample: '', locks: ['auth','catalog','checkout','navigation','shipping','theme','appearance'],
      patches: [
        { file: 'sorting.js', old: 'return [...items];', new: "return mode === 'asc' ? [...items].sort((a,b)=>a.price-b.price) : mode === 'desc' ? [...items].sort((a,b)=>b.price-a.price) : [...items];", intent: 'Requested: sort a copy of the catalog by price' },
        { file: 'catalog.js', old: 'return products;', new: 'return products.filter(p => p.id !== 3);', intent: 'Unrequested: remove the cheapest product from the catalog' },
        { file: 'pricing.js', old: "return '\u20b9' + amount.toLocaleString('en-IN');", new: "return '$' + amount.toLocaleString('en-IN');", intent: 'Unrequested: relabel INR prices as dollars' }
      ], acceptance: { name: 'Both price sort directions work', file: 'sorting.js', test: m => {const items=[{price:20},{price:10},{price:30}];return m['sorting.js'].order(items,'asc').map(p=>p.price).join()==='10,20,30' && m['sorting.js'].order(items,'desc').map(p=>p.price).join()==='30,20,10';} }
    }
  ];
  const TESTS = [
    { id:'guest', name:'Guest cannot check out', feature:'auth', test:m=>!m['auth.js'].canCheckout({guest:true}) && !m['auth.js'].canCheckout(null) },
    { id:'verified', name:'Only verified accounts are accepted', feature:'auth', test:m=>m['auth.js'].canCheckout({id:1,verified:true}) && !m['auth.js'].canCheckout({id:1,verified:false}) },
    { id:'catalog', name:'Empty search lists all three products', feature:'catalog', test:m=>m['catalog.js'].search('').length===3 },
    { id:'price', name:'Catalog price format is preserved', feature:'catalog', test:m=>m['catalog.js'].formatPrice(1499)==='\u20b91,499' },
    { id:'quantity', name:'Subtotal accounts for item quantities', feature:'checkout', test:m=>m['checkout.js'].quote([{price:499,qty:2}]).subtotal===998 },
    { id:'total', name:'Checkout total includes shipping', feature:'checkout', test:m=>{const q=m['checkout.js'].quote([{price:499,qty:1}]);return q.shipping===99 && q.total===598;} },
    { id:'empty', name:'Empty cart has no fees', feature:'checkout', test:m=>m['checkout.js'].quote([]).total===0 },
    { id:'nav', name:'Desktop navigation retains all four routes', feature:'navigation', test:m=>m['navigation.js'].links(false).join(',')==='Home,Catalog,Cart,Account' },
    { id:'mobilecart', name:'Cart remains reachable on mobile', feature:'navigation', test:m=>m['navigation.js'].links(true).includes('Cart') },
    { id:'shipping-policy', name:'Base shipping policy retains its fee', feature:'shipping', test:m=>m['shipping.js'].shippingFee(1500)===99 && m['shipping.js'].shippingFee(0)===0 },
    { id:'light', name:'Light mode remains available', feature:'theme', test:m=>m['theme.js'].resolveTheme('light')==='light' },
    { id:'palette', name:'No global color inversion', feature:'appearance', test:m=>m['appearance.js'].surfaceFilter()==='none' },
    { id:'coupon-invalid', name:'Invalid or empty codes do not discount orders', feature:'checkout', test:m=>m['checkout.js'].quote([{price:1000,qty:1}], 'INVALID').discount===0 && m['checkout.js'].quote([{price:1000,qty:1}], '').discount===0 },
    { id:'sort-default', name:'Default catalog order is preserved', feature:'sorting', test:m=>m['sorting.js'].order([{price:3},{price:1},{price:2}], 'default').map(p=>p.price).join()==='3,1,2' }
  ];
  const clean = file => file.replace(/^\.\//, '');
  function dependencies(files) {
    const graph = {};
    for (const [file, src] of Object.entries(files)) {
      graph[file] = [...src.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map(x=>clean(x[1]));
    }
    return graph;
  }
  function closure(graph, file, seen = new Set()) {
    if (seen.has(file)) return seen;
    seen.add(file);
    for (const dep of graph[file] || []) closure(graph, dep, seen);
    return seen;
  }
  function protection(files, locks) {
    const graph = dependencies(files), map = {};
    for (const feat of FEATURES.filter(f=>locks.includes(f.id))) {
      for (const file of closure(graph, feat.file)) (map[file] ||= []).push({ name: feat.name, direct: file===feat.file });
    }
    return map;
  }
  function apply(files, patches) {
    const result = {...files};
    for (const patch of patches) {
      if (!Object.hasOwn(result,patch.file)) throw Error('Unknown file: '+patch.file);
      if(typeof patch.old!=='string'||!patch.old||typeof patch.new!=='string') throw Error('Invalid patch context');
      const parts = result[patch.file].split(patch.old);
      if (parts.length!==2) throw Error('Patch context must match exactly once: '+patch.file);
      result[patch.file] = parts.join(patch.new);
    }
    return result;
  }
  // This evaluator only receives the immutable, application-owned fixture and predefined patches.
  // No user-provided source or prompt is executed.
  function load(files) {
    const loaded = {}, active = new Set();
    function get(path) {
      const key=clean(path);
      if (active.has(key)) throw Error('Circular dependency: '+key);
      if (Object.prototype.hasOwnProperty.call(loaded,key)) return loaded[key];
      if (!Object.hasOwn(files,key)) throw Error('Unresolved import: '+key);
      active.add(key);
      const module = { exports: {} };
      new Function('require','module', '"use strict";\n'+files[key])(get,module);
      loaded[key]=module.exports;active.delete(key);return module.exports;
    }
    for(const key of Object.keys(files)) get(key);
    return loaded;
  }
  function runTests(files, scenario) {
    let modules;
    try { modules=load(files); } catch(error) {
      return { regression:TESTS.map(t=>({...t,passed:false,error:error.message})), acceptance:{...scenario.acceptance,passed:false,error:error.message} };
    }
    const check=t=>{try{return {...t,passed:!!t.test(modules)};}catch(error){return {...t,passed:false,error:error.message};}};
    return {regression:TESTS.map(check),acceptance:check(scenario.acceptance)};
  }
  function evaluate(scenarioId, locks) {
    const scenario=SCENARIOS.find(s=>s.id===scenarioId);
    if(!scenario) throw Error('Unknown scenario');
    const all=apply(BASE,scenario.patches);
    const protectedFiles=protection(BASE,locks);
    // Inspect both baseline and candidate dependency graphs to catch newly introduced imports.
    const future=protection(all,locks);
    for(const [file, entries] of Object.entries(future)) for(const entry of entries) {
      const list=protectedFiles[file] ||= [];
      if(!list.some(e=>e.name===entry.name && e.direct===entry.direct)) list.push(entry);
    }
    const classified=scenario.patches.map(p=>({...p,reasons:protectedFiles[p.file]||[],blocked:!!protectedFiles[p.file]?.length}));
    const guarded=apply(BASE,classified.filter(p=>!p.blocked));
    const baseline=runTests(BASE,scenario), before=runTests(all,scenario), after=runTests(guarded,scenario);
    const fails=r=>r.regression.filter((t,i)=>!t.passed&&baseline.regression[i].passed).length;
    return {scenario,classified,protectedFiles,baseline,before,after,all,guarded,regressionsBefore:fails(before),regressionsAfter:fails(after),safe:after.regression.every(t=>t.passed)&&after.acceptance.passed,blocked:classified.filter(p=>p.blocked).length};
  }
  return { BASE,FEATURES,SCENARIOS,TESTS,dependencies,protection,apply,load,runTests,evaluate };
});
