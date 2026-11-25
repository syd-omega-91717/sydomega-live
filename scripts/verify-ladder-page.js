#!/usr/bin/env node
/* Browser check: levels.html is the merged ladder page (levels + lattice grid + gates).
 *
 * Usage: node scripts/verify-ladder-page.js [--root DIR]
 *
 * Renders levels.html under the harness Supabase stub as a member (AUTH about 5.36) and as an owner at 390 px, and asserts: 12 level cards named by
 * the canon, the 12 x 12 grid with canon sign columns, the sovereign path, gate unlock states (gate 4 needs 6.9592), MARK MASTERED and LOG ATTEMPT
 * persisting under the original localStorage keys, history order, the ported science and lattice text, no duplicate ids, the #gates deep link, no
 * overflow at 390 px, no page errors. Files are served from disk through route(). No browser: SKIPPED, exit 0 unless OMEGA_REQUIRE_BROWSER is set.
 */
const fs=require('fs'),path=require('path');
if(process.argv.includes('--help')||process.argv.includes('-h')){console.log(fs.readFileSync(__filename,'utf8').split('*/')[0].replace(/^#!.*\n/,'').replace(/^\/\*\s?/,''));process.exit(0)}
let pw=null;for(const t of [process.env.OMEGA_SCRATCHPAD&&path.join(process.env.OMEGA_SCRATCHPAD,'node_modules','playwright'),'playwright','playwright-core']){if(!t)continue;try{pw=require(t);break}catch(e){}}
if(!pw){console.log('SKIPPED: no playwright');process.exit(process.env.OMEGA_REQUIRE_BROWSER?1:0)}
const ri=process.argv.indexOf('--root');const root=ri>0?path.resolve(process.argv[ri+1]):path.resolve(__dirname,'..');const O='https://ld.test';
const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml'};
const BASE=require(path.resolve(__dirname,'..','.claude','skills','verify-in-browser','harness','sbstub.js')).STUB;
(async()=>{let b;for(const exe of [undefined,'/opt/pw-browsers/chromium']){try{b=await pw.chromium.launch(exe?{executablePath:exe}:{});break}catch(e){}}
if(!b){console.log('SKIPPED: no browser');process.exit(process.env.OMEGA_REQUIRE_BROWSER?1:0)}const res=[];const ck=(n,ok,d)=>res.push([ok?'PASS':'FAIL',n,ok?'':JSON.stringify(d).slice(0,300)]);
async function open(vw,stub,hash=''){
 const ctx=await b.newContext({serviceWorkers:'block',viewport:{width:vw,height:900},reducedMotion:'reduce'});
 await ctx.route(O+'/**',async r=>{let u=decodeURIComponent(new URL(r.request().url()).pathname);if(u==='/vendor/supabase-js.js')return r.fulfill({status:200,contentType:'text/javascript',body:stub});const f=path.join(root,u);try{r.fulfill({status:200,contentType:MIME[path.extname(f)]||'application/octet-stream',body:fs.readFileSync(f)})}catch(e){r.fulfill({status:404,body:''})}});
 await ctx.route('https://esm.sh/**',r=>r.fulfill({status:200,contentType:'text/javascript',body:stub}));await ctx.route('https://fonts.g*/**',r=>r.fulfill({status:200,body:''}));
 await ctx.addInitScript(()=>{try{localStorage.setItem('omega_demo_watched_at','2026-01-01T00:00:00Z');localStorage.setItem('omega_consent_v1','all');localStorage.setItem('omega_genesis_seen','1')}catch(e){}});
 const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(String(e.message).slice(0,120)));
 await pg.goto(O+'/levels.html'+hash,{waitUntil:'load'});await pg.waitForTimeout(3000);return {ctx,pg,errs}}
// member (auth ~5.36)
{const {ctx,pg,errs}=await open(1000,BASE);
 const L=await pg.evaluate(()=>({st:OmegaLadder.status(),cards:document.querySelectorAll('.lv-card').length,earned:document.querySelectorAll('.lv-card.earned').length,names:[...document.querySelectorAll('.lv-card')].map(c=>c.children[1].textContent).join(','),hdr:document.getElementById('hdr-auth').textContent,my:document.getElementById('my-lv-name').textContent,next:document.getElementById('my-lv-next').textContent}));
 ck('ladder ready, 12 cards, names from canon',L.st.ready&&L.cards===12&&L.names.startsWith('INITIATE,ACOLYTE,SCHOLAR')&&L.names.endsWith('PRIME,APEX'),L);
 ck('member auth ~5.36 earns 2 levels (>=2.3197,>=4.6394)',L.earned===2&&L.my==='ACOLYTE'&&/SCHOLAR/.test(L.next)&&/^5\.3/.test(L.hdr),L);
 await pg.click('[data-tab="grid"]');await pg.waitForTimeout(200);
 const G=await pg.evaluate(()=>({rows:document.querySelectorAll('#grd-tbody > .tbl-row').length,cells:document.querySelectorAll('#grd-tbody .gc').length,head:[...document.querySelectorAll('#grd-head > div')].map(d=>d.textContent).join(','),vis:getComputedStyle(document.getElementById('tab-grid')).display,done:document.querySelectorAll('#grd-tbody .gc-done').length}));
 ck('grid is 12 rows x 12 signs from the canon',G.rows===12&&G.cells===144&&/^GATE,ARI,TAU,GEM/.test(G.head)&&G.vis==='block',G);
 ck('grid marks 2 gates done x 12 signs',G.done===24,G);
 await pg.click('[data-tab="my"]');await pg.waitForTimeout(150);
 const M=await pg.evaluate(()=>({sign:document.getElementById('grd-my-sign').textContent,gate:document.getElementById('grd-my-gate').textContent,bars:document.querySelectorAll('#grd-path-bars > div').length}));
 ck('MY LEVEL carries the sovereign path (sign, active gate, 12 bars)',M.sign==='ARIES'&&M.gate==='GATE II'&&M.bars===12,M);
 await pg.click('[data-tab="gates"]');await pg.waitForTimeout(200);
 const T=await pg.evaluate(()=>({open:document.getElementById('k-open').textContent,locked:document.getElementById('k-locked').textContent,mast:document.getElementById('k-mastered').textContent,cards:document.getElementById('gate-grid').children.length,masterBtns:document.querySelectorAll('[data-master]').length,stage:!!document.querySelector('[data-omega-sculpture="gates"]')}));
 ck('gates: gate 1..3 open at auth 5.36 (gate 4 needs 6.9592)',T.open==='3'&&T.locked==='9'&&T.mast==='0'&&T.cards===12&&T.masterBtns===3&&T.stage,T);
 await pg.click('[data-master="2"]');await pg.waitForTimeout(150);
 ck('MARK MASTERED persists and updates counts',await pg.evaluate(()=>document.getElementById('k-mastered').textContent==='1'&&JSON.parse(localStorage.getItem('omega_gates'))[2].mastered===true),0);
 await pg.click('[data-tab="attempt"]');await pg.selectOption('#a-gate','3');await pg.fill('#a-notes','held back by sleep');await pg.click('#btn-pass');await pg.waitForTimeout(150);
 const A=await pg.evaluate(()=>({note:document.getElementById('a-note').textContent,hist:JSON.parse(localStorage.getItem('omega_gate_history')),gd:JSON.parse(localStorage.getItem('omega_gates'))[3]}));
 ck('LOG ATTEMPT writes history and counts, says LOGGED',A.hist.length===1&&A.hist[0].outcome==='pass'&&A.gd.attempts===1&&A.gd.passes===1&&/LOGGED/.test(A.note),A);
 await pg.click('#btn-fail');await pg.waitForTimeout(100);
 await pg.click('[data-tab="history"]');await pg.waitForTimeout(150);
 ck('HISTORY lists both attempts newest first',await pg.evaluate(()=>{const t=document.getElementById('history-list').innerText;return /FAILED/.test(t)&&/PASSED/.test(t)&&t.indexOf('FAILED')<t.indexOf('PASSED')}),0);
 for (const [tab,pats] of [['science',['CUBIC AUTHORITY','9³ INNER CUBE','THRESHOLD THEORY','CHUNKING','THE LEVEL SYSTEM','ZODIAC ALIGNMENT','GROWTH MINDSET']],['structure',['144 intersections','729 axis nodes','104,976','571,536','26,453,952','27.8367','BASE LATTICE NODES']]]){
  await pg.click('[data-tab="'+tab+'"]');await pg.waitForTimeout(150);
  const miss=await pg.evaluate(([t,p])=>{const x=document.getElementById('tab-'+t).innerText.toUpperCase();return p.filter(q=>!x.includes(q.toUpperCase()))},[tab,pats]);
  ck(tab+' carries every ported string',miss.length===0,miss)}
 ck('no duplicate ids',await pg.evaluate(()=>{const c={};document.querySelectorAll('[id]').forEach(e=>c[e.id]=(c[e.id]||0)+1);return Object.entries(c).filter(([k,v])=>v>1).length===0}),await pg.evaluate(()=>{const c={};document.querySelectorAll('[id]').forEach(e=>c[e.id]=(c[e.id]||0)+1);return Object.entries(c).filter(([k,v])=>v>1)}));
 ck('no page errors (member)',errs.length===0,errs);
 await ctx.close()}
// deep link + owner + phone
{const {ctx,pg,errs}=await open(390,BASE.replace('is_owner:false','is_owner:true'),'#gates');
 const O2=await pg.evaluate(()=>({tab:[...document.querySelectorAll('.tab-panel')].filter(p=>p.style.display!=='none').map(p=>p.id).join(),earned:document.querySelectorAll('.lv-card.earned').length,open:document.getElementById('k-open').textContent,ov:document.documentElement.scrollWidth-document.documentElement.clientWidth}));
 ck('#gates deep link opens GATES; owner earns all 12 levels, all 12 gates open; no overflow at 390',O2.tab==='tab-gates'&&O2.earned===12&&O2.open==='12'&&O2.ov<=1,O2);
 ck('no page errors (owner, phone)',errs.length===0,errs);
 await ctx.close()}
await b.close();res.forEach(r=>console.log(r.join(' ')));const bad=res.some(r=>r[0]==='FAIL');console.log(bad?'FAILED':'ALL PASS');process.exit(bad?1:0)})().catch(e=>{console.error('ERROR',e);process.exit(1)});
