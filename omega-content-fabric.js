/* Ω CONTENT FABRIC — read-only normalization across existing production content sources. */
(function(root){
'use strict';
function getClient(){
  if(root.OmegaSB&&typeof root.OmegaSB.get==='function')return root.OmegaSB.get();
  return Promise.resolve(root.__omegaSb||root.supabaseClient||null);
}
function typeFor(source,row){
  if(source==='media_items')return row.media_type||'catalog_item';
  if(source==='storage_files'){
    var m=String(row.mime_type||'').toLowerCase();
    if(m.indexOf('image/')===0)return 'image';
    if(m.indexOf('video/')===0)return 'video';
    if(m.indexOf('audio/')===0)return 'audio';
    if(m.indexOf('pdf')>=0||m.indexOf('document')>=0)return 'document';
    return 'other';
  }
  return row.asset_type||'user_asset';
}
function normalize(source,row){
  return {
    content_id:source+':'+String(row.id),
    source:source,
    content_type:typeFor(source,row),
    title:row.title||row.filename||row.name||'Untitled',
    created_at:row.created_at||null,
    truth_state:'LIVE',
    rights_state:'UNVERIFIED',
    publication_state:'UNVERIFIED',
    entitlement_state:'UNVERIFIED',
    delivery:{
      thumbnail:row.thumbnail_url||null,
      primary:row.video_url||row.storage_path||null
    },
    provenance:{
      owner_id:row.owner_id||row.user_id||null,
      checksum:row.checksum||null,
      mime_type:row.mime_type||null,
      size_bytes:row.size_bytes==null?null:row.size_bytes
    }
  };
}
async function query(sb,source,select){
  var r=await sb.from(source).select(select).limit(100);
  if(r.error)throw r.error;
  return (r.data||[]).map(function(row){return normalize(source,row);});
}
async function list(options){
  options=options||{};
  var sb=await getClient();
  if(!sb) return {truth_state:'UNAVAILABLE',items:[],errors:['DATABASE_CLIENT_UNAVAILABLE']};
  var session=await sb.auth.getSession();
  if(!session.data||!session.data.session) return {truth_state:'UNAVAILABLE',items:[],errors:['SIGN_IN_REQUIRED']};
  var sources=options.sources||['media_items','storage_files','user_assets'];
  var items=[],errors=[];
  var selects={
    media_items:'id,title,media_type,thumbnail_url,video_url,created_at',
    storage_files:'id,filename,storage_path,mime_type,size_bytes,checksum,owner_id,created_at,visibility',
    user_assets:'id,name,asset_type,user_id,created_at'
  };
  for(var i=0;i<sources.length;i++){
    var source=sources[i];
    if(!selects[source]){errors.push('UNSUPPORTED_SOURCE:'+source);continue;}
    try{items=items.concat(await query(sb,source,selects[source]));}
    catch(e){errors.push(source+':'+(e&&e.message?e.message:'QUERY_FAILED'));}
  }
  return {truth_state:items.length?'LIVE':(errors.length?'UNAVAILABLE':'EMPTY'),items:items,errors:errors};
}
root.OmegaContentFabric={list:list,normalize:normalize,typeFor:typeFor};
})(globalThis);
