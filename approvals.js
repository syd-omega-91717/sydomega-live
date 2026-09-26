/* approvals.html owner console logic (was an inline <script type=module>). */
import{createClient}from'/vendor/supabase-js.js';
var sb=window.__omegaSb||(window.__omegaSb=createClient('https://ydqhzvvoyufiiqvzcjns.supabase.co','sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q'));
try{window.OmegaSB=window.OmegaSB||{get:function(){return Promise.resolve(sb);}};}catch(e){}

function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
var TRIAL_SECS=557; /* 9 minutes 17 seconds — the approval window */
var allMembers=[];
var timers={};
var ownerUid=null;

/* ── TOAST ── */
function toast(msg,col){
  var t=document.getElementById('toast');
  if(!t)return;
  t.textContent=msg;t.style.color=col||'var(--gold)';t.style.opacity='1';
  clearTimeout(t._to);t._to=setTimeout(function(){t.style.opacity='0';},3200);
}

/* ── FORMAT ── */
function fmtDate(d){
  try{return new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase();}catch(e){return '--';}
}
function fmtTime(d){
  try{return new Date(d).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',second:'2-digit'}).toUpperCase();}catch(e){return '--';}
}

/* ── CHRONOMETER: builds per-card countdown ── */
function startChrono(uid,expISO,startISO){
  if(timers[uid])clearInterval(timers[uid]);
  timers[uid]=setInterval(function(){
    var cdEl=document.getElementById('cd-'+uid);
    var pbEl=document.getElementById('pb-'+uid);
    if(!cdEl){clearInterval(timers[uid]);return;}
    var rem=Math.max(0,new Date(expISO)-Date.now());
    var mm=Math.floor(rem/60000);
    var ss=Math.floor((rem%60000)/1000);
    var str=(mm<10?'0':'')+mm+':'+(ss<10?'0':'')+ss;
    cdEl.textContent=str;
    cdEl.style.color=rem<120000?'var(--crim)':rem<300000?'var(--solar)':'var(--green)';
    if(rem<=0){
      cdEl.textContent='EXPIRED';cdEl.style.color='var(--crim)';
      clearInterval(timers[uid]);
      /* auto-expire in DB */
      sb.rpc('check_trial_status',{p_uid:uid}).catch(function(){});
      setTimeout(function(){load();},1500);
    }
    /* progress bar: pct of 557s remaining */
    if(pbEl){
      var total=TRIAL_SECS*1000;
      var pct=Math.round(rem/total*100);
      pbEl.style.width=Math.max(0,Math.min(100,pct))+'%';
      pbEl.style.background=rem<120000?'var(--crim)':rem<300000?'var(--solar)':'var(--gold)';
    }
  },1000);
}

/* ── BUILD MEMBER CARD ── */
function buildCard(m){
  var now=Date.now();
  var isPending=!m.access_approved&&!m.is_rejected;
  var isActive=m.access_approved&&m.is_trial&&m.trial_expires_at&&new Date(m.trial_expires_at)>now;
  var isPermanent=m.access_approved&&!m.is_trial&&!m.is_rejected;
  var isExpired=m.is_trial&&m.trial_expires_at&&new Date(m.trial_expires_at)<=now&&!m.is_rejected;
  var isRejected=m.is_rejected||(!m.access_approved&&!isPending&&!isActive&&!isPermanent);

  /* filter */
  if(_filter==='pending'&&!isPending)return null;
  if(_filter==='active'&&!isActive)return null;
  if(_filter==='approved'&&!isPermanent)return null;
  if(_filter==='rejected'&&!isRejected&&!isExpired)return null;

  /* status label + color */
  var col,label;
  var t=window.OmegaI18n?window.OmegaI18n.t:function(k){return k;};
  if(isPending){col='var(--solar)';label=t('status_pending');}
  else if(isActive){col='var(--green)';label=t('status_trial_active');}
  else if(isPermanent){col='var(--cyan)';label='∞ '+t('status_permanent');}
  else if(isExpired){col='var(--crim)';label=t('status_expired');}
  else{col='var(--muted)';label=t('status_rejected');}

  /* initials */
  var name=m.display_name||m.email||'MEMBER';
  var init=(name.trim()[0]||'?').toUpperCase();

  /* trial progress bar + chrono */
  var expISO=m.trial_expires_at||null;
  var startISO=expISO?new Date(new Date(expISO).getTime()-TRIAL_SECS*1000).toISOString():null;

  /* action buttons */
  var btns='';
  var btnGrantTrial=t('btn_grant_trial');
  var btnPermanent=t('btn_grant_permanent');
  var btnReject=window.OmegaI18n?window.OmegaI18n.t('reject','en'):'REJECT';
  var btnExtend=t('btn_extend_trial');
  var btnRevoke=t('btn_revoke_access');
  var btnRenew=t('btn_renew_trial');
  var btnReconsider=t('btn_reconsider');
  if(isPending||isExpired){
    btns+='<button class="ac approve" data-uid="'+esc(m.id)+'" data-action="approve">&#10003; '+btnGrantTrial+'<br><small style="font-size:12px;letter-spacing:.5px;display:block;margin-top:2px;opacity:.7">9M 17S WINDOW</small></button>';
    btns+='<button class="ac permanent" data-uid="'+esc(m.id)+'" data-action="grantPermanent">&#8734; '+btnPermanent+'</button>';
    btns+='<button class="ac reject" data-uid="'+esc(m.id)+'" data-action="reject">&#10005; '+btnReject+'</button>';
  }
  if(isActive){
    btns+='<button class="ac extend" data-uid="'+esc(m.id)+'" data-action="extend">&#8635; '+btnExtend+'</button>';
    btns+='<button class="ac permanent" data-uid="'+esc(m.id)+'" data-action="grantPermanent">&#8734; '+btnPermanent+'</button>';
    btns+='<button class="ac revoke" data-uid="'+esc(m.id)+'" data-action="revoke">&#9632; '+btnRevoke+'</button>';
  }
  if(isPermanent){
    btns+='<button class="ac extend" data-uid="'+esc(m.id)+'" data-action="approve">&#8635; '+btnRenew+'</button>';
    btns+='<button class="ac revoke" data-uid="'+esc(m.id)+'" data-action="revoke">&#9632; '+btnRevoke+'</button>';
  }
  if(isRejected&&!isExpired){
    btns+='<button class="ac approve" data-uid="'+esc(m.id)+'" data-action="approve">&#10003; '+btnReconsider+'</button>';
  }

  var card=document.createElement('div');
  card.className='mc card';
  card.innerHTML=
    '<div class="mc-top">'
      +'<div class="mc-avatar" style="border-color:'+col+';color:'+col+'">'+esc(init)+'</div>'
      +'<div class="mc-info">'
        +'<div class="mc-name" style="color:'+col+'">'+esc(name.toUpperCase())+'</div>'
        +'<div class="mc-email">'+esc(m.email||'--')+'</div>'
        +'<div class="mc-uid">ID: '+esc(String(m.id||'').slice(0,20))+'...</div>'
      +'</div>'
      +'<div class="mc-right">'
        +'<div class="mc-pill" style="border-color:'+col+';color:'+col+'">'+label+'</div>'
        +(isActive?'<div class="mc-chrono" id="cd-'+esc(m.id)+'" style="color:'+col+'">--:--</div><div class="mc-chrono-lbl">'+t('label_remaining')+'</div>':'')
      +'</div>'
    +'</div>'
    +(isActive?'<div class="mc-progress"><div class="mc-progress-fill" id="pb-'+esc(m.id)+'" style="width:100%"></div></div>':'')
    +'<div class="mc-timeline">'
      +'<div class="tl-item"><div class="tl-lbl">'+t('timeline_requested')+'</div><div class="tl-val">'+(m.access_requested_at?fmtDate(m.access_requested_at):'--')+'</div></div>'
      +'<div class="tl-item"><div class="tl-lbl">'+t('timeline_trial_started')+'</div><div class="tl-val">'+(startISO&&isActive?fmtTime(startISO):'--')+'</div></div>'
      +'<div class="tl-item"><div class="tl-lbl">'+t('timeline_trial_expires')+'</div><div class="tl-val" style="color:'+col+'">'+(expISO&&isActive?fmtTime(expISO):'--')+'</div></div>'
      +'<div class="tl-item"><div class="tl-lbl">'+t('timeline_access_type')+'</div><div class="tl-val">'+label+'</div></div>'
      +'<div class="tl-item"><div class="tl-lbl">'+t('timeline_sign_element')+'</div><div class="tl-val">'+esc(((m.sign||'--')+'/'+(m.element||'--')).toUpperCase())+'</div></div>'
      +'<div class="tl-item"><div class="tl-lbl">'+t('timeline_authority')+'</div><div class="tl-val" style="color:var(--gold)">'+Number(m.authority||m.axis_a||0).toFixed(4)+'</div></div>'
    +'</div>'
    +'<div class="mc-actions">'+btns+'</div>';

  /* start chronometer if active */
  if(isActive&&expISO) requestAnimationFrame(function(){startChrono(m.id,expISO,startISO);});
  return card;
}

/* ── LOAD ALL MEMBERS ── */
async function load(){
  Object.values(timers).forEach(clearInterval);timers={};
  var members=[];
  try{
    var r=await sb.rpc('get_all_members');
    members=r.data||[];
  }catch(e){
    var r2=await sb.from('profiles').select('*').order('created_at',{ascending:false});
    members=r2.data||[];
  }
  allMembers=members.filter(function(m){return !m.is_owner;});
  var now=Date.now();
  var pending=allMembers.filter(function(m){return !m.access_approved&&!m.is_rejected;});
  var active=allMembers.filter(function(m){return m.access_approved&&m.is_trial&&m.trial_expires_at&&new Date(m.trial_expires_at)>now;});
  var permanent=allMembers.filter(function(m){return m.access_approved&&!m.is_trial;});
  var rejected=allMembers.filter(function(m){return m.is_rejected||(m.is_trial&&m.trial_expires_at&&new Date(m.trial_expires_at)<=now&&!m.access_approved);});

  /* stats */
  function sid(id,v){var el=document.getElementById(id);if(el)el.textContent=v;}
  sid('stat-total',allMembers.length);
  sid('stat-pending',pending.length);
  sid('stat-active',active.length);
  sid('stat-approved',permanent.length);
  sid('stat-rejected',rejected.length);
  sid('hb-total',allMembers.length+' MEMBERS');
  sid('hb-pending',pending.length+(pending.length===1?' PENDING':' PENDING'));

  /* pending badge on tab */
  var bp=document.getElementById('badge-pending');
  if(bp){bp.textContent=pending.length;bp.style.display=pending.length?'inline':'none';}

  /* render */
  var list=document.getElementById('member-list');
  if(!list)return;
  list.innerHTML='';
  var cards=allMembers.map(buildCard).filter(Boolean);
  if(!cards.length){
    list.innerHTML='<div class="empty">'+t('empty_no_members')+'</div>';
  } else {
    cards.forEach(function(c){list.appendChild(c);});
  }
}

/* ── ACTIONS ── */
async function rpcOk(name,args){
  try{ var r=await sb.rpc(name,args); return !!(r&&r.data&&r.data.ok); }
  catch(e){ return false; }
}
async function approve(uid){
  var exp=new Date(Date.now()+557*1000).toISOString();
  var ok=await rpcOk('approve_member',{p_uid:uid});
  if(!ok){
    var r=await sb.from('profiles').update({access_approved:true,is_trial:true,trial_expires_at:exp,is_rejected:false}).eq('id',uid);
    ok=!r.error;
  }
  if(ok){toast(t('toast_trial_granted').replace('{TIME}','9 MINUTES 17 SECONDS'),'var(--green)');}
  else{toast('COULD NOT GRANT ACCESS — try again','var(--crim)');}
  load();
}
async function grantPermanent(uid){
  if(!confirm('Grant PERMANENT lifetime access to this member?'))return;
  try{
    if(window.OmegaGuardian&&window.OmegaGuardian.gate){
      await window.OmegaGuardian.gate('admin',async function(){
        var ok=await rpcOk('grant_permanent_access',{p_uid:uid});
        if(!ok){
          var r=await sb.from('profiles').update({access_approved:true,is_trial:false,trial_expires_at:null,is_rejected:false}).eq('id',uid);
          ok=!r.error;
        }
        if(ok){toast(t('toast_permanent_granted'),'var(--gold)');}
        else{toast('COULD NOT GRANT PERMANENT ACCESS — try again','var(--crim)');}
        load();
      },{action:'grant_permanent_access',member:uid});
    }else{
      var ok=await rpcOk('grant_permanent_access',{p_uid:uid});
      if(!ok){
        var r=await sb.from('profiles').update({access_approved:true,is_trial:false,trial_expires_at:null,is_rejected:false}).eq('id',uid);
        ok=!r.error;
      }
      if(ok){toast(t('toast_permanent_granted'),'var(--gold)');}
      else{toast('COULD NOT GRANT PERMANENT ACCESS — try again','var(--crim)');}
      load();
    }
  }catch(err){
    toast('SECURITY GATE DENIED ACTION','var(--crim)');
  }
}
async function extend(uid){
  try{
    if(window.OmegaGuardian&&window.OmegaGuardian.gate){
      await window.OmegaGuardian.gate('admin',async function(){
        var m=allMembers.find(function(x){return x.id===uid;});
        var base=m&&m.trial_expires_at&&new Date(m.trial_expires_at)>new Date()?new Date(m.trial_expires_at).getTime():Date.now();
        var exp=new Date(base+557*1000).toISOString();
        var ok=await rpcOk('extend_trial',{p_uid:uid,p_seconds:557});
        if(!ok){
          var r=await sb.from('profiles').update({access_approved:true,is_trial:true,trial_expires_at:exp,is_rejected:false}).eq('id',uid);
          ok=!r.error;
        }
        if(ok){toast(t('toast_extend_trial'),'var(--cyan)');}
        else{toast('COULD NOT EXTEND TRIAL — try again','var(--crim)');}
        load();
      },{action:'extend_trial',member:uid});
    }else{
      var m=allMembers.find(function(x){return x.id===uid;});
      var base=m&&m.trial_expires_at&&new Date(m.trial_expires_at)>new Date()?new Date(m.trial_expires_at).getTime():Date.now();
      var exp=new Date(base+557*1000).toISOString();
      var ok=await rpcOk('extend_trial',{p_uid:uid,p_seconds:557});
      if(!ok){
        var r=await sb.from('profiles').update({access_approved:true,is_trial:true,trial_expires_at:exp,is_rejected:false}).eq('id',uid);
        ok=!r.error;
      }
      if(ok){toast(t('toast_extend_trial'),'var(--cyan)');}
      else{toast('COULD NOT EXTEND TRIAL — try again','var(--crim)');}
      load();
    }
  }catch(err){
    toast('SECURITY GATE DENIED ACTION','var(--crim)');
  }
}
async function reject(uid){
  if(!confirm('Reject this access request?'))return;
  var ok=await rpcOk('reject_member',{p_uid:uid});
  if(!ok){
    var r=await sb.from('profiles').update({access_approved:false,is_trial:false,trial_expires_at:null,is_rejected:true}).eq('id',uid);
    ok=!r.error;
  }
  if(ok){toast(t('toast_rejected'),'var(--crim)');}
  else{toast('COULD NOT REJECT REQUEST — try again','var(--crim)');}
  load();
}
async function revoke(uid){
  if(!confirm('Immediately revoke access for this member?'))return;
  try{
    if(window.OmegaGuardian&&window.OmegaGuardian.gate){
      await window.OmegaGuardian.gate('admin',async function(){
        var ok=await rpcOk('revoke_member',{p_uid:uid});
        if(!ok){
          var r=await sb.from('profiles').update({access_approved:false,is_trial:false,trial_expires_at:null}).eq('id',uid);
          ok=!r.error;
        }
        if(ok){toast(t('toast_revoked'),'var(--crim)');}
        else{toast('COULD NOT REVOKE ACCESS — try again','var(--crim)');}
        load();
      },{action:'revoke_member',member:uid});
    }else{
      var ok=await rpcOk('revoke_member',{p_uid:uid});
      if(!ok){
        var r=await sb.from('profiles').update({access_approved:false,is_trial:false,trial_expires_at:null}).eq('id',uid);
        ok=!r.error;
      }
      if(ok){toast(t('toast_revoked'),'var(--crim)');}
      else{toast('COULD NOT REVOKE ACCESS — try again','var(--crim)');}
      load();
    }
  }catch(err){
    toast('SECURITY GATE DENIED ACTION','var(--crim)');
  }
}

/* ── QUEUE LOADERS ── */
async function loadContracts(){
  var el=document.getElementById('contracts-queue');if(!el)return;
  try{
    var r=await sb.rpc('review_contracts');
    var rows=r.data||[];
    if(!rows.length){el.innerHTML='<div class="empty">'+t('empty_no_contracts')+'</div>';return;}
    el.innerHTML=rows.map(function(row){return '<div class="q-row"><div class="q-id">'+esc((row.id||'').slice(0,12))+'</div><div class="q-lbl">'+esc(String(row.title||row.type||'CONTRACT').toUpperCase())+'</div><div class="q-btn">REVIEW</div></div>';}).join('');
  }catch(e){el.innerHTML='<div class="empty">'+t('error_rpc_contract')+'</div>';}
}
async function loadReservations(){
  var el=document.getElementById('reservations-queue');if(!el)return;
  try{
    var r=await sb.rpc('review_reservations');
    var rows=r.data||[];
    if(!rows.length){el.innerHTML='<div class="empty">'+t('empty_no_reservations')+'</div>';return;}
    el.innerHTML=rows.map(function(row){return '<div class="q-row"><div class="q-id">'+esc((row.id||'').slice(0,12))+'</div><div class="q-lbl">'+esc(String(row.title||row.service||'RESERVATION').toUpperCase())+'</div><div class="q-btn">REVIEW</div></div>';}).join('');
  }catch(e){el.innerHTML='<div class="empty">'+t('error_rpc_reservations')+'</div>';}
}
async function loadAudit(){
  var el=document.getElementById('audit-list');if(!el)return;
  try{
    var r=await sb.rpc('access_audit_log');
    var rows=(r.data&&r.data.rows)||[];
    if(!rows.length){el.innerHTML='<div class="empty">'+t('empty_no_audit')+'</div>';return;}
    el.innerHTML=rows.map(function(row){return '<div class="audit-row"><div class="aud-time">'+fmtTime(row.created_at)+'</div><div class="aud-evt">'+esc((row.action||'EVENT').toUpperCase())+'</div><div class="aud-uid">'+esc((row.subject||'').slice(0,10))+'</div></div>';}).join('');
  }catch(e){el.innerHTML='<div class="empty">'+t('error_rpc_audit')+'</div>';}
}
async function loadErrors(){
  var el=document.getElementById('err-list');if(!el)return;
  try{
    var r=await sb.rpc('error_summary');
    var rows=(r.data&&r.data.rows)||[];
    if(!rows.length){el.innerHTML='<div class="empty">'+t('empty_no_errors')+'</div>';return;}
    el.innerHTML=rows.map(function(row){return '<div class="err-row"><div class="err-msg">'+esc((row.message||'ERROR').slice(0,120))+'</div><div class="err-ctx">'+esc(row.page||'')+'  '+(row.hits?'×'+row.hits:'')+'</div></div>';}).join('');
  }catch(e){el.innerHTML='<div class="empty">'+t('error_rpc_errors')+'</div>';}
}
async function sendDispatch(){
  var title=document.getElementById('disp-title');
  var cat=document.getElementById('disp-category');
  var body=document.getElementById('disp-body');
  if(!title||!body||!title.value.trim()||!body.value.trim()){toast(t('error_dispatch_empty'),'var(--crim)');return;}
  if(await rpcOk('post_dispatch',{p_title:title.value.trim(),p_category:cat?cat.value:'',p_body:body.value.trim()})){
    title.value='';body.value='';if(cat)cat.value='';
    toast(t('toast_dispatch_sent'),'var(--gold)');
  }else{
    /* No raw-insert fallback: public.dispatches has no INSERT policy for
       anyone (only post_dispatch(), SECURITY DEFINER, can write to it), so
       a direct .insert() here can never succeed regardless of column names
       -- surface the real failure instead of a false "recorded" success. */
    toast(t('error_dispatch_rpc'),'var(--crim)');
  }
}

/* ── EXPOSE TO WINDOW (for) ── */
window.load=load;
window.approve=approve;
window.grantPermanent=grantPermanent;
window.extend=extend;
window.reject=reject;
window.revoke=revoke;
window.sendDispatch=sendDispatch;
window.loadContracts=loadContracts;
window.loadReservations=loadReservations;
window.loadAudit=loadAudit;
window.loadErrors=loadErrors;

/* ── BOOT: owner gate ── */
(async function boot(){
  try{
    var sess=(await sb.auth.getSession()).data.session;
    if(!sess){window.location.href='/account.html';return;}
    ownerUid=sess.user.id;
    var pr=(await sb.from('profiles').select('is_owner').eq('id',ownerUid).maybeSingle()).data;
    if(!pr||!pr.is_owner){
      var g=document.getElementById('gate');if(g)g.style.display='flex';
      return;
    }
    document.getElementById('app').style.display='flex';
    load();
  }catch(e){
    var g=document.getElementById('gate');if(g)g.style.display='flex';
  }
})();
