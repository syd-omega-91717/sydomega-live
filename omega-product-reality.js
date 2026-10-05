/* Ω PRODUCT REALITY — read-only projections over canonical production data. */
(function(root){
'use strict';
function client(){
  if(root.OmegaSB&&typeof root.OmegaSB.get==='function')return root.OmegaSB.get();
  return Promise.resolve(root.__omegaSb||null);
}
async function read(view){
  var sb=await client();
  if(!sb)throw new Error('DATABASE_CLIENT_UNAVAILABLE');
  var session=(await sb.auth.getSession()).data.session;
  if(!session||!session.user)throw new Error('SIGN_IN_REQUIRED');
  var result=await sb.from(view).select('*').maybeSingle();
  if(result.error)throw result.error;
  return result.data||null;
}
root.OmegaProductReality={
  member:function(){return read('omega_member_product_reality');},
  platform:function(){return read('omega_platform_product_reality');}
};
})(globalThis);
