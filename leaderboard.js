/* leaderboard.html -- page logic (kept out of the HTML: scripts/csp-inline-ratchet.py). */
import{createClient}from'/vendor/supabase-js.js';
var sb=window.__omegaSb||(window.__omegaSb=createClient('https://ydqhzvvoyufiiqvzcjns.supabase.co','sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q'));
var PHI=1.6180339887,EU=2.7182818285;
var GATE_THRESH=[2.3197,4.6394,6.9592,9.2789,11.5986,13.9183,16.2381,18.5578,20.8775,23.1972,25.517,27.8367];
var GATE_NAMES=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
function sid(id,v){var el=document.getElementById(id);if(el)el.textContent=String(v==null?'--':v);}
function calcAuth(a,b,c){return Math.sqrt(Math.pow(Number(a)||0,3)+Math.pow(Number(b)||0,3)+Math.pow(Number(c)||0,3))*PHI/EU;}
function getGate(auth){var g=0;GATE_THRESH.forEach(function(t,i){if(auth>=t)g=i;});return GATE_NAMES[g];}

function renderPodium(r1,r2,r3){
  function fill(id,r){if(!r)return;sid(id+'-auth',r.auth||r.authority||'--');sid(id+'-name',(r.display_name||'MEMBER').toUpperCase().slice(0,18));sid(id+'-el',(r.element||'').toUpperCase());}
  fill('p1',r1);fill('p2',r2);fill('p3',r3);
}
function renderTable(rows,myUid){
  var el=document.getElementById('lb-rows');if(!el)return;
  el.innerHTML='';
  rows.forEach(function(r,i){
    var row=document.createElement('div');row.className='tbl-row'+(r.user_id===myUid||r.id===myUid?' me':'');row.setAttribute('role','row');
    var isMe=r.user_id===myUid||r.id===myUid;
    var rank=r.rank||r.rank_global||i+1;
    var medal=rank===1?'♔':rank===2?'♕':rank===3?'♖':'';
    var auth=r.auth||r.authority||(r.axis_a!==undefined?calcAuth(r.axis_a,r.axis_b,r.axis_c).toFixed(4):'--');
    var rankEl=document.createElement('div');rankEl.className='lb-rank';rankEl.style.color=rank<=3?'var(--gold)':'var(--muted)';rankEl.textContent=medal+rank;
    var nameWrap=document.createElement('div');
    var nameEl=document.createElement('div');nameEl.className='lb-name-val';
    if(isMe){var you=document.createElement('span');you.style.color='var(--gold)';you.textContent='◆ YOU — ';nameEl.appendChild(you);}
    nameEl.appendChild(document.createTextNode((r.display_name||'MEMBER').toUpperCase().slice(0,22)));
    var signEl=document.createElement('div');signEl.className='lb-sign-val';signEl.textContent=(r.element||r.sign||'').toUpperCase();
    nameWrap.appendChild(nameEl);nameWrap.appendChild(signEl);
    var authEl=document.createElement('div');authEl.className='lb-auth-val';authEl.textContent=typeof auth==='number'?auth.toFixed(4):String(auth);
    var axaEl=document.createElement('div');axaEl.className='lb-axis-val';axaEl.style.color='var(--gold)';axaEl.textContent=Number(r.axis_a||0).toFixed(3);
    var axbEl=document.createElement('div');axbEl.className='lb-axis-val';axbEl.style.color='var(--cyan)';axbEl.textContent=Number(r.axis_b||0).toFixed(3);
    var elemEl=document.createElement('div');elemEl.style.cssText='font-family:var(--M);font-size:12px;color:var(--muted);text-align:center';elemEl.textContent=(r.element||'?').toUpperCase().slice(0,5);
    row.appendChild(rankEl);row.appendChild(nameWrap);row.appendChild(authEl);row.appendChild(axaEl);row.appendChild(axbEl);row.appendChild(elemEl);
    el.appendChild(row);
  });
}

(async function(){
  try{
    var sessionResult=await sb.auth.getSession();if(sessionResult.error)throw sessionResult.error;var s=sessionResult.data&&sessionResult.data.session;
    if(!s){location.replace('/account.html');return;}
    var profileResult=await sb.from('profiles').select('*').eq('id',s.user.id).maybeSingle();if(profileResult.error)throw profileResult.error;if(!profileResult.data||typeof profileResult.data!=='object')throw new Error('profile_record_unavailable');var pr=profileResult.data;
    if(!pr.is_owner&&!pr.access_approved){location.replace('/pending.html');return;}
    if(!pr.is_owner&&pr.is_trial&&pr.trial_expires_at&&new Date(pr.trial_expires_at)<=new Date()){location.replace('/pending.html?expired=1');return;}
    document.getElementById('app').style.display='flex';
    if(window.__omegaPopulate)window.__omegaPopulate(pr,s.user);
    var myA=Number(pr.is_owner?9:pr.axis_a||0.001);
    var myB=Number(pr.is_owner?9:pr.axis_b||0.001);
    var myC=Number(pr.is_owner?9:pr.axis_c||0.001);
    var myAuth=pr.is_owner?27.8367:calcAuth(myA,myB,myC);
    sid('my-auth',myAuth.toFixed(4));sid('my-auth-2',myAuth.toFixed(4));
    sid('my-gate',getGate(myAuth));
    var dateStr=new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase();
    /* Banner */
    sid('banner-name',(pr.display_name||'SOVEREIGN MEMBER').toUpperCase());
    sid('banner-auth',myAuth.toFixed(4));
    sid('banner-element',(pr.element||'--').toUpperCase());
    sid('banner-a',myA.toFixed(3));sid('banner-b',myB.toFixed(3));sid('banner-c',myC.toFixed(3));
    /* Try rankings edge function */
    var ranked=false;
    try{
      var rr=await sb.functions.invoke('rankings',{body:{limit:50,user_id:s.user.id}});
      if(rr.data&&rr.data.rankings&&rr.data.rankings.length){
        var rankings=rr.data.rankings;
        var total=rr.data.total||rankings.length;
        sid('lb-total',total);sid('my-total',total);sid('lb-date',dateStr);
        if(rr.data.my_rank){sid('my-rank',rr.data.my_rank);sid('my-rank-2',rr.data.my_rank);sid('banner-rank',rr.data.my_rank);}
        renderPodium(rankings[0],rankings[1],rankings[2]);
        renderTable(rankings,s.user.id);
        ranked=true;
      }
    }catch(e){}
    /* Try leaderboard_snapshots */
    if(!ranked){
      try{
        var lb=await sb.from('leaderboard_snapshots').select('*').eq('snapshot_date',new Date().toISOString().slice(0,10)).order('rank_global',{ascending:true}).limit(50);
        var rows=lb.data||[];
        if(!rows.length)throw new Error('no snapshot');
        sid('lb-total',rows.length);sid('my-total',rows.length);sid('lb-date',dateStr);
        var me=rows.find(function(r){return r.user_id===s.user.id;});
        if(me){sid('my-rank',me.rank_global);sid('my-rank-2',me.rank_global);sid('banner-rank',me.rank_global);}
        renderPodium(rows[0],rows[1],rows[2]);
        renderTable(rows,s.user.id);
        ranked=true;
      }catch(e){}
    }
    /* Live ranking fallback: public_leaderboard is the member-visible ranking.
       A direct profiles read cannot be one -- RLS returns only the caller's own
       row, so every member used to see themselves ranked #1 of 1. */
    if(!ranked){
      var pl=await sb.rpc('public_leaderboard',{p_limit:50});
      if(pl.error||!Array.isArray(pl.data)){
        sid('lb-total','--');sid('my-total','--');sid('lb-date','UNAVAILABLE');
        var lbEl=document.getElementById('lb-rows');
        if(lbEl)lbEl.textContent='Ranking is unavailable right now.';
        console.warn('[leaderboard] public_leaderboard failed',pl.error);
        return;
      }
      var myName=(pr.display_name||'').trim()||('Initiate-'+String(s.user.id).slice(0,4));
      var rows2=pl.data.map(function(r){
        return {rank:r.rank,display_name:r.name,element:r.element,sign:r.sign,
          axis_a:r.axis_a,axis_b:r.axis_b,axis_c:r.axis_c,authority:Number(r.authority),auth:Number(r.authority)};
      });
      /* The RPC returns no user ids. Mark "you" only when exactly one row has
         your name and your authority; otherwise leave your rank unstated. */
      var mine=rows2.filter(function(r){return r.display_name===myName&&Math.abs(r.auth-myAuth)<0.001;});
      if(mine.length===1){mine[0].user_id=s.user.id;sid('my-rank',mine[0].rank);sid('my-rank-2',mine[0].rank);sid('banner-rank',mine[0].rank);}
      sid('lb-total',rows2.length);sid('my-total',rows2.length);sid('lb-date','LIVE');
      renderPodium(rows2[0],rows2[1],rows2[2]);
      renderTable(rows2,s.user.id);
    }
  }catch(e){var app=document.getElementById('app');if(app)app.style.display='none';var panel=document.getElementById('leaderboard-load-error');if(panel)panel.hidden=false;console.error('[leaderboard] access verification failed; page remains locked.',e);}
})();
