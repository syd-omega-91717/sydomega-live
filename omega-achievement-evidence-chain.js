/* Ω ACHIEVEMENT EVIDENCE CHAIN — event-backed, RLS-scoped presentation */
(function(){
'use strict';
var root=document.getElementById('omega-achievement-chain'); if(!root)return;
function el(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;}
function badge(text){var n=el('span','oac-state',text);n.dataset.state=text;return n;}
function unavailable(msg){root.replaceChildren();var h=el('div','oac-head');h.appendChild(el('div','oac-title','ACHIEVEMENT EVIDENCE CHAIN'));h.appendChild(badge('UNAVAILABLE'));root.appendChild(h);root.appendChild(el('p','oac-note',msg));}
async function boot(){
var sb=window.__omegaSb;
if(!sb){try{var m=await import('/vendor/supabase-js.js');sb=window.__omegaSb=m.createClient('https://ydqhzvvoyufiiqvzcjns.supabase.co','sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q');}catch(e){unavailable('The shared data client could not be initialized. No achievement state is inferred.');return;}}
var session=(await sb.auth.getSession()).data.session;
if(!session){unavailable('Sign in to inspect your evidence-backed progression. Signed-out users receive no inferred achievement state.');return;}
var uid=session.user.id;
try{
var r=await Promise.all([
sb.from('evolution_events').select('id,axis,note,delta,created_at').eq('user_id',uid).order('created_at',{ascending:false}).limit(100),
sb.from('task_completions').select('id,kind,task,task_name,task_type,axis,completed_at,points_earned,auth_after').eq('user_id',uid).order('completed_at',{ascending:false}).limit(100),
sb.from('trophies').select('id,trophy_num,trophy_name,milestone,tier,earned_at').eq('user_id',uid).order('trophy_num'),
sb.from('medals').select('medal_num,earned_at').eq('user_id',uid).order('medal_num'),
sb.from('certificates').select('cert_num,issued_at').eq('user_id',uid).order('cert_num')
]);
for(var i=0;i<r.length;i++){if(r[i].error)throw r[i].error;}
var events=r[0].data||[],tasks=r[1].data||[],trophies=r[2].data||[],medals=r[3].data||[],certs=r[4].data||[];
root.replaceChildren();
var h=el('div','oac-head');h.appendChild(el('div','oac-title','ACHIEVEMENT EVIDENCE CHAIN'));h.appendChild(badge('LIVE'));root.appendChild(h);
root.appendChild(el('p','oac-note','Only persisted member records are counted. Source artwork is never treated as earned state. This is evidence presentation, not an authorization or entitlement engine.'));
var s=el('div','oac-stats');
[['EVOLUTION EVENTS',events.length],['TASK COMPLETIONS',tasks.length],['TROPHIES EARNED',trophies.length],['MEDALS AWARDED',medals.length],['CERTIFICATES ISSUED',certs.length]].forEach(function(x){var d=el('div','oac-stat');d.appendChild(el('b',null,String(x[1])));d.appendChild(el('span',null,x[0]));d.appendChild(el('small',null,'LIVE RECORDS'));s.appendChild(d);});root.appendChild(s);
var chain=el('div','oac-chain');
[['EVENT','Persisted evolution history',events.length>0],['TASK','Completed work record',tasks.length>0],['VERIFICATION','Persisted achievement row',trophies.length+medals.length+certs.length>0],['ACHIEVEMENT','Trophy / medal / certificate',trophies.length+medals.length+certs.length>0],['INVENTORY','User asset inventory',false],['WORLD','Presentation surface',true]].forEach(function(x,i){var n=el('div','oac-node');n.appendChild(el('strong',null,x[0]));n.appendChild(el('span',null,x[1]));n.appendChild(badge(x[2]?'EVIDENCED':'NOT-YET-EVIDENCED'));if(i<5)n.appendChild(el('i','oac-arrow','→'));chain.appendChild(n);});root.appendChild(chain);
var a=el('div','oac-actions');[['/trophies.html','OPEN TROPHY VAULT'],['/credentials.html','OPEN CREDENTIALS'],['/evolution.html','OPEN EVOLUTION']].forEach(function(x){var l=document.createElement('a');l.href=x[0];l.className='oac-link';l.textContent=x[1];a.appendChild(l);});root.appendChild(a);
var t=el('p','oac-truth');t.appendChild(el('strong',null,'TRUTH BOUNDARY: '));t.appendChild(document.createTextNode('Persisted rows prove records exist; they do not independently prove the underlying award rule was correctly executed. Inventory is not claimed because the live user_assets policy exposes SELECT only and no verified award-to-asset rule exists.'));root.appendChild(t);
}catch(e){unavailable('The evidence tables could not be read for this member. No achievement state is inferred.');}
}
boot();
})();