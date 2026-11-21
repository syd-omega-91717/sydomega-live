#!/usr/bin/env node
/* Panel census: can every page be hosted IN PLACE by omega-panels.js?
   For each page, mount it as a panel inside life.html (a hub that already loads the engine) and record whether it
   loads, shows content (>= 40 chars of text) and throws no page error, and whether the host stayed put.
   Read-only. NOT a parity test: it does not prove the page behaves the same as standalone (controls, storage written).

   Usage (static server on :8765, see .claude/skills/verify-in-browser):
     OMEGA_SCRATCHPAD=<dir> SHARD=0 OF=3 node scripts/panel-census.js    # one shard; run shards in parallel
   Writes <scratchpad>/census-<shard>.json. One browser per page with a 35 s cap: a page script that never returns
   (observed) would otherwise hang the whole run. */
const { launch, open } = require('../.claude/skills/verify-in-browser/harness/session.js');
const fs = require('fs');
const shard = +process.env.SHARD, of = +process.env.OF;
const all = fs.readdirSync(require('path').resolve(__dirname, '..')).filter(f => f.endsWith('.html')).sort().filter(f => f !== 'life.html');
const mine = all.filter((_, i) => i % of === shard);
const timeout = (ms, label) => new Promise((_, rej) => setTimeout(() => rej(new Error(label + ' timeout')), ms));
async function one(t) {
  const key = t.replace(/\.html$/, '');
  const { browser, ctx } = await launch({ width: 1280, height: 800 });
  try {
    const work = (async () => {
      const page = await open(ctx, 'life.html', { settle: 1200 });
      const errs = []; page.on('pageerror', e => errs.push(String(e.message).slice(0, 100)));
      const r = await page.evaluate(async ([key, url]) => {
        const host = document.createElement('section');
        host.setAttribute('data-omega-panels', JSON.stringify([[key, key.toUpperCase(), url]]));
        (document.querySelector('main') || document.body).appendChild(host);
        window.OmegaPanels.mount(host);
        host.__omegaPanels.open(key, false);
        await new Promise(r => setTimeout(r, 2500));
        const stage = host.querySelector('.op-stage');
        return { failed: !!host.querySelector('.op-msg'), text: stage ? stage.innerText.trim().length : 0, nodes: stage ? stage.querySelectorAll('*').length : 0, navigated: location.pathname };
      }, [key, '/' + t]);
      return { page: t, ...r, errors: errs.length, firstError: errs[0] || null };
    })();
    return await Promise.race([work, timeout(35000, 'page')]);
  } catch (e) { return { page: t, error: String(e.message).slice(0, 110) }; }
  finally { try { await Promise.race([browser.close(), timeout(5000, 'close')]); } catch (e) {} }
}
(async () => {
  const out = [];
  for (const t of mine) {
    const rec = await one(t); out.push(rec);
    console.log(out.length + '/' + mine.length, rec.page, rec.failed ? 'FAILED' : '', rec.text ?? '', rec.errors ?? '', rec.error || '');
    fs.writeFileSync(`${process.env.OMEGA_SCRATCHPAD}/census-${shard}.json`, JSON.stringify(out));
  }
  fs.writeFileSync(`${process.env.OMEGA_SCRATCHPAD}/census-${shard}.done`, 'done');
})();
