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
  }catch(e){console.warn('[OmegaMetrics] LCP observer unavailable:',e);}

  /* ── CLS (Cumulative Layout Shift) ──────────────────────────── */
  try{
    new PerformanceObserver(function(list){
      list.getEntries().forEach(function(e){if(!e.hadRecentInput)_cls+=e.value;});
    }).observe({type:'layout-shift',buffered:true});
  }catch(e){console.warn('[OmegaMetrics] CLS observer unavailable:',e);}

  /* ── INP (Interaction to Next Paint) — fallback to FID ──────── */
  try{
    new PerformanceObserver(function(list){
      list.getEntries().forEach(function(e){_inp=Math.max(_inp,e.duration||0);});
    }).observe({type:'event',buffered:true,durationThreshold:40});
  }catch(e){console.warn('[OmegaMetrics] INP observer unavailable:',e);}

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
      lcp_pass:_lcp>0&&_lcp<=2500,
      cls_pass:_cls<=0.1,
      inp_pass:_inp>0&&_inp<=200,
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

    /* Route through OmegaTelemetry, NOT a direct platform_metrics write.
       Verified live 2026-08-30 by member impersonation: INSERT into
       platform_metrics as `authenticated` fails 42501 permission denied. The
       table has an INSERT policy (WITH CHECK true) but no INSERT grant, and a
       GRANT is checked before row security -- CLAUDE.md 8.1 class 6(c). The
       old code did check res.error, so this was not silent in the strict
       sense: it console.warn'd on every page load and every metric was lost.
       Nothing surfaced that to a user or a gate, so it read as working.
       Granting platform_metrics is the wrong fix twice over: it has no user_id,
       so members would overwrite each other on (metric_date, metric_name), and
       its UPDATE policy is is_platform_owner(), so the upsert's DO UPDATE
       branch fails even with the grant. CLAUDE.md 8.2 warns against exactly
       that grant. telemetry_events is the correct home -- per-member,
       WITH CHECK (auth.uid() = user_id), already granted, and verified live to
       accept this payload.
       Going through OmegaTelemetry.track rather than inserting here directly
       is deliberate: it owns _uid/_session resolution and buffers until the
       profile is known. Writing the insert inline would need window.__omegaUid,
       a global nothing assigns -- CLAUDE.md 8.1 class 4(b) -- and a null
       user_id fails that WITH CHECK. bg.js loads telemetry (line 1710) after
       metrics (526), so guard rather than assume; track() buffers pre-ready
       events itself once it exists. */
    if(window.OmegaTelemetry&&window.OmegaTelemetry.track){
      window.OmegaTelemetry.track('web_vitals',metric);
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
