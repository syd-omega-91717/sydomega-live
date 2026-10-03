/* cosmetics.html -- page logic (kept out of the HTML: scripts/csp-inline-ratchet.py). */
import{createClient}from'/vendor/supabase-js.js';
var sb=window.__omegaSb||(window.__omegaSb=createClient('https://ydqhzvvoyufiiqvzcjns.supabase.co','sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q'));

/* Gamification Phase 2. Catalogue = point_perks rows with a slot; purchase is
   the existing purchase_perk() (atomic balance check + ledger debit), equip is
   set_perk_equipped(). Both return {ok,error} inside data, and the transport
   can also fail with r.error -- both are checked before any success state
   (CLAUDE.md section 8.1 class 1). */
var ERRORS={
  insufficient_balance:'Not enough points yet.',
  already_owned:'You already own this.',
  unknown_perk:'That item no longer exists.',
  not_owned:'You need to own this before equipping it.',
  not_equippable:'This item cannot be equipped.',
  feature_disabled:'Cosmetics are not active yet.',
  not_authenticated:'Please sign in again.'
};
var state={uid:null,catalog:[],owned:{},busy:false};

function msg(text,isErr){var m=document.getElementById('cos-msg');m.textContent=text||'';m.classList.toggle('err',!!isErr);}
function sid(id,v){var el=document.getElementById(id);if(el)el.textContent=String(v==null?'--':v);}

async function call(fn,args){
  var r=await sb.rpc(fn,args);
  if(r.error)return{ok:false,error:r.error.message||'request_failed'};
  return r.data||{ok:false,error:'empty_response'};
}

async function load(){
  var cat=await sb.from('point_perks').select('id,name,cost,description,slot').not('slot','is',null).eq('active',true).order('cost');
  var own=await sb.from('member_perks').select('perk_id,equipped').eq('user_id',state.uid);
  var prog=await sb.rpc('my_progression');
  if(cat.error||own.error){msg('Could not load cosmetics right now. Please try again later.',true);return;}
  state.catalog=cat.data||[];
  state.owned={};(own.data||[]).forEach(function(o){state.owned[o.perk_id]=o;});
  var p=!prog.error&&prog.data&&prog.data.ok?prog.data:null;
  sid('cos-balance',p?p.balance:'--');sid('cos-level',p?p.level:'--');
  sid('cos-owned',state.catalog.filter(function(c){return state.owned[c.id];}).length+' / '+state.catalog.length);
  render(p?p.balance:0);
}

function render(balance){
  ['frame','aura','title'].forEach(function(slot){
    var host=document.getElementById('cos-'+slot);host.textContent='';
    var items=state.catalog.filter(function(c){return c.slot===slot;});
    if(!items.length){var e=document.createElement('p');e.className='cos-note';e.textContent='Nothing in this slot yet.';host.appendChild(e);return;}
    items.forEach(function(c){host.appendChild(card(c,balance));});
  });
}

function card(c,balance){
  var o=state.owned[c.id];
  var el=document.createElement('div');el.className='card cos-item';
  function t(tag,cls,text){var x=document.createElement(tag);x.className=cls;x.textContent=text;el.appendChild(x);return x;}
  t('div','cos-slot',c.slot.toUpperCase());
  t('div','cos-name',c.name);
  t('div','cos-desc',c.description||'');
  var foot=document.createElement('div');foot.className='cos-foot';el.appendChild(foot);
  var left=document.createElement('span');
  var btn=document.createElement('button');btn.type='button';btn.className='btn';
  if(!o){
    left.className='cos-cost';left.textContent=c.cost+' PTS';
    btn.className='btn btn-fill';btn.textContent='BUY';
    if(balance<c.cost){btn.disabled=true;btn.title='Not enough points yet';}
    btn.onclick=function(){act(btn,'purchase_perk',{p_perk_id:c.id},'Bought '+c.name+'.');};
  }else if(o.equipped){
    left.className='cos-state';left.textContent='EQUIPPED';
    btn.textContent='UNEQUIP';
    btn.onclick=function(){act(btn,'set_perk_equipped',{p_perk_id:c.id,p_equipped:false},'Unequipped '+c.name+'.');};
  }else{
    left.className='cos-state';left.style.color='var(--muted)';left.textContent='OWNED';
    btn.textContent='EQUIP';
    btn.onclick=function(){act(btn,'set_perk_equipped',{p_perk_id:c.id,p_equipped:true},'Equipped '+c.name+'.');};
  }
  foot.appendChild(left);foot.appendChild(btn);
  return el;
}

async function act(btn,fn,args,okText){
  if(state.busy)return;
  state.busy=true;btn.disabled=true;msg('Working…');
  var res=await call(fn,args);
  state.busy=false;
  if(!res.ok){msg(ERRORS[res.error]||'That did not go through. Nothing was charged.',true);btn.disabled=false;return;}
  msg(okText);
  await load();
}

(async function(){
  var s=(await sb.auth.getSession()).data.session;
  if(!s){location.replace('/account.html');return;}
  var pr=(await sb.from('profiles').select('*').eq('id',s.user.id).maybeSingle()).data||{};
  if(!pr.is_owner&&!pr.access_approved){location.replace('/pending.html');return;}
  document.getElementById('app').style.display='flex';
  if(window.__omegaPopulate)window.__omegaPopulate(pr,s.user);
  state.uid=s.user.id;
  await load();
})();
