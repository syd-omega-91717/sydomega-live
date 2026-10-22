/* Ω Living Intelligence Core — read-only orchestration over canonical member context. */
(function(){
  'use strict';
  if(window.__omegaLivingIntelligenceLoaded)return;
  window.__omegaLivingIntelligenceLoaded=true;
  var el=function(id){return document.getElementById(id);};
  var labels={ai_personalization_enabled:'AI PERSONALIZATION',web_research_enabled:'WEB RESEARCH',proactive_alerts_enabled:'PROACTIVE ALERTS',sensitive_data_processing_enabled:'SENSITIVE-DATA PROCESSING'};
  function make(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;}
  function setText(id,value){var n=el(id);if(n)n.textContent=String(value);}
  function state(id,value){var n=el(id);if(n)n.textContent=value;}
  function renderConsent(prefs,available){
    var root=el('oli-consent-list');if(!root)return;root.replaceChildren();
    Object.keys(labels).forEach(function(key){
      var card=make('div','oli-consent'),body=make('div','',null),name=make('b','',labels[key]);
      var descriptions={ai_personalization_enabled:'Account-level permission; item consent remains separately required.',web_research_enabled:'Permission for a future governed web-research workflow.',proactive_alerts_enabled:'Permission for a future governed alert workflow.',sensitive_data_processing_enabled:'Additional permission required for highly sensitive context.'};
      body.append(name,make('small','',descriptions[key]));
      card.append(body,make('span','oli-consent-state',available?(prefs&&prefs[key]===true?'GRANTED':'DENIED'):'UNAVAILABLE'));
      root.appendChild(card);
    });
  }
  function renderGraph(api,available){
    var root=el('oli-graph');if(!root)return;root.replaceChildren();
    if(!available){root.appendChild(make('p','oli-empty','Private context source unavailable. Records and relationships are not being treated as empty.'));state('oli-graph-state','SOURCE UNAVAILABLE');return;}
    if(!api||typeof api.listMetadata!=='function'){root.appendChild(make('p','oli-empty','Private context API unavailable. Open Ω LIFE and verify the authenticated source.'));state('oli-graph-state','UNAVAILABLE');return;}
    var items=[],links=[];
    try{items=api.listMetadata()||[];}catch(e){}
    try{links=typeof api.listLinkMetadata==='function'?(api.listLinkMetadata()||[]):[];}catch(e){}
    if(!items.length){root.appendChild(make('p','oli-empty','No context nodes are available in this session. Check the canonical source state before interpreting this as an empty graph.'));state('oli-graph-state','NO NODES');return;}
    var byId={};items.forEach(function(item){byId[item.id]=item;});
    items.slice(0,60).forEach(function(item){
      var card=make('article','oli-node'),title=make('h3','',item.title||'Untitled context'),meta=make('div','oli-node-meta');
      [String(item.context_kind||'other').replace(/_/g,' ').toUpperCase(),String(item.review_status||'UNVERIFIED').toUpperCase(),item.ai_processing_allowed===true?'ITEM CONSENT ON':'ITEM CONSENT OFF',String(item.sensitivity||'unknown').toUpperCase()].forEach(function(v){meta.appendChild(make('span','',v));});
      var provenance=[item.source_kind,item.source_label].filter(Boolean).join(' · ');if(provenance)meta.appendChild(make('span','',provenance));
      if(item.expires_at)meta.appendChild(make('span','','EXPIRES '+new Date(item.expires_at).toLocaleDateString()));
      if(item.updated_at)meta.appendChild(make('span','','UPDATED '+new Date(item.updated_at).toLocaleDateString()));
      card.append(title,meta);root.appendChild(card);
    });
    var visibleEdges=links.filter(function(link){return byId[link.from_item_id]&&byId[link.to_item_id];});
    visibleEdges.forEach(function(link){
      var from=byId[link.from_item_id],to=byId[link.to_item_id];
      root.appendChild(make('div','oli-edge',from.title+' —['+String(link.relation_kind||'related_to').replace(/_/g,' ')+']→ '+to.title+' · '+(link.user_confirmed===true?'CONFIRMED':'UNCONFIRMED')+' · '+(link.source_kind||'source unavailable')));
    });
    if(items.length>60)root.appendChild(make('p','oli-note','Showing 60 of '+items.length+' nodes. Open Ω LIFE to search and manage the full set.'));
    state('oli-graph-state',items.length+' NODES · '+visibleEdges.length+' EXPLICIT EDGES');
  }
  function render(){
    var api=window.OmegaPersonalContext;
    if(!api||typeof api.status!=='function'){
      setText('oli-overall-state','PRIVATE CONTEXT API UNAVAILABLE');state('oli-context-state','UNAVAILABLE');state('oli-trust-state','UNAVAILABLE');renderConsent(null);renderGraph(null);return;
    }
    var status=api.status(),prefs=typeof api.getPreferences==='function'?api.getPreferences():{},metadata=typeof api.listMetadata==='function'?api.listMetadata():[];
    var authenticated=status.authenticated===true;
    setText('oli-overall-state',authenticated?'PRIVATE CONTEXT CONNECTED':'SIGN IN REQUIRED');
    state('oli-context-state',authenticated?'AUTHENTICATED':'SIGN IN REQUIRED');state('oli-trust-state',authenticated?'CONSENT READ FROM PRIVATE SOURCE':'CONSENT UNAVAILABLE');
    setText('oli-record-count',status.items===undefined?'—':status.items);setText('oli-link-count',status.links===undefined?'—':status.links);setText('oli-consented-count',status.aiEligible===undefined?'—':status.aiEligible);
    setText('oli-source-count',metadata.filter(function(x){return !!(x.source_kind||x.source_label);}).length);
    renderConsent(prefs);renderGraph(api);
    var advice=el('oli-advice-boundary');if(advice)advice.textContent=prefs.ai_personalization_enabled===true?'Account-level AI permission is enabled, but no model is connected here. Item consent, server-side policy, and a governed action approval are still required.':'AI personalization is denied or unavailable. No model is called; use the existing goal, mission, and project workspaces.';
    if(!authenticated)setText('oli-overall-state','SIGN IN REQUIRED · PRIVATE DATA NOT SHOWN');
  }
  function boot(){render();window.addEventListener('omega:personal-context:changed',render);document.addEventListener('omega:consent-changed',render);window.addEventListener('focus',render);window.setTimeout(render,350);window.setTimeout(render,1200);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
