/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN RECOMMENDATION ENGINE
   Records interest signals and surfaces related content.
   Principle extracted from TikTok's interest-graph FYP engine:
   show content aligned with proven engagement, not just subscriptions.
   ========================================================================== */
(function(){
  if(window.__omegaRecommendActive) return;
  window.__omegaRecommendActive=true;

  var PAGE=location.pathname.replace('/','').replace('.html','')||'home';
  var _entered=Date.now();
  var _recordedEntry=false;

  /* Record a signal to the interest graph */
  function signal(type,contentId,contentType,axisType,weight){
    if(!window.__omegaSb) return;
    window.__omegaSb.rpc('record_interest_signal',{
      p_signal_type:type,
      p_content_id:contentId||PAGE,
      p_content_type:contentType||'page',
      p_axis_type:axisType||null,
      p_weight:weight||1.0
    }).catch(function(e){ console.warn('[Omega] non-critical async operation failed:', e); });
  }

  /* Record 'watch' signal when page is active for 30+ seconds */
  function tryRecordWatch(){
    if(_recordedEntry) return;
    var elapsed=(Date.now()-_entered)/1000;
    if(elapsed>=30&&!document.hidden){
      _recordedEntry=true;
      signal('watch',PAGE,'page',null,Math.min(3.0,elapsed/30));
    }
  }
  var _watchCheck=setInterval(tryRecordWatch,5000);

  /* Record 'complete' when exam/game card is clicked */
  document.addEventListener('omega:task_complete',function(e){
    if(e.detail){
      signal('complete',e.detail.task_name,e.detail.task_type,e.detail.axis_type,2.0);
    }
  });

  /* Record 'skip' on rapid navigate-away (< 5 seconds) */
  window.addEventListener('beforeunload',function(){
    clearInterval(_watchCheck);
    var elapsed=(Date.now()-_entered)/1000;
    if(elapsed<5) signal('skip',PAGE,'page',null,0.5);
    else if(elapsed>=30&&!_recordedEntry) signal('watch',PAGE,'page',null,1.0);
  });

  /* Expose for manual signal recording */
  window.OmegaRecommend={signal:signal};
})();
