/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN FINOPS ENGINE (omega-finops.js)
   
   Continuously measures platform costs: AI inference, Supabase queries,
   storage, networking — and provides optimisation recommendations.
   
   Inspired by:
   - Google Cloud FinOps: unit economics per workload
   - AWS Cost Explorer: cost allocation tags and anomaly detection
   - Anthropic usage API: token-level cost tracking
   - Cloudflare Analytics: request-level cost attribution
   
   Cost Model (estimated, adjust with real billing data):
   - Anthropic claude-sonnet-4-6: ~$0.003 per 1K input tokens, ~$0.015 per 1K output
   - Supabase: included in plan up to 500MB, $0.09/GB beyond
   - Vercel: included in plan up to 100GB bandwidth
   - Resend: $0.001 per email
   ========================================================================== */
(function(){
  if(window.__omegaFinOpsActive) return;
  window.__omegaFinOpsActive = true;

  /* ── COST RATES (USD per unit) ────────────────────────────────── */
  var RATES = {
    ai_input_token:   0.000003,   /* per token */
    ai_output_token:  0.000015,   /* per token */
    db_read:          0.000001,   /* per 1000 reads = $0.001 */
    db_write:         0.000005,   /* per 1000 writes = $0.005 */
    edge_function:    0.000002,   /* per invocation */
    storage_gb_month: 0.09,
    bandwidth_gb:     0.015,
    email:            0.001,
  };

  /* ── COST ACCUMULATORS ────────────────────────────────────────── */
  var _costs = {
    session_start: Date.now(),
    ai_tokens_in:  0,
    ai_tokens_out: 0,
    db_reads:      0,
    db_writes:     0,
    edge_calls:    0,
    emails:        0,
    total_usd:     0,
  };
  var _history = []; /* rolling 60-item log */

  /* ── COST RECORDING ───────────────────────────────────────────── */
  function record(type, units){
    var rate = RATES[type] || 0;
    var cost = rate * (units || 1);
    _costs[type] = (_costs[type] || 0) + (units || 1);
    _costs.total_usd += cost;
    _history.push({type:type,units:units||1,cost:cost,ts:Date.now()});
    if(_history.length>60) _history.shift();
    /* Alert on high AI cost session */
    if(type.startsWith('ai_')&&_costs.total_usd>0.01){
      if(window.OmegaOS)window.OmegaOS.events.emit('finops:cost_alert',{type:'ai_cost_high',total_usd:_costs.total_usd});
    }
  }

  /* ── INTERCEPT SUPABASE QUERIES ───────────────────────────────── */
  document.addEventListener('omega:populated',function(){
    if(!window.__omegaSb) return;
    var orig = window.__omegaSb.from.bind(window.__omegaSb);
    window.__omegaSb.from = function(table){
      var q = orig(table);
      var origSelect = q.select.bind(q);
      q.select = function(){
        record('db_reads', 1);
        return origSelect.apply(this, arguments);
      };
      return q;
    };
    /* Intercept edge function calls */
    var origFn = window.__omegaSb.functions&&window.__omegaSb.functions.invoke.bind(window.__omegaSb.functions);
    if(origFn) window.__omegaSb.functions.invoke = function(fn, opts){
      record('edge_calls', 1);
      /* Estimate AI tokens from body (concierge format: {message: string}) */
      if(opts&&opts.body&&opts.body.message){
        var approxTokens=String(opts.body.message).length/4;
        record('ai_input_token', Math.round(approxTokens));
      }
      return origFn(fn, opts).then(function(r){
        if(r&&r.data&&r.data.reply){
          var outTokens=r.data.reply.length/4;
          record('ai_output_token', Math.round(outTokens));
        }
        return r;
      });
    };
  });

  /* ── COST SUMMARY ─────────────────────────────────────────────── */
  function getSummary(){
    var duration_s = Math.round((Date.now()-_costs.session_start)/1000);
    var ai_cost = (_costs.ai_tokens_in||0)*RATES.ai_input_token + (_costs.ai_tokens_out||0)*RATES.ai_output_token;
    var db_cost = ((_costs.db_reads||0)*RATES.db_read)+  ((_costs.db_writes||0)*RATES.db_write);
    var edge_cost = (_costs.edge_calls||0)*RATES.edge_function;
    return {
      session_duration_s: duration_s,
      total_usd: _costs.total_usd,
      breakdown: {
        ai_usd: ai_cost.toFixed(6),
        db_usd: db_cost.toFixed(6),
        edge_usd: edge_cost.toFixed(6)
      },
      units: {
        ai_tokens_in: _costs.ai_tokens_in||0,
        ai_tokens_out: _costs.ai_tokens_out||0,
        db_reads: _costs.db_reads||0,
        edge_calls: _costs.edge_calls||0
      },
      /* FinOps recommendations */
      recommendations: getRecommendations()
    };
  }

  function getRecommendations(){
    var recs=[];
    if((_costs.ai_tokens_in||0)>5000) recs.push('HIGH AI USAGE: Consider caching frequent AI responses to reduce token spend.');
    if((_costs.db_reads||0)>50) recs.push('HIGH DB READS: Add client-side caching (localStorage) for repeated profile queries.');
    if((_costs.edge_calls||0)>20) recs.push('HIGH EDGE CALLS: Batch multiple requests into single edge function invocations.');
    if(_costs.total_usd>0.05) recs.push('SESSION COST ELEVATED: Review AI usage patterns for optimisation opportunities.');
    if(!recs.length) recs.push('COST EFFICIENT: Current session is within optimal spending parameters.');
    return recs;
  }

  /* ── REPORT COST ON SESSION END ───────────────────────────────── */
  function reportSessionCost(){
    var summary=getSummary();
    if(summary.total_usd>0&&window.OmegaTelemetry){
      window.OmegaTelemetry.track('session_cost',{
        total_usd:summary.total_usd,
        ai_calls:_costs.edge_calls,
        db_reads:_costs.db_reads,
        duration_s:summary.session_duration_s
      });
    }
    /* Route through OmegaTelemetry, not platform_metrics -- see the note in
       omega-metrics.js: an authenticated INSERT into platform_metrics fails
       42501 (policy present, grant absent, CLAUDE.md 8.1 class 6(c)), so this
       write never landed. track() owns uid/session resolution and buffering. */
    if(summary.total_usd>0.001&&window.OmegaTelemetry&&window.OmegaTelemetry.track){
      window.OmegaTelemetry.track('session_cost',summary);
    }
  });

  window.OmegaFinOps={
    record:record,
    summary:getSummary,
    costs:function(){return Object.assign({},_costs);},
    RATES:RATES
  };
})();
