/* Ω CONTENT TASK FABRIC — governed upload/register/download orchestration. */
(function(root){
'use strict';
var MAX=50*1024*1024;
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
  if(r.error)return {error:'FUNCTION_INVOCATION_FAILED',data:r.data||null};
  return {error:null,data:r.data||null};
}
async function cleanupUploaded(path){
  if(typeof path!=='string'||!path)return false;
  if(!root.OmegaStorage||typeof root.OmegaStorage.remove!=='function')return false;
  try{
    var removed=await root.OmegaStorage.remove('uploads',path);
    return !!removed&&!removed.error;
  }catch(_error){return false;}
}
function cleanupTask(error,path,confirmed){
  return confirmed
    ? task('ROLLED_BACK',{truth_state:'LIVE',error:error,path:path,cleanup_state:'CONFIRMED'})
    : task('ROLLBACK_REQUIRED',{truth_state:'UNAVAILABLE',error:error,path:path,cleanup_state:'UNCONFIRMED'});
}
async function upload(file,options){
  options=options||{};
  if(!file||typeof file.name!=='string'||typeof file.size!=='number'||!Number.isFinite(file.size)||file.size<0)
    return task('FAILED',{truth_state:'UNAVAILABLE',error:'NO_FILE'});
  if(file.size>MAX)return task('FAILED',{truth_state:'UNAVAILABLE',error:'FILE_TOO_LARGE'});
  var uploaded=null;
  var uploaded=null,registrationStarted=false;
  try{
    var sb=await client(),s=await session(sb);
    if(!s)return task('FAILED',{truth_state:'UNAVAILABLE',error:'SIGN_IN_REQUIRED'});
    if(!root.OmegaStorage||typeof root.OmegaStorage.upload!=='function')
      return task('FAILED',{truth_state:'UNAVAILABLE',error:'STORAGE_HELPER_UNAVAILABLE'});
    uploaded=await root.OmegaStorage.upload('uploads',file);
    if(!uploaded||uploaded.error||typeof uploaded.path!=='string'||!uploaded.path)
      return task('FAILED',{truth_state:'UNAVAILABLE',error:'UPLOAD_FAILED'});
    registrationStarted=true;
    var registered=await invoke(sb,'content-ingest',{
      bucket:'uploads',
      path:uploaded.path,
      filename:file.name,
      mime_type:file.type||null,
      size_bytes:file.size,
      requested_content_type:options.content_type||null
    });
    if(registered.error||!registered.data||registered.data.ok!==true){
      var error=(registered.data&&registered.data.error)||registered.error||'REGISTRATION_FAILED';
      // Client-side Storage DELETE is not authorized by the current RLS policy.
      // Only the privileged Edge Function's explicit compensation result can
      // prove cleanup; otherwise surface an actionable unresolved state.
      if(registered.data&&registered.data.rollback_state==='complete')
        return task('ROLLED_BACK',{truth_state:'LIVE',error:error,path:uploaded.path,cleanup_state:'CONFIRMED'});
      return task('ROLLBACK_REQUIRED',{truth_state:'UNAVAILABLE',error:error,path:uploaded.path,cleanup_state:'UNCONFIRMED'});
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
  }catch(_error){
    if(uploaded&&typeof uploaded.path==='string'&&uploaded.path)
      return task('ROLLBACK_REQUIRED',{truth_state:'UNAVAILABLE',error:'UNEXPECTED_PIPELINE_ERROR',path:uploaded.path,cleanup_state:'UNCONFIRMED'});
    if(registered.data&&registered.data.ok===true){
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
    var error=(registered.data&&registered.data.error)||registered.error||'REGISTRATION_FAILED';
    if(registered.data&&registered.data.rollback_state==='complete')
      return task('ROLLED_BACK',{truth_state:'LIVE',error:error,path:uploaded.path,cleanup_state:'CONFIRMED'});
    if(registered.data&&registered.data.rollback_state==='partial')
      return task('ROLLBACK_REQUIRED',{truth_state:'UNAVAILABLE',error:error,path:uploaded.path,cleanup_state:'PARTIAL',support_review_required:true});
    // A transport failure without a response is ambiguous: the server may have
    // committed metadata/audit before the response was lost. Never delete the
    // object blindly and risk leaving a registered row pointing to missing data.
    if(registered.error&&!registered.data)
      return task('REGISTRATION_UNCERTAIN',{truth_state:'UNAVAILABLE',error:'REGISTRATION_RESPONSE_UNCONFIRMED',path:uploaded.path,cleanup_state:'NOT_ATTEMPTED',support_review_required:true});
    return cleanupTask(error,uploaded.path,await cleanupUploaded(uploaded.path));
  }
}
async function signedDownload(fileId){
  if(typeof fileId!=='string'||!fileId)return task('FAILED',{truth_state:'UNAVAILABLE',error:'FILE_ID_REQUIRED'});
  try{
    var sb=await client(),s=await session(sb);
    if(!s)return task('FAILED',{truth_state:'UNAVAILABLE',error:'SIGN_IN_REQUIRED'});
    var r=await invoke(sb,'content-delivery',{file_id:fileId});
    if(r.error||!r.data||r.data.ok!==true)
      return task('DENIED',{truth_state:'UNAVAILABLE',error:(r.data&&r.data.error)||r.error||'DELIVERY_DENIED'});
    return task('SIGNED',{truth_state:'LIVE',content_id:fileId,signed_url:r.data.signed_url,expires_at:r.data.expires_at});
  }catch(_error){
    return task('FAILED',{truth_state:'UNAVAILABLE',error:'DELIVERY_UNAVAILABLE'});
  }
}
root.OmegaContentTasks={MAX:MAX,upload:upload,signedDownload:signedDownload};
})(globalThis);
