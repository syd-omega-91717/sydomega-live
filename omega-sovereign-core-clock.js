/* SYD OMEGA 91717 — Sovereign Command Core clock.
   External script to preserve the repository's strict inline-script ratchet.
   Display-only; pauses while the tab is hidden. */
(function(){
  'use strict';
  var time=document.getElementById('sc-time');
  var date=document.getElementById('sc-date');
  if(!time||!date)return;
  var timeFormat=new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
  var dateFormat=new Intl.DateTimeFormat(undefined,{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
  var timer=null;
  function tick(){
    var now=new Date();
    time.textContent=timeFormat.format(now);
    date.textContent=dateFormat.format(now).toUpperCase();
  }
  function start(){if(timer===null){tick();timer=window.setInterval(tick,1000);}}
  function stop(){if(timer!==null){window.clearInterval(timer);timer=null;}}
  document.addEventListener('visibilitychange',function(){document.hidden?stop():start();});
  start();
})();
