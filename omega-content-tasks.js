/* Ω CONTENT TASK FABRIC — governed upload/register/download orchestration. */
(function(root){
'use strict';
var MAX=5*1024*1024*1024;
function task(state,data){return {task_type:'content_asset',state:state,truth_state:data&&data.truth_state||'UNAVAILABLE',data:data||null};}
async function client(){
  if(root.OmegaSB&&typeof root.OmegaSB.get==='function')return await root.OmegaSB.get();
  return root.supabaseClient||null;
}
async function session(sb){
  if(!sb||!sb.auth)return null;
  var r=await sb.auth.getSession();
  return r.data&&r.data.session||null;
}
async function invoke(sb,name,body){
  var r=await sb.functions.invoke(name,{body:body});
  if(r.error)return {error:r.error.message||String(r.error),data:r.data||null};
  return {error:null,data:r.data||null};
}
async function upload(file,options){
  options=options||{};
  if(!file||typeof file.name!=='string'||typeof file.size!=='number')return task('FAILED',{truth_state:'UNAVAILABLE',error:'NO_FILE'});
  if(file.size>MAX)return task('FAILED',{truth_state:'UNAVAILABLE',error:'FILE_TOO_LARGE'});
  var sb=await client(),s=await session(sb);
  if(!s)return task('FAILED',{truth_state:'UNAVAILABLE',error:'SIGN_IN_REQUIRED'});
  if(!root.OmegaStorage||typeof root.OmegaStorage.upload!=='function')return task('FAILED',{truth_state:'UNAVAILABLE',error:'STORAGE_HELPER_UNAVAILABLE'});
  var uploaded=await root.OmegaStorage.upload('uploads',file);
  if(!uploaded||uploaded.error)return task('FAILED',{truth_state:'UNAVAILABLE',error:(uploaded&&uploaded.error)||'UPLOAD_FAILED'});
  var registered=await invoke(sb,'content-ingest',{
    bucket:'uploads',
    path:uploaded.path,
    filename:file.name,
    mime_type:file.type||null,
    size_bytes:file.size,
    requested_content_type:options.content_type||null
  });
  if(registered.error||!registered.data||registered.data.ok!==true){
    if(root.OmegaStorage&&typeof root.OmegaStorage.remove==='function')await root.OmegaStorage.remove('uploads',uploaded.path);
    return task('ROLLED_BACK',{truth_state:'UNAVAILABLE',error:(registered.error)||(registered.data&&registered.data.error)||'REGISTRATION_FAILED',path:uploaded.path});
  }
  return task('PENDING_REVIEW',{
    truth_state:'LIVE',
    content_id:registered.data.content_id||null,
    file:registered.data.file||null,
    rights_state:'UNVERIFIED',
    publication_state:'UNVERIFIED',
    entitlement_state:'UNVERIFIED',
    scan_state:'UNAVAILABLE'
  });
}
async function signedDownload(fileId){
  if(typeof fileId!=='string'||!fileId)return task('FAILED',{truth_state:'UNAVAILABLE',error:'FILE_ID_REQUIRED'});
  var sb=await client(),s=await session(sb);
  if(!s)return task('FAILED',{truth_state:'UNAVAILABLE',error:'SIGN_IN_REQUIRED'});
  var r=await invoke(sb,'content-delivery',{file_id:fileId});
  if(r.error||!r.data||r.data.ok!==true)return task('DENIED',{truth_state:'UNAVAILABLE',error:(r.error)||(r.data&&r.data.error)||'DELIVERY_DENIED'});
  return task('SIGNED',{truth_state:'LIVE',content_id:fileId,signed_url:r.data.signed_url,expires_at:r.data.expires_at});
}
root.OmegaContentTasks={MAX:MAX,upload:upload,signedDownload:signedDownload};
})(globalThis);
