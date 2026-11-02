/* Ω Daily brief: the TODAY tab of dashboard.html (FIXES_LOG 204). Moved here from the former command.html:
   clock, optional weather, three priorities, schedule blocks, evening review, streak, archive. Loaded the first
   time the TODAY tab opens, so the dashboard itself writes nothing to localStorage until a member uses it. */
(function(){
if(window.__omegaDailyBrief)return;window.__omegaDailyBrief=1;
/* the panels this tab mounts (what is due today, readiness, spaced review) were separate scripts on the old page's
   head; load them with the brief, once, and only if something has not already loaded them. They boot safely after
   DOMContentLoaded. */
['/omega-srs.js','/omega-today.js','/omega-review.js'].forEach(function(src){
  if(document.querySelector('script[src="'+src+'"]'))return;
  var s=document.createElement('script');s.src=src;s.async=false;/* async=false keeps insertion order: review needs srs first */document.head.appendChild(s);
});
const CMD_KEY = 'omega_command_briefs';

function loadArr(k){try{return JSON.parse(localStorage.getItem(k))||[];}catch{return[];}}
function save(k,v){localStorage.setItem(k,JSON.stringify(v));}

var todayKey=new Date().toISOString().slice(0,10);
var briefs=loadArr(CMD_KEY);
var todayBrief=briefs.find(function(b){return b.date===todayKey;});
if(!todayBrief){
  todayBrief={date:todayKey,priorities:[{text:'',done:false},{text:'',done:false},{text:'',done:false}],intent:'',schedule:[],review:{},dayScore:null};
  briefs.push(todayBrief);save(CMD_KEY,briefs);
}

/* CLOCK */
(function(){
  function tick(){
    var now=new Date(),h=now.getHours(),m=now.getMinutes(),s=now.getSeconds();
    document.getElementById('clockTime').textContent=(h<10?'0':'')+h+':'+(m<10?'0':'')+m+':'+(s<10?'0':'')+s;
    var days=['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
    var months=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    document.getElementById('clockDate').textContent=months[now.getMonth()]+' '+now.getDate()+', '+now.getFullYear();
    document.getElementById('clockDay').textContent=days[now.getDay()];
  }
  tick();setInterval(tick,1000);
})();

/* WEATHER via Open-Meteo: OFF until the member presses the button (FIXES_LOG 204). It used to ask for the
   browser's location and send 4-decimal coordinates to a third party on every page load; it now sends nothing
   until asked, at about 11 km precision. */
(function(){
  var WMO={0:'CLEAR SKY',1:'MAINLY CLEAR',2:'PARTLY CLOUDY',3:'OVERCAST',45:'FOG',48:'ICY FOG',51:'LIGHT DRIZZLE',53:'DRIZZLE',55:'HEAVY DRIZZLE',61:'LIGHT RAIN',63:'RAIN',65:'HEAVY RAIN',71:'LIGHT SNOW',73:'SNOW',75:'HEAVY SNOW',80:'LIGHT SHOWERS',81:'SHOWERS',82:'HEAVY SHOWERS',95:'THUNDERSTORM',96:'THUNDERSTORM+HAIL'};
  var ICONS={0:'☀︎',1:'☀︎',2:'⛅︎',3:'☁︎',45:'≋',48:'≋',51:'⌇',53:'☂',55:'☂',61:'☂',63:'☂',65:'☂',71:'❄︎',73:'❄︎',75:'❄︎',80:'⌇',81:'☂',82:'⛈︎',95:'⛈︎',96:'⛈︎'};
  function start(){
    var btn=document.getElementById('wxOn');if(btn)btn.disabled=true;
    if(!navigator.geolocation){document.getElementById('wxLoc').textContent='GEOLOCATION NOT SUPPORTED';return;}
    document.getElementById('wxLoc').textContent='ASKING YOUR BROWSER FOR LOCATION\u2026';
    navigator.geolocation.getCurrentPosition(function(pos){
      var lat=pos.coords.latitude.toFixed(1),lon=pos.coords.longitude.toFixed(1);
      fetch('https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon+'&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,uv_index&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto')
      .then(function(r){return r.json();}).then(function(d){
        var c=d.current,code=c.weather_code;
        document.getElementById('wxIcon').textContent=ICONS[code]||'☀︎';
        document.getElementById('wxTemp').textContent=Math.round(c.temperature_2m)+'°C';
        document.getElementById('wxDesc').textContent=WMO[code]||'CLEAR';
        document.getElementById('wxDetail').textContent='Wind '+Math.round(c.wind_speed_10m)+' km/h · Humidity '+c.relative_humidity_2m+'% · UV '+Math.round(c.uv_index||0);
        document.getElementById('wxLoc').textContent='⌖ '+lat+'°N '+lon+'°E';
      }).catch(function(){document.getElementById('wxLoc').textContent='WEATHER UNAVAILABLE';});
    },function(){document.getElementById('wxLoc').textContent='LOCATION PERMISSION DENIED';document.getElementById('wxDesc').textContent='ENABLE LOCATION FOR WEATHER';if(btn)btn.disabled=false;});
  }
  var on=document.getElementById('wxOn');if(on)on.addEventListener('click',start);
})();

/* QUOTES */
var QUOTES=[
  {t:'Waste no more time arguing about what a good man should be. Be one.',a:'MARCUS AURELIUS'},
  {t:'The impediment to action advances action. What stands in the way becomes the way.',a:'MARCUS AURELIUS'},
  {t:'Discipline is the bridge between goals and accomplishment.',a:'JIM ROHN'},
  {t:'Where focus goes, energy flows.',a:'TONY ROBBINS'},
  {t:'Every action you take is a vote for the type of person you wish to become.',a:'JAMES CLEAR'},
  {t:'The man who moves a mountain begins by carrying away small stones.',a:'CONFUCIUS'},
  {t:'He who has a why to live can bear almost any how.',a:'NIETZSCHE'},
  {t:'Energy and persistence conquer all things.',a:'BENJAMIN FRANKLIN'},
  {t:'The unexamined life is not worth living.',a:'SOCRATES'},
  {t:'Do not wait to strike till the iron is hot; but make it hot by striking.',a:'W.B. SPRAGUE'},
];
var qi=Math.floor(Math.random()*QUOTES.length);
document.getElementById('quoteText').textContent=QUOTES[qi].t;
document.getElementById('quoteAttr').textContent='— '+QUOTES[qi].a;

/* PRIORITIES */
function loadPriorities(){
  var p=todayBrief.priorities||[{text:'',done:false},{text:'',done:false},{text:'',done:false}];
  for(var i=0;i<3;i++){
    var inp=document.getElementById('p'+(i+1)),chk=document.getElementById('c'+(i+1));
    inp.value=p[i]?p[i].text:'';
    var done=p[i]?p[i].done:false;
    inp.classList.toggle('done',done);chk.textContent=done?'✓':'';chk.classList.toggle('done',done);
  }
}
function savePriorities(){
  for(var i=0;i<3;i++) todayBrief.priorities[i]={text:document.getElementById('p'+(i+1)).value,done:todayBrief.priorities[i]?todayBrief.priorities[i].done:false};
  persistBrief();
}
function togglePri(n){savePriorities();todayBrief.priorities[n-1].done=!todayBrief.priorities[n-1].done;persistBrief();loadPriorities();renderKPIs();}
function clearPriorities(){for(var i=0;i<3;i++)todayBrief.priorities[i]={text:'',done:false};persistBrief();loadPriorities();}

/* SCHEDULE */
function addBlock(){
  var t=document.getElementById('blockTime').value,task=document.getElementById('blockTask').value.trim();
  if(!t||!task)return;
  todayBrief.schedule=todayBrief.schedule||[];
  todayBrief.schedule.push({time:t,task,id:Date.now()});
  todayBrief.schedule.sort(function(a,b){return a.time.localeCompare(b.time);});
  document.getElementById('blockTask').value='';
  persistBrief();renderSchedule();
}
function deleteBlock(id){todayBrief.schedule=todayBrief.schedule.filter(function(b){return b.id!==id;});persistBrief();renderSchedule();}
function updateBlock(id,val){var b=todayBrief.schedule.find(function(x){return x.id===id;});if(b)b.task=val;persistBrief();}
/* FEATURE_IDEAS.md S7 step 1: today's blocks as an .ics file the member's own
   calendar imports -- pure client, no feed, no token. Each block runs 90 min,
   the same span renderSchedule() treats as NOW. Times are floating (no TZ):
   the member typed them on their own clock. Block text is member text, so it
   is escaped per RFC 5545 3.3.11 and never reaches HTML. */
function icsEsc(t){return String(t==null?'':t).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');}
function downloadBlocksIcs(){
  var blocks=(todayBrief.schedule||[]).filter(function(b){return /^\d{2}:\d{2}$/.test(b.time);});
  if(!blocks.length){alert('Add a time block first.');return;}
  var d=new Date(),p=function(n){return(n<10?'0':'')+n;},day=d.getFullYear()+p(d.getMonth()+1)+p(d.getDate());
  var stamp=d.toISOString().replace(/[-:]/g,'').replace(/\.\d+/,'');
  var L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//SYD OMEGA 91717//Command//EN','CALSCALE:GREGORIAN'];
  blocks.forEach(function(b,i){
    var t=b.time.split(':').map(Number),s=t[0]*60+t[1],e=Math.min(s+90,24*60-1);
    L.push('BEGIN:VEVENT','UID:omega-block-'+day+'-'+i+'-'+(+b.id||0)+'@sydomega','DTSTAMP:'+stamp,
      'DTSTART:'+day+'T'+p(t[0])+p(t[1])+'00','DTEND:'+day+'T'+p(Math.floor(e/60))+p(e%60)+'00',
      'SUMMARY:'+icsEsc(b.task||'Time block'),'END:VEVENT');
  });
  L.push('END:VCALENDAR');
  /* RFC 5545 3.1: lines over 75 octets fold with CRLF + space. Folding at
     60 code units keeps a line of 3-byte characters under the limit, and
     never splits a surrogate pair. */
  var F=L.map(function(l){var o=[],c=Array.from(l);while(c.length>60){o.push(c.splice(0,60).join(''));}o.push(c.join(''));return o.join('\r\n ');});
  var blob=new Blob([F.join('\r\n')+'\r\n'],{type:'text/calendar'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='omega-blocks-'+day+'.ics';
  document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},2000);
}
window.downloadBlocksIcs=downloadBlocksIcs;
(function(){var b=document.getElementById('blocksIcs');if(b)b.addEventListener('click',downloadBlocksIcs);})();
function renderSchedule(){
  var el=document.getElementById('scheduleGrid'),blocks=todayBrief.schedule||[];
  if(!blocks.length){el.innerHTML='<div style="font-family:var(--M);font-size:12px;color:rgba(138,134,118,.4);padding:8px 0">No time blocks yet.</div>';return;}
  var nowMin=(function(){var n=new Date();return n.getHours()*60+n.getMinutes();})();
  el.innerHTML=blocks.map(function(b){
    var[bh,bm]=b.time.split(':').map(Number),bMin=bh*60+bm;
    var active=nowMin>=bMin&&nowMin<bMin+90,past=nowMin>=bMin+90;
    return '<div class="time-block" style="'+(active?'border-color:rgba(201,168,76,.3);background:rgba(201,168,76,.06)':'')+(past?'opacity:.5':'')+'">'
      +'<div class="tb-time">'+b.time+'</div>'
      +'<input class="tb-input" value="'+b.task.replace(/"/g,'&quot;')+'" data-brief-change="updateBlock" data-brief-arg="'+b.id+'">'
      +(active?'<span style="font-family:var(--M);font-size:12px;color:var(--gold);letter-spacing:1px">NOW</span>':'')
      +'<button class="tb-del" data-brief-act="deleteBlock" data-brief-arg="'+b.id+'" aria-label="Delete this block">✕</button></div>';
  }).join('');
}

/* REVIEW */
function loadReview(){
  var r=todayBrief.review||{};
  for(var i=1;i<=5;i++) document.getElementById('rq'+i).value=r[i]||'';
  document.getElementById('dayScore').value=todayBrief.dayScore||7;
  updateDayScoreDisplay();
}
document.getElementById('dayScore').addEventListener('input',updateDayScoreDisplay);
function updateDayScoreDisplay(){document.getElementById('dayScoreDisplay').textContent=document.getElementById('dayScore').value+'/10';}
function saveReview(){
  todayBrief.review={};
  for(var i=1;i<=5;i++) todayBrief.review[i]=document.getElementById('rq'+i).value;
  todayBrief.dayScore=+document.getElementById('dayScore').value;
  persistBrief();alert('Day sealed. Sovereign.');
}

/* INTENT */
document.getElementById('intentText').addEventListener('blur',function(){todayBrief.intent=this.value;persistBrief();});

/* STREAK */
function calcStreak(){
  var dates=new Set(briefs.filter(function(b){return b.priorities&&b.priorities.some(function(p){return p.text;});}).map(function(b){return b.date;}));
  var streak=0,d=new Date();
  while(true){var k=d.toISOString().slice(0,10);if(!dates.has(k))break;streak++;d.setDate(d.getDate()-1);}
  return streak;
}
function renderStreak(){
  var streak=calcStreak();
  document.getElementById('kpiStreak').textContent=streak+'d';
  document.getElementById('streakLabel').textContent='Current planning streak: '+streak+' days';
  var dots=document.getElementById('streakDots'),html='';
  for(var i=29;i>=0;i--){
    var d=new Date();d.setDate(d.getDate()-i);
    var k=d.toISOString().slice(0,10);
    var done=briefs.find(function(b){return b.date===k&&b.priorities&&b.priorities.some(function(p){return p.text;});});
    html+='<div class="sd'+(done?' done':'')+(i===0?' today':'')+'" title="'+k+'"></div>';
  }
  dots.innerHTML=html;
}

/* KPIs */
function renderKPIs(){
  var done=todayBrief.priorities?todayBrief.priorities.filter(function(p){return p.done;}).length:0;
  var total=todayBrief.priorities?todayBrief.priorities.filter(function(p){return p.text;}).length:0;
  document.getElementById('kpiPri').textContent=done+'/'+total;
  document.getElementById('kpiDay').textContent=todayBrief.dayScore?todayBrief.dayScore+'/10':'—';
  try{
    var fs=JSON.parse(localStorage.getItem('omega_focus_sessions'))||[];
    document.getElementById('kpiSess').textContent=fs.filter(function(s){return s.date===todayKey;}).length;
  }catch{document.getElementById('kpiSess').textContent='—';}
}

/* ARCHIVE */
function renderArchive(){
  var el=document.getElementById('pastBriefs');
  var sorted=briefs.slice().sort(function(a,b){return b.date.localeCompare(a.date);}).slice(0,30);
  if(!sorted.length){el.innerHTML='<div style="font-family:var(--M);font-size:12px;color:rgba(138,134,118,.4)">No past briefs yet.</div>';return;}
  el.innerHTML=sorted.map(function(b){
    var done=b.priorities?b.priorities.filter(function(p){return p.done;}).length:0;
    var total=b.priorities?b.priorities.filter(function(p){return p.text;}).length:0;
    return '<div class="pb-entry"><div class="pb-date">'+b.date+(b.dayScore?' · SCORE '+b.dayScore+'/10':'')+(b.date===todayKey?' · TODAY':'')+'</div>'
      +'<div class="pb-snippet">'+(b.intent||'No intent set')+' — '+done+'/'+total+' priorities</div></div>';
  }).join('');
}

/* PERSIST */
function persistBrief(){
  var idx=briefs.findIndex(function(b){return b.date===todayKey;});
  if(idx>=0)briefs[idx]=todayBrief;else briefs.push(todayBrief);
  save(CMD_KEY,briefs);
}

/* TABS */
function briefTab(id,btn){
  var root=document.getElementById('l-today');
  root.querySelectorAll('.tab-pane').forEach(function(p){p.classList.remove('active');});
  root.querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('active');});
  document.getElementById('tab-'+id).classList.add('active');btn.classList.add('active');
  if(id==='schedule')renderSchedule();
  if(id==='review')renderArchive();
}
document.querySelectorAll('#l-today [data-brief-tab]').forEach(function(b){b.addEventListener('click',function(){briefTab(b.getAttribute('data-brief-tab'),b);});});

/* INIT */
loadPriorities();
document.getElementById('intentText').value=todayBrief.intent||'';
renderSchedule();loadReview();renderKPIs();renderStreak();renderArchive();

/* One delegated listener replaces the inline onclick= handlers the old page used (CSP: no inline handlers). */
var ACTS={togglePri:function(a){togglePri(Number(a));},savePriorities:savePriorities,clearPriorities:clearPriorities,
  addBlock:addBlock,deleteBlock:function(a){deleteBlock(isNaN(Number(a))?a:Number(a));},saveReview:saveReview};
document.getElementById('l-today').addEventListener('change',function(e){
  var el=e.target;if(!el||!el.getAttribute||el.getAttribute('data-brief-change')!=='updateBlock')return;
  var id=el.getAttribute('data-brief-arg');updateBlock(isNaN(Number(id))?id:Number(id),el.value);
});
document.getElementById('l-today').addEventListener('click',function(e){
  var el=e.target.closest&&e.target.closest('[data-brief-act]');if(!el)return;
  var f=ACTS[el.getAttribute('data-brief-act')];if(f)f(el.getAttribute('data-brief-arg'));
});
})();
