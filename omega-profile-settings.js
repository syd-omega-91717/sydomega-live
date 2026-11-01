/* Ω Profile settings: the logic behind the SETTINGS tab of profile.html (FIXES_LOG 203).
   Moved here, unchanged in behaviour, from the former settings.html: void background, appearance
   overrides, calm mode, language, platform tour, data export/import/restore, deactivate and delete.
   Session and approval gating stay with profile.html. */
import { createClient } from '/vendor/supabase-js.js';
var sb=window.__omegaSb||(window.__omegaSb=createClient('https://ydqhzvvoyufiiqvzcjns.supabase.co','sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q'));

/* Data export / import. OmegaLocalBackup is loaded platform-wide by bg.js and
   defer-loaded, so it may not have published when this runs -- hence the guard
   rather than an assumption. */
(function(){
  function msg(s){ var el=document.getElementById('data-msg'); if(el) el.textContent=s; }
  function lb(){ return window.OmegaLocalBackup; }
  var __dataInit=function(){
    var ex=document.getElementById('btn-data-export');
    var im=document.getElementById('btn-data-import');
    var cl=document.getElementById('btn-data-cloud');
    /* Pull the account's member_state backup down. OmegaMemberState.restore
       resolves {restored, skipped, error} and never throws; keys this browser
       already holds are skipped, so nothing local is overwritten. */
    if(cl) cl.addEventListener('click', function(){
      var ms=window.OmegaMemberState;
      if(!ms||typeof ms.restore!=='function'){ msg('Cloud backup not loaded yet — reload the page and try again.'); return; }
      cl.disabled=true; msg('Restoring from your cloud backup…');
      ms.restore().then(function(r){
        cl.disabled=false;
        if(!r||r.error){ msg(r&&r.error==='not signed in' ? 'Sign in to restore your cloud backup.' : 'Restore failed: ' + ((r&&r.error)||'unknown error') + '. Nothing was changed.'); return; }
        if(!r.restored&&!r.skipped){ msg('Your cloud backup is empty — nothing to restore yet.'); return; }
        msg('Restored ' + r.restored + ' item' + (r.restored===1?'':'s')
            + (r.skipped ? ' — ' + r.skipped + ' already in this browser, kept as is.' : '.')
            + (r.restored ? ' Reload a page to see them.' : ''));
      });
    });
    if(ex) ex.addEventListener('click', function(){
      var b=lb();
      if(!b||!b.exportAll){ msg('Backup module not loaded — reload the page and try again.'); return; }
      var n=b.exportAll();
      msg(n ? ('Exported ' + n + ' item' + (n===1?'':'s') + ' to your downloads.')
            : 'Nothing stored in this browser yet — nothing to export.');
    });
    if(im) im.addEventListener('click', function(){
      var b=lb();
      if(!b||!b.importAll){ msg('Backup module not loaded — reload the page and try again.'); return; }
      b.importAll(function(ok, restored, rejected){
        if(!ok){ msg('That file could not be read. Choose a file exported from this platform.'); return; }
        msg('Restored ' + restored + ' item' + (restored===1?'':'s')
            + (rejected ? ' — ' + rejected + ' entry(s) ignored as not platform data.' : '')
            + ' Reload a page to see them.');
      });
    });
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',__dataInit);else __dataInit();
})();
var DEFAULT_BG='#0A0A0F';
var PRESETS=[['Void Black','#0A0A0F'],['Obsidian Navy','#06080f'],['Crimson Void','#0c0608'],['Forest Void','#060a08'],['Charcoal','#0e0e12'],['Deep Plum','#0a0710'],['Abyss Teal','#05090b'],['Ash','#101013']];
function applyBg(color){document.documentElement.style.setProperty('--void',color);document.body.style.background=color;}
function markSwatch(color){document.querySelectorAll('.sw').forEach(function(el){el.classList.toggle('sel',el.getAttribute('data-c').toLowerCase()===String(color).toLowerCase());});}
function buildSwatches(){
  var box=document.getElementById('swatches');box.innerHTML='';
  PRESETS.forEach(function(p){
    var d=document.createElement('div');d.className='sw';d.setAttribute('data-c',p[1]);
    var chip=document.createElement('div');chip.className='chip';chip.style.background=p[1];
    var nm=document.createElement('div');nm.className='nm';nm.textContent=p[0];
    d.appendChild(chip);d.appendChild(nm);
    d.addEventListener('click',function(){saveBg(p[1]);document.getElementById('cpick').value=p[1];});
    box.appendChild(d);
  });
}
buildSwatches();
document.querySelectorAll('[data-lang]').forEach(function(b){
  b.addEventListener('click',function(){try{localStorage.setItem('omega_lang',b.getAttribute('data-lang'));}catch(e){}location.reload();});
});
/* Calm mode lives in bg.js (window.OmegaCalm), which is deferred and so runs
   after this block: read it at click time, and paint the state once the DOM
   is ready (deferred scripts have run by then). */
var calmBtn=document.getElementById('btn-calm');
function paintCalm(){if(!calmBtn)return;var on=!!(window.OmegaCalm&&window.OmegaCalm.on());calmBtn.setAttribute('aria-pressed',on?'true':'false');calmBtn.textContent='CALM: '+(on?'ON':'OFF');}
if(calmBtn){calmBtn.addEventListener('click',function(){if(!window.OmegaCalm)return;window.OmegaCalm.set(!window.OmegaCalm.on());paintCalm();});document.addEventListener('DOMContentLoaded',paintCalm);}
var wdBtn=document.getElementById('btn-watch-demo');
if(wdBtn)wdBtn.addEventListener('click',function(){if(window.OmegaDemo)window.OmegaDemo.replay();});
var apApplyBtn=document.getElementById('ap-apply');
if(apApplyBtn)apApplyBtn.addEventListener('click',function(){
  if(window.OmegaAppearance){var bg=document.getElementById('ap-bg');var tx=document.getElementById('ap-text');var ft=document.getElementById('ap-font');window.OmegaAppearance.set(bg?bg.value:'',tx?tx.value:'',ft?ft.value:'');}
});
var apResetBtn=document.getElementById('ap-reset-app');
if(apResetBtn)apResetBtn.addEventListener('click',function(){if(window.OmegaAppearance){window.OmegaAppearance.reset();location.reload();}});

var _user=null;
async function saveBg(color){
  try{localStorage.setItem('omega_bg',color);}catch(e){}
  applyBg(color);markSwatch(color);
  var msg=document.getElementById('s-msg');
  if(_user){
    var r=await sb.from('profiles').update({bg_color:color}).eq('id',_user.id).then(null,function(e){return{error:e};});
    if(msg)msg.textContent=(r&&r.error)?'Background saved on this device. Sync to your account failed.':'Background saved.';
  } else if(msg){msg.textContent='Background saved.';}
}
window.saveBg=saveBg;
async function resetBg(){
  try{localStorage.removeItem('omega_bg');}catch(e){}
  applyBg(DEFAULT_BG);markSwatch(DEFAULT_BG);document.getElementById('cpick').value=DEFAULT_BG;
  var msg=document.getElementById('s-msg');
  if(_user){
    var r=await sb.from('profiles').update({bg_color:null}).eq('id',_user.id).then(null,function(e){return{error:e};});
    if(msg)msg.textContent=(r&&r.error)?'Reset on this device. Sync to your account failed.':'Reset to the Void.';
  } else if(msg){msg.textContent='Reset to the Void.';}
}
document.getElementById('apply-custom').addEventListener('click',function(){saveBg(document.getElementById('cpick').value);});
document.getElementById('btn-reset').addEventListener('click',resetBg);
function accMsg(t){var m=document.getElementById('acc-msg');if(m)m.textContent=t;}
document.getElementById('btn-logout').addEventListener('click',async function(){try{await sb.auth.signOut();}catch(e){}location.href='/account.html';});
document.getElementById('btn-deactivate').addEventListener('click',async function(){
  if(!confirm('Deactivate your account? Your access is suspended until you sign back in and are re-approved.'))return;
  try{var r=await sb.rpc('deactivate_account');if(r.data&&r.data.ok){await sb.auth.signOut();location.href='/account.html';}else{accMsg((r.data&&r.data.error)||'Could not deactivate.');}}catch(e){accMsg('Could not deactivate.');}
});
document.getElementById('btn-delete').addEventListener('click',async function(){
  if(!confirm('Permanently DELETE your account and ALL your data? This cannot be undone.'))return;
  if(!confirm('Final confirmation — erase everything permanently?'))return;
  try{var call=function(){return sb.rpc('delete_account');};var r=window.OmegaStorage?await window.OmegaStorage.clearIdentityDocThen(call):await call();if(r.data&&r.data.ok){try{await sb.auth.signOut();}catch(e){}alert('Your account and data have been deleted.');location.href='/account.html';}else{accMsg((r.data&&r.data.error)||'Could not delete.');}}catch(e){accMsg('Could not delete.');}
});
/* The profile page owns session and approval gating (bg.js approval guard plus its own bootstrap), so this
   module only needs the signed-in user to sync the background colour, and never reveals or hides the page. */
(async function(){
  try{
    var s=(await sb.auth.getSession()).data.session;
    if(!s)return;
    _user=s.user;
    var cur=null;try{cur=localStorage.getItem('omega_bg');}catch(e){}
    if(!cur){
      var pr=(await sb.from('profiles').select('bg_color').eq('id',s.user.id).maybeSingle()).data||{};
      if(pr.bg_color){cur=pr.bg_color;try{localStorage.setItem('omega_bg',cur);}catch(e){}applyBg(cur);}
    }
    cur=cur||DEFAULT_BG;markSwatch(cur);var cp=document.getElementById('cpick');if(cp)cp.value=/^#/.test(cur)?cur:DEFAULT_BG;
    if(window.OmegaAppearance){
      var ac=window.OmegaAppearance.get();
      var bg=document.getElementById('ap-bg');var tx=document.getElementById('ap-text');var ft=document.getElementById('ap-font');
      if(ac.bg&&bg)bg.value=ac.bg;if(ac.text&&tx)tx.value=ac.text;if(ac.font&&ft)ft.value=ac.font;
    }
  }catch(e){console.warn('Settings background sync failed; the page stays as it was.',e);}
})();
