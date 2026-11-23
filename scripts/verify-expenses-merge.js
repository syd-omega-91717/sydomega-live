#!/usr/bin/env node
/* Browser validation for the budget -> expenses merge (expenses.html absorbed budget.html's month view and trends).
 *
 * Usage: node scripts/verify-expenses-merge.js [--shots DIR]
 *
 * The expected figures are computed here, independently, from a seed written into the one shared store (omega_budget_months / omega_budget_targets),
 * with budget.html's own definitions (a month's numbers come from the month KEY an entry is filed under, not from its date; savings rate =
 * round((income - expenses) / income * 100), 0 with no income). They were also checked once against the retired budget.html itself (docs/fixes entry).
 * Covers: the month navigator and its overview, a filing trap (an entry dated in another month than its key), year boundaries, a time zone east of
 * UTC (budget.html's toISOString arithmetic landed a month early there), the yearly trend series, adding an entry through the real form, a hostile
 * description, un-migrated legacy data, keyboard use, 375 px, the Vault's single row and the invest hub's single card.
 * Files are served from disk through route() (no http server). No browser: SKIPPED, exit 0 unless OMEGA_REQUIRE_BROWSER is set.
 */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), ORIGIN = 'http://money.test';
if (process.argv.includes('--help') || process.argv.includes('-h')) { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^#!.*\n/, '').replace(/^\/\*\s?/, '')); process.exit(0); }
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };
function loadPW() { const sp = process.env.OMEGA_SCRATCHPAD; for (const t of [sp && path.join(sp, 'node_modules', 'playwright'), sp && path.join(sp, 'node_modules', 'playwright-core'), 'playwright', 'playwright-core']) { if (!t) continue; try { return require(t); } catch (e) { } } return null; }
let STUB = null; try { STUB = require(path.join(ROOT, '.claude', 'skills', 'verify-in-browser', 'harness', 'sbstub.js')).STUB; } catch (e) { }
const results = []; const check = (n, ok, d) => results.push({ name: n, ok: !!ok, detail: ok ? undefined : d });

/* ---- the seed, and the expectation computed from it ---- */
const Y = new Date().getFullYear();
const key = (y, m) => y + '-' + String(m).padStart(2, '0');
const cm = new Date().getMonth() + 1;                                   // current month, 1-12 (browser and test share the machine's zone unless a test sets another)
const prevKey = cm === 1 ? key(Y - 1, 12) : key(Y, cm - 1);
const curKey = key(Y, cm);
const GROUPS = ['HOUSING', 'TRANSPORT', 'FOOD', 'HEALTH', 'GROWTH', 'LIFESTYLE', 'GIVING', 'OTHER'];
let uid = 1; const ex = (cat, amount, date) => ({ id: 'e' + uid++, cat, desc: 'seed', amount, date }); const inc = (amount, date) => ({ id: 'i' + uid++, source: 'job', amount, date });
const SEED = {};
SEED[curKey] = { income: [inc(4000, curKey + '-02'), inc(250.5, curKey + '-10')], expenses: [ex('HOUSING', 1500, curKey + '-03'), ex('FOOD', 210.25, curKey + '-05'), ex('FOOD', 90, prevKey + '-28') /* TRAP: dated last month, filed under this one */, ex('GIVING', 120, curKey + '-09'), ex('OTHER', 33, curKey + '-12')] };
SEED[prevKey] = { income: [inc(3800, prevKey + '-01')], expenses: [ex('HOUSING', 1500, prevKey + '-02'), ex('TRANSPORT', 310, prevKey + '-04'), ex('LIFESTYLE', 410, prevKey + '-15'), ex('HEALTH', 75, prevKey + '-20')] };
SEED[key(Y - 1, 3)] = { income: [inc(2000, (Y - 1) + '-03-05')], expenses: [ex('FOOD', 2500, (Y - 1) + '-03-06')] };      // rate -25
SEED[key(Y - 1, 11)] = { income: [], expenses: [ex('GROWTH', 99, (Y - 1) + '-11-02')] };                                   // no income: rate 0
SEED['2024-12'] = { income: [inc(1000, '2024-12-01')], expenses: [ex('FOOD', 250, '2024-12-02')] };                          // year boundary, rate 75
SEED['2025-01'] = { income: [inc(1000, '2025-01-01')], expenses: [ex('FOOD', 500, '2025-01-02')] };                          // rate 50
const TARGETS = { HOUSING: 1500, TRANSPORT: 300, FOOD: 600, HEALTH: 200, GROWTH: 150, LIFESTYLE: 250, GIVING: 100, OTHER: 200 };
const usd = v => Math.round(v).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const sum = a => a.reduce((s, x) => s + x.amount, 0);
const totals = k => { const m = SEED[k] || { income: [], expenses: [] }; const i = sum(m.income), e = sum(m.expenses); return { i, e, rate: i > 0 ? Math.round(((i - e) / i) * 100) : 0 }; };
const actual = (k, g) => sum(((SEED[k] || { expenses: [] }).expenses).filter(x => x.cat === g));
const kpiText = k => { const t = totals(k); return [usd(t.i) + 'INCOME', usd(t.e) + 'EXPENSES', usd(Math.max(t.i - t.e, 0)) + 'SURPLUS', t.rate + '%SAVINGS RATE']; };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const labelOf = (y, m) => new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
const incSeries = y => MON.map((n, i) => { const t = totals(key(y, i + 1)); return n + ' income ' + usd(t.i) + ', expenses ' + usd(t.e); }).join('; ');
const rateSeries = y => MON.map((n, i) => n + ' ' + totals(key(y, i + 1)).rate + '%').join('; ');

(async () => {
  const pw = loadPW(); let browser;
  if (pw) for (const exe of [undefined, '/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome']) { try { browser = await pw.chromium.launch(exe ? { executablePath: exe } : {}); break; } catch (e) { } }
  if (!browser || !STUB) { console.log('SKIPPED: no playwright/browser (or the harness Supabase stub) available'); process.exit(process.env.OMEGA_REQUIRE_BROWSER ? 1 : 0); }

  async function open(page, { store = SEED, targets = TARGETS, legacy = null, viewport = { width: 1280, height: 900 }, tz = undefined } = {}) {
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport, timezoneId: tz });
    await ctx.route(ORIGIN + '/**', async (route) => {
      let u = decodeURIComponent(new URL(route.request().url()).pathname); if (u === '/') u = '/index.html';
      const f = path.join(ROOT, path.normalize(u).replace(/^(\.\.[/\\])+/, ''));
      if (!f.startsWith(ROOT)) return route.fulfill({ status: 403, body: '' });
      if (u === '/vendor/supabase-js.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: STUB });
      try { return route.fulfill({ status: 200, contentType: MIME[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) }); } catch (e) { return route.fulfill({ status: 404, body: '' }); }
    });
    await ctx.route('https://esm.sh/**', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: STUB }));
    await ctx.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('https://fonts.gstatic.com/**', r => r.fulfill({ status: 200, body: '' }));
    await ctx.addInitScript(([s, t, l]) => { try { localStorage.setItem('omega_demo_watched_at', '2026-01-01T00:00:00Z'); localStorage.setItem('omega_consent_v1', 'all'); localStorage.setItem('omega_genesis_seen', '1');
      if (s) localStorage.setItem('omega_budget_months', s); if (t) localStorage.setItem('omega_budget_targets', t); if (l) localStorage.setItem('omega_expenses', l); } catch (e) { } },
      [store ? (typeof store === 'string' ? store : JSON.stringify(store)) : null, targets ? JSON.stringify(targets) : null, legacy ? JSON.stringify(legacy) : null]);   // a string store is passed through verbatim (the hostile case needs invalid-for-JSON.stringify shapes such as an own __proto__ key)
    const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e.message).slice(0, 140)));
    await pg.goto(ORIGIN + '/' + page, { waitUntil: 'load', timeout: 60000 });
    await pg.waitForTimeout(1200);
    return { ctx, pg, errs };
  }
  const tab = (pg, t) => pg.click('.tab-btn[data-tab="' + t + '"]');
  const kpis = pg => pg.evaluate(() => [...document.querySelectorAll('#budget-month-kpis .stat')].map(s => (s.querySelector('.stat-val').textContent + s.querySelector('.stat-lbl').textContent).replace(/\s+/g, '')));
  const bars = pg => pg.evaluate(() => Object.fromEntries([...document.querySelectorAll('#budget-bars .budget-row')].map(r => [r.dataset.group, +r.querySelector('.budget-cat-nums').textContent.split('/')[0].replace(/[$,\s]/g, '')])));
  const label = pg => pg.textContent('#budget-month-nav-label');
  const compact = a => a.map(x => x.replace(/\s+/g, ''));

  /* ---------- the month overview ---------- */
  {
    const { ctx, pg, errs } = await open('expenses.html');
    await tab(pg, 'budget');
    check('the budget tab opens on the current month', (await label(pg)) === labelOf(Y, cm), await label(pg));
    check('this month: income, expenses, surplus and savings rate are the seed\'s', JSON.stringify(await kpis(pg)) === JSON.stringify(compact(kpiText(curKey))), JSON.stringify([await kpis(pg), kpiText(curKey)]));
    const b = await bars(pg); const wantBars = Object.fromEntries(GROUPS.filter(g => TARGETS[g] > 0 || actual(curKey, g) > 0).map(g => [g, Math.round(actual(curKey, g))]));
    check('this month: every category\'s actual is the seed\'s, including the entry dated last month but filed under this one', JSON.stringify(b) === JSON.stringify(wantBars) && b.FOOD === 300, JSON.stringify([b, wantBars]));
    check('the filing trap: FOOD counts 210.25 + 90 here, not 210.25', b.FOOD === 300, b.FOOD);
    await pg.click('#mn-prev');
    check('previous month: the label moves and the figures are that month\'s', (await label(pg)) === labelOf(...prevKey.split('-').map((v, i) => i ? +v : +v)) && JSON.stringify(await kpis(pg)) === JSON.stringify(compact(kpiText(prevKey))), JSON.stringify([await label(pg), await kpis(pg)]));
    const pb = await bars(pg);
    check('previous month: categories match, and the entry dated here but filed elsewhere is not counted', JSON.stringify(pb) === JSON.stringify(Object.fromEntries(GROUPS.filter(g => TARGETS[g] > 0 || actual(prevKey, g) > 0).map(g => [g, Math.round(actual(prevKey, g))]))) && pb.FOOD === 0, JSON.stringify(pb));
    await pg.click('#mn-next');
    check('next month returns to the current one', (await label(pg)) === labelOf(Y, cm), await label(pg));
    check('no page errors', errs.length === 0, JSON.stringify(errs));
    await ctx.close();
  }

  /* ---------- a month with nothing in it, over-limit styling, and a month with spending but no limit ---------- */
  {
    const { ctx, pg } = await open('expenses.html', { store: SEED, targets: { HOUSING: 1000 } });
    await tab(pg, 'budget');
    const over = await pg.evaluate(() => { const r = document.querySelector('#budget-bars .budget-row[data-group="HOUSING"]'); return r && r.querySelector('.budget-fill').className; });
    check('spending above a limit is styled "over"', /over/.test(over || ''), over);
    const noLimit = await pg.evaluate(() => { const r = document.querySelector('#budget-bars .budget-row[data-group="GIVING"]'); return r && r.querySelector('.budget-cat-nums').textContent.replace(/\s+/g, ' '); });
    check('spending with no limit set is still shown, with a dash for the limit', /\$120 \/ —/.test(noLimit || ''), noLimit);
    await ctx.close();
  }
  {
    const { ctx, pg } = await open('expenses.html', { store: {}, targets: null });
    await tab(pg, 'budget');
    const txt = await pg.textContent('#budget-bars');
    check('an empty store says nothing is recorded instead of showing zeros as data', /NOTHING RECORDED/.test(txt) && JSON.stringify(await kpis(pg)) === JSON.stringify(compact(['$0INCOME', '$0EXPENSES', '$0SURPLUS', '0%SAVINGS RATE'])), JSON.stringify([txt, await kpis(pg)]));
    await ctx.close();
  }

  /* ---------- year boundaries, and a time zone east of UTC ---------- */
  for (const tz of [undefined, 'Pacific/Kiritimati' /* UTC+14 */, 'Pacific/Pago_Pago' /* UTC-11 */]) {
    const { ctx, pg } = await open('expenses.html', { tz });
    await tab(pg, 'budget');
    await pg.evaluate(() => { viewMonth = '2025-01'; renderBudget(); });
    const seq = [await label(pg)];
    await pg.click('#mn-prev'); seq.push(await label(pg), JSON.stringify(await kpis(pg)));
    await pg.click('#mn-prev'); seq.push(await label(pg));
    await pg.click('#mn-next'); await pg.click('#mn-next'); seq.push(await label(pg));
    await pg.click('#mn-next'); seq.push(await label(pg));
    const want = [labelOf(2025, 1), labelOf(2024, 12), JSON.stringify(compact(kpiText('2024-12'))), labelOf(2024, 11), labelOf(2025, 1), labelOf(2025, 2)];
    check('month steps are exact across a year boundary' + (tz ? ' in ' + tz : ''), JSON.stringify(seq) === JSON.stringify(want), JSON.stringify([seq, want]));
    await ctx.close();
  }

  /* ---------- yearly trends ---------- */
  {
    const { ctx, pg, errs } = await open('expenses.html');
    await tab(pg, 'trends');
    const years = await pg.evaluate(() => [...document.querySelectorAll('#trend-years .yr-btn')].map(b => b.textContent + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')));
    const wantYears = [...new Set(Object.keys(SEED).map(k => k.slice(0, 4)).concat([String(Y)]))].sort().map(y => y + (+y === Y ? '*' : ''));
    check('the year buttons are the years in the store plus this year, this year pressed', JSON.stringify(years) === JSON.stringify(wantYears), JSON.stringify([years, wantYears]));
    const lab = async () => pg.evaluate(() => ({ inc: document.getElementById('trend-year-canvas').getAttribute('aria-label'), rate: document.getElementById('trend-rate-canvas').getAttribute('aria-label') }));
    let l = await lab();
    check('this year: income and expenses by month are the seed\'s', l.inc === 'Income and expenses by month, ' + Y + ': ' + incSeries(Y), l.inc);
    check('this year: savings rate by month is the seed\'s', l.rate === 'Savings rate by month, ' + Y + ': ' + rateSeries(Y), l.rate);
    await pg.click('#trend-years .yr-btn:text-is("' + (Y - 1) + '")');
    l = await lab();
    check('last year: -25% for a month spending more than it earned, 0% for a month with no income', l.rate === 'Savings rate by month, ' + (Y - 1) + ': ' + rateSeries(Y - 1) && /Mar -25%/.test(l.rate) && /Nov 0%/.test(l.rate), l.rate);
    check('last year: income and expenses by month are the seed\'s', l.inc === 'Income and expenses by month, ' + (Y - 1) + ': ' + incSeries(Y - 1), l.inc);
    check('the pressed year follows the click', await pg.evaluate((y) => document.querySelector('#trend-years .yr-btn.on').textContent === String(y), Y - 1));
    const painted = await pg.evaluate(() => ['trend-year-canvas', 'trend-rate-canvas'].map(id => { const c = document.getElementById(id), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; }));
    check('both charts actually draw something (not just a label)', painted.every(n => n > 200), painted);
    check('no page errors', errs.length === 0, JSON.stringify(errs));
    await ctx.close();
  }

  /* ---------- adding an entry through the real form shows up in the month view and the trends ---------- */
  {
    const { ctx, pg, errs } = await open('expenses.html', { store: SEED });
    const today = await pg.evaluate(() => document.getElementById('e-date').value);
    await pg.fill('#e-desc', 'Rent top-up'); await pg.fill('#e-amount', '77'); await pg.selectOption('#e-type', 'expense'); await pg.selectOption('#e-cat', 'housing');
    await pg.click('text=+ ADD TRANSACTION');
    await tab(pg, 'budget');
    const b = await bars(pg);
    const filedUnder = today.slice(0, 7), viewing = await pg.evaluate(() => viewMonth);
    check('an entry added in the form lands in the month it is dated and counts under its group', filedUnder !== viewing || b.HOUSING === 1500 + 77, JSON.stringify([today, viewing, b.HOUSING]));
    const stored = await pg.evaluate(() => JSON.parse(localStorage.getItem('omega_budget_months')));
    const row = (stored[filedUnder].expenses || []).find(x => x.desc === 'Rent top-up');
    check('it is written to the shared store in budget.html\'s shape (group in cat, fine category in sub)', !!row && row.cat === 'HOUSING' && row.amount === 77, JSON.stringify(row));
    await tab(pg, 'trends');
    const l = await pg.getAttribute('#trend-year-canvas', 'aria-label');
    check('and the yearly trend includes it', l.includes('Income and expenses by month, ' + Y), l.slice(0, 80));
    check('no page errors', errs.length === 0, JSON.stringify(errs));
    await ctx.close();
  }

  /* ---------- a hostile description never becomes markup (the largest-expense insight put it in innerHTML unescaped) ---------- */
  {
    const evil = { [curKey]: { income: [], expenses: [ex('OTHER', 999, curKey + '-01')] } };
    evil[curKey].expenses[0].desc = '<img src=x onerror="window.__pwned=1">EVIL';
    const { ctx, pg, errs } = await open('expenses.html', { store: evil });
    await tab(pg, 'science'); await pg.waitForTimeout(500);
    const r = await pg.evaluate(() => ({ pwned: window.__pwned === 1, imgs: document.querySelectorAll('#insight-grid img').length, text: document.getElementById('insight-grid').textContent }));
    check('a description with markup is shown as text, nothing executes, no <img> is created', !r.pwned && r.imgs === 0 && /EVIL/.test(r.text), JSON.stringify(r).slice(0, 200));
    check('no page errors', errs.length === 0, JSON.stringify(errs));
    await ctx.close();
  }

  /* ---------- a hostile store: markup in every stored field, junk rows, a junk month, a __proto__ key, year keys that are not years ---------- */
  {
    const X = '<img src=x onerror="window.__pwned=1">';
    // Built as an object and serialised with JSON.stringify (no hand-escaping). The own "__proto__" key can only come from JSON.parse, so it starts from a static literal.
    const hostile = JSON.parse('{"__proto__":{"expenses":[1],"income":[1]}}');
    hostile[curKey] = { income: [{ id: 'a', source: X, amount: '12.5', date: X }, null, 5, 'junk'],
      expenses: [{ id: X, cat: 'FOOD', desc: X, amount: X, date: X, sub: X, notes: X }, null, 5, 'junk'] };
    hostile['2026-10'] = 'junk'; hostile['abcd-01'] = { income: [{ amount: 1 }] }; hostile['99999-01'] = { income: [{ amount: 1 }] }; hostile['<b>-01'] = { income: [{ amount: 1 }] };
    const raw = JSON.stringify(hostile);
    if (!raw.includes('"__proto__"')) throw new Error('the hostile seed lost its own __proto__ key');
    const { ctx, pg, errs } = await open('expenses.html', { store: raw });
    for (const t of ['budget', 'trends', 'ledger', 'science', 'add']) { await tab(pg, t); await pg.waitForTimeout(250); }
    await tab(pg, 'budget');
    const k = await kpis(pg);
    check('hostile store: amounts are coerced to numbers (a markup amount counts as 0, "12.5" as 12.5), junk rows are skipped', JSON.stringify(k) === JSON.stringify(compact(['$13INCOME', '$0EXPENSES', '$13SURPLUS', '100%SAVINGS RATE'])), JSON.stringify(k));
    const r = await pg.evaluate(() => ({ pwned: window.__pwned === 1, imgs: document.querySelectorAll('img[src="x"]').length, years: [...document.querySelectorAll('#trend-years .yr-btn')].map(b => b.textContent), proto: Object.prototype.expenses === undefined && Object.prototype.income === undefined }));
    check('hostile store: nothing executes and no <img> is created on any tab (budget, trends, ledger, science, add)', !r.pwned && r.imgs === 0, JSON.stringify(r));
    check('hostile store: only four-digit years become year buttons, and Object.prototype is not polluted', r.years.every(y => /^\d{4}$/.test(y)) && r.proto, JSON.stringify(r));
    check('hostile store: no page errors', errs.length === 0, JSON.stringify(errs));
    await ctx.close();
  }

  /* ---------- members of the older ledger are still moved over, once ---------- */
  {
    const legacy = [{ id: 'L1', desc: 'Old rent', amount: 800, type: 'expense', cat: 'housing', date: curKey + '-04', recurring: 'none' }, { id: 'L2', desc: 'Old pay', amount: 2000, type: 'income', cat: 'other', date: curKey + '-01', recurring: 'none' }];
    const { ctx, pg, errs } = await open('expenses.html', { store: {}, targets: null, legacy });
    const st = await pg.evaluate(() => ({ legacy: localStorage.getItem('omega_expenses'), store: JSON.parse(localStorage.getItem('omega_budget_months') || '{}') }));
    const m = st.store[curKey] || { income: [], expenses: [] };
    check('legacy data is moved into the store and the old key removed', st.legacy === null && m.expenses.length === 1 && m.income.length === 1 && m.expenses[0].cat === 'HOUSING', JSON.stringify(st).slice(0, 200));
    await tab(pg, 'budget');
    check('and the month view shows it', (await kpis(pg))[0] === '$2,000INCOME' && (await kpis(pg))[1] === '$800EXPENSES', JSON.stringify(await kpis(pg)));
    check('no page errors', errs.length === 0, JSON.stringify(errs));
    await ctx.close();
  }

  /* ---------- keyboard and phone ---------- */
  {
    const { ctx, pg } = await open('expenses.html');
    await tab(pg, 'budget');
    await pg.focus('#mn-prev'); await pg.keyboard.press('Enter');
    check('the month buttons are real buttons: keyboard Enter steps the month', (await label(pg)) === labelOf(...prevKey.split('-').map(Number)), await label(pg));
    const names = await pg.evaluate(() => ['mn-prev', 'mn-next'].map(id => document.getElementById(id).getAttribute('aria-label')));
    check('and they have names for assistive technology', names.join() === 'Previous month,Next month', names);
    await ctx.close();
  }
  {
    const { ctx, pg } = await open('expenses.html', { viewport: { width: 375, height: 800 } });
    const o = [];
    for (const t of ['budget', 'trends']) { await tab(pg, t); await pg.waitForTimeout(300); o.push(await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth)); }
    check('375 px: the month view and the trends cause no horizontal overflow', o.every(v => v <= 1), o);
    await ctx.close();
  }

  /* ---------- the neighbours that pointed at the old page ---------- */
  {
    const { ctx, pg, errs } = await open('invest.html');
    const links = await pg.evaluate(() => [...document.querySelectorAll('a.card')].map(a => a.getAttribute('href')));
    check('the invest hub has one card for it and none for the retired page', links.filter(h => h === '/expenses.html').length === 1 && !links.includes('/budget.html'), JSON.stringify(links));
    await pg.waitForFunction(() => document.querySelector('[data-omega-vault-core]') && document.querySelector('[data-omega-vault-core]').textContent.length > 20, null, { timeout: 15000 }).catch(() => { });
    const v = await pg.evaluate(() => document.querySelector('[data-omega-vault-core]').textContent.replace(/\s+/g, ' '));
    check('the Vault summary shows one BUDGET & EXPENSES row with this month\'s in and out', /BUDGET & EXPENSES/.test(v) && !/\bBUDGET\b(?! &)/.test(v), v.slice(0, 300));
    check('no page errors', errs.length === 0, JSON.stringify(errs));
    await ctx.close();
  }
  {
    const legacy = [{ id: 'L1', desc: 'Old rent', amount: 800, type: 'expense', cat: 'housing', date: curKey + '-04' }];
    const { ctx, pg } = await open('invest.html', { store: {}, targets: null, legacy });
    await pg.waitForFunction(() => document.querySelector('[data-omega-vault-core]') && document.querySelector('[data-omega-vault-core]').textContent.length > 20, null, { timeout: 15000 }).catch(() => { });
    const v = await pg.evaluate(() => document.querySelector('[data-omega-vault-core]').textContent.replace(/\s+/g, ' '));
    check('a member whose ledger is not migrated yet is not shown as empty in the Vault', /\$800 out/.test(v), v.slice(0, 300));
    await ctx.close();
  }

  await browser.close();
  const bad = results.filter(r => !r.ok);
  results.forEach(r => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.ok ? '' : '  -> ' + r.detail)));
  console.log(`\n${results.length - bad.length}/${results.length} passed`);
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error('ERROR', e); process.exit(1); });
