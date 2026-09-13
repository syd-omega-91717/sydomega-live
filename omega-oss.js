/* ==========================================================================
   Ω SYD OMEGA 91717 — OPEN SOURCE LIBRARY MANAGER (omega-oss.js)
   
   Directive: "Identify opportunities to responsibly integrate mature
   open-source technologies where they provide clear value."
   
   Libraries integrated (all MIT/Apache licensed, CDN-loaded on demand):
   
   A. LUCIDE ICONS      — MIT. 1,400+ clean SVG icons. Replaces emoji/unicode.
      CDN: https://unpkg.com/lucide@1.37.0/dist/umd/lucide.min.js
      
   B. CHART.JS 4.x      — MIT. Lightweight chart library. Auth/lattice graphs.
      CDN: https://cdn.jsdelivr.net/npm/chart.js@4.5.1
      
   C. FUSE.JS 6.6.2     — Apache 2.0. Fuzzy search. Enhances omega-search.js.
      Vendored: /vendor/fuse.min.js. NOTE THE VERSION: this used to request
      fuse.js@7.5.0/dist/fuse.min.js, a file that DOES NOT EXIST in that
      package — 7.x dropped the UMD build entirely (its `jsdelivr` field
      points at dist/fuse.mjs, an ES module a classic <script> cannot take a
      global from). So the request 404'd and `Fuse` was never defined.
      6.6.2 is the last version shipping the UMD `Fuse` global this code is
      written against, and it serves every API used here.
      
   D. DAYJS             — MIT. Tiny date/time library. Formats timestamps.
      CDN: https://cdn.jsdelivr.net/npm/dayjs@1.11.23/dayjs.min.js
      
   E. MARKED.JS 12.0.2  — MIT. Markdown renderer for chatbot/agent responses.
      Vendored: /vendor/marked.min.js
      
   F. HIGHLIGHT.JS      — BSD. Code syntax highlighting. For lab/research pages.
      CDN: https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.12.0/build/highlight.min.js
   
   WHY SOME ARE VENDORED: a <script src> to a third-party CDN fails silently
   here — load() handles s.onerror with console.warn only, so the callback
   never fires and there is no rejected promise to notice. On top of that,
   vault.html carries its own Content-Security-Policy <meta> whose script-src
   omits cdn.jsdelivr.net and unpkg.com; a meta CSP is enforced ALONGSIDE the
   vercel.json header and the intersection wins, so every jsdelivr/unpkg
   library was refused outright on that page. /vendor/ is 'self' and
   satisfies both policies, so vendoring fixes the CSP divergence without
   weakening the stricter policy.

   Design: lazy-load each library only when first needed.
   Never block page load. Always provide fallbacks.
   ========================================================================== */
(function(){
  if(window.__omegaOSSActive) return;
  window.__omegaOSSActive = true;

  var _loaded = {};
  var _loading = {};

  /* ── LOADER CORE ──────────────────────────────────────────────── */
  function load(name, url, global, cb){
    if(_loaded[name]){ if(cb) cb(window[global]); return; }
    if(_loading[name]){ var old=_loading[name]; _loading[name]=function(){old&&old();if(cb)cb(window[global]);}; return; }
    _loading[name]=cb||null;
    var s=document.createElement('script');
    s.src=url;s.async=true;s.crossOrigin='anonymous';
    s.onload=function(){
      _loaded[name]=true;
      var fn=_loading[name];delete _loading[name];
      if(fn) fn(window[global]);
    };
    s.onerror=function(){
      console.warn('[OmegaOSS] Failed to load: '+name);
      delete _loading[name];
    };
    document.head.appendChild(s);
  }

  /* ── LIBRARY REGISTRY ─────────────────────────────────────────── */
  var LIBS = {
    lucide:    {url:'https://unpkg.com/lucide@1.37.0/dist/umd/lucide.min.js',global:'lucide'},
    /* SELF-HOSTED. This read
       https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js and
       silently produced nothing whenever that host was unreachable: load()
       below only console.warn()s on s.onerror, so the callback never fires,
       no chart is drawn, and the member is told nothing. Measured on
       dashboard.html with the CDN blocked -- #dash-radar stayed at the
       browser's default 300x150 with 0 painted pixels and window.Chart
       undefined, on the page that shows a member their own axis scores.
       Same class as the Supabase client (CLAUDE.md 4), the particle engine
       (FIXES_LOG 128) and Three.js (131). Vendored per the same recipe:
       `npm pack chart.js@<version>`, copy package/dist/chart.umd.min.js to
       vendor/. Self-contained UMD, defines the `Chart` global, MIT,
       ~208KB -- loaded lazily, so only the three pages that actually draw
       a chart (dashboard, analytics, studio) ever fetch it. */
    chartjs:   {url:'/vendor/chart.umd.min.js',global:'Chart'},
    fuse:      {url:'/vendor/fuse.min.js',global:'Fuse'},
    dayjs:        {url:'https://cdn.jsdelivr.net/npm/dayjs@1.11.23/dayjs.min.js',global:'dayjs'},
    dayjsRelTime: {url:'https://cdn.jsdelivr.net/npm/dayjs@1.11.23/plugin/relativeTime.min.js',global:'dayjs'},
    marked:    {url:'/vendor/marked.min.js',global:'marked'},
    hljs:      {url:'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.12.0/build/highlight.min.js',global:'hljs'},
    /* Tippy.js — MIT. Lightweight tooltip/popover library.
       REQUIRES @popperjs/core, and not merely to position well: the UMD
       bundle's global branch is `(t=t||self).tippy=e(t.Popper)`, so with no
       Popper on window it throws "Cannot read properties of undefined
       (reading 'applyStyles')" AT LOAD and never defines window.tippy at
       all. Measured both ways in Chromium. Hence the ordered pair below:
       popper first, then tippy — never tippy alone. */
    /* SELF-HOSTED, added 2026-09-13. graph.html and map.html each opened an
       async IIFE with a dynamic import of a CDN-hosted module, and that host
       is refused by vault.html's stricter script-src and unreachable from the
       verification sandbox. A rejected dynamic import
       aborts the whole IIFE, so NEITHER PAGE RAN ANY OF ITS OWN CODE --
       `d3.select is not a function` / `L.map is not a function` on every
       load, measured identically on HEAD and branch. Same class as the
       Supabase client, the particle engine and three.js.
       d3 ships no self-contained ESM build (`main` is src/index.js, which
       needs a bundler); its package `exports.umd` IS dist/d3.min.js, so the
       UMD global is the only form that works in a no-build repo. */
    d3:        {url:'/vendor/d3.min.js',global:'d3'},
    leaflet:   {url:'/vendor/leaflet.js',global:'L'},
    popper:    {url:'/vendor/popper.min.js',global:'Popper'},
    tippy:     {url:'/vendor/tippy-bundle.umd.min.js',global:'tippy'},
  };

  /* ── PUBLIC API ───────────────────────────────────────────────── */
  var OSS = {
    require: function(name, cb){
      var lib=LIBS[name];
      if(!lib){ console.warn('[OmegaOSS] Unknown library: '+name); return; }
      load(name,lib.url,lib.global,cb);
    },

    /* Render Lucide icons in the DOM */
    icons: function(){
      OSS.require('lucide',function(lucide){
        if(lucide&&lucide.createIcons) lucide.createIcons();
      });
    },

    /* Create a Chart.js chart */
    chart: function(canvas, config, cb){
      OSS.require('chartjs',function(Chart){
        if(!Chart||!canvas) return;
        /* Sovereign theme defaults */
        Chart.defaults.color='rgba(233,230,220,.6)';
        Chart.defaults.borderColor='rgba(201,168,76,.08)';
        Chart.defaults.backgroundColor='rgba(201,168,76,.08)';
        var chart=new Chart(canvas,config);
        if(cb) cb(chart);
      });
    },

    /* Enhanced fuzzy search using Fuse.js */
    fuzzySearch: function(items, query, keys, cb){
      OSS.require('fuse',function(Fuse){
        if(!Fuse){ /* fallback to basic search */ cb(items.filter(function(i){return JSON.stringify(i).toLowerCase().includes(query.toLowerCase());})); return; }
        var f=new Fuse(items,{keys:keys,threshold:.35,includeScore:true});
        cb(f.search(query).map(function(r){return r.item;}));
      });
    },

    /* Render markdown in an element */
    markdown: function(el, md){
      OSS.require('marked',function(marked){
        if(!marked||!el) return;
        el.innerHTML=marked.parse(md,{breaks:true,gfm:true});
        /* Apply sovereign styling to rendered markdown */
        el.querySelectorAll('code').forEach(function(c){
          c.style.cssText='font-family:var(--M,"Courier Prime",monospace);font-size:.85em;background:rgba(201,168,76,.08);padding:1px 5px;border-radius:2px;color:var(--solar,#E2C86D)';
        });
        el.querySelectorAll('a').forEach(function(a){
          a.style.color='var(--cyan,#00E5FF)';
        });
        el.querySelectorAll('h1,h2,h3').forEach(function(h){
          h.style.cssText='font-family:var(--D,"Cinzel Decorative",serif);color:var(--gold,#C9A84C);margin:12px 0 6px';
        });
        /* Syntax highlight code blocks */
        OSS.require('hljs',function(hljs){
          if(hljs) el.querySelectorAll('pre code').forEach(function(b){hljs.highlightElement(b);});
        });
      });
    },

    /* Friendly date formatting — uses dayjs+relativeTime when loaded, inline fallback */
    fromNow: function(dateStr){
      if(!dateStr) return '--';
      /* Fast path: dayjs already loaded and extended with relativeTime */
      try{
        if(window.dayjs && window.dayjs._omegaRtReady) return window.dayjs(dateStr).fromNow();
      }catch(e){}
      /* Not loaded yet -- start it now, for the NEXT call. This used to run
         eagerly at module scope, so every page fetched dayjs plus its
         relativeTime plugin (two third-party requests) whether or not it ever
         rendered a relative timestamp. The fallback below is synchronous and
         complete, so nothing is lost by waiting. */
      warmDayjs();
      /* Inline fallback (synchronous, always works) */
      var d=new Date(dateStr),now=new Date();
      var diff=Math.round((now-d)/1000);
      if(diff<60) return diff+'s ago';
      if(diff<3600) return Math.round(diff/60)+'m ago';
      if(diff<86400) return Math.round(diff/3600)+'h ago';
      if(diff<604800) return Math.round(diff/86400)+'d ago';
      return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase();
    },

    /* Chart presets for sovereign design */
    presets: {
      authLine: function(labels, data){
        return {
          type:'line',
          data:{labels:labels,datasets:[{label:'AUTH',data:data,borderColor:'#C9A84C',backgroundColor:'rgba(201,168,76,.06)',borderWidth:1.5,tension:.4,pointRadius:3,pointBackgroundColor:'#C9A84C'}]},
          options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:'rgba(201,168,76,.06)'}},y:{grid:{color:'rgba(201,168,76,.06)'},min:0,max:28}}}
        };
      },
      axisRadar: function(labels, data){
        return {
          type:'radar',
          data:{labels:labels,datasets:[{data:data,borderColor:'#00E5FF',backgroundColor:'rgba(0,229,255,.06)',borderWidth:1.5,pointBackgroundColor:'#00E5FF'}]},
          options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{r:{grid:{color:'rgba(201,168,76,.08)'},ticks:{display:false},pointLabels:{color:'rgba(233,230,220,.6)',font:{size:9}},min:0,max:9}}}
        };
      },
      barChart: function(labels, datasets){
        return {
          type:'bar',
          data:{labels:labels,datasets:datasets},
          options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'rgba(233,230,220,.5)',font:{size:9}}}},scales:{x:{grid:{color:'rgba(201,168,76,.04)'},ticks:{color:'rgba(138,134,118,.7)'}},y:{grid:{color:'rgba(201,168,76,.04)'},ticks:{color:'rgba(138,134,118,.7)'}}}}
        };
      }
    }
  };

  /* ── TOOLTIP API (Tippy.js) ──────────────────────────────────── */
  /* Usage: OmegaOSS.tooltip(el, 'content') or [data-tippy-content="..."] */
  OSS.tooltip = function(el, content, opts){
    OSS.require('popper', function(){
      OSS.require('tippy', function(tippy){
        if(!tippy||!el) return;
        tippy(el, Object.assign({
          content: content||'',
          theme: 'omega',
          animation: 'shift-away',
          placement: 'top',
          arrow: true,
          delay: [150, 0],
          maxWidth: 280,
          appendTo: document.body,
        }, opts||{}));
      });
    });
  };

  /* Batch-init all [data-tooltip] elements on the page */
  OSS.initTooltips = function(){
    OSS.require('popper', function(){
      OSS.require('tippy', function(tippy){
        if(!tippy) return;
        /* Inject sovereign tooltip theme CSS once */
        if(!document.getElementById('omega-tippy-css')){
          var s=document.createElement('style');
          s.id='omega-tippy-css';
          s.textContent=[
            '.tippy-box[data-theme~="omega"]{background:rgba(10,10,15,.97);border:1px solid rgba(201,168,76,.3);',
            'border-radius:3px;font-family:"Courier Prime",monospace;font-size:12px;letter-spacing:1px;',
            'color:#e9e6dc;box-shadow:0 8px 24px rgba(0,0,0,.5)}',
            '.tippy-box[data-theme~="omega"] .tippy-arrow{color:rgba(201,168,76,.3)}'
          ].join('');
          (document.head||document.documentElement).appendChild(s);
        }
        tippy('[data-tooltip]',{
          content: function(el){ return el.getAttribute('data-tooltip'); },
          theme: 'omega',
          animation: 'shift-away',
          placement: 'top',
          arrow: true,
          delay: [150, 0],
          maxWidth: 280,
          appendTo: document.body,
          allowHTML: false,
        });
      });
    });
  };

  /* ── DAYJS + RELATIVETIME ────────────────────────────────────── */
  /* Loaded on FIRST USE by OSS.fromNow(), not at module scope. Hoisted so
     fromNow() can call it above. Guarded so concurrent calls load once. */
  var _dayjsWarming = false;
  function warmDayjs(){
    if(_dayjsWarming) return;
    _dayjsWarming = true;
    OSS.require('dayjs', function(){
    /* CDN plugin file sets window.dayjs_plugin_relativeTime */
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/dayjs@1.11.23/plugin/relativeTime.min.js';
    s.async = true;
    s.onload = function(){
      try{
        if(window.dayjs && window.dayjs_plugin_relativeTime){
          window.dayjs.extend(window.dayjs_plugin_relativeTime);
          window.dayjs._omegaRtReady = true;
        }
      }catch(e){}
    };
    document.head.appendChild(s);
    });
  }

  /* ── AUTO-INIT LUCIDE ICONS ───────────────────────────────────── */
  window.addEventListener('load',function(){
    if(document.querySelector('[data-lucide]')) OSS.icons();
    if(document.querySelector('[data-tooltip]')) OSS.initTooltips();
  });
  document.addEventListener('omega:populated',function(){
    if(document.querySelector('[data-lucide]')) OSS.icons();
    if(document.querySelector('[data-tooltip]')) OSS.initTooltips();
  });

  window.OmegaOSS = OSS;
})();
