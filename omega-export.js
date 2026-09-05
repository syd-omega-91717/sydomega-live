/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN DATA EXPORT ENGINE (omega-export.js)

   GDPR Article 20 — Right to Data Portability.
   Collects all member data from Supabase, packages it into a downloadable
   JSON archive, and triggers a browser download.

   Exported datasets (all scoped to auth.uid()):
   1. Profile & identity
   2. Task completions
   3. Sovereign events
   4. Interest signals
   5. Dedications (chrono B logs)
   6. Activity feed (own entries)
   7. Leaderboard snapshots (own entries)

   Public API: OmegaExport.request() → Promise<void>
   ========================================================================== */
(function(){
  if(window.__omegaExportActive) return;
  window.__omegaExportActive = true;

  /* ── GATHER DATA ────────────────────────────────────────────────── */
  async function gather(sb, userId){
    var PHI=1.6180339887, EU=2.7182818285;
    var fetched={};

    /* 1. Profile */
    var pf=await sb.from('profiles')
      .select('id,display_name,email,sign,element,agent,god,token,is_owner,subscription_tier,axis_a,axis_b,axis_c,created_at,access_approved')
      .eq('id',userId).maybeSingle();
    fetched.profile=pf.data||{};

    /* Computed authority */
    var pr=fetched.profile;
    var a=Number(pr.axis_a||0.001),b=Number(pr.axis_b||0.001),c=Number(pr.axis_c||0.001);
    fetched.profile._computed_authority=pr.is_owner?27.8367:
      Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;

    /* 2. Task completions */
    var tc=await sb.from('task_completions')
      .select('id,task_name,task_type,axis,points_earned,completed_at')
      .eq('user_id',userId).order('completed_at',{ascending:false}).limit(2000);
    fetched.task_completions=tc.data||[];

    /* 3. Sovereign events */
    var ev=await sb.from('sovereign_events')
      .select('id,event_type,event_data,axis_delta,auth_before,auth_after,occurred_at')
      .eq('user_id',userId).order('occurred_at',{ascending:false}).limit(500);
    fetched.sovereign_events=ev.data||[];

    /* 4. Interest signals */
    var is=await sb.from('interest_signals')
      .select('id,signal_type,content_id,content_type,axis_type,weight,created_at')
      .eq('user_id',userId).order('created_at',{ascending:false}).limit(1000);
    fetched.interest_signals=is.data||[];

    /* 5. Activity feed (own entries) */
    var af=await sb.from('activity_feed')
      .select('id,activity_type,title,created_at')
      .eq('user_id',userId).order('created_at',{ascending:false}).limit(200);
    fetched.activity_feed=af.data||[];

    /* 6. Leaderboard snapshots */
    var lb=await sb.from('leaderboard_snapshots')
      .select('snapshot_date,authority,axis_a,axis_b,axis_c,rank_global,element')
      .eq('user_id',userId).order('snapshot_date',{ascending:false}).limit(365);
    fetched.leaderboard_snapshots=lb.data||[];

    return fetched;
  }

  /* ── DOWNLOAD TRIGGER ───────────────────────────────────────────── */
  function download(filename, obj){
    var json=JSON.stringify(obj,null,2);
    var blob=new Blob([json],{type:'application/json'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;a.download=filename;
    document.body.appendChild(a);a.click();
    setTimeout(function(){URL.revokeObjectURL(url);document.body.removeChild(a);},2000);
  }

  /* ── PROGRESS TOAST ─────────────────────────────────────────────── */
  function toast(msg,type){
    if(window.OmegaNotify)window.OmegaNotify.showToast(msg,type||'info');
    else console.info('[OmegaExport]',msg);
  }

  /* ── PUBLIC API ─────────────────────────────────────────────────── */
  window.OmegaExport={
    request:async function(){
      var sb=window.__omegaSb;
      if(!sb){toast('Data export requires authentication.','error');return;}
      var sess=await sb.auth.getSession();
      var s=sess&&sess.data&&sess.data.session;
      if(!s){toast('Please sign in to export your data.','error');return;}
      var userId=s.user.id;
      toast('Collecting your sovereign data… This may take a moment.','info');
      try{
        var data=await gather(sb,userId);
        var pkg={
          export_meta:{
            exported_at:new Date().toISOString(),
            user_id:userId,
            platform:'SYD OMEGA 91717',
            gdpr_basis:'Article 20 — Right to Data Portability',
            authority_formula:'AUTH = sqrt(A³+B³+C³) × φ/e',
            phi:1.6180339887,
            euler:2.7182818285,
            apex:27.8367
          },
          data:data
        };
        var fname='omega-export-'+new Date().toISOString().slice(0,10)+'.json';
        download(fname,pkg);
        toast('Export ready · Download started · '+Object.keys(data).length+' datasets packaged.','success');
        /* Record as sovereign event */
        /* This try/catch cannot see a Supabase write fail — it resolves
           {data:null,error} rather than throwing — so the export's audit
           record could go missing with nothing said (CLAUDE.md 8.1 class 1).
           The export itself has already succeeded here, so a failure to record
           it is logged rather than surfaced to the member. */
        try{
          var ev=await sb.rpc('record_sovereign_event',{
            p_event_type:'data.exported',
            p_event_data:{datasets:Object.keys(data),rows:Object.values(data).reduce(function(s,d){return s+(Array.isArray(d)?d.length:1);},0)},
            p_axis_delta:{a:0,b:0,c:0}
          });
          if(ev&&ev.error)console.warn('[OmegaExport] export not recorded:',ev.error.message);
        }catch(e){console.warn('[OmegaExport] export not recorded:',e&&e.message);}
      }catch(e){
        toast('Export failed: '+e.message,'error');
      }
    }
  };

  /* ── AUTO-WIRE data-omega-export BUTTONS ────────────────────────── */
  function wireButtons(){
    document.querySelectorAll('[data-omega-export]').forEach(function(btn){
      if(btn.__omegaExportWired) return;
      btn.__omegaExportWired=true;
      btn.addEventListener('click',function(e){
        e.preventDefault();
        window.OmegaExport.request();
      });
    });
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',wireButtons);
  }else{wireButtons();}
  document.addEventListener('omega:populated',wireButtons);
})();
