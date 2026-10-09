/* Ω MEDIA NATIVE — truth-aware projection over the canonical persisted media catalog. */
(function(root){
'use strict';
async function load(){
 if(!root.OmegaContentFabric)throw new Error('CONTENT_FABRIC_UNAVAILABLE');
 var result=await root.OmegaContentFabric.list({sources:['media_items']});
 if(result.truth_state==='UNAVAILABLE'&&result.errors&&result.errors.indexOf('SIGN_IN_REQUIRED')>=0)throw new Error('SIGN_IN_REQUIRED');
 return {truth_state:result.truth_state,items:result.items||[],errors:result.errors||[]};
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
