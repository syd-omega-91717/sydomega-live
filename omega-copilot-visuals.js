/* ============================================================================
   SYD OMEGA 91717 -- COPILOT VISUAL COMMANDS
   /decisionmatrix /infographic /canvas /layers /cycle /diagram /roadmap
   /sketchnotes /iceberg /blueprint /explodedview /tree /timeline /handwritten

   The concierge model returns TEXT only (max_tokens 400): it cannot draw. So each
   command asks it for one small JSON object of a fixed shape, and this module
   draws the visual in the drawer. Rules this file keeps:
   - Model output is data: every label goes in through textContent/createTextNode,
     never innerHTML, so a reply cannot inject markup.
   - Derived numbers are computed here, not trusted from the model (the decision
     matrix total is sum(weight*score) recomputed client-side).
   - A reply that is not valid JSON of the expected shape is shown as text with a
     plain note that no visual was drawn -- never a half-drawn or invented one.
   Loaded on demand by omega-copilot.js (guard: data-omega-copilot-visuals).
   ========================================================================== */
(function(){
  'use strict';
  if(window.OmegaCopilotVisuals) return;

  var SVGNS='http://www.w3.org/2000/svg';
  var GOLD='#C9A84C', CYAN='#4FC3D9', INK='#e9e6dc', MUTED='#9b978c', LINE='rgba(201,168,76,.35)';
  var LIMITS='Keep it short: at most 7 items, labels up to 6 words, details up to 14 words. Reply with ONLY one JSON object in a ```json fenced block, nothing before or after it.';

  /* c, agent, hint, d, kind, schema (sent to the model) */
  var DEFS=[
    {c:'decisionmatrix',agent:'Analyst',hint:'/decisionmatrix <decision>',d:'Weighted options-vs-criteria matrix',kind:'matrix',
      s:'{"title":"...","criteria":[{"name":"...","weight":1-5}],"options":[{"name":"...","scores":[1-5 per criterion, same order]}],"note":"one-line caveat"}'},
    {c:'infographic',agent:'Beacon',hint:'/infographic <topic>',d:'Key numbers and points at a glance',kind:'infographic',
      s:'{"title":"...","stats":[{"value":"short figure","label":"..."}],"points":["..."],"source":"where the figures come from, or \\"illustrative\\""}'},
    {c:'canvas',agent:'Merchant',hint:'/canvas <business idea>',d:'Business Model Canvas (9 blocks)',kind:'canvas',
      s:'{"title":"...","partners":["..."],"activities":["..."],"resources":["..."],"value":["..."],"relationships":["..."],"channels":["..."],"segments":["..."],"costs":["..."],"revenue":["..."]}'},
    {c:'layers',agent:'Proxy',hint:'/layers <system>',d:'Stacked layers, top to bottom',kind:'layers',
      s:'{"title":"...","items":[{"label":"top layer first","detail":"..."}]}'},
    {c:'cycle',agent:'Oracle',hint:'/cycle <process>',d:'A repeating loop of stages',kind:'cycle',
      s:'{"title":"...","items":[{"label":"stage","detail":"..."}]}'},
    {c:'diagram',agent:'Proxy',hint:'/diagram <flow>',d:'Boxes and arrows flow diagram',kind:'diagram',
      s:'{"title":"...","nodes":[{"id":"a","label":"..."}],"edges":[{"from":"a","to":"b","label":"optional"}]}'},
    {c:'roadmap',agent:'Sovereign',hint:'/roadmap <goal>',d:'Phased roadmap with milestones',kind:'roadmap',
      s:'{"title":"...","items":[{"tag":"phase or timeframe","label":"milestone","detail":"..."}]}'},
    {c:'sketchnotes',agent:'Tutor',hint:'/sketchnotes <topic>',d:'Hand-drawn style visual notes',kind:'sketch',
      s:'{"title":"...","items":[{"label":"heading","detail":"note"}],"takeaway":"one line"}'},
    {c:'iceberg',agent:'Auditor',hint:'/iceberg <subject>',d:'Visible vs hidden factors',kind:'iceberg',
      s:'{"title":"...","above":["what everyone sees"],"below":["hidden causes, deepest last"]}'},
    {c:'blueprint',agent:'Warden',hint:'/blueprint <thing to build>',d:'Technical blueprint of components',kind:'blueprint',
      s:'{"title":"...","parts":[{"label":"component","detail":"spec or role"}],"notes":["constraint"]}'},
    {c:'explodedview',agent:'Scout',hint:'/explodedview <object or system>',d:'Parts pulled apart around the whole',kind:'exploded',
      s:'{"title":"the whole","parts":[{"label":"part","detail":"what it does"}]}'},
    {c:'tree',agent:'Historian',hint:'/tree <subject>',d:'Hierarchy tree',kind:'tree',
      s:'{"title":"...","root":{"label":"...","children":[{"label":"...","children":[]}]}} (max depth 3, max 12 nodes)'},
    {c:'timeline',agent:'Historian',hint:'/timeline <subject>',d:'Chronological timeline',kind:'timeline',
      s:'{"title":"...","items":[{"tag":"date or period","label":"event","detail":"..."}]}'},
    {c:'handwritten',agent:'Tutor',hint:'/handwritten <text or topic>',d:'Notes written out by hand on paper',kind:'handwritten',
      s:'{"title":"...","lines":["short handwritten-style line"]} (at most 10 lines)'}
  ];
  DEFS.forEach(function(x){
    x.visual=true;
    x.g='Task: produce the content for a '+x.d.toLowerCase()+' about the member\'s subject. '
      +'Use real, checkable content; when a figure is not known, say so in the text instead of inventing one. '
      +'Return this exact JSON shape: '+x.s+'. '+LIMITS;
  });

  /* ── parsing ─────────────────────────────────────────────── */
  function extractJSON(text){
    var t=String(text||''), m=/```(?:json)?\s*([\s\S]*?)```/i.exec(t);
    var body=m?m[1]:t.slice(t.indexOf('{'),t.lastIndexOf('}')+1);
    try{var o=JSON.parse(body);return o&&typeof o==='object'?o:null;}catch(e){return null;}
  }
  function str(v,n){v=v==null?'':String(v);n=n||160;return v.length>n?v.slice(0,n-1)+'…':v;}
  function arr(v,n){return Array.isArray(v)?v.slice(0,n||8):[];}
  function items(o){return arr(o.items,8).filter(function(i){return i&&(i.label||i.detail);});}

  /* ── DOM helpers (text only, never innerHTML) ────────────── */
  function el(tag,css,text){var e=document.createElement(tag);if(css)e.style.cssText=css;if(text!=null)e.textContent=str(text);return e;}
  function svg(tag,attrs,text){var e=document.createElementNS(SVGNS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);if(text!=null)e.textContent=str(text,40);return e;}
  function frame(o,kind){
    var f=el('div','margin-top:2px;padding:10px;border:1px solid '+LINE+';border-radius:4px;background:rgba(5,6,10,.6);max-width:100%;overflow-x:auto');
    f.setAttribute('data-copilot-visual',kind);
    if(o.title) f.appendChild(el('div','font-family:"Cinzel Decorative",serif;color:'+GOLD+';font-size:12px;margin-bottom:8px;letter-spacing:.04em',o.title));
    return f;
  }
  function card(label,detail,css){
    var c=el('div','border:1px solid '+LINE+';border-radius:3px;padding:6px 8px;background:rgba(201,168,76,.05);'+(css||''));
    if(label) c.appendChild(el('div','color:'+INK+';font-weight:600;font-size:12px',label));
    if(detail) c.appendChild(el('div','color:'+MUTED+';font-size:12px;margin-top:2px',detail));
    return c;
  }
  function needFont(){
    if(document.getElementById('omega-font-caveat')) return;
    var l=document.createElement('link');l.id='omega-font-caveat';l.rel='stylesheet';
    l.href='https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap';
    document.head.appendChild(l);
  }

  /* ── renderers: each returns an element, or null when the shape is wrong ── */
  var R={};
  R.matrix=function(o){
    var cr=arr(o.criteria,6).filter(function(c){return c&&c.name;}), op=arr(o.options,6).filter(function(p){return p&&p.name&&Array.isArray(p.scores);});
    if(!cr.length||!op.length) return null;
    var w=cr.map(function(c){var n=Number(c.weight);return n>0&&n<=5?n:1;});
    var totals=op.map(function(p){return cr.reduce(function(s,c,i){var v=Number(p.scores[i]);return s+(v>=0&&v<=5?v:0)*w[i];},0);});
    var best=Math.max.apply(null,totals), f=frame(o,'matrix'), t=el('table','border-collapse:collapse;font-size:12px;width:100%');
    var hr=el('tr');hr.appendChild(el('th','text-align:left;padding:4px;color:'+MUTED,'Option'));
    cr.forEach(function(c,i){hr.appendChild(el('th','padding:4px;color:'+GOLD,str(c.name,24)+' ×'+w[i]));});
    hr.appendChild(el('th','padding:4px;color:'+GOLD,'Total'));t.appendChild(hr);
    op.forEach(function(p,j){
      var r=el('tr',totals[j]===best?'background:rgba(201,168,76,.12)':'');
      r.appendChild(el('td','padding:4px;color:'+INK+';border-top:1px solid '+LINE,p.name));
      cr.forEach(function(c,i){var v=Number(p.scores[i]);r.appendChild(el('td','padding:4px;text-align:center;border-top:1px solid '+LINE+';color:'+INK,v>=0&&v<=5?String(v):'–'));});
      r.appendChild(el('td','padding:4px;text-align:center;font-weight:700;border-top:1px solid '+LINE+';color:'+(totals[j]===best?GOLD:INK),String(totals[j])));
      t.appendChild(r);
    });
    f.appendChild(t);
    f.appendChild(el('div','color:'+MUTED+';font-size:12px;margin-top:6px','Totals are weight × score, computed here from the scores shown.'+(o.note?' '+str(o.note):'')));
    return f;
  };
  R.infographic=function(o){
    var st=arr(o.stats,4).filter(function(s){return s&&s.value;}), pts=arr(o.points,5);
    if(!st.length&&!pts.length) return null;
    var f=frame(o,'infographic'), row=el('div','display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:6px');
    st.forEach(function(s){var c=el('div','text-align:center;padding:8px 4px;border:1px solid '+LINE+';border-radius:3px');
      c.appendChild(el('div','font-family:"Cinzel Decorative",serif;font-size:18px;color:'+GOLD,str(s.value,14)));
      c.appendChild(el('div','font-size:12px;color:'+MUTED+';margin-top:2px',s.label));row.appendChild(c);});
    f.appendChild(row);
    pts.forEach(function(p){f.appendChild(el('div','font-size:12px;color:'+INK+';margin-top:6px;padding-left:10px;border-left:2px solid '+CYAN,p));});
    if(o.source) f.appendChild(el('div','font-size:12px;color:'+MUTED+';margin-top:6px','Source: '+str(o.source)));
    return f;
  };
  R.canvas=function(o){
    /* Narrow drawer: the 9 blocks wrap, value proposition first, instead of the 5-column poster grid. */
    var B=[['value','Value proposition'],['segments','Customer segments'],['channels','Channels'],['relationships','Relationships'],['revenue','Revenue streams'],['activities','Key activities'],['resources','Key resources'],['partners','Key partners'],['costs','Cost structure']];
    if(!B.some(function(b){return arr(o[b[0]]).length;})) return null;
    var f=frame(o,'canvas'), g=el('div','display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:4px;font-size:12px');
    B.forEach(function(b){var c=el('div','border:1px solid '+(b[0]==='value'?GOLD:LINE)+';border-radius:3px;padding:5px;min-width:0');
      c.appendChild(el('div','color:'+GOLD+';font-weight:700;margin-bottom:3px',b[1]));
      arr(o[b[0]],4).forEach(function(x){c.appendChild(el('div','color:'+INK+';margin-top:2px','• '+str(x,60)));});g.appendChild(c);});
    f.appendChild(g);return f;
  };
  R.layers=function(o){
    var it=items(o);if(!it.length) return null;
    var f=frame(o,'layers');
    it.forEach(function(i,k){f.appendChild(card(i.label,i.detail,'margin:0 '+(k*4)+'px 3px;border-left:3px solid '+(k%2?CYAN:GOLD)));});
    return f;
  };
  R.cycle=function(o){
    var it=items(o);if(it.length<2) return null;
    var f=frame(o,'cycle'), n=it.length, W=300, cx=150, cy=150, rad=105;
    var s=svg('svg',{viewBox:'0 0 '+W+' 300',width:'100%',role:'img','aria-label':str(o.title||'cycle')});
    s.appendChild(svg('circle',{cx:cx,cy:cy,r:rad,fill:'none',stroke:LINE,'stroke-dasharray':'4 4'}));
    it.forEach(function(i,k){
      var a=-Math.PI/2+k*2*Math.PI/n, x=cx+rad*Math.cos(a), y=cy+rad*Math.sin(a);
      var a2=-Math.PI/2+(k+0.5)*2*Math.PI/n;
      s.appendChild(svg('polygon',{points:arrowPts(cx+rad*Math.cos(a2),cy+rad*Math.sin(a2),a2+Math.PI/2),fill:GOLD}));
      s.appendChild(svg('circle',{cx:x,cy:y,r:24,fill:'#0A0A0F',stroke:GOLD}));
      s.appendChild(svg('text',{x:x,y:y+4,'text-anchor':'middle','font-size':'15',fill:GOLD},String(k+1)));
    });
    f.appendChild(s);
    it.forEach(function(i,k){f.appendChild(card((k+1)+'. '+str(i.label,48),i.detail,'margin-top:3px'));});
    return f;
  };
  function arrowPts(x,y,ang){var p=[[7,0],[-5,-5],[-5,5]];return p.map(function(q){return (x+q[0]*Math.cos(ang)-q[1]*Math.sin(ang)).toFixed(1)+','+(y+q[0]*Math.sin(ang)+q[1]*Math.cos(ang)).toFixed(1);}).join(' ');}
  R.diagram=function(o){
    var nodes=arr(o.nodes,10).filter(function(n){return n&&n.id!=null&&n.label;}), edges=arr(o.edges,14);
    if(!nodes.length) return null;
    var ids={};nodes.forEach(function(n){ids[n.id]=n;n._d=0;});
    edges=edges.filter(function(e){return e&&ids[e.from]&&ids[e.to]&&e.from!==e.to;});
    for(var pass=0;pass<nodes.length;pass++) edges.forEach(function(e){if(ids[e.to]._d<ids[e.from]._d+1&&ids[e.from]._d<nodes.length) ids[e.to]._d=ids[e.from]._d+1;});
    var cols=[];nodes.forEach(function(n){(cols[n._d]=cols[n._d]||[]).push(n);});cols=cols.filter(Boolean);
    var BW=118,BH=34,GX=12,GY=30, per=Math.max.apply(null,cols.map(function(c){return c.length;}));
    var W=per*(BW+GX)+GX, H=cols.length*(BH+GY)+GY, f=frame(o,'diagram');
    var s=svg('svg',{viewBox:'0 0 '+W+' '+H,width:'100%',style:'max-width:'+W+'px;display:block;margin:0 auto',role:'img','aria-label':str(o.title||'diagram')});
    var pos={};cols.forEach(function(c,ri){c.forEach(function(n,ci){pos[n.id]={x:GX+ci*(BW+GX)+(per-c.length)*(BW+GX)/2,y:GY/2+ri*(BH+GY)};});});
    edges.forEach(function(e){var a=pos[e.from],b=pos[e.to],x1=a.x+BW/2,y1=a.y+BH,x2=b.x+BW/2,y2=b.y;
      if(y2<=y1){y1=a.y+BH/2;y2=b.y+BH/2;x1=a.x+(x2>x1?BW:0);x2=b.x+(x2>x1?0:BW);}
      s.appendChild(svg('line',{x1:x1,y1:y1,x2:x2,y2:y2-5,stroke:GOLD,'stroke-width':'1.2'}));
      s.appendChild(svg('polygon',{points:arrowPts(x2,y2-3,Math.atan2(y2-y1,x2-x1)),fill:GOLD}));
      if(e.label) s.appendChild(svg('text',{x:(x1+x2)/2+6,y:(y1+y2)/2+3,'font-size':'12',fill:MUTED},str(e.label,18)));});
    nodes.forEach(function(n){var p=pos[n.id];
      s.appendChild(svg('rect',{x:p.x,y:p.y,width:BW,height:BH,rx:4,fill:'#0A0A0F',stroke:CYAN}));
      s.appendChild(svg('text',{x:p.x+BW/2,y:p.y+BH/2+4,'text-anchor':'middle','font-size':'12',fill:INK},str(n.label,20)));});
    f.appendChild(s);return f;
  };
  R.roadmap=function(o){
    var it=items(o);if(!it.length) return null;
    var f=frame(o,'roadmap'), row=el('div','display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:5px');
    it.forEach(function(i,k){var c=card(i.label,i.detail,'border-top:3px solid '+(k%2?CYAN:GOLD));
      if(i.tag) c.insertBefore(el('div','font-family:"Courier Prime",monospace;font-size:12px;color:'+GOLD+';margin-bottom:3px;letter-spacing:.08em',String(i.tag).toUpperCase()),c.firstChild);
      row.appendChild(c);});
    f.appendChild(row);return f;
  };
  R.timeline=function(o){
    var it=items(o);if(!it.length) return null;
    var f=frame(o,'timeline'), list=el('div','border-left:2px solid '+GOLD+';margin-left:6px;padding-left:12px');
    it.forEach(function(i){var c=el('div','position:relative;margin-bottom:8px');
      c.appendChild(el('span','position:absolute;left:-18px;top:3px;width:9px;height:9px;border-radius:50%;background:'+GOLD));
      if(i.tag) c.appendChild(el('div','font-family:"Courier Prime",monospace;font-size:12px;color:'+CYAN,i.tag));
      c.appendChild(el('div','font-size:12px;color:'+INK+';font-weight:600',i.label));
      if(i.detail) c.appendChild(el('div','font-size:12px;color:'+MUTED,i.detail));list.appendChild(c);});
    f.appendChild(list);return f;
  };
  R.iceberg=function(o){
    var up=arr(o.above,4), dn=arr(o.below,6);if(!up.length&&!dn.length) return null;
    var f=frame(o,'iceberg');
    var tip=el('div','margin:0 auto;width:60%;padding:6px;text-align:center;background:linear-gradient(#e9eef2,#b9c9d3);color:#0A0A0F;clip-path:polygon(30% 0,70% 0,100% 100%,0 100%);font-size:12px');
    up.forEach(function(x){tip.appendChild(el('div','',str(x,50)));});f.appendChild(tip);
    f.appendChild(el('div','border-top:2px dashed '+CYAN+';margin:4px 0;font-size:12px;color:'+CYAN+';text-align:right','waterline'));
    var base=el('div','margin:0 auto;padding:8px;background:linear-gradient(rgba(79,195,217,.25),rgba(10,40,60,.6));clip-path:polygon(0 0,100% 0,85% 100%,15% 100%);text-align:center;font-size:12px;color:'+INK);
    dn.forEach(function(x,k){base.appendChild(el('div','margin:3px 0;opacity:'+(1-k*0.08),str(x,60)));});f.appendChild(base);
    return f;
  };
  R.blueprint=function(o){
    var pts=arr(o.parts,8).filter(function(p){return p&&p.label;});if(!pts.length) return null;
    var f=frame(o,'blueprint');f.style.background='#0b2a4a';
    f.style.backgroundImage='linear-gradient(rgba(255,255,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px)';f.style.backgroundSize='14px 14px';
    var g=el('div','display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:6px');
    pts.forEach(function(p,k){var c=el('div','border:1px dashed rgba(220,240,255,.6);padding:6px;color:#dcefff');
      c.appendChild(el('div','font-family:"Courier Prime",monospace;font-size:12px;opacity:.7','C-'+String(k+1).padStart(2,'0')));
      c.appendChild(el('div','font-size:12px;font-weight:600',p.label));if(p.detail) c.appendChild(el('div','font-size:12px;opacity:.85;margin-top:2px',p.detail));g.appendChild(c);});
    f.appendChild(g);
    arr(o.notes,4).forEach(function(n){f.appendChild(el('div','font-family:"Courier Prime",monospace;font-size:12px;color:#dcefff;margin-top:5px','NOTE: '+str(n)));});
    return f;
  };
  R.exploded=function(o){
    var pts=arr(o.parts,8).filter(function(p){return p&&p.label;});if(!pts.length) return null;
    var f=frame(o,'exploded'), n=pts.length, s=svg('svg',{viewBox:'0 0 320 260',width:'100%',role:'img','aria-label':str(o.title||'exploded view')});
    s.appendChild(svg('rect',{x:130,y:105,width:60,height:50,rx:6,fill:'rgba(201,168,76,.15)',stroke:GOLD}));
    s.appendChild(svg('text',{x:160,y:134,'text-anchor':'middle','font-size':'12',fill:GOLD},'WHOLE'));
    pts.forEach(function(p,k){var a=-Math.PI/2+k*2*Math.PI/n, x=160+118*Math.cos(a), y=130+100*Math.sin(a);
      s.appendChild(svg('line',{x1:160+34*Math.cos(a),y1:130+28*Math.sin(a),x2:x,y2:y,stroke:LINE,'stroke-dasharray':'3 3'}));
      s.appendChild(svg('circle',{cx:x,cy:y,r:13,fill:'#0A0A0F',stroke:CYAN}));
      s.appendChild(svg('text',{x:x,y:y+4,'text-anchor':'middle','font-size':'12',fill:CYAN},String(k+1)));});
    f.appendChild(s);
    pts.forEach(function(p,k){f.appendChild(card((k+1)+'. '+str(p.label,48),p.detail,'margin-top:3px'));});
    return f;
  };
  R.tree=function(o){
    var root=o.root;if(!root||!root.label) return null;
    var f=frame(o,'tree'), count={n:0};
    function node(t,depth){if(!t||!t.label||count.n++>=14) return null;
      var wrap=el('div','margin-left:'+(depth?14:0)+'px;'+(depth?'border-left:1px solid '+LINE+';padding-left:8px;':''));
      wrap.appendChild(el('div','font-size:12px;padding:2px 0;color:'+(depth?INK:GOLD)+';font-weight:'+(depth?400:700),(depth?'└ ':'')+str(t.label,60)));
      if(depth<3) arr(t.children,6).forEach(function(c){var k=node(c,depth+1);if(k) wrap.appendChild(k);});
      return wrap;}
    f.appendChild(node(root,0));return f;
  };
  R.sketch=function(o){
    var it=items(o);if(!it.length) return null;needFont();
    var f=frame(o,'sketch');f.style.background='#f6f1e3';f.style.fontFamily='Caveat,"Comic Sans MS",cursive';
    if(f.firstChild) {f.firstChild.style.fontFamily='Caveat,cursive';f.firstChild.style.color='#3a2e1a';f.firstChild.style.fontSize='20px';}
    var g=el('div','display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px');
    it.forEach(function(i,k){var c=el('div','border:2px solid #3a2e1a;border-radius:14px 6px 12px 8px;padding:6px 8px;transform:rotate('+((k%2?1:-1)*1.2)+'deg);color:#3a2e1a');
      c.appendChild(el('div','font-size:18px;font-weight:700',i.label));if(i.detail) c.appendChild(el('div','font-size:16px',i.detail));g.appendChild(c);});
    f.appendChild(g);
    if(o.takeaway) f.appendChild(el('div','margin-top:10px;font-size:18px;color:#8a1c1c;text-decoration:underline wavy','→ '+str(o.takeaway)));
    return f;
  };
  R.handwritten=function(o){
    var lines=arr(o.lines,10);if(!lines.length) return null;needFont();
    var f=frame(o,'handwritten');
    f.style.background='#fbf7ec';f.style.backgroundImage='repeating-linear-gradient(transparent,transparent 25px,#c8d8e8 26px)';f.style.paddingLeft='26px';
    if(f.firstChild){f.firstChild.style.fontFamily='Caveat,cursive';f.firstChild.style.fontSize='22px';f.firstChild.style.color='#1b2f6b';}
    lines.forEach(function(l){f.appendChild(el('div','font-family:Caveat,"Comic Sans MS",cursive;font-size:20px;line-height:26px;color:#1b2f6b',str(l,90)));});
    return f;
  };

  /* Draw `reply` for command `cmd` into `host`. Returns true when a visual was drawn. */
  function render(cmd,reply,host){
    var o=extractJSON(reply), fn=R[cmd.kind], node=null;
    try{node=o&&fn?fn(o):null;}catch(e){node=null;}
    if(node){host.textContent='';host.appendChild(node);return true;}
    return false;
  }

  window.OmegaCopilotVisuals={commands:DEFS,render:render,_extractJSON:extractJSON};
  document.dispatchEvent(new CustomEvent('omega:copilot-visuals-ready'));
})();
