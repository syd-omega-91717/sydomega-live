(function(global){
'use strict';
var TRUTH=Object.freeze({LIVE:'LIVE',USER_CREATED:'USER-CREATED',UNVERIFIED:'UNVERIFIED',BLOCKED:'BLOCKED'});
function clean(v){return typeof v==='string'?v.trim():'';}
function unique(a){return Array.from(new Set((a||[]).filter(Boolean)));}
function assessProvider(p){p=p||{};var m=[];if(!clean(p.id))m.push('provider id');if(p.configured!==true)m.push('configuration');if(p.authorizationVerified!==true)m.push('authorization');if(p.failureTested!==true)m.push('failure handling');if(p.idempotencyVerified!==true)m.push('idempotency');if(p.productionEvidence!==true)m.push('production evidence');return{id:clean(p.id),truthState:m.length?TRUTH.UNVERIFIED:TRUTH.LIVE,ready:m.length===0,missing:unique(m)};}
function assessEntitlement(i){i=i||{};var r=[];if(i.providerWebhookVerified!==true)r.push('verified provider webhook is required');if(i.signatureVerified!==true)r.push('webhook signature is not verified');if(i.idempotencyVerified!==true)r.push('idempotency is not verified');if(i.paymentState!=='PAID')r.push('payment state is not PAID');if(i.authorizationVerified!==true)r.push('authorization is not verified');return{truthState:r.length?TRUTH.BLOCKED:TRUTH.LIVE,grant:r.length===0,reasons:r};}
function assessDataExport(i){i=i||{};var r=[];if(i.authenticated!==true)r.push('authentication required');if(i.authorizationVerified!==true)r.push('authorization required');if(i.scopeVerified!==true)r.push('export scope must be verified');return{truthState:r.length?TRUTH.BLOCKED:TRUTH.USER_CREATED,ready:r.length===0,reasons:r};}
function assessNotification(i){i=i||{};var r=[];if(i.providerConfirmed!==true)r.push('provider delivery is unconfirmed');if(i.preferenceAllowed!==true)r.push('user notification preference does not permit delivery');if(i.authorized!==true)r.push('notification action is not authorized');return{truthState:r.length?TRUTH.UNVERIFIED:TRUTH.LIVE,deliver:r.length===0,reasons:r};}
global.OmegaControlPlaneContracts=Object.freeze({TRUTH:TRUTH,assessProvider:assessProvider,assessEntitlement:assessEntitlement,assessDataExport:assessDataExport,assessNotification:assessNotification});
})(typeof window!=='undefined'?window:globalThis);
