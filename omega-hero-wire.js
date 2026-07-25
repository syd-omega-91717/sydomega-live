/* SYD OMEGA 91717 -- Hero Band Data Wire
   Populates ohb-l-{page} and ohb-r-{page} stat boxes on every page
   that has the omega-hero-band component injected. */
(function(){
  if(!document.querySelector('.omega-hero-band')) return;
  function sid(id,v){var e=document.getElementById(id);if(e)e.textContent=v;}
  function fmt(n){return Number(n||0).toLocaleString();}
  /* wait for the page's Supabase client to be ready */
  var WAIT=0;
  function tryWire(){
    if(!window.OmegaSB && WAIT++<30){setTimeout(tryWire,300);return;}
    var sbp=window.OmegaSB?window.OmegaSB.get():Promise.resolve(window.__omegaSb);
    if(!sbp)return;
    sbp.then(function(sb){
      if(!sb)return;
      sb.auth.getSession().then(function(r){
        var uid=r&&r.data&&r.data.session&&r.data.session.user&&r.data.session.user.id;
        if(!uid)return;
        /* derive page key from id attributes on any ohb element */
        var el=document.querySelector('[id^="ohb-l-"]');
        if(!el)return;
        var pageKey=el.id.replace('ohb-l-','');
        sb.from('profiles').select(
          'axis_a,axis_b,axis_c,matrix_track,matrix_phase,certificates_earned,trophies_earned,medals_earned,nodes_earned'
        ).eq('id',uid).maybeSingle().then(function(pr){
          var d=pr.data||{};
          var a=Number(d.axis_a||0.001),b=Number(d.axis_b||0.001),c=Number(d.axis_c||0.001);
          var PHI=1.6180339887,EU=2.7182818285;
          var auth=Math.round(Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU*1000)/1000;
          var track=d.matrix_track||1,phase=d.matrix_phase||1;
          var node=((track-1)*12+(phase-1))*729+(Math.max(1,Math.min(9,Math.ceil(a)))-1)*81+(Math.max(1,Math.min(9,Math.ceil(b)))-1)*9+Math.max(1,Math.min(9,Math.ceil(c)));
          /* populate right stat always = authority */
          sid('ohb-r-'+pageKey, auth.toFixed(3)+' AUTH');
          /* populate left stat with page-specific data */
          var PAGE_STATS={
            academy:     fmt(Math.round(a*100))+'%',
            automation:  (d.nodes_earned||0)+' NODES',
            beacon:      'T'+track+' P'+phase,
            blockchain:  fmt(d.nodes_earned||0),
            chatbot:     'AXIS A '+a.toFixed(2),
            city:        (d.matrix_track||1)+'/12',
            compliance:  fmt(d.certificates_earned||0)+' CERTS',
            consultancy: 'AXIS B '+b.toFixed(2),
            contracts:   fmt(d.nodes_earned||0)+' ACTS',
            events:      'PHASE '+phase,
            factions:    'TRACK '+track,
            gaming:      fmt(Math.round(b*100))+'%',
            health:      'AXIS C '+c.toFixed(2),
            houses:      'T'+track+'/12',
            marketing:   fmt(d.nodes_earned||0),
            marketplace: fmt(d.nodes_earned||0)+' ACTS',
            news:        'TRACK '+track,
            notifications:fmt(0)+' ALERTS',
            prediction:  auth.toFixed(3),
            publishing:  fmt(d.nodes_earned||0)+' ACTS',
            research:    'AXIS A '+a.toFixed(2),
            services:    fmt(d.nodes_earned||0)+' NODES',
            social:      'T'+track+' P'+phase,
            sovereigns:  auth.toFixed(3),
            subscriptions:d.matrix_track+'/'+'12',
            trophies:    fmt((d.trophies_earned||0)+(d.medals_earned||0)+(d.certificates_earned||0)),
            travel:      'T'+track,
            advertising: 'SPONSOR',
            points:      fmt(0)+' PTS',
          };
          var left=PAGE_STATS[pageKey]||auth.toFixed(3);
          sid('ohb-l-'+pageKey, left);
        }).catch(function(){});
      }).catch(function(){});
    }).catch(function(){});
  }
  tryWire();
})();
