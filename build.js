const fs=require('fs');const path=require('path');const root=__dirname;
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('template.html').replace('/*__CSS__*/',()=>read('styles.css')).replace('/*__ENGINE__*/',()=>read('engine.js')).replace('/*__ASSETS__*/',()=>read('assets.js')).replace('/*__APP__*/',()=>read('app.js'));
fs.writeFileSync(path.join(root,'index.html'),html);
