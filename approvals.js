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
async function rpcResult(name,args){try{var r=await sb.rpc(name,args),d=r&&r.data;if(r&&r.error)return{ok:false,error:r.error.message||'database_error',code:r.error.code||''};if(d&&typeof d==='object'&&d.ok===false)return{ok:false,error:d.error||'action_denied',code:''};return{ok:!!(d&&d.ok),data:d,error:(d&&d.ok)?null:'action_denied',code:''};}catch(e){return{ok:false,error:e&&e.message?e.message:'request_failed',code:e&&e.code?e.code:''};}}
function explainActionError(prefix,result){var reason=(result&&result.error)||'unknown_error';var msg=reason==='aal2_required'?'AAL2 REQUIRED — open Security and complete MFA step-up, then retry.':reason==='forbidden'||reason==='Not authorised: only a platform owner may grant trial access.'?'OWNER AUTHORIZATION REQUIRED — this action is restricted to the platform owner.':prefix+' — '+reason;toast(msg,'var(--crim)');}
async function approve(uid){var result=await rpcResult('approve_member',{p_uid:uid});if(result.ok)toast(t('toast_trial_granted').replace('{TIME}','9 MINUTES 17 SECONDS'),'var(--green)');else explainActionError('COULD NOT GRANT TRIAL ACCESS',result);load();}
async function grantPermanent(uid){if(!confirm('Grant PERMANENT lifetime access to this member?'))return;try{if(window.OmegaGuardian&&window.OmegaGuardian.gate){await window.OmegaGuardian.gate('admin',async function(){var result=await rpcResult('grant_permanent_access',{p_uid:uid});if(result.ok)toast(t('toast_permanent_granted'),'var(--gold)');else explainActionError('COULD NOT GRANT PERMANENT ACCESS',result);load();},{action:'grant_permanent_access',member:uid});}else{var result=await rpcResult('grant_permanent_access',{p_uid:uid});if(result.ok)toast(t('toast_permanent_granted'),'var(--gold)');else explainActionError('COULD NOT GRANT PERMANENT ACCESS',result);load();}}catch(err){toast('SECURITY GATE DENIED ACTION — '+(err&&err.message?err.message:'unknown_error'),'var(--crim)');}}
async function extend(uid){try{if(window.OmegaGuardian&&window.OmegaGuardian.gate){await window.OmegaGuardian.gate('admin',async function(){var result=await rpcResult('extend_trial',{p_uid:uid,p_seconds:557});if(result.ok)toast(t('toast_extend_trial'),'var(--cyan)');else explainActionError('COULD NOT EXTEND TRIAL',result);load();},{action:'extend_trial',member:uid});}else{var result=await rpcResult('extend_trial',{p_uid:uid,p_seconds:557});if(result.ok)toast(t('toast_extend_trial'),'var(--cyan)');else explainActionError('COULD NOT EXTEND TRIAL',result);load();}}catch(err){toast('SECURITY GATE DENIED ACTION — '+(err&&err.message?err.message:'unknown_error'),'var(--crim)');}}
async function reject(uid){if(!confirm('Reject this access request?'))return;var result=await rpcResult('reject_member',{p_uid:uid});if(result.ok)toast(t('toast_rejected'),'var(--crim)');else explainActionError('COULD NOT REJECT REQUEST',result);load();}
async function revoke(uid){if(!confirm('Immediately revoke access for this member?'))return;try{if(window.OmegaGuardian&&window.OmegaGuardian.gate){await window.OmegaGuardian.gate('admin',async function(){var result=await rpcResult('revoke_member',{p_uid:uid});if(result.ok)toast(t('toast_revoked'),'var(--crim)');else explainActionError('COULD NOT REVOKE ACCESS',result);load();},{action:'revoke_member',member:uid});}else{var result=await rpcResult('revoke_member',{p_uid:uid});if(result.ok)toast(t('toast_revoked'),'var(--crim)');else explainActionError('COULD NOT REVOKE ACCESS',result);load();}}catch(err){toast('SECURITY GATE DENIED ACTION — '+(err&&err.message?err.message:'unknown_error'),'var(--crim)');}}
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
/* ── IDENTITY REVIEW (docs/decisions/kyc-intake/PLAN.md) ──
   kyc_queue() / review_kyc() are owner-only on the server; this list only
   renders what they return. Names go through textContent. A document opens
   through a 60-second signed URL -- the owner may read `uploads` under the
   storage policy -- and a verdict applies only while the row is still
   'submitted', so two owners cannot double-decide it. */
async function loadKyc(){
  var el=document.getElementById('kyc-queue');if(!el)return;
  var r=await sb.rpc('kyc_queue');
  el.removeAttribute('data-loading');el.textContent='';
  var d=r.data||{};
  if(r.error||d.ok!==true){var e=document.createElement('div');e.className='empty';e.textContent='Identity review unavailable: '+(r.error?r.error.message:(d.error||'no response'));el.appendChild(e);return;}
  var note=document.createElement('div');note.className='q-row';note.setAttribute('data-kyc-intake',d.intake_enabled?'open':'closed');
  var nl=document.createElement('div');nl.className='q-lbl';
  nl.textContent=d.intake_enabled?'INTAKE OPEN — members can submit identity documents':'INTAKE CLOSED — members cannot submit identity documents';
  var tg=document.createElement('button');tg.type='button';tg.className='q-btn';
  tg.textContent=d.intake_enabled?'CLOSE INTAKE':'OPEN INTAKE';
  tg.setAttribute('data-action','kycIntake');tg.setAttribute('data-on',d.intake_enabled?'false':'true');
  note.appendChild(nl);note.appendChild(tg);el.appendChild(note);
  /* Verdicts whose document is still stored: the deletion after the verdict
     failed or never ran. They stay here until the server confirms the file
     is gone (kyc_document_purged). */
  (d.purge||[]).forEach(function(row){
    var q=document.createElement('div');q.className='q-row';q.setAttribute('data-kyc-purge',row.id);
    var lbl=document.createElement('div');lbl.className='q-lbl';
    lbl.textContent=String(row.display_name||'Member').toUpperCase()+' · '+String(row.status||'').toUpperCase()+' · DOCUMENT NOT YET DELETED';
    var btn=document.createElement('button');btn.type='button';btn.className='q-btn';btn.textContent='DELETE NOW';
    btn.setAttribute('data-action','kycPurge');btn.setAttribute('data-uid',row.id);btn.setAttribute('data-path',row.doc_path||'');
    q.appendChild(lbl);q.appendChild(btn);el.appendChild(q);
  });
  (d.rows||[]).forEach(function(row){
    var q=document.createElement('div');q.className='q-row';q.setAttribute('data-kyc-row',row.id);
    var id=document.createElement('div');id.className='q-id';id.textContent=fmtDate(row.submitted_at);
    var lbl=document.createElement('div');lbl.className='q-lbl';lbl.textContent=String(row.display_name||'Member').toUpperCase();
    q.appendChild(id);q.appendChild(lbl);
    [['kycView','VIEW','data-path',row.doc_path],['kycVerify','VERIFY','data-uid',row.id],['kycReject','REJECT','data-uid',row.id]].forEach(function(b){
      var btn=document.createElement('button');btn.type='button';btn.className='q-btn';btn.textContent=b[1];
      btn.setAttribute('data-action',b[0]);btn.setAttribute(b[2],b[3]||'');q.appendChild(btn);
    });
    el.appendChild(q);
  });
  if(!(d.rows||[]).length){var e2=document.createElement('div');e2.className='empty';e2.textContent='No identity documents waiting.';el.appendChild(e2);}
}
async function kycView(path){
  if(!path)return;
  var r=await sb.storage.from('uploads').createSignedUrl(path,60);
  if(r.error||!r.data||!r.data.signedUrl){toast('COULD NOT OPEN DOCUMENT — '+((r.error&&r.error.message)||'no URL'),'var(--crim)');return;}
  window.open(r.data.signedUrl,'_blank','noopener');
}
async function kycVerdict(uid,verdict){
  if(!uid)return;
  if(!confirm((verdict==='verified'?'Mark this member VERIFIED':'REJECT this submission')+'? This is recorded and cannot be undone here.'))return;
  var r=await sb.rpc('review_kyc',{p_member:uid,p_verdict:verdict});
  var d=r.data||{};
  if(r.error||d.ok!==true){toast('VERDICT NOT RECORDED — '+(r.error?r.error.message:(d.error||'no response')),'var(--crim)');loadKyc();return;}
  /* Retention rule: the document goes as soon as the verdict is recorded. */
  var gone=await kycPurge(uid,d.purge,true);
  toast((verdict==='verified'?'IDENTITY VERIFIED':'SUBMISSION REJECTED')+(gone?' · DOCUMENT DELETED':' · DOCUMENT NOT DELETED — RETRY BELOW'),gone?(verdict==='verified'?'var(--green)':'var(--crim)'):'var(--crim)');
  loadKyc();
}
/* Delete through the Storage API, then let the server confirm. Storage answers
   an RLS-blocked delete with an empty success, so only kyc_document_purged --
   which checks storage.objects itself -- decides whether it is gone. */
async function kycPurge(uid,path,quiet){
  if(!uid)return false;
  if(path){var rm=await sb.storage.from('uploads').remove([path]);
    if(rm.error){if(!quiet)toast('DOCUMENT NOT DELETED — '+rm.error.message,'var(--crim)');return false;}}
  var r=await sb.rpc('kyc_document_purged',{p_member:uid});
  var d=r.data||{};
  if(r.error||d.ok!==true){if(!quiet)toast('DOCUMENT NOT DELETED — '+(r.error?r.error.message:(d.error||'no response')),'var(--crim)');return false;}
  if(!quiet){toast('DOCUMENT DELETED','var(--green)');loadKyc();}
  return true;
}
async function kycIntake(on){
  if(!confirm(on?'OPEN identity document intake? Members will be able to submit a government ID. Each document is deleted once you record a decision.':'CLOSE identity document intake? Pending submissions stay in the queue.'))return;
  var r=await sb.rpc('owner_set_kyc_intake',{p_on:!!on});
  var d=r.data||{};
  if(r.error||d.ok!==true){toast('INTAKE NOT CHANGED — '+(r.error?r.error.message:(d.error||'no response')),'var(--crim)');return;}
  toast(on?'INTAKE OPEN':'INTAKE CLOSED',on?'var(--green)':'var(--muted)');
  loadKyc();
}

async function sendDispatch(){
  var title=document.getElementById('disp-title'),cat=document.getElementById('disp-category'),body=document.getElementById('disp-body');
  if(!title||!body||!title.value.trim()||!body.value.trim()){toast(t('error_dispatch_empty'),'var(--crim)');return;}
  var result=await rpcResult('post_dispatch',{p_title:title.value.trim(),p_category:cat?cat.value:'',p_body:body.value.trim()});
  if(result.ok){title.value='';body.value='';if(cat)cat.value='';toast(t('toast_dispatch_sent'),'var(--gold)');}
  else toast(t('error_dispatch_rpc')+' — '+(result.error||'unknown_error'),'var(--crim)');
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
window.loadKyc=loadKyc;
window.kycView=kycView;
window.kycVerdict=kycVerdict;
window.kycPurge=kycPurge;
window.kycIntake=kycIntake;

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
