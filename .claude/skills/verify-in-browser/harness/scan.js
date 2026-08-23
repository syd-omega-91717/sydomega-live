#!/usr/bin/env node
/* Repo-wide scanners for sydomega-live. One file, several modes, all built on
   session.js so the harness gotchas are handled once.

   Usage:
     node scan.js errors      # uncaught throws, unhandled rejections, 404s
     node scan.js taps        # controls under the 24x24 CSS-px touch floor @375
     node scan.js overflow    # pages that scroll horizontally @375
     node scan.js dupids      # duplicate element ids in the LIVE dom
     node scan.js chrome      # fixed bottom-of-viewport widgets and collisions
     node scan.js handlers    # inline onclick= naming a function that does not exist

   Add PAGES=a.html,b.html to limit the sweep. Requires serve.js running on 8765.
*/
const S = require('./session.js');

const MODE = process.argv[2] || 'errors';
const only = process.env.PAGES ? process.env.PAGES.split(',') : null;

const MODES = {
  /* Real page errors. Note d3 / Leaflet / three.js come from CDNs the sandbox
     blocks, so graph.html, map.html and realm.html throw here but not in
     production -- treat those three as expected, not findings. */
  errors: {
    mobile: false,
    collect: async page => {
      const rejections = await page.evaluate(() => window.__rej || []);
      return { rejections };
    },
    init: ctx => ctx.addInitScript(() => {
      window.__rej = [];
      window.addEventListener('unhandledrejection', e => {
        try { window.__rej.push(String((e.reason && e.reason.message) || e.reason).slice(0, 200)); } catch (x) { }
      });
    }),
    report: rows => {
      const bad = rows.filter(r => (r.errors || []).length || (r.result && r.result.rejections.length));
      console.log(`pages: ${rows.length} | pages with uncaught errors or rejections: ${bad.length}`);
      bad.forEach(r => console.log(`  ${r.file.padEnd(26)} ${JSON.stringify((r.errors || []).concat(r.result ? r.result.rejections : []).slice(0, 3))}`));
    }
  },

  taps: {
    mobile: true, width: 375, height: 667,
    collect: page => page.evaluate(() => {
      const sel = 'a[href],button,input:not([type=hidden]),select,textarea,[role=button],[onclick]';
      const small = [];
      document.querySelectorAll(sel).forEach(e => {
        const cs = getComputedStyle(e);
        if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return;
        const b = e.getBoundingClientRect();
        if (!b.width || !b.height) return;
        if (b.width >= 24 && b.height >= 24) return;
        small.push(e.tagName.toLowerCase() + (e.className && typeof e.className === 'string'
          ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : ''));
      });
      return small;
    }),
    report: rows => {
      const total = rows.reduce((a, r) => a + (r.result ? r.result.length : 0), 0);
      console.log(`controls under 24x24 CSS px at 375: ${total} across ${rows.filter(r => r.result && r.result.length).length} pages`);
      const agg = {};
      rows.forEach(r => (r.result || []).forEach(s => { agg[s] = (agg[s] || 0) + 1; }));
      Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 20)
        .forEach(([k, v]) => console.log(`  ${String(v).padStart(6)}  ${k}`));
    }
  },

  overflow: {
    mobile: true, width: 375, height: 667,
    collect: page => page.evaluate(() => {
      const de = document.documentElement, vw = de.clientWidth;
      const over = de.scrollWidth - vw;
      if (over <= 1) return { over: 0, who: [] };
      const who = [];
      document.querySelectorAll('body *').forEach(e => {
        const cs = getComputedStyle(e);
        if (cs.position === 'fixed' || cs.display === 'none') return;
        const b = e.getBoundingClientRect();
        if (b.width && b.right > vw + 1) {
          who.push(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + ' (' + Math.round(b.width) + 'w)');
        }
      });
      return { over, who: who.slice(0, 4) };
    }),
    /* NOTE: this cannot see an element centred with translateX(-50%) that
       overflows to the LEFT -- that never grows scrollWidth. Use `chrome`
       mode for fixed, centred widgets. */
    report: rows => {
      const bad = rows.filter(r => r.result && r.result.over > 1);
      console.log(`pages scrolling horizontally at 375px: ${bad.length}/${rows.length}`);
      bad.sort((a, b) => b.result.over - a.result.over).slice(0, 25)
        .forEach(r => console.log(`  +${String(r.result.over).padStart(5)}px  ${r.file.padEnd(24)} ${r.result.who.join(' | ').slice(0, 90)}`));
    }
  },

  dupids: {
    collect: page => page.evaluate(() => {
      const seen = {}, dup = {};
      document.querySelectorAll('[id]').forEach(e => {
        if (!e.id) return;
        if (seen[e.id]) dup[e.id] = (dup[e.id] || 1) + 1; else seen[e.id] = 1;
      });
      /* A duplicate only matters if something resolves it. */
      return Object.keys(dup).map(id => {
        const uses = [];
        ['for', 'aria-labelledby', 'aria-describedby', 'aria-controls'].forEach(a => {
          if (document.querySelector(`[${a}~="${id}"],[${a}="${id}"]`)) uses.push(a);
        });
        if (document.querySelector(`[href="#${CSS.escape(id)}"]`)) uses.push('href');
        return { id, n: dup[id], uses };
      });
    }),
    report: rows => {
      const all = rows.flatMap(r => (r.result || []).map(d => ({ ...d, file: r.file })));
      const used = all.filter(d => d.uses.length);
      console.log(`duplicated ids: ${all.length} on ${rows.filter(r => r.result && r.result.length).length} pages | referenced by something: ${used.length}`);
      used.forEach(d => console.log(`  ${d.file} #${d.id} x${d.n} <- ${d.uses.join(',')}`));
      all.filter(d => !d.uses.length).slice(0, 12)
        .forEach(d => console.log(`  (unreferenced) ${d.file} #${d.id} x${d.n}`));
    }
  },

  chrome: {
    mobile: true, width: 375, height: 667,
    collect: page => page.evaluate(() => {
      const vh = window.innerHeight, out = [];
      document.querySelectorAll('body > *').forEach(e => {
        const cs = getComputedStyle(e);
        if (cs.position !== 'fixed' || cs.display === 'none') return;
        const b = e.getBoundingClientRect();
        if (!b.height || b.bottom < vh - 200) return;
        if (b.height > vh * 0.9) return;          // full-screen overlays are not "chrome"
        /* A closed drawer parks itself below the fold on purpose. Reporting it
           as COVERED is noise, not a finding. */
        if (b.top >= vh || b.bottom <= 0) return;
        const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        out.push({
          id: e.id || e.className || e.tagName, z: cs.zIndex,
          box: `x ${Math.round(b.left)}..${Math.round(b.right)} y ${Math.round(b.top)}..${Math.round(b.bottom)}`,
          clipped: b.left < -1 || b.right > document.documentElement.clientWidth + 1,
          covered: !(hit && (hit === e || e.contains(hit)))
        });
      });
      return out;
    }),
    report: rows => {
      const sample = rows.find(r => r.result && r.result.length > 1) || rows[0];
      console.log(`fixed bottom chrome, sampled on ${sample.file}:`);
      (sample.result || []).forEach(w =>
        console.log(`  ${String(w.id).padEnd(24)} ${w.box.padEnd(34)} z=${String(w.z).padEnd(6)}` +
          `${w.clipped ? ' CLIPPED' : ''}${w.covered ? ' COVERED' : ''}`));
      const broken = rows.filter(r => (r.result || []).some(w => w.clipped || w.covered));
      console.log(`pages with a clipped or covered fixed widget: ${broken.length}/${rows.length}`);
    }
  },

  /* Web Interface Guidelines checks, restricted to the rules that actually
     apply to this stack. The upstream list (vercel-labs/web-interface-
     guidelines) is largely React/Next/Tailwind -- `focus-visible:ring-*`,
     `htmlFor`, `spellCheck={false}`, nuqs, `priority` -- none of which exist
     here. These are the vanilla-HTML ones, checked at RUNTIME rather than by
     grepping source, because grepping source got three of them wrong: it
     reported <meta theme-color> missing on 121 pages (bg.js injects it, so
     172/173 have it live) and 131 bare `outline:none` (a global
     :focus-visible rule replaces them on 172/173). */
  guidelines: {
    collect: page => page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      const out = { url: location.pathname.replace(/^\//, ''), issues: [] };
      if (cs.colorScheme !== 'dark') out.issues.push('color-scheme not dark (native selects/scrollbars render light)');
      if (!document.querySelector('meta[name="theme-color"]')) out.issues.push('no <meta name="theme-color">');
      const vp = document.querySelector('meta[name="viewport"]');
      if (vp && /user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(?!\d)/.test(vp.content || ''))
        out.issues.push('viewport disables zoom');
      let imgNoDim = 0, imgNoAlt = 0;
      document.querySelectorAll('img').forEach(im => {
        if (!im.getAttribute('alt') && im.getAttribute('alt') !== '') imgNoAlt++;
        if (!im.getAttribute('width') || !im.getAttribute('height')) imgNoDim++;
      });
      if (imgNoAlt) out.issues.push(imgNoAlt + ' <img> without alt');
      if (imgNoDim) out.issues.push(imgNoDim + ' <img> without width/height (CLS)');
      /* Controls with no accessible name. The first version of this rule
         flagged any control whose text was under 3 characters, which is
         wrong: a button reading "7" announces as "7" and is perfectly named.
         Flag only a control that is genuinely nameless -- empty text -- or one
         whose entire label is a symbol glyph with no letter or digit in it
         (an unlabelled "✕" or "◀" announces as a glyph name or not at all). */
      let iconNoName = 0;
      document.querySelectorAll('button,[role=button]').forEach(b => {
        if (b.getAttribute('aria-label') || b.getAttribute('aria-labelledby') || b.getAttribute('title')) return;
        const t = (b.textContent || '').trim();
        if (t && /[\p{L}\p{N}]/u.test(t)) return;      // has real text: named
        const r = b.getBoundingClientRect();
        if (r.width && r.height) iconNoName++;
      });
      if (iconNoName) out.issues.push(iconNoName + ' icon-only control(s) with no accessible name');
      /* transition:all is not compositor-friendly and animates properties
         nobody intended. Counted on rendered elements, not in source. */
      let transAll = 0;
      document.querySelectorAll('body *').forEach(e => {
        const p = getComputedStyle(e).transitionProperty;
        if (p === 'all') transAll++;
      });
      if (transAll > 0) out.issues.push(transAll + ' element(s) with transition-property:all');
      return out;
    }),
    report: rows => {
      const seen = new Map();
      rows.forEach(r => { if (r.result) seen.set(r.result.url, r.result); });
      const v = [...seen.values()];
      const agg = {};
      v.forEach(pg => pg.issues.forEach(i => {
        const key = i.replace(/^\d+/, 'N');
        (agg[key] = agg[key] || []).push(pg.url);
      }));
      console.log(`distinct pages rendered: ${v.length}`);
      console.log(`pages fully clean: ${v.filter(x => !x.issues.length).length}`);
      Object.entries(agg).sort((a, b) => b[1].length - a[1].length).forEach(([k, pages]) =>
        console.log(`  ${String(pages.length).padStart(4)} pages  ${k}   e.g. ${pages.slice(0, 3).join(', ')}`));
    }
  },

  /* A canvas whose drawing buffer is 0 can never paint, no matter how big its
     CSS box is. This happens when a page sizes its canvas from offsetWidth at
     DOMContentLoaded -- which is before bg.js's approval guard reveals #app,
     so it measures 0 -- and only re-sizes on a window resize event that the
     reveal never fires. It killed the largest element on the dashboard.
     IGNORE #omega-particles-canvas here: omega-particles.js hands its canvas
     to tsParticles from a CDN the sandbox blocks, so it correctly sits at the
     300x150 default with opacity 0 and would work in production. */
  canvas: {
    collect: page => page.evaluate(() => {
      const out = [];
      document.querySelectorAll('canvas').forEach(cv => {
        if (cv.id === 'omega-particles-canvas') return;
        const cs = getComputedStyle(cv);
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        const b = cv.getBoundingClientRect();
        if (b.width < 2 || b.height < 2) return;
        let painted = 0, err = false;
        try {
          const g = cv.getContext('2d');
          if (g && cv.width && cv.height) {
            const d = g.getImageData(0, 0, cv.width, cv.height).data;
            for (let i = 3; i < d.length; i += 4) if (d[i] > 8) { painted++; if (painted > 40) break; }
          }
        } catch (e) { err = true; }        // WebGL / tainted: not a 2d canvas
        if (err) return;
        out.push({
          id: cv.id || cv.className || 'canvas',
          buffer: cv.width + 'x' + cv.height,
          css: Math.round(b.width) + 'x' + Math.round(b.height),
          zero: cv.width === 0 || cv.height === 0,
          blank: cv.width > 0 && cv.height > 0 && painted === 0
        });
      });
      return { url: location.pathname.replace(/^\//, ''), canvases: out };
    }),
    report: rows => {
      /* Dedupe by the page actually landed on: account/pending/terms redirect
         a signed-in member to the dashboard, so the requested filename is not
         the page that was measured. Reporting per requested file turns one
         real bug into six phantom ones. */
      const seen = new Map();
      rows.forEach(r => { if (r.result) seen.set(r.result.url, r.result); });
      const zero = [], blank = [];
      [...seen.values()].forEach(pg => pg.canvases.forEach(c => {
        if (c.zero) zero.push(`${pg.url} #${c.id} buffer=${c.buffer} css=${c.css}`);
        else if (c.blank) blank.push(`${pg.url} #${c.id} ${c.buffer}`);
      }));
      console.log(`distinct pages rendered: ${seen.size}`);
      console.log(`canvases that can NEVER paint (zero drawing buffer): ${zero.length}`);
      zero.forEach(z => console.log('  ' + z));
      console.log(`canvases sized but painting nothing: ${blank.length}`);
      blank.slice(0, 20).forEach(z => console.log('  ' + z));
    }
  },

  /* Inline onclick= that names a function declared only inside a
     <script type="module"> and never put on window. Module top-level
     declarations are not global, so the click throws silently. */
  handlers: {
    collect: page => page.evaluate(() => {
      const missing = [];
      const ATTRS = ['onclick', 'onchange', 'oninput', 'onsubmit'];
      document.querySelectorAll('*').forEach(e => {
        ATTRS.forEach(a => {
          const v = e.getAttribute && e.getAttribute(a);
          if (!v) return;
          /* Only a BARE call can resolve against window. `e.stopPropagation()`
             and `document.getElementById()` are method calls on some object and
             say nothing about globals -- the (^|[^.\w$]) guard rejects them,
             which is what separates this from a scanner that cries wolf. */
          const m = v.match(/(?:^|[^.\w$])([A-Za-z_$][\w$]*)\s*\(/);
          if (!m) return;
          const name = m[1];
          if (['alert', 'confirm', 'prompt', 'return', 'if', 'typeof', 'this',
            'Number', 'String', 'Boolean', 'Array', 'Object', 'JSON', 'Math',
            'parseInt', 'parseFloat', 'encodeURIComponent', 'decodeURIComponent'
          ].includes(name)) return;
          if (typeof window[name] !== 'function' && !missing.includes(name)) missing.push(name);
        });
      });
      return missing;
    }),
    report: rows => {
      const bad = rows.filter(r => r.result && r.result.length);
      console.log(`pages with an inline handler naming a non-existent function: ${bad.length}/${rows.length}`);
      bad.forEach(r => console.log(`  ${r.file.padEnd(26)} ${r.result.join(', ')}`));
    }
  }
};

(async () => {
  const m = MODES[MODE];
  if (!m) { console.error('unknown mode: ' + MODE + '\nmodes: ' + Object.keys(MODES).join(', ')); process.exit(1); }
  const { browser, ctx } = await S.launch({
    width: m.width || 1280, height: m.height || 700, mobile: !!m.mobile
  });
  if (m.init) await m.init(ctx);
  const files = only || S.allPages();
  const rows = await S.each(ctx, files, m.collect);
  await browser.close();
  m.report(rows);
})();
