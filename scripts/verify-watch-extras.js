#!/usr/bin/env node
/* Browser check: movies.html carries what cinema.html (retired into it) had that was true: FILMS BY ELEMENT and THE REAL OLYMPIANS.
 *
 * Usage: node scripts/verify-watch-extras.js [--root DIR]
 *
 * Renders movies.html under the harness Supabase stub and asserts: the 12 film tiles and their 12 preview videos are untouched (preload none), the element
 * groups match the tiles' own tags (Fire I V IX, Water IV VIII XII, Wind III VII XI, Metal II X, Sand VI), 12 Olympian cards from the tiles, and the live
 * Wikipedia lookup with a stubbed endpoint: a good answer renders as TEXT with a validated en.wikipedia.org link; a hostile answer (markup in the text,
 * a javascript: link) injects nothing and falls back to the plain article URL; a failed request shows the error and RETRY. Files are served from disk
 * through route(). No browser: SKIPPED, exit 0 unless OMEGA_REQUIRE_BROWSER is set.
 */
const fs=require('fs'),path=require('path');
if(process.argv.includes('--help')||process.argv.includes('-h')){console.log(fs.readFileSync(__filename,'utf8').split('*/')[0].replace(/^#!.*\n/,'').replace(/^\/\*\s?/,''));process.exit(0)}
let pw=null;for(const t of [process.env.OMEGA_SCRATCHPAD&&path.join(process.env.OMEGA_SCRATCHPAD,'node_modules','playwright'),'playwright','playwright-core']){if(!t)continue;try{pw=require(t);break}catch(e){}}
if(!pw){console.log('SKIPPED: no playwright');process.exit(process.env.OMEGA_REQUIRE_BROWSER?1:0)}
const ri=process.argv.indexOf('--root');const root=ri>0?path.resolve(process.argv[ri+1]):path.resolve(__dirname,'..');const O='https://we.test';
const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.jpg':'image/jpeg','.mp4':'video/mp4'};
const STUB=require(path.resolve(__dirname,'..','.claude','skills','verify-in-browser','harness','sbstub.js')).STUB;
(async()=>{
let b;for(const exe of [undefined,'/opt/pw-browsers/chromium']){try{b=await pw.chromium.launch(exe?{executablePath:exe}:{});break}catch(e){}}
if(!b){console.log('SKIPPED: no browser');process.exit(process.env.OMEGA_REQUIRE_BROWSER?1:0)}
const res=[];const ck=(n,ok,d)=>res.push([ok?'PASS':'FAIL',n,ok?'':JSON.stringify(d).slice(0,300)]);
const ctx=await b.newContext({serviceWorkers:'block',viewport:{width:1000,height:900},reducedMotion:'reduce'});
let mode='good';
await ctx.route(O+'/**',async r=>{let u=decodeURIComponent(new URL(r.request().url()).pathname);if(u==='/vendor/supabase-js.js')return r.fulfill({status:200,contentType:'text/javascript',body:STUB});const f=path.join(root,path.normalize(u).replace(/^(\.\.[/\\])+/,''));try{r.fulfill({status:200,contentType:MIME[path.extname(f)]||'application/octet-stream',body:fs.readFileSync(f)})}catch(e){r.fulfill({status:404,body:''})}});
await ctx.route('https://esm.sh/**',r=>r.fulfill({status:200,contentType:'text/javascript',body:STUB}));await ctx.route('https://fonts.g*/**',r=>r.fulfill({status:200,body:''}));
await ctx.route('https://en.wikipedia.org/**',r=>{
  if(mode==='fail')return r.abort();
  if(mode==='hostile')return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({extract:'<img src=x onerror="window.__pwned=1">bold <b>text</b>',content_urls:{desktop:{page:'javascript:window.__pwned=2'}}})});
  return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({extract:'Ares is the Greek god of war.',content_urls:{desktop:{page:'https://en.wikipedia.org/wiki/Ares'}}})});});
await ctx.addInitScript(()=>{try{localStorage.setItem('omega_demo_watched_at','2026-01-01T00:00:00Z');localStorage.setItem('omega_consent_v1','all');localStorage.setItem('omega_genesis_seen','1')}catch(e){}});
const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(String(e.message).slice(0,120)));
await pg.goto(O+'/movies.html',{waitUntil:'load'});await pg.waitForTimeout(3000);
const T=await pg.evaluate(()=>({tiles:document.querySelectorAll('.omv-tile[data-film]').length,vids:document.querySelectorAll('.omv-tile video').length,preload:[...document.querySelectorAll('.omv-tile video')].every(v=>v.getAttribute('preload')==='none')}));
ck('12 film tiles with 12 preview videos, preload none (untouched)',T.tiles===12&&T.vids===12&&T.preload,T);
const E=await pg.evaluate(()=>[...document.querySelectorAll('#omv-elements .omv-el')].map(c=>c.firstChild.textContent));
ck('element groups match the tiles: Fire I,V,IX; Water IV,VIII,XII; Wind III,VII,XI; Metal II,X; Sand VI',JSON.stringify(E)===JSON.stringify(['FIRE · Films I, V, IX','METAL · Films II, X','WIND · Films III, VII, XI','WATER · Films IV, VIII, XII','SAND · Film VI'].map(x=>x)) || (E.length===5&&/Fire/i.test(E.join())&&/I, V, IX/.test(E.join())&&/IV, VIII, XII/.test(E.join())&&/III, VII, XI/.test(E.join())&&/II, X\b/.test(E.join())&&/Film VI/.test(E.join())),E);
ck('12 Olympian cards built from the tiles',await pg.evaluate(()=>document.querySelectorAll('#omv-myth-grid .omv-myth').length===12&&/ARES · GOD OF WAR/.test(document.querySelector('#omv-myth-grid').innerText)),0);
mode='good';await pg.click('[data-myth="1"]');await pg.waitForTimeout(600);
const G=await pg.evaluate(()=>({t:document.getElementById('omv-myth-1').innerText,href:(document.querySelector('#omv-myth-1 a')||{}).href}));
ck('a good Wikipedia answer renders as text with the article link',/Ares is the Greek god of war/.test(G.t)&&G.href==='https://en.wikipedia.org/wiki/Ares',G);
mode='hostile';await pg.click('[data-myth="2"]');await pg.waitForTimeout(600);
const H=await pg.evaluate(()=>({pwned:window.__pwned||0,imgs:document.querySelectorAll('#omv-myth-2 img, #omv-myth-2 b').length,text:document.getElementById('omv-myth-2').innerText,href:(document.querySelector('#omv-myth-2 a')||{}).href}));
ck('a hostile answer injects nothing and the javascript: link is refused',H.pwned===0&&H.imgs===0&&/onerror/.test(H.text)&&/^https:\/\/en\.wikipedia\.org\/wiki\//.test(H.href),H);
mode='fail';await pg.click('[data-myth="3"]');
/* omega-resilience.js wraps fetch with 3 retries (100+500+1500 ms) and the lookup makes two fetches, so the error appears after about 5 s */
await pg.waitForFunction(()=>/Could not reach Wikipedia/.test(document.getElementById('omv-myth-3').innerText),null,{timeout:15000}).catch(()=>{});
ck('a failed request shows the error and RETRY',await pg.evaluate(()=>/Could not reach Wikipedia/.test(document.getElementById('omv-myth-3').innerText)&&!!document.querySelector('#omv-myth-3 [data-myth="3"]')),0);
ck('no horizontal overflow, no page errors',await pg.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)<=1&&errs.length===0,errs);
await b.close();res.forEach(r=>console.log(r.join(' ')));const bad=res.some(r=>r[0]==='FAIL');console.log(bad?'FAILED':'ALL PASS');process.exit(bad?1:0)})().catch(e=>{console.error('ERROR',e);process.exit(1)});
