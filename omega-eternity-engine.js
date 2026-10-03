/* Ω ETERNAL CONTINUITY ENGINE
   Read-only control surface over existing governed production sources.
   It never reads server-only queues/dead letters and never invents missing state. */
(function(){
  'use strict';
  if(window.OmegaEternity)return;

  var SUPABASE_URL='https://ydqhzvvoyufiiqvzcjns.supabase.co';
  var SUPABASE_KEY='sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q';

  function el(tag,cls,text){
    var n=document.createElement(tag);
    if(cls)n.className=cls;
    if(text!=null)n.textContent=String(text);
    return n;
  }
  function host(){return document.getElementById('omega-eternity-state');}
  function clear(n){n.replaceChildren();}
  function statusCard(label,value,mode){
    var n=el('article','oe-status '+(mode||''));
    n.appendChild(el('strong',null,value));
    n.appendChild(el('span',null,label));
    return n;
  }
  function stamp(v){
    if(!v)return '—';
    var d=new Date(v);
    return Number.isNaN(d.getTime())?'—':d.toISOString().replace('T',' ').replace('.000Z','Z');
  }
  function showUnavailable(message){
    var h=host();if(!h)return;
    clear(h);
    var box=el('div','oe-unavailable');
    box.appendChild(el('strong',null,'CONTINUITY · UNAVAILABLE'));
    box.appendChild(el('p',null,message));
    h.appendChild(box);
  }
  function render(data){
    var h=host();if(!h)return;
    clear(h);

    var grid=el('div','oe-status-grid');
    grid.appendChild(statusCard('AUTHENTICATED EVENT HISTORY',data.events.length?'LIVE':'EMPTY',data.events.length?'live':'empty'));
    grid.appendChild(statusCard('PUBLIC ACTIVITY STREAM',data.feed.length?'LIVE':'EMPTY',data.feed.length?'live':'empty'));
    grid.appendChild(statusCard('CAPABILITY REGISTRY',data.capabilities.length?'LIVE':'EMPTY',data.capabilities.length?'live':'empty'));
    grid.appendChild(statusCard('SERVER EVENT QUEUE','SEALED','sealed'));
    h.appendChild(grid);

    var note=el('p','oe-truth','Truth boundary: this page is a read-only continuity view. Empty data means no returned rows, not proof that nothing exists elsewhere.');
    h.appendChild(note);

    var columns=el('div','oe-columns');
    var timeline=el('section','oe-panel');
    timeline.appendChild(el('h2',null,'EVENT MEMORY'));
    if(!data.events.length) timeline.appendChild(el('p','oe-empty','No authenticated platform events were returned.'));
    data.events.forEach(function(e){
      var row=el('article','oe-event');
      row.appendChild(el('time',null,stamp(e.created_at)));
      row.appendChild(el('strong',null,e.event_type||'EVENT'));
      row.appendChild(el('span',null,e.route||'platform'));
      timeline.appendChild(row);
    });

    var feed=el('section','oe-panel');
    feed.appendChild(el('h2',null,'PUBLIC ACTIVITY'));
    if(!data.feed.length)feed.appendChild(el('p','oe-empty','No public activity rows were returned.'));
    data.feed.forEach(function(e){
      var row=el('article','oe-event');
      row.appendChild(el('time',null,stamp(e.created_at)));
      row.appendChild(el('strong',null,e.title||e.activity_type||'ACTIVITY'));
      row.appendChild(el('span',null,e.body||e.activity_type||''));
      feed.appendChild(row);
    });

    var caps=el('section','oe-panel');
    caps.appendChild(el('h2',null,'CAPABILITY CONTINUITY'));
    if(!data.capabilities.length)caps.appendChild(el('p','oe-empty','No capability records were returned for this session.'));
    data.capabilities.forEach(function(c){
      var row=el('article','oe-cap');
      row.appendChild(el('strong',null,c.capability_name||c.capability_id||'CAPABILITY'));
      row.appendChild(el('span',null,(c.lifecycle_status||'UNKNOWN')+' · '+(c.health_status||'UNKNOWN')+' · v'+(c.version||'?')));
      caps.appendChild(row);
    });

    columns.appendChild(timeline);
    columns.appendChild(feed);
    columns.appendChild(caps);
    h.appendChild(columns);

    var chain=el('section','oe-chain');
    chain.appendChild(el('h2',null,'CONTINUITY CHAIN'));
    ['EVENT','EVIDENCE','CAPABILITY','EXPERIENCE','PROGRESSION','HISTORY'].forEach(function(x,i){
      var node=el('div','oe-chain-node');
      node.appendChild(el('strong',null,String(i+1).padStart(2,'0')));
      node.appendChild(el('span',null,x));
      chain.appendChild(node);
    });
    h.appendChild(chain);
  }

  async function boot(){
    if(!host())return;
    try{
      var sb=window.__omegaSb;
      if(!sb){
        var mod=await import('/vendor/supabase-js.js');
        sb=window.__omegaSb=mod.createClient(SUPABASE_URL,SUPABASE_KEY);
      }
      var session=(await sb.auth.getSession()).data.session;
      if(!session){
        showUnavailable('Sign in to inspect authenticated continuity. No member history is inferred while signed out.');
        return;
      }

      var events=await sb.from('omega_platform_events')
        .select('id,event_type,route,created_at')
        .eq('actor_user_id',session.user.id)
        .order('created_at',{ascending:false}).limit(24);
      if(events.error)events={data:[]};

      var feed=await sb.from('activity_feed')
        .select('id,activity_type,title,body,created_at')
        .order('created_at',{ascending:false}).limit(12);
      if(feed.error)feed={data:[]};

      var capabilities=await sb.from('capability_registry')
        .select('capability_id,capability_name,lifecycle_status,health_status,version')
        .order('capability_name',{ascending:true}).limit(18);
      if(capabilities.error)capabilities={data:[]};

      render({
        events:Array.isArray(events.data)?events.data:[],
        feed:Array.isArray(feed.data)?feed.data:[],
        capabilities:Array.isArray(capabilities.data)?capabilities.data:[]
      });
    }catch(e){
      showUnavailable('Continuity sources could not be read. The interface does not substitute inferred history.');
    }
  }

  window.OmegaEternity={boot:boot};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
