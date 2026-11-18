/* SYD OMEGA 91717 — Sovereign Command Core clock.
   External script to preserve the repository's strict inline-script ratchet. */
(function(){
  'use strict';
  var time=document.getElementById('sc-time');
  var date=document.getElementById('sc-date');
  if(!time||!date)return;
  var timeFormat=new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
  var dateFormat=new Intl.DateTimeFormat(undefined,{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
  function tick(){
    var now=new Date();
    time.textContent=timeFormat.format(now);
    date.textContent=dateFormat.format(now).toUpperCase();
  }
  tick();
  window.setInterval(tick,1000);
})();
