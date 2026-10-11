/* Ω DATA REALITY FABRIC — governed source registry reader. */
(function(root){
'use strict';
var STATES=new Set(['LIVE','CALCULATED','SIMULATED','USER_CREATED','LORE','UNAVAILABLE','UNVERIFIED','BLOCKED']);
function client(){
  if(root.OmegaSB&&typeof root.OmegaSB.get==='function')return root.OmegaSB.get();
  return Promise.resolve(root.__omegaSb||null);
}
function add(parent,tag,cls,text){
  var e=document.createElement(tag);
  if(cls)e.className=cls;
  if(text!==undefined)e.textContent=text;
  parent.appendChild(e);
  return e;
}
async function read(){
  var sb=await client();
  if(!sb)throw new Error('DATABASE_CLIENT_UNAVAILABLE');
  var session=(await sb.auth.getSession()).data.session;
  if(!session||!session.user)throw new Error('SIGN_IN_REQUIRED');
  var r=await sb.from('omega_data_sources').select('source_key,domain,display_name,source_uri,access_mode,truth_state,freshness_seconds,last_verified_at,status_reason,active').eq('active',true).order('domain').order('display_name');
  if(r.error)throw r.error;
  return r.data||[];
}
async function render(target){
  var box=typeof target==='string'?document.getElementById(target):target;
  if(!box)return {state:'UNAVAILABLE',count:0};
  box.replaceChildren();
  try{
    var rows=await read();
    rows.forEach(function(row){
      var state=STATES.has(row.truth_state)?row.truth_state:'UNVERIFIED';
      var card=add(box,'article','data-source-card');
      add(card,'b',null,row.display_name);
      add(card,'span','data-source-state',state);
      add(card,'span',null,(row.domain||'platform').toUpperCase()+' · '+(row.access_mode||'UNKNOWN'));
      add(card,'small',null,row.last_verified_at?'Verified '+new Date(row.last_verified_at).toLocaleString():'Verification pending');
      if(row.status_reason)add(card,'p',null,row.status_reason);
    });
    return {state:'LIVE',count:rows.length};
  }catch(e){
    var state=add(box,'div','data-source-empty','DATA SOURCE REGISTRY UNAVAILABLE');
    state.setAttribute('role','status');
    return {state:'UNAVAILABLE',count:0};
  }
}
root.OmegaDataReality={read:read,render:render,STATES:STATES};
})(globalThis);
