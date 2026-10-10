/* Ω CREATION STUDIO — external content import controller; no inline script required. */
(function(root){
'use strict';
var form=document.getElementById('content-import-form');
var file=document.getElementById('content-import-file');
var type=document.getElementById('content-import-type');
var msg=document.getElementById('content-import-message');
if(!form||!file||!msg)return;
form.addEventListener('submit',async function(e){
  e.preventDefault();
  if(!root.OmegaContentTasks){msg.textContent='CONTENT TASK FABRIC UNAVAILABLE';return;}
  var f=file.files&&file.files[0];
  if(!f){msg.textContent='SELECT A FILE FIRST';return;}
  msg.textContent='UPLOADING · REGISTERING · VERIFYING OWNER PATH…';
  var r=await root.OmegaContentTasks.upload(f,{content_type:String(type&&type.value||'OTHER').toLowerCase()});
  if(r.state==='PENDING_REVIEW'){
    msg.textContent='REGISTERED: '+(r.data&&r.data.content_id||'CONTENT')+' · RIGHTS/PUBLICATION/ENTITLEMENT REMAIN UNVERIFIED';
  }else if(r.state==='ROLLED_BACK'){
    msg.textContent='ROLLED BACK: '+(r.data&&r.data.error||'REGISTRATION FAILED')+' · NO ORPHAN UPLOAD KEPT';
  }else{
    msg.textContent='NOT AVAILABLE: '+(r.data&&r.data.error||'UPLOAD FAILED');
  }
});
})(globalThis);
