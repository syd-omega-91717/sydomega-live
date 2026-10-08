/* Ω MEDIA NATIVE — truth-aware projection over the canonical persisted media catalog. */
(function(root){
'use strict';
function client(){if(root.OmegaSB&&typeof root.OmegaSB.get==='function')return root.OmegaSB.get();return Promise.resolve(root.__omegaSb||null);}
async function load(){
 var sb=await client();if(!sb)throw new Error('DATABASE_CLIENT_UNAVAILABLE');
 var s=(await sb.auth.getSession()).data.session;if(!s||!s.user)throw new Error('SIGN_IN_REQUIRED');
 var r=await sb.from('media_items').select('id,title,media_type,status,created_at').order('created_at',{ascending:false}).limit(100);
 if(r.error)throw r.error;
 return {truth_state:r.data&&r.data.length?'LIVE':'EMPTY',items:r.data||[]};
}
function esc(v){return String(v==null?'—':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function render(d){
 var el=document.getElementById('media-native-state');if(!el)return;
 var items=d.items||[], live=items.length;
 var byType={};items.forEach(function(x){var k=x.media_type||'UNSPECIFIED';byType[k]=(byType[k]||0)+1;});
 var cards=[['PERSISTED MEDIA',live,d.truth_state],['MEMBER MEDIA','USER-SCOPED','RLS / AUTHORIZED'],['CATALOG TYPES',Object.keys(byType).length,'CALCULATED'],['FRANCHISE / SAGA','LORE','NOT PRODUCTION PROOF']];
 el.innerHTML='<div class="native-grid">'+cards.map(function(c){return '<div class="native-card"><b>'+esc(c[1])+'</b><span>'+esc(c[0])+'</span><small>'+esc(c[2])+'</small></div>';}).join('')+'</div><div class="native-boundary">TRUTH BOUNDARY: '+esc(live)+' persisted media_items are readable in the authenticated context. Static franchise/series/game material remains presentation or lore unless linked to governed persisted records. This projection does not infer publication, distribution, ownership, subscription entitlement or deployment from a catalog row.</div>';
}
root.OmegaMediaNative={load:load,render:render};
})(globalThis);
