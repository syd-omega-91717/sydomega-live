/* ==========================================================================
   Ω SYD OMEGA 91717 — OPEN SOURCE LIBRARY MANAGER (omega-oss.js)
   
   Directive: "Identify opportunities to responsibly integrate mature
   open-source technologies where they provide clear value."
   
   Libraries integrated (all MIT/Apache licensed, CDN-loaded on demand):
   
   A. LUCIDE ICONS      — MIT. 1,400+ clean SVG icons. Replaces emoji/unicode.
      CDN: https://unpkg.com/lucide@latest/dist/umd/lucide.min.js
      
   B. CHART.JS 4.x      — MIT. Lightweight chart library. Auth/lattice graphs.
      CDN: https://cdn.jsdelivr.net/npm/chart.js@4
      
   C. FUSE.JS 7.x       — Apache 2.0. Fuzzy search. Enhances omega-search.js.
      CDN: https://cdn.jsdelivr.net/npm/fuse.js@7/dist/fuse.min.js
      
   D. DAYJS             — MIT. Tiny date/time library. Formats timestamps.
      CDN: https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js
      
   E. MARKED.JS         — MIT. Markdown renderer for chatbot/agent responses.
      CDN: https://cdn.jsdelivr.net/npm/marked@12/marked.min.js
      
   F. HIGHLIGHT.JS      — BSD. Code syntax highlighting. For lab/research pages.
      CDN: https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11/build/highlight.min.js
   
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
    lucide:    {url:'https://unpkg.com/lucide@latest/dist/umd/lucide.min.js',global:'lucide'},
    chartjs:   {url:'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js',global:'Chart'},
    fuse:      {url:'https://cdn.jsdelivr.net/npm/fuse.js@7/dist/fuse.min.js',global:'Fuse'},
    dayjs:     {url:'https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js',global:'dayjs'},
    marked:    {url:'https://cdn.jsdelivr.net/npm/marked@12/marked.min.js',global:'marked'},
    hljs:      {url:'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11/build/highlight.min.js',global:'hljs'},
    /* Tippy.js — MIT. Lightweight tooltip/popover library (8KB gzip).
       Requires @popperjs/core. Lazy-loaded pair: popper first, then tippy. */
    popper:    {url:'https://cdn.jsdelivr.net/npm/@popperjs/core@2/dist/umd/popper.min.js',global:'Popper'},
    tippy:     {url:'https://cdn.jsdelivr.net/npm/tippy.js@6/dist/tippy-bundle.umd.min.js',global:'tippy'},
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

    /* Friendly date formatting */
    fromNow: function(dateStr){
      if(!dateStr) return '--';
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
            'border-radius:3px;font-family:"Courier Prime",monospace;font-size:10px;letter-spacing:1px;',
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
