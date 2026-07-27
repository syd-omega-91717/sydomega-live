/* ==========================================================================
   Ω SYD OMEGA 91717 — PERFORMANCE METRICS ENGINE
   Google Core Web Vitals: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 (75th p.)
   Reports to Supabase platform_metrics for the SRE dashboard.
   ========================================================================== */
(function(){
  if(window.__omegaMetricsActive) return;
  window.__omegaMetricsActive=true;

  var _lcp=0,_cls=0,_inp=0;
  var PAGE=location.pathname.replace('/','').replace('.html','')||'home';

  /* ── LCP (Largest Contentful Paint) ─────────────────────────── */
  try{
    new PerformanceObserver(function(list){
      var entries=list.getEntries();
      if(entries.length){_lcp=entries[entries.length-1].startTime;}
    }).observe({type:'largest-contentful-paint',buffered:true});
  }catch(e){}

  /* ── CLS (Cumulative Layout Shift) ──────────────────────────── */
  try{
    new PerformanceObserver(function(list){
      list.getEntries().forEach(function(e){if(!e.hadRecentInput)_cls+=e.value;});
    }).observe({type:'layout-shift',buffered:true});
  }catch(e){}

  /* ── INP (Interaction to Next Paint) — fallback to FID ──────── */
  try{
    new PerformanceObserver(function(list){
      list.getEntries().forEach(function(e){_inp=Math.max(_inp,e.duration||0);});
    }).observe({type:'event',buffered:true,durationThreshold:40});
  }catch(e){}

  /* ── Report after page fully loads ──────────────────────────── */
  function report(){
    var nav=performance.getEntriesByType('navigation')[0];
    var ttfb=nav?nav.responseStart:0;
    var fcp=0;
    try{
      var paint=performance.getEntriesByName('first-contentful-paint')[0];
      if(paint)fcp=paint.startTime;
    }catch(e){}

    var metric={
      page:PAGE,
      lcp_ms:Math.round(_lcp),
      cls:parseFloat(_cls.toFixed(4)),
      inp_ms:Math.round(_inp),
      fcp_ms:Math.round(fcp),
      ttfb_ms:Math.round(ttfb),
      /* PASS/FAIL per Google thresholds */
      lcp_pass:_lcp<=2500,
      cls_pass:_cls<=0.1,
      inp_pass:_inp<=200,
      ts:new Date().toISOString()
    };

    /* Log to console in dev */
    if(location.hostname==='localhost'){
      console.group('\u03A9 CORE WEB VITALS \u2014 '+PAGE);
      console.log('LCP:',metric.lcp_ms+'ms',(metric.lcp_pass?'\u2713':'\u2717'),'(target \u22642500ms)');
      console.log('CLS:',metric.cls,(metric.cls_pass?'\u2713':'\u2717'),'(target \u22640.1)');
      console.log('INP:',metric.inp_ms+'ms',(metric.inp_pass?'\u2713':'\u2717'),'(target \u2264200ms)');
      console.log('TTFB:',metric.ttfb_ms+'ms','FCP:',metric.fcp_ms+'ms');
      console.groupEnd();
    }

    /* Send to Supabase platform_metrics */
    if(window.__omegaSb){
      window.__omegaSb.from('platform_metrics').upsert({
        metric_date:new Date().toISOString().slice(0,10),
        metric_name:PAGE+'_cwv',
        metric_value:metric.lcp_ms,
        dimensions:metric
      }).catch(function(){});
    }

    window.__omegaMetrics=metric;
    return metric;
  }

  /* Report after load + 3s for LCP to stabilise */
  if(document.readyState==='complete'){
    setTimeout(report,3000);
  } else {
    window.addEventListener('load',function(){setTimeout(report,3000);});
  }

  window.OmegaMetrics={getMetrics:function(){return window.__omegaMetrics||null;},report:report};
})();
