/* Ω INVEST NATIVE — read-only financial state projection. No balances or market values are fabricated. */
(function(root){
'use strict';
function client(){if(root.OmegaSB&&typeof root.OmegaSB.get==='function')return root.OmegaSB.get();return Promise.resolve(root.__omegaSb||null);}
async function start(){var sb=await client();if(!sb)throw new Error('DATABASE_CLIENT_UNAVAILABLE');var s=(await sb.auth.getSession()).data.session;if(!s||!s.user)throw new Error('SIGN_IN_REQUIRED');return {sb:sb,uid:s.user.id};}
async function count(sb,table,column,uid){var q=sb.from(table).select('*',{count:'exact',head:true});if(column)q=q.eq(column,uid);var r=await q;if(r.error)throw r.error;return Number(r.count||0);}
async function load(){
 var x=await start(),sb=x.sb,uid=x.uid;
 var p=await sb.from('profiles').select('is_owner,access_approved,subscription_tier,subscription_status,subscription_period_end').eq('id',uid).maybeSingle();
 if(p.error)throw p.error;
 var out={truth_state:'LIVE',authorization:{truth_state:'LIVE',authenticated:true,access_approved:p.data&&p.data.access_approved===true,is_owner:p.data&&p.data.is_owner===true},
 subscription:{truth_state:p.data?'LIVE':'EMPTY',tier:p.data&&p.data.subscription_tier||null,status:p.data&&p.data.subscription_status||null,period_end:p.data&&p.data.subscription_period_end||null},
 wallet_accounts:{truth_state:'UNAVAILABLE',count:null},wallet_transactions:{truth_state:'UNAVAILABLE',count:null},token_balances:{truth_state:'UNAVAILABLE',count:null},investment_watchlists:{truth_state:'UNAVAILABLE',count:null},payments:{truth_state:'UNAVAILABLE',count:null}};
 var specs=[['wallet_accounts','wallet_accounts','profile_id'],['wallet_transactions','wallet_transactions','profile_id'],['token_balances','token_balances','user_id'],['omega_investment_watchlists','omega_investment_watchlists','user_id'],['payments','payments','user_id']];
 for(var i=0;i<specs.length;i++){try{var n=await count(sb,specs[i][1],specs[i][2],uid);out[specs[i][0]]={truth_state:n?'LIVE':'EMPTY',count:n};}catch(e){out[specs[i][0]]={truth_state:'UNAVAILABLE',count:null,error:String(e&&e.message||e)};}}
 return out;
}
function esc(v){return String(v==null?'—':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function render(d){var el=document.getElementById('invest-native-state');if(!el)return;var s=d.subscription||{};var cards=[['SUBSCRIPTION',s.status||'NO STATUS',s.truth_state],['WALLET ACCOUNTS',d.wallet_accounts.count,d.wallet_accounts.truth_state],['WALLET TRANSACTIONS',d.wallet_transactions.count,d.wallet_transactions.truth_state],['TOKEN BALANCE RECORDS',d.token_balances.count,d.token_balances.truth_state],['INVESTMENT WATCHLISTS',d.investment_watchlists.count,d.investment_watchlists.truth_state],['PAYMENT RECORDS',d.payments.count,d.payments.truth_state]];el.innerHTML='<div class="native-grid">'+cards.map(function(c){return '<div class="native-card"><b>'+esc(c[1])+'</b><span>'+c[0]+'</span><em>'+esc(c[2])+'</em></div>';}).join('')+'</div><p class="native-boundary">LIVE means an authenticated canonical record was readable. This projection never converts a record count into a balance, price, valuation, reserve, profit or investment recommendation.</p>';}
root.OmegaInvestNative={load:load,render:render};
})(globalThis);
