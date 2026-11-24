/* omega-honors-vault.js -- the VAULT tab of honors.html (ported from the retired trophies.html).
   Names come from OmegaCanon.track(n), colours from OmegaRealm.palette; reads trophies/medals/certificates for the signed-in member.
   Loaded as a module by honors.html; defines window.bootVault, called when the VAULT tab opens. */
import { createClient } from '/vendor/supabase-js.js';
var sb=window.__omegaSb||(window.__omegaSb=createClient('https://ydqhzvvoyufiiqvzcjns.supabase.co','sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q'));
/* The VAULT tab. Names come from OmegaCanon.track(n) and colours from OmegaRealm.palette (by the track's element), never a copy. */
function colorOf(t){var P=window.OmegaRealm&&window.OmegaRealm.palette,e=t&&t.element?String(t.element):'';e=e.charAt(0).toUpperCase()+e.slice(1).toLowerCase();return (P&&P[e]&&P[e].core)||'#C9A84C';}
function drawIcon(cv,col,earned){
  var still=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
  cv.width=120;cv.height=100;cv.style.width='60px';cv.style.height='50px';
  var ctx=cv.getContext('2d');var t=0;
  function f(){
    if(!cv.isConnected)return;
    t+=.025;ctx.clearRect(0,0,120,100);
    if(!earned){ctx.fillStyle='rgba(133,131,123,0.1)';ctx.beginPath();ctx.arc(60,50,44,0,Math.PI*2);ctx.fill();return;}
    var g=ctx.createRadialGradient(60,50,0,60,50,44);g.addColorStop(0,col+'55');g.addColorStop(1,'transparent');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(60,50,44,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.translate(60,50);ctx.rotate(t*.6);ctx.beginPath();ctx.arc(0,0,40,0,Math.PI*2);ctx.strokeStyle=col+'44';ctx.lineWidth=1;ctx.stroke();ctx.restore();
    ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=14+5*Math.sin(t*2);
    ctx.font='700 22px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('Ω',60,51);ctx.shadowBlur=0;
    if(!still)requestAnimationFrame(f);
  }f();
}
function el(tag,cls,txt,css){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;if(css)e.style.cssText=css;return e;}
function fillStat(id,frac,col){var e=document.getElementById(id);if(!e)return;e.style.setProperty('--vt-fill',Math.round(frac*100)+'%');e.style.setProperty('--vt-col',col);}
async function build(){
  var C=window.OmegaCanon;
  var sess=(await sb.auth.getSession()).data.session;if(!sess)return;
  var uid=sess.user.id;
  var pr=(await sb.from('profiles').select('*').eq('id',uid).maybeSingle()).data||{};
  var share=document.getElementById('vt-share');
  if(share)share.addEventListener('click',function(){
    if(window.OmegaShareCard){window.OmegaShareCard.showModal(pr);}
    else if(window.OmegaNotify&&window.OmegaNotify.showToast){window.OmegaNotify.showToast('Share card loading…','info');}
  });
  var isOwner=!!pr.is_owner;
  var res=await Promise.all([
    sb.from('trophies').select('trophy_num,earned_at').eq('user_id',uid),
    sb.from('medals').select('medal_num,earned_at').eq('user_id',uid),
    sb.from('certificates').select('cert_num,issued_at').eq('user_id',uid)]);
  /* a failed read is not "nothing earned" */
  if(res[0].error||res[1].error||res[2].error){
    var box=document.getElementById('vt-trophies');box.textContent='';
    box.appendChild(el('div','vt-info','Your honors could not be read right now. Try again in a moment.'));return;
  }
  var et=res[0].data||[],em=res[1].data||[],ec=res[2].data||[];
  var all=[1,2,3,4,5,6,7,8,9,10,11,12];
  var tn=isOwner?all:et.map(function(r){return r.trophy_num;});
  var mn=isOwner?all:em.map(function(r){return r.medal_num;});
  var cn=isOwner?all:ec.map(function(r){return r.cert_num;});
  /* celebrate unlocks since the last visit; the first visit only seeds the baseline (same key the old page used) */
  if(!isOwner){
    try{
      var K='omega_trophy_celebrate_seen_v1',had=localStorage.getItem(K)!==null,seen={};
      try{seen=JSON.parse(localStorage.getItem(K)||'{}');}catch(e){seen={};}
      if(had){
        [['t',tn,'trophy'],['m',mn,'medal'],['c',cn,'certificate']].forEach(function(g){
          var old=seen[g[0]]||[];
          g[1].filter(function(n){return old.indexOf(n)===-1;}).forEach(function(n){
            var t=C&&C.track(n);if(t)window.dispatchEvent(new CustomEvent('omega:achievement',{detail:{title:t[g[2]]}}));
          });
        });
      }
      localStorage.setItem(K,JSON.stringify({t:tn,m:mn,c:cn}));
    }catch(e){}
  }
  var total=tn.length+mn.length+cn.length;
  var tier=total===36?'OMEGA MASTER':total>=24?'PLATINUM':total>=12?'GOLD':'SAND';
  document.getElementById('vt-t').textContent=tn.length+'/12';
  document.getElementById('vt-m').textContent=mn.length+'/12';
  document.getElementById('vt-c').textContent=cn.length+'/12';
  document.getElementById('vt-a').textContent=tier;
  fillStat('vt-s-t',tn.length/12,'var(--gold)');fillStat('vt-s-m',mn.length/12,'var(--solar)');fillStat('vt-s-c',cn.length/12,'var(--cyan)');fillStat('vt-s-a',total/36,'var(--gold)');
  var tg=document.getElementById('vt-trophies'),mg=document.getElementById('vt-medals'),cg=document.getElementById('vt-certs');
  tg.textContent='';mg.textContent='';cg.textContent='';
  all.forEach(function(n){
    var t=C&&C.track(n);if(!t)return;
    var col=colorOf(t);
    var on=tn.indexOf(n)>=0;
    var row=!isOwner&&on?et.filter(function(r){return r.trophy_num===n;})[0]:null;
    var card=el('div','vt-card'+(on?' earned':''));card.style.setProperty('--tc',on?col:'var(--muted)');
    var cv=document.createElement('canvas');card.appendChild(cv);
    card.appendChild(el('div','vt-num','TROPHY '+n+' OF 12'));
    card.appendChild(el('div','vt-name',t.trophy,'color:'+(on?col:'var(--muted)')));
    card.appendChild(el('div','vt-sub','ELEMENT: '+String(t.element).toUpperCase(),'color:'+(on?col:'var(--muted)')));
    card.appendChild(el('div','vt-info',row&&row.earned_at?'EARNED: '+new Date(row.earned_at).toLocaleDateString():(isOwner?'EARNED: OMEGA MASTER':(on?'EARNED':'LOCKED — PROGRESS REQUIRED'))));
    tg.appendChild(card);
    requestAnimationFrame(function(){drawIcon(cv,col,on);});
    var mo=mn.indexOf(n)>=0;
    var m=el('div','vt-medal'+(mo?' earned':''));m.style.setProperty('--mc',col);
    m.appendChild(el('div','ic',String(n),'border-color:'+(mo?col:'rgba(133,131,123,.2)')+';color:'+(mo?col:'var(--muted)')));
    var mb=el('div','');mb.appendChild(el('div','vt-name',t.medal,'font-size:12px;color:'+(mo?col:'var(--muted)')));mb.appendChild(el('div','vt-sub',String(t.sign).toUpperCase()));m.appendChild(mb);
    mg.appendChild(m);
    var co=cn.indexOf(n)>=0;
    var r=el('div','vt-row'+(co?' issued':''));r.style.setProperty('--cc',col);
    r.appendChild(el('div','n',String(n),'color:'+(co?col:'rgba(133,131,123,.2)')));
    var b=el('div','b');b.appendChild(el('div','vt-name',t.certificate,'color:'+(co?col:'var(--muted)')));b.appendChild(el('div','vt-sub',String(t.sign).toUpperCase()));r.appendChild(b);
    r.appendChild(el('span','vt-badge',co?'ISSUED':'PENDING','color:'+(co?col:'var(--muted)')+';border-color:'+(co?col+'44':'rgba(133,131,123,.15)')));
    cg.appendChild(r);
  });
}
window.bootVault=function(){
  /* A #vault deep link opens this tab before bg.js has injected OmegaCanon, so wait for it rather than doing nothing. */
  var tries=0;
  (function go(){
    var C=window.OmegaCanon;
    if(C&&C.ready){build().catch(function(e){console.warn('vault',e);});return;}
    if(C&&C.onReady){C.onReady(function(){build().catch(function(e){console.warn('vault',e);});});return;}
    if(++tries<100){setTimeout(go,100);return;}
    var box=document.getElementById('vt-trophies');
    if(box){box.textContent='';box.appendChild(el('div','vt-info','The honors canon did not load. Reload the page to try again.'));}
    window.__vaultBuilt=false;
  })();
};
