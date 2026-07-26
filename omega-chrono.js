/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN TRIAL CHRONOMETER
   Automatically shows the 9h 17m 17s countdown on every page
   the moment a member receives access approval.
   ========================================================================== */
(function(){

var TRIAL_TOTAL = 33437; /* 9 hours, 17 minutes, 17 seconds — the sovereign dedication */

/* ── Format seconds to HH:MM:SS ─────────────────────────────────────────── */
function fmtHMS(sec){
  sec=Math.max(0,Math.floor(sec));
  var h=Math.floor(sec/3600);
  var m=Math.floor((sec%3600)/60);
  var s=sec%60;
  return (h<10?'0':'')+h+':'+(m<10?'0':'')+m+':'+(s<10?'0':'')+s;
}

/* ── Format ISO timestamp to readable ───────────────────────────────────── */
function fmtTS(iso){
  try{
    return new Date(iso).toLocaleString('en-GB',{
      day:'2-digit',month:'short',year:'numeric',
      hour:'2-digit',minute:'2-digit',second:'2-digit'
    }).toUpperCase();
  }catch(e){return '--';}
}

/* ── Inject chronometer bar into page ───────────────────────────────────── */
function injectChrono(expiresAt, startsAt){
  if(document.getElementById('omega-chrono-bar')) return; /* already injected */

  var bar = document.createElement('div');
  bar.id = 'omega-chrono-bar';
  bar.style.cssText = [
    'position:fixed','top:0','left:0','right:0','z-index:8000',
    'background:rgba(2,2,6,.97)','border-bottom:1px solid rgba(201,168,76,.3)',
    'display:flex','align-items:center','gap:clamp(8px,2vw,24px)',
    'padding:8px clamp(12px,3vw,32px)','flex-wrap:wrap',
    'box-shadow:0 2px 20px rgba(201,168,76,.1)',
  ].join(';');

  bar.innerHTML =
    '<div style="font-family:\'Cinzel Decorative\',serif;font-size:9px;color:rgba(201,168,76,.6);letter-spacing:2px;flex-shrink:0">&#937; SOVEREIGN TRIAL</div>'
    +'<div style="display:flex;flex-direction:column;gap:2px;flex-shrink:0">'
      +'<div style="font-family:\'Courier Prime\',monospace;font-size:7px;letter-spacing:1.5px;color:rgba(138,134,118,.6)">STARTED</div>'
      +'<div id="omega-chrono-start" style="font-family:\'Courier Prime\',monospace;font-size:9px;color:#8a8676">'+fmtTS(startsAt)+'</div>'
    +'</div>'
    +'<div style="display:flex;flex-direction:column;gap:2px;flex-shrink:0">'
      +'<div style="font-family:\'Courier Prime\',monospace;font-size:7px;letter-spacing:1.5px;color:rgba(138,134,118,.6)">EXPIRES</div>'
      +'<div id="omega-chrono-end" style="font-family:\'Courier Prime\',monospace;font-size:9px;color:#8a8676">'+fmtTS(expiresAt)+'</div>'
    +'</div>'
    +'<div style="flex:1;min-width:0">'
      +'<div id="omega-chrono-track" style="height:3px;background:rgba(201,168,76,.08);border-radius:2px;overflow:hidden;margin-bottom:4px">'
        +'<div id="omega-chrono-fill" style="height:100%;background:#C9A84C;border-radius:2px;transition:width .9s linear;width:100%"></div>'
      +'</div>'
      +'<div style="font-family:\'Courier Prime\',monospace;font-size:7px;letter-spacing:1.5px;color:rgba(138,134,118,.5);text-align:center">9 HOURS \u00b7 17 MINUTES \u00b7 17 SECONDS \u00b7 THE SOVEREIGN DEDICATION</div>'
    +'</div>'
    +'<div style="text-align:right;flex-shrink:0">'
      +'<div id="omega-chrono-time" style="font-family:\'Cinzel Decorative\',serif;font-size:clamp(18px,3vw,26px);color:#C9A84C;line-height:1;letter-spacing:.05em">09:17:17</div>'
      +'<div style="font-family:\'Courier Prime\',monospace;font-size:7px;letter-spacing:2px;color:rgba(138,134,118,.6);margin-top:2px">REMAINING</div>'
    +'</div>';

  document.body.insertBefore(bar, document.body.firstChild);

  /* Push page content down */
  setTimeout(function(){
    var h = bar.offsetHeight + 4;
    var topbars = document.querySelectorAll('.topbar,[class*="topbar"]');
    topbars.forEach(function(t){
      if(getComputedStyle(t).position==='sticky'){
        t.style.top = h+'px';
      }
    });
    if(document.getElementById('app')){
      document.getElementById('app').style.paddingTop = h+'px';
    }
  }, 100);

  /* ── TICK ── */
  function tick(){
    var rem = Math.max(0, new Date(expiresAt) - Date.now());
    var remSec = rem / 1000;
    var pct = Math.min(100, (remSec / TRIAL_TOTAL * 100));

    var timeEl = document.getElementById('omega-chrono-time');
    var fillEl = document.getElementById('omega-chrono-fill');

    if(timeEl) timeEl.textContent = fmtHMS(remSec);
    if(fillEl)  fillEl.style.width = pct.toFixed(2)+'%';

    /* Color shift as time runs low */
    if(timeEl){
      if(remSec < 3600)       timeEl.style.color = '#E2C86D';  /* < 1 hour: solar */
      if(remSec < 1800)       timeEl.style.color = '#ff9900';  /* < 30 min: orange */
      if(remSec < 600)        timeEl.style.color = '#8B0000';  /* < 10 min: crimson */
      if(fillEl&&remSec<3600) fillEl.style.background='#E2C86D';
      if(fillEl&&remSec<600)  fillEl.style.background='#8B0000';
    }

    if(rem <= 0){
      if(timeEl){ timeEl.textContent='EXPIRED'; timeEl.style.color='#8B0000'; }
      if(bar) bar.style.borderBottomColor='rgba(139,0,0,.5)';
      /* Expire the session */
      if(window.__omegaSb){
        window.__omegaSb.rpc('my_trial_status').catch(function(){});
      }
      setTimeout(function(){
        if(window.location.pathname!=='/pending.html'){
          window.location.replace('/pending.html?expired=1');
        }
      }, 2500);
      return;
    }
    setTimeout(tick, 1000);
  }
  tick();
}

/* ── CHECK & START ───────────────────────────────────────────────────────── */
window.__omegaStartChrono = function(expiresISO, startsISO){
  if(!expiresISO) return;
  var rem = new Date(expiresISO) - Date.now();
  if(rem <= 0) return; /* already expired */
  var starts = startsISO || new Date(new Date(expiresISO).getTime() - TRIAL_TOTAL*1000).toISOString();
  injectChrono(expiresISO, starts);
  /* Also populate standard elements */
  document.querySelectorAll('#trial-countdown,#plan-countdown,#mem-trial-cd').forEach(function(el){
    el.style.display='';
  });
  var lbl=document.getElementById('mem-trial-cd-lbl');
  if(lbl) lbl.style.display='block';
};

/* ── AUTO-CHECK on every page ─────────────────────────────────────────────── */

/* Also trigger when user data is populated */
document.addEventListener('omega:populated',function(e){
  var pr=e.detail&&e.detail.profile;
  if(!pr||pr.is_owner||!pr.is_trial||!pr.trial_expires_at) return;
  if(new Date(pr.trial_expires_at)<=new Date()) return;
  var starts=pr.access_requested_at||
    new Date(new Date(pr.trial_expires_at).getTime()-TRIAL_TOTAL*1000).toISOString();
  window.__omegaStartChrono(pr.trial_expires_at,starts);
});

(function autoCheck(){
  var tries=0;
  var iv=setInterval(function(){
    tries++;
    if(window.__omegaSb){
      window.__omegaSb.auth.getSession().then(function(resp){
        var sess=resp.data&&resp.data.session;
        if(!sess){clearInterval(iv);return;}
        return window.__omegaSb.from('profiles')
          .select('is_owner,is_trial,trial_expires_at,access_approved,access_requested_at')
          .eq('id',sess.user.id)
          .maybeSingle()
          .then(function(r){
            var pr=r.data||{};
            if(pr.is_owner){clearInterval(iv);return;}
            if(!pr.access_approved){clearInterval(iv);return;}
            if(pr.is_trial&&pr.trial_expires_at&&new Date(pr.trial_expires_at)>new Date()){
              var starts=pr.access_requested_at||
                         new Date(new Date(pr.trial_expires_at).getTime()-TRIAL_TOTAL*1000).toISOString();
              window.__omegaStartChrono(pr.trial_expires_at, starts);
              clearInterval(iv);
            } else {
              clearInterval(iv);
            }
          });
      }).catch(function(){});
    }
    if(tries>20) clearInterval(iv);
  }, 500);
})();

})();
