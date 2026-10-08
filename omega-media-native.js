/* Ω MEDIA NATIVE — truth-aware media catalog projection.
 * The current media hub is a static/presentation catalog. It must not imply
 * that its franchise, series or game arrays are persisted production assets.
 */
(function(root){
'use strict';
function render(){
 var el=document.getElementById('media-native-state');if(!el)return;
 var cards=[
  ['CATALOG','CALCULATED','Static catalog/presentation data'],
  ['FRANCHISE / SAGA','LORE','Creative universe material; not production deployment proof'],
  ['SERIES / GAMES','LORE','Concept/development presentation; not shipped runtime state'],
  ['MEMBER MEDIA','UNAVAILABLE','No verified canonical member-media table is exposed by the current media hub'],
  ['PERSISTED MEDIA STATE','UNAVAILABLE','Current evidence matrix records media.html as having no persisted state'],
  ['STORAGE','UNVERIFIED','Supabase Storage is referenced by the page framework, but this hub does not establish a live media-storage inventory']
 ];
 el.innerHTML='<div class="native-grid">'+cards.map(function(c){return '<div class="native-card"><b>'+c[1]+'</b><span>'+c[0]+'</span><small>'+c[2]+'</small></div>';}).join('')+'</div><p class="native-boundary">TRUTH BOUNDARY: catalog concepts, franchise metadata and visual assets remain presentation material unless a governed persisted source proves otherwise. This surface does not claim publication, distribution, subscription entitlement, advertising inventory, ownership or deployment.</p>';
}
root.OmegaMediaNative={render:render};
})(globalThis);
