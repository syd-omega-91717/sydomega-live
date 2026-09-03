/* Shared Playwright session setup for sydomega-live.
   Every scanner in this harness imports from here, so the gotchas that
   silently invalidate a run live in exactly one place.

   Usage:
     const { launch, PAGES, ROOT } = require('./session.js');
     const { browser, ctx } = await launch({ width: 375, mobile: true });
*/
const path = require('path');
const { execSync } = require('child_process');

const ROOT = '/home/user/sydomega-live';
const ORIGIN = 'http://localhost:8765';
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

/* Playwright is not a dependency of this repo (no build step, no
   package.json deps) -- it is installed into the agent's scratchpad. Resolve
   it from there, falling back to a normal require so this also works if a
   future session installs it elsewhere. */
function loadPlaywright(scratchpad) {
  const tries = [
    scratchpad && path.join(scratchpad, 'node_modules', 'playwright'),
    'playwright'
  ].filter(Boolean);
  for (const t of tries) { try { return require(t); } catch (e) { } }
  throw new Error('playwright not found. Install it into the scratchpad first:\n' +
    '  cd <scratchpad> && npm i playwright   (PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 is already set)');
}

const { STUB } = require('./sbstub.js');

/* Every .html in the repo root, which is every page -- there is no src/. */
function allPages() {
  return execSync(`ls ${ROOT}/*.html`, { encoding: 'utf8' })
    .trim().split('\n').map(p => p.split('/').pop());
}

/* Chrome that is already past every first-run gate. Each key here was found
   the hard way, by a click timing out behind a full-viewport overlay:
     omega_demo_watched_at -- omega-demo-video.js opens a modal covering the
                              whole viewport for any eligible unwatched member
     omega_consent_v1      -- omega-legal.js cookie banner, sits over the
                              bottom-of-screen chrome
     omega_last_gate       -- omega-sdt.js fires a 4.5s full-screen GATE
                              UNLOCKED celebration on first load
   #omega-genesis (bg.js) is a z-index 100000 intro overlay that is NOT
   localStorage-gated -- remove it from the DOM after load instead, see
   dismissOverlays(). */
const PRIMED_STORAGE = {
  omega_demo_watched_at: '2026-01-01T00:00:00Z',
  omega_consent_v1: 'all',
  omega_last_gate: '99'
};

async function launch(opts = {}) {
  const {
    width = 1280, height = 700, mobile = false, scratchpad = process.env.OMEGA_SCRATCHPAD,
    /* Map of filename -> source, served instead of the working-tree copy.
       Use with gitShow() for a real A/B against a previous commit. */
    pin = null,
    signedIn = true
  } = opts;
  const { chromium } = loadPlaywright(scratchpad);
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({
    /* sw.js proxies fetches and slips straight past ctx.route(), so a stubbed
       esm.sh silently is not stubbed and every module import fails. */
    serviceWorkers: 'block',
    viewport: { width, height },
    isMobile: mobile, hasTouch: mobile,
    deviceScaleFactor: mobile ? 2 : 1
  });

  /* Every gated page imports the Supabase client at the top of a module
     script -- and when a module's top-level import fails, NONE of that
     module's code runs. Without a stub a scan reports every window.-exposed
     function in every module as "missing", which is the single most
     misleading failure mode in this repo's tooling history.

     The import target is now `/vendor/supabase-js.js`, self-hosted, because
     a third-party CDN on the critical path of all 179 pages was producing
     exactly that never-resolving state in production (see the file header).
     So the stub is routed at the LOCAL path: serving the real vendored
     bundle here would make every page try to reach supabase.co, which the
     sandbox denies, and the approval guard would then never lift.

     esm.sh stays stubbed for the other libraries still loaded from it
     (tsparticles, tone, jspdf, ...). */
  if (signedIn) {
    await ctx.route('**/vendor/supabase-js.js', r =>
      r.fulfill({ status: 200, contentType: 'text/javascript', body: STUB }));
    await ctx.route('https://esm.sh/**', r =>
      r.fulfill({ status: 200, contentType: 'text/javascript', body: STUB }));
  }
  /* Webfonts are stubbed with an EMPTY stylesheet by default, so scans stay
     deterministic and offline. The cost is invisible and was: every screenshot
     this harness has ever produced showed the browser's fallback serif/sans,
     NOT Cinzel Decorative / Rajdhani / Courier Prime. Measured on
     dashboard.html -- `"Cinzel Decorative",serif` and bare `serif` rendered the
     same string at an identical 589px, and `document.fonts.size` was 0.

     That is fine for a correctness scan and WRONG for judging visual design:
     type is most of the brand. Pass `webfonts: true` to let the real faces
     load, and use it for any screenshot a design decision rests on. It needs
     network, so never enable it in a check that must run offline. */
  if (!opts.webfonts) {
    await ctx.route('https://fonts.googleapis.com/**', r =>
      r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('https://fonts.gstatic.com/**', r => r.fulfill({ status: 200, body: '' }));
  }

  if (pin) {
    /* Content type must follow the extension. Serving a pinned .html as
       text/javascript makes the browser refuse to parse it as a document, and
       the "before" run then reports every element as absent -- which looks
       exactly like a dramatic improvement and is not one. */
    const TYPES = {
      '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
      '.css': 'text/css', '.svg': 'image/svg+xml'
    };
    for (const [file, body] of Object.entries(pin)) {
      const ext = file.slice(file.lastIndexOf('.'));
      const contentType = TYPES[ext] || 'text/plain';
      await ctx.route('**/' + file, r => r.fulfill({ status: 200, contentType, body }));
    }
  }

  if (signedIn) {
    await ctx.addInitScript(store => {
      try { Object.entries(store).forEach(([k, v]) => localStorage.setItem(k, v)); } catch (e) { }
    }, PRIMED_STORAGE);
  }
  return { browser, ctx };
}

/* Read a file as it was at some commit, for pinning a real BEFORE.
   Do NOT use `git stash` for this: once the change is committed there is
   nothing to stash, and the "BEFORE" run silently executes the fixed code. */
function gitShow(rev, files) {
  const out = {};
  files.forEach(f => {
    out[f] = execSync(`git -C ${ROOT} show ${rev}:${f}`, { encoding: 'utf8', maxBuffer: 1 << 24 });
  });
  return out;
}

/* bg.js's genesis intro is z-index 100000 over the whole viewport and is not
   storage-gated. Any click or hit-test before this runs measures the overlay,
   not the page. */
async function dismissOverlays(page) {
  await page.evaluate(() => {
    ['omega-genesis', 'omg-demo-overlay', 'omega-gate-celebrate', 'omega-consent']
      .forEach(id => { const e = document.getElementById(id); if (e) e.remove(); });
  });
}

async function open(ctx, file, opts = {}) {
  const { settle = 1800 } = opts;
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message || e).slice(0, 200)));
  await page.goto(ORIGIN + '/' + file, { waitUntil: 'load', timeout: 40000 });
  await page.waitForTimeout(settle);
  await dismissOverlays(page);
  page.__errors = errors;
  return page;
}

/* Run fn(page, file) over many pages with bounded concurrency. */
async function each(ctx, files, fn, concurrency = 6) {
  const queue = files.slice(), out = [];
  async function worker() {
    while (queue.length) {
      const f = queue.shift();
      let page;
      try {
        page = await open(ctx, f);
        out.push({ file: f, errors: page.__errors, result: await fn(page, f) });
      } catch (e) {
        out.push({ file: f, errors: page ? page.__errors : [], error: String(e.message).slice(0, 160) });
      }
      if (page) await page.close();
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return out;
}

/* Is this element the topmost thing at its own centre? Geometry alone does not
   prove a control is usable -- this repo has six fixed widgets competing for
   the bottom-right corner. */
const REACHABLE = `(el) => {
  const b = el.getBoundingClientRect();
  if (!b.width || !b.height) return false;
  const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
  return !!(hit && (hit === el || el.contains(hit)));
}`;

module.exports = { launch, open, each, allPages, gitShow, dismissOverlays,
  ROOT, ORIGIN, CHROME, PRIMED_STORAGE, REACHABLE };
