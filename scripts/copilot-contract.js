#!/usr/bin/env node
/*
 * SYD OMEGA 91717 - behavioural contract for the Sovereign Copilot (omega-copilot.js).
 *
 * Loads the real module into headless Chromium with a stubbed concierge and
 * asserts what a member relies on, none of which `node --check`, audit.py or
 * verify-runtime.js can see (they never type into the drawer):
 *
 *   commands   /help lists them; unknown and argument-less commands answer
 *              locally with no paid call; a command sends its persona as
 *              system_override; a plain question sends none; typing "/s"
 *              filters the picker.
 *   memory     a follow-up carries the earlier turns in a [CONVERSATION SO FAR]
 *              block; /clear empties it with no call; the message never exceeds
 *              concierge's 2000-char limit; a call declined WITH history is
 *              retried once bare.
 *   honesty    offline, a command says nothing was generated (never a canned
 *              answer passed off as the result) and stays out of history.
 *   events     omega:copilot-stream-end fires once per answered message.
 *
 *   node scripts/copilot-contract.js            run the contract
 *   node scripts/copilot-contract.js --help     this text
 *
 * Playwright is not a repo dependency (no build step). Resolved like
 * verify-runtime.js: $OMEGA_SCRATCHPAD/node_modules, then a global/CI install.
 * Without a browser it prints SKIPPED and exits 0 -- unless
 * OMEGA_REQUIRE_BROWSER is set (CI sets it), where a skip is a failure: a gate
 * that silently skips proves nothing (verify-runtime.js skipped on every
 * GitHub-hosted run until 2026-10-12 while its job reported green).
 *
 *   Exit 0 = contract holds (or SKIPPED locally).  Exit 1 = a broken case.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ARGV = process.argv.slice(2);
if (ARGV.includes('--help') || ARGV.includes('-h')) {
  const src = fs.readFileSync(__filename, 'utf8');
  console.log(src.slice(src.indexOf('/*') + 2, src.indexOf('*/')).replace(/^ \* ?/gm, '').trim());
  process.exit(0);
}
/* --module <file>: run the contract against another copy of the module, e.g.
   `git show <rev>:omega-copilot.js > old.js` -- how the cases were proven to
   fail on the code that preceded them. */
const MOD_ARG = ARGV.indexOf('--module');
const MODULE = MOD_ARG >= 0 ? path.resolve(ARGV[MOD_ARG + 1]) : path.join(ROOT, 'omega-copilot.js');

function loadPlaywright() {
  const tries = [
    process.env.OMEGA_SCRATCHPAD && path.join(process.env.OMEGA_SCRATCHPAD, 'node_modules', 'playwright-core'),
    process.env.OMEGA_SCRATCHPAD && path.join(process.env.OMEGA_SCRATCHPAD, 'node_modules', 'playwright'),
    'playwright-core', 'playwright'
  ].filter(Boolean);
  for (const t of tries) { try { return require(t); } catch (e) {} }
  return null;
}
function skip(why) {
  console.log('SKIPPED: ' + why + '. Copilot contract not run.');
  return process.env.OMEGA_REQUIRE_BROWSER ? 1 : 0;
}

/* The concierge stub. mode: ok | offline (throws) | blockhistory (declines
   any message carrying history, as classify() does for an old risky word). */
function installStub() {
  window.__calls = []; window.__mode = 'ok'; window.__ends = 0; let n = 0;
  window.__omegaSb = { functions: { invoke: async (name, opts) => {
    const b = opts.body; window.__calls.push(b);
    if (window.__mode === 'offline') throw new Error('network');
    if (window.__mode === 'blockhistory' && b.message.includes('[CONVERSATION SO FAR]')) return { data: null, error: { status: 403 } };
    if (b.message.length > 2000) return { data: null, error: { status: 400 } };
    return { data: { reply: 'R' + (++n) }, error: null };
  } } };
  document.addEventListener('omega:copilot-stream-end', () => { window.__ends++; });
}

async function main() {
  const pw = loadPlaywright();
  if (!pw) return skip('playwright-core not resolvable');
  let browser;
  try { browser = await pw.chromium.launch({ headless: true }); }
  catch (e) { return skip('could not launch Chromium (' + String(e.message).split('\n')[0].slice(0, 100) + ')'); }

  const results = [];
  const check = (name, ok, detail) => results.push({ name, ok: !!ok, detail: ok ? '' : detail });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message || e)));
  try {
    await page.setContent('<!doctype html><html><head></head><body></body></html>');
    await page.evaluate(installStub);
    await page.addScriptTag({ content: fs.readFileSync(MODULE, 'utf8') });
    await page.evaluate(() => document.dispatchEvent(new CustomEvent('omega:populated',
      { detail: { profile: { sign: 'Aries', axis_a: 1, axis_b: 1, axis_c: 1 } } })));
    await page.evaluate(() => window.OmegaCopilot.open());

    const calls = () => page.evaluate(() => window.__calls.length);
    const last = () => page.evaluate(() => window.__calls[window.__calls.length - 1] || null);
    const lastAi = () => page.evaluate(() => { const m = document.querySelectorAll('#cp-messages .cp-msg-ai'); return m.length ? m[m.length - 1].textContent : ''; });
    const send = async q => { await page.fill('#cp-input', q); await page.evaluate(() => window.OmegaCopilot.send()); await page.waitForTimeout(20); };

    // ── commands
    await page.fill('#cp-input', '/s');
    await page.dispatchEvent('#cp-input', 'input');
    const picked = await page.$$eval('#cp-suggest .cp-cmd-k', els => els.map(e => e.textContent)).catch(() => []);
    check('picker filters "/s" to /summarize and /strategy', JSON.stringify(picked) === '["/summarize","/strategy"]', 'got ' + JSON.stringify(picked));
    await page.fill('#cp-input', '');

    let before = await calls();
    await send('/help');
    check('/help lists the commands without a call', (await calls()) === before && /\/summarize/.test(await lastAi()), 'calls ' + before + '->' + (await calls()) + ', reply ' + JSON.stringify((await lastAi()).slice(0, 60)));
    await send('/nosuchcommand x');
    check('an unknown command answers locally without a call', (await calls()) === before && /Unknown command/.test(await lastAi()), 'reply ' + JSON.stringify((await lastAi()).slice(0, 60)));
    await send('/compare');
    check('a command with no argument shows usage without a call', (await calls()) === before && /Usage/.test(await lastAi()), 'reply ' + JSON.stringify((await lastAi()).slice(0, 60)));

    await send('/summarize alpha beta gamma');
    let c = await last();
    check('a command sends its argument and its persona', c && c.message === 'alpha beta gamma' && /Historian/.test(c.system_override || ''), JSON.stringify(c));

    // ── memory
    await send('make it shorter');
    c = await last();
    check('a follow-up carries the earlier turns', c && /\[CONVERSATION SO FAR\][\s\S]*alpha beta gamma[\s\S]*\[CURRENT MESSAGE\]\nmake it shorter$/.test(c.message), 'sent ' + JSON.stringify(c && c.message));
    before = await calls();
    await send('/clear');
    check('/clear resets without a call', (await calls()) === before, 'calls ' + before + '->' + (await calls()));
    await send('fresh question');
    c = await last();
    check('after /clear the next message goes bare', c && c.message === 'fresh question' && !c.system_override, JSON.stringify(c));
    for (let i = 0; i < 8; i++) await send('x'.repeat(900));
    await send('final');
    c = await last();
    check('history stays within the 2000-char limit and ends with the current message',
      c && c.message.length <= 2000 && c.message.endsWith('[CURRENT MESSAGE]\nfinal'), 'length ' + (c && c.message.length));
    await page.evaluate(() => { window.__mode = 'blockhistory'; });
    before = await calls();
    await send('declined with history');
    c = await last();
    check('a call declined with history is retried once bare and answered',
      (await calls()) - before === 2 && c.message === 'declined with history' && /^R\d+$/.test(await lastAi()),
      (await calls()) - before + ' call(s), last ' + JSON.stringify(c && c.message) + ', reply ' + JSON.stringify(await lastAi()));

    // ── honesty
    await page.evaluate(() => { window.__mode = 'offline'; });
    await send('/explain gates');
    check('offline, a command says nothing was generated', /Nothing was generated/.test(await lastAi()), 'reply ' + JSON.stringify((await lastAi()).slice(0, 80)));
    await page.evaluate(() => { window.__mode = 'ok'; });
    await send('/clear');
    await page.evaluate(() => { window.__mode = 'offline'; });
    await send('/explain gates');
    await page.evaluate(() => { window.__mode = 'ok'; });
    await send('next');
    c = await last();
    check('the offline notice never enters history', c && c.message === 'next', 'sent ' + JSON.stringify(c && c.message));

    // ── events: every message that reached aiSend fired one stream-end
    const answered = await page.evaluate(() => document.querySelectorAll('#cp-messages .cp-msg-user').length) - 5; // help, unknown, usage, 2x clear answer locally
    await page.waitForTimeout(6000);
    const ends = await page.evaluate(() => window.__ends);
    check('omega:copilot-stream-end fires once per answered message', ends === answered, ends + ' events for ' + answered + ' answered messages');
    check('no uncaught page error', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('harness ran to completion', false, String(e.message || e).slice(0, 200));
  } finally {
    await browser.close();
  }

  const failed = results.filter(r => !r.ok);
  console.log('COPILOT CONTRACT - ' + path.relative(ROOT, MODULE));
  for (const r of results) console.log((r.ok ? '  ok   ' : '  FAIL ') + r.name + (r.ok ? '' : '\n         ' + r.detail));
  console.log(failed.length ? 'COPILOT CONTRACT: ' + failed.length + ' of ' + results.length + ' case(s) failed'
                            : 'COPILOT CONTRACT: PASS (' + results.length + ' cases)');
  return failed.length ? 1 : 0;
}

main().then(c => process.exit(c)).catch(e => { console.error(e); process.exit(2); });
