/* Ω WORLD PROGRESSION BRIDGE
   Uses the existing authenticated profile progression source.
   Output is CALCULATED PRESENTATION, never an entitlement or achievement award. */
(function(){'use strict';
if(window.OmegaWorldProgression)return;
var PHI=1.6180339887,EU=2.7182818285,APEX=27.8367;
var THRESHOLDS=[2.32,3.98,5.95,8.29,11,13.92,17.21,20.87,24.01,25.9,27.1,27.8367];
var GNAMES=['INITIATE','ACOLYTE','SCHOLAR','KEEPER','GUARDIAN','ARCHITECT','SOVEREIGN','VANGUARD','HERALD','ORACLE','PRIME','APEX SOVEREIGN'];
var PHASES=window.OmegaLegacyConstellation&&window.OmegaLegacyConstellation.phases||[];
function el(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;}
function imageUrl(p){return '/BlockChain_Market_Analysis_syd_omega_91717/Phases_syd_omega_91717/'+encodeURIComponent(p[2]);}
function authority(a,b,c){return Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;}
function state(a,b,c){
  var auth=authority(a,b,c),gi=THRESHOLDS.findIndex(function(t){return auth<t;});
  if(gi<0)gi=12;
  var gate=GNAMES[Math.max(0,gi-1)], phaseIndex=PHASES.length?Math.min(PHASES.length-1,Math.max(0,Math.round((auth/APEX)*(PHASES.length-1)))):0;
  return {a:a,b:b,c:c,auth:auth,gate:gate,gateIndex:Math.min(12,Math.max(1,gi||1)),next:gi<12?THRESHOLDS[gi]:APEX,phase:PHASES[phaseIndex]||null,phaseIndex:phaseIndex};
}
function render(s){
  var host=document.getElementById('omega-world-progression');if(!host)return;
  host.replaceChildren();
  var head=el('div','ow-progress-head');
  var title=el('div','ow-progress-title','CALCULATED WORLD STATE');
  var badge=el('span','ow-progress-badge','CALCULATED');head.appendChild(title);head.appendChild(badge);host.appendChild(head);
  var grid=el('div','ow-progress-grid');
  [['AUTHORITY',s.auth.toFixed(4)],['GATE',s.gate+' · '+s.gateIndex+'/12'],['NEXT GATE',s.next.toFixed(2)],['AXES',s.a.toFixed(2)+' / '+s.b.toFixed(2)+' / '+s.c.toFixed(2)]].forEach(function(x){var card=el('div','ow-progress-stat');card.appendChild(el('b',null,x[1]));card.appendChild(el('span',null,x[0]));grid.appendChild(card);});
  host.appendChild(grid);
  if(s.phase){
    var phase=el('div','ow-progress-phase');
    var im=document.createElement('img');im.src=imageUrl(s.phase);im.alt=s.phase[1]+' calculated presentation source asset';im.loading='lazy';im.decoding='async';phase.appendChild(im);
    var body=el('div','ow-progress-phase-body');body.appendChild(el('strong',null,'VISUAL PHASE · '+String(s.phaseIndex+1).padStart(2,'0')));
    body.appendChild(el('span',null,s.phase[1]));
    body.appendChild(el('p',null,'Calculated from the authenticated profile axes. This selects presentation artwork only; it does not grant a tier, credential, achievement, ownership right, or financial entitlement.'));
    var link=document.createElement('a');link.href='/evolution.html';link.textContent='OPEN EVOLUTION';link.className='ow-progress-link';body.appendChild(link);
    phase.appendChild(body);host.appendChild(phase);
  }
}
function unavailable(reason){
  var host=document.getElementById('omega-world-progression');if(!host)return;
  host.replaceChildren();
  var head=el('div','ow-progress-head');head.appendChild(el('div','ow-progress-title','WORLD PROGRESSION STATE'));head.appendChild(el('span','ow-progress-badge unavailable','UNAVAILABLE'));host.appendChild(head);
  host.appendChild(el('p','ow-progress-note',reason||'Authenticated progression state is unavailable. The World remains usable in route/source mode.'));
}
async function boot(){
  if(!document.getElementById('omega-world-progression'))return;
  try{
    var sb=window.__omegaSb;
    if(!sb){var mod=await import('/vendor/supabase-js.js');sb=window.__omegaSb=mod.createClient('https://ydqhzvvoyufiiqvzcjns.supabase.co','sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q');}
    var session=(await sb.auth.getSession()).data.session;
    if(!session){unavailable('Sign in to reveal your calculated World progression. No member state is inferred while signed out.');return;}
    var result=await sb.from('profiles').select('axis_a,axis_b,axis_c,is_owner,access_approved').eq('id',session.user.id).maybeSingle();
    if(result.error||!result.data){unavailable('Profile progression could not be read. The World does not substitute estimated values.');return;}
    var p=result.data;
    if(!p.is_owner&&!p.access_approved){unavailable('Your access is not approved for progression state. The World remains available in source mode.');return;}
    render(state(Number(p.is_owner?9:p.axis_a||0),Number(p.is_owner?9:p.axis_b||0),Number(p.is_owner?9:p.axis_c||0)));
  }catch(e){unavailable('Progression state is temporarily unavailable. Retry through Evolution.');}
}
window.OmegaWorldProgression={boot:boot,state:state};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();