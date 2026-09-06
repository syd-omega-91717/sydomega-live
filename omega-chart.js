/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN CHART SYSTEM (omega-chart.js)
   Chart.js 4 integration via OmegaOSS — sovereign theme, responsive, SSR-safe.

   AUTO-MOUNT: Any element with [data-omega-chart] is auto-mounted on load.

   [data-omega-chart="line"]        — line chart
   [data-omega-chart="bar"]         — bar chart
   [data-omega-chart="radar"]       — radar/axis chart
   [data-omega-chart="doughnut"]    — doughnut chart
   [data-omega-chart="auth"]        — special: live authority history (Supabase)
   [data-omega-chart="axis-radar"]  — special: live axis A/B/C radar (Supabase)

   Additional attrs:
   [data-chart-labels="Jan,Feb,Mar"]
   [data-chart-data="10,20,30"]
   [data-chart-color="gold|cyan|green|purple|crim"]
   [data-chart-height="200"]         — pixel height (default: 180)
   [data-chart-uid]                  — for live charts: member user_id (auto from session)

   Programmatic API:
     OmegaChart.line(canvas, labels, data, opts)
     OmegaChart.bar(canvas, labels, datasets, opts)
     OmegaChart.radar(canvas, labels, data, opts)
     OmegaChart.doughnut(canvas, labels, data, opts)
     OmegaChart.auth(canvas, uid)      — authority history from Supabase
     OmegaChart.axisRadar(canvas, uid) — A/B/C radar from Supabase
   ========================================================================== */
(function(){
  'use strict';
  if(window.__omegaChartActive) return;
  window.__omegaChartActive = true;

  var COLOR = {
    gold:   { line:'#C9A84C', bg:'rgba(201,168,76,.08)',  point:'#C9A84C' },
    solar:  { line:'#E2C86D', bg:'rgba(226,200,109,.08)', point:'#E2C86D' },
    cyan:   { line:'#00E5FF', bg:'rgba(0,229,255,.06)',   point:'#00E5FF' },
    green:  { line:'#3fb27f', bg:'rgba(63,178,127,.06)',  point:'#3fb27f' },
    purple: { line:'#9B6BF0', bg:'rgba(155,107,240,.07)', point:'#9B6BF0' },
    crim:   { line:'#C4453C', bg:'rgba(139,0,0,.07)',     point:'#C4453C' },
  };

  function resolveColor(name){ return COLOR[name] || COLOR.gold; }

  /* Shared Chart.js defaults applied once */
  var _defaultsSet = false;
  function applyDefaults(Chart){
    if(_defaultsSet) return; _defaultsSet = true;
    Chart.defaults.color                = 'rgba(233,230,220,.55)';
    Chart.defaults.borderColor          = 'rgba(201,168,76,.07)';
    Chart.defaults.backgroundColor      = 'rgba(201,168,76,.07)';
    Chart.defaults.font.family          = '"Courier Prime",monospace';
    Chart.defaults.font.size            = 9;
    Chart.defaults.plugins.legend.display = false;
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(2,2,6,.95)';
    Chart.defaults.plugins.tooltip.borderColor      = 'rgba(201,168,76,.3)';
    Chart.defaults.plugins.tooltip.borderWidth      = 1;
    Chart.defaults.plugins.tooltip.titleColor       = '#C9A84C';
    Chart.defaults.plugins.tooltip.bodyColor        = 'rgba(233,230,220,.75)';
    Chart.defaults.plugins.tooltip.padding          = 10;
  }

  var GRID_OPTS = {
    color: 'rgba(201,168,76,.06)',
    drawBorder: false,
  };

  /* ── BUILDERS ──────────────────────────────────────────────────────── */
  function require(cb){
    if(!window.OmegaOSS){ console.warn('[OmegaChart] OmegaOSS not ready'); return; }
    window.OmegaOSS.require('chartjs', function(Chart){
      if(!Chart){ console.warn('[OmegaChart] Chart.js unavailable'); return; }
      applyDefaults(Chart);
      cb(Chart);
    });
  }

  var API = {};

  API.line = function(canvas, labels, data, opts){
    opts = opts || {};
    var col = resolveColor(opts.color||'gold');
    require(function(Chart){
      if(canvas._omegaChart) canvas._omegaChart.destroy();
      canvas._omegaChart = new Chart(canvas, {
        type: 'line',
        data: {
          labels: labels,
          datasets:[{
            data: data,
            borderColor: col.line,
            backgroundColor: col.bg,
            borderWidth: 1.5,
            tension: opts.tension != null ? opts.tension : 0.4,
            pointRadius: opts.points != null ? opts.points : 3,
            pointBackgroundColor: col.point,
            fill: opts.fill !== false,
          }]
        },
        options:{
          responsive: true,
          maintainAspectRatio: false,
          plugins:{ legend:{display:false} },
          scales:{
            x:{ grid: GRID_OPTS, ticks:{maxTicksLimit:6,maxRotation:0} },
            y:{ grid: GRID_OPTS, beginAtZero: opts.beginAtZero !== false,
                min: opts.min, max: opts.max }
          }
        }
      });
    });
  };

  API.bar = function(canvas, labels, datasets, opts){
    opts = opts || {};
    require(function(Chart){
      if(canvas._omegaChart) canvas._omegaChart.destroy();
      /* Ensure each dataset has sovereign colors */
      datasets = datasets.map(function(ds, i){
        var keys = Object.keys(COLOR);
        var col = resolveColor(ds.color || keys[i % keys.length]);
        return Object.assign({ backgroundColor: col.bg, borderColor: col.line, borderWidth: 1 }, ds);
      });
      canvas._omegaChart = new Chart(canvas, {
        type: 'bar',
        data: { labels: labels, datasets: datasets },
        options:{
          responsive: true, maintainAspectRatio: false,
          plugins:{ legend:{ display: datasets.length > 1, labels:{boxWidth:10,padding:12} } },
          scales:{
            x:{ grid: GRID_OPTS, ticks:{maxRotation:0} },
            y:{ grid: GRID_OPTS, beginAtZero: true }
          }
        }
      });
    });
  };

  API.radar = function(canvas, labels, data, opts){
    opts = opts || {};
    var col = resolveColor(opts.color||'cyan');
    require(function(Chart){
      if(canvas._omegaChart) canvas._omegaChart.destroy();
      canvas._omegaChart = new Chart(canvas, {
        type: 'radar',
        data:{
          labels: labels,
          datasets:[{ data: data, borderColor: col.line, backgroundColor: col.bg,
                      borderWidth: 1.5, pointBackgroundColor: col.point }]
        },
        options:{
          responsive: true, maintainAspectRatio: false,
          plugins:{ legend:{display:false} },
          scales:{ r:{ grid:{color:'rgba(201,168,76,.07)'}, angleLines:{color:'rgba(201,168,76,.07)'},
                        ticks:{display:false,stepSize:3},
                        pointLabels:{color:'rgba(233,230,220,.55)',font:{size:9}},
                        min:0, max: opts.max || 9 } }
        }
      });
    });
  };

  API.doughnut = function(canvas, labels, data, opts){
    opts = opts || {};
    var cols = ['#C9A84C','#00E5FF','#3fb27f','#9B6BF0','#C4453C'];
    require(function(Chart){
      if(canvas._omegaChart) canvas._omegaChart.destroy();
      canvas._omegaChart = new Chart(canvas, {
        type: 'doughnut',
        data:{
          labels: labels,
          datasets:[{ data: data, backgroundColor: cols,
                      borderColor:'rgba(10,10,15,1)', borderWidth:2 }]
        },
        options:{
          responsive: true, maintainAspectRatio: false,
          plugins:{
            legend:{ display:true, position:'bottom',
                     labels:{color:'rgba(233,230,220,.55)',boxWidth:10,padding:12} }
          },
          cutout: opts.cutout || '65%',
        }
      });
    });
  };

  /* ── LIVE CHARTS (Supabase-backed) ────────────────────────────────── */
  API.auth = function(canvas, uid){
    /* Fetch leaderboard_snapshots for the user and render a line chart */
    if(!window.OmegaSB){ console.warn('[OmegaChart] OmegaSB unavailable'); return; }
    window.OmegaSB.get().then(function(sb){
      return sb.from('leaderboard_snapshots')
               .select('snapshot_date,authority')
               .eq('user_id', uid || '')
               .order('snapshot_date', {ascending:true})
               .limit(90);
    }).then(function(res){
      var rows = (res&&res.data) || [];
      if(!rows.length){
        /* No data — show placeholder */
        API.line(canvas,['No data'],[0],{color:'gold'});
        return;
      }
      var labels = rows.map(function(r){
        return new Date(r.snapshot_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}).toUpperCase();
      });
      var data = rows.map(function(r){ return Number(r.authority||0).toFixed(4); });
      API.line(canvas, labels, data, {
        color:'gold', tension:0.5, points:2, min:0, max:27.8367,
      });
    }).catch(function(e){ console.warn('[OmegaChart] auth history error', e); });
  };

  API.axisRadar = function(canvas, uid){
    if(!window.OmegaSB){ return; }
    window.OmegaSB.get().then(function(sb){
      return sb.from('profiles').select('axis_a,axis_b,axis_c').eq('id', uid||'').single();
    }).then(function(res){
      var d = (res&&res.data) || {axis_a:0.001,axis_b:0.001,axis_c:0.001};
      API.radar(canvas,
        ['AXIS A\nKNOWLEDGE', 'AXIS B\nMASTERY', 'AXIS C\nCONTRIB'],
        [Number(d.axis_a||0).toFixed(3), Number(d.axis_b||0).toFixed(3), Number(d.axis_c||0).toFixed(3)],
        {color:'cyan', max:9}
      );
    }).catch(function(e){ console.warn('[OmegaChart] axis radar error', e); });
  };

  /* ── AUTO-MOUNT [data-omega-chart] ELEMENTS ─────────────────────────── */
  function mountOne(el){
    if(el._omegaChartMounted) return;
    el._omegaChartMounted = true;
    var type = el.getAttribute('data-omega-chart');
    var height = parseInt(el.getAttribute('data-chart-height')||'180',10);
    /* Wrap in a sized container if needed */
    var cv;
    if(el.tagName === 'CANVAS'){
      cv = el;
    } else {
      cv = document.createElement('canvas');
      cv.style.display = 'block';
      el.style.height = el.style.height || height+'px';
      el.style.position = 'relative';
      el.appendChild(cv);
    }

    var labels = (el.getAttribute('data-chart-labels')||'').split(',').map(function(s){return s.trim();});
    var data   = (el.getAttribute('data-chart-data')||'').split(',').map(Number);
    var color  = el.getAttribute('data-chart-color')||'gold';
    var uid    = el.getAttribute('data-chart-uid');

    if(type==='line')        API.line(cv, labels, data, {color:color});
    else if(type==='bar')    API.bar(cv, labels, [{data:data,color:color}]);
    else if(type==='radar')  API.radar(cv, labels, data, {color:color});
    else if(type==='doughnut') API.doughnut(cv, labels, data);
    else if(type==='auth')   API.auth(cv, uid);
    else if(type==='axis-radar') API.axisRadar(cv, uid);
  }

  function mountAll(){
    document.querySelectorAll('[data-omega-chart]').forEach(mountOne);
  }

  window.addEventListener('load', mountAll);
  document.addEventListener('omega:populated', function(){ setTimeout(mountAll, 200); });

  window.OmegaChart = API;
})();
