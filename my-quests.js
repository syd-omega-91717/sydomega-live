/* my-quests.html -- page logic (kept out of the HTML: scripts/csp-inline-ratchet.py). */
import{createClient}from'/vendor/supabase-js.js';
var sb=window.__omegaSb||(window.__omegaSb=createClient('https://ydqhzvvoyufiiqvzcjns.supabase.co','sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q'));

/* Gamification Phase 2 -- public.member_quests. RLS scopes every row to its
   author; insert/update additionally require gamification_enabled. Every write
   checks .error, and updates/deletes ask for the affected rows back: RLS
   filters a row it rejects silently (0 rows, no error), so "no error" alone
   is not success (CLAUDE.md section 8.1 class 1). */
var state={uid:null,filter:'active',rows:[],busy:false};
var STARS=['','★','★★','★★★','★★★★','★★★★★'];

function msg(text,isErr){var m=document.getElementById('mq-msg');m.textContent=text||'';m.classList.toggle('err',!!isErr);}

async function load(){
  var r=await sb.from('member_quests').select('id,title,description,difficulty,element,status,completed_at,created_at')
    .eq('user_id',state.uid).order('created_at',{ascending:false});
  var host=document.getElementById('mq-list');
  if(r.error){host.textContent='';var e=document.createElement('p');e.className='mq-note';e.textContent='Could not load your quests right now.';host.appendChild(e);return;}
  state.rows=r.data||[];
  render();
}

function render(){
  var host=document.getElementById('mq-list');host.textContent='';
  var rows=state.rows.filter(function(q){return q.status===state.filter;});
  if(!rows.length){
    var e=document.createElement('p');e.className='mq-note';
    e.textContent=state.filter==='active'?'No active quests. Create your first one above.':'Nothing here yet.';
    host.appendChild(e);return;
  }
  rows.forEach(function(q){host.appendChild(card(q));});
}

function card(q){
  var el=document.createElement('div');el.className='card mq-card'+(q.status==='completed'?' done':'');
  var head=document.createElement('div');head.className='mq-head';
  var t=document.createElement('div');t.className='mq-title';t.textContent=q.title;
  var d=document.createElement('div');d.className='mq-diff';d.textContent=STARS[q.difficulty]||'';d.setAttribute('aria-label','Difficulty '+q.difficulty+' of 5');
  head.appendChild(t);head.appendChild(d);el.appendChild(head);
  if(q.description){var p=document.createElement('div');p.className='mq-desc';p.textContent=q.description;el.appendChild(p);}
  var meta=document.createElement('div');meta.className='mq-meta';
  var bits=[];if(q.element)bits.push(q.element.toUpperCase());
  bits.push(q.status==='completed'&&q.completed_at?'DONE '+new Date(q.completed_at).toLocaleDateString():'CREATED '+new Date(q.created_at).toLocaleDateString());
  meta.textContent=bits.join(' · ');el.appendChild(meta);
  var btns=document.createElement('div');btns.className='mq-btns';
  function b(label,cls,fn){var x=document.createElement('button');x.type='button';x.className=cls;x.textContent=label;x.onclick=function(){fn(x);};btns.appendChild(x);}
  if(q.status==='active'){
    b('COMPLETE','btn btn-fill',function(x){update(x,q.id,{status:'completed',completed_at:new Date().toISOString()},'Quest completed.');});
    b('ARCHIVE','btn',function(x){update(x,q.id,{status:'archived'},'Quest archived.');});
  }else{
    b('REOPEN','btn',function(x){update(x,q.id,{status:'active',completed_at:null},'Quest reopened.');});
  }
  b('DELETE','btn',function(x){remove(x,q.id);});
  el.appendChild(btns);
  return el;
}

async function update(btn,id,patch,okText){
  if(state.busy)return;state.busy=true;btn.disabled=true;
  var r=await sb.from('member_quests').update(patch).eq('id',id).eq('user_id',state.uid).select('id');
  state.busy=false;
  if(r.error||!r.data||!r.data.length){btn.disabled=false;msg('That change did not save. Please try again.',true);return;}
  msg(okText);await load();
}

async function remove(btn,id){
  if(state.busy)return;
  if(!confirm('Delete this quest permanently?'))return;
  state.busy=true;btn.disabled=true;
  var r=await sb.from('member_quests').delete().eq('id',id).eq('user_id',state.uid).select('id');
  state.busy=false;
  if(r.error||!r.data||!r.data.length){btn.disabled=false;msg('That quest was not deleted. Please try again.',true);return;}
  msg('Quest deleted.');await load();
}

document.getElementById('mq-form').addEventListener('submit',async function(ev){
  ev.preventDefault();
  if(state.busy)return;
  var title=document.getElementById('mq-title').value.trim();
  var desc=document.getElementById('mq-desc').value.trim();
  var diff=parseInt(document.getElementById('mq-diff').value,10)||1;
  var elem=document.getElementById('mq-elem').value||null;
  if(title.length<3){msg('Give your quest a title of at least 3 characters.',true);document.getElementById('mq-title').focus();return;}
  var btn=document.getElementById('mq-submit');
  state.busy=true;btn.disabled=true;msg('Saving…');
  var r=await sb.from('member_quests').insert({title:title,description:desc||null,difficulty:diff,element:elem}).select('id');
  state.busy=false;btn.disabled=false;
  if(r.error||!r.data||!r.data.length){msg('Your quest was not saved. Please try again.',true);return;}
  ev.target.reset();msg('Quest created.');
  setFilter('active');await load();
});

function setFilter(f){
  state.filter=f;
  document.querySelectorAll('.mq-filter .btn').forEach(function(x){x.setAttribute('aria-pressed',String(x.dataset.filter===f));});
  render();
}
document.querySelectorAll('.mq-filter .btn').forEach(function(x){x.addEventListener('click',function(){setFilter(x.dataset.filter);});});

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
