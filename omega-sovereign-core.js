/* Ω SYD OMEGA 91717 — Sovereign Command Core clock.
   Kept external so the page remains clean under the CSP inline-code ratchet. */
(function(){
  'use strict';
  var time=document.getElementById('sc-time');
  var date=document.getElementById('sc-date');
  if(!time||!date)return;
  function tick(){
    var now=new Date();
    time.textContent=new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(now);
    date.textContent=new Intl.DateTimeFormat(undefined,{weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(now).toUpperCase();
  }
  tick();
  window.setInterval(tick,1000);
})();
