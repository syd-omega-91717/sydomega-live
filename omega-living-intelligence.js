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
    if(!links.some(function(link){return !!(link.from_item_id&&link.to_item_id);}))root.appendChild(make('p','oli-note','Relationship endpoints are intentionally omitted from the current summary-only query. Open Ω LIFE to inspect and edit the complete member-owned graph.'));
    if(items.length>60)root.appendChild(make('p','oli-note','Showing 60 of '+items.length+' nodes. Open Ω LIFE to search and manage the full set.'));
    state('oli-graph-state',items.length+' NODES · '+(visibleEdges.length?visibleEdges.length+' EXPLICIT EDGES':'EDGE DETAIL IN LIFE'));
  }
  function render(){
    var api=window.OmegaPersonalContext;
    if(!api||typeof api.status!=='function'){
      setText('oli-overall-state','PRIVATE CONTEXT API UNAVAILABLE');state('oli-context-state','UNAVAILABLE');state('oli-trust-state','UNAVAILABLE');renderConsent(null,false);renderGraph(null,false);return;
    }
    var status=api.status(),prefs=typeof api.getPreferences==='function'?api.getPreferences():{},metadata=typeof api.listMetadata==='function'?api.listMetadata():[];
    var authenticated=status.authenticated===true,sourceAvailable=status.dataAvailable===true,preferencesAvailable=status.preferencesAvailable===true;
    setText('oli-overall-state',authenticated?'PRIVATE CONTEXT CONNECTED':'SIGN IN REQUIRED');
    state('oli-context-state',!authenticated?'SIGN IN REQUIRED':sourceAvailable?'LIVE SOURCE':'SOURCE UNAVAILABLE');state('oli-trust-state',authenticated&&preferencesAvailable?'CONSENT READ FROM PRIVATE SOURCE':'CONSENT UNAVAILABLE');
    setText('oli-record-count',!sourceAvailable?'—':status.items===undefined?'—':status.items);setText('oli-link-count',!sourceAvailable?'—':status.links===undefined?'—':status.links);setText('oli-consented-count',!sourceAvailable?'—':status.aiEligible===undefined?'—':status.aiEligible);
    var sourceCount=metadata.filter(function(x){return !!(x.source_kind||x.source_label);}).length;setText('oli-source-count',sourceCount?sourceCount:'NOT LOADED');
    renderConsent(prefs,preferencesAvailable);renderGraph(api,sourceAvailable);
    var advice=el('oli-advice-boundary');if(advice)advice.textContent=prefs.ai_personalization_enabled===true?'Account-level AI permission is enabled, but no model is connected here. Item consent, server-side policy, and a governed action approval are still required.':'AI personalization is denied or unavailable. No model is called; use the existing goal, mission, and project workspaces.';
    if(!authenticated)setText('oli-overall-state','SIGN IN REQUIRED · PRIVATE DATA NOT SHOWN');else if(!sourceAvailable)setText('oli-overall-state','SOURCE UNAVAILABLE · DATA NOT ASSUMED EMPTY');
  }
  function renderPlanComposer(){
    var root=el('oli-plan-composer');if(!root||root.dataset.ready==='true')return;root.dataset.ready='true';
    var wrap=make('div','oli-plan-tool'),heading=make('h3','','Deterministic Plan Composer');
    var note=make('p','oli-note','Template-based planning only. No AI call, persistence, reminder scheduling, or external action occurs here.');
    var form=make('form','oli-plan-form'),objectiveLabel=make('label','','Objective or question');
    objectiveLabel.htmlFor='oli-plan-objective';
    var objective=make('input','');objective.id='oli-plan-objective';objective.name='objective';objective.type='text';objective.maxLength=240;objective.required=true;objective.placeholder='What outcome do you want to achieve?';
    var typeLabel=make('label','','Plan type');typeLabel.htmlFor='oli-plan-type';
    var type=make('select','');type.id='oli-plan-type';type.name='type';
    [['project','Project / execution'],['research','Research'],['learning','Learning path'],['decision','Decision analysis'],['report','Report'],['reminder','Reminder proposal']].forEach(function(pair){var option=make('option','',pair[1]);option.value=pair[0];type.appendChild(option);});
    var submit=make('button','oli-button','GENERATE DRAFT PLAN');submit.type='submit';
    form.append(objectiveLabel,objective,typeLabel,type,submit);
    var outputLabel=make('label','','Plan draft — select and copy into the canonical workspace');outputLabel.htmlFor='oli-plan-output';
    var output=make('textarea','oli-plan-output');output.id='oli-plan-output';output.rows=10;output.readOnly=true;output.placeholder='Your plan draft appears here. It is not saved or scheduled.';
    var status=make('p','oli-plan-status','DRAFT ONLY · NOT SAVED');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    var templates={
      project:['Define the outcome and a measurable acceptance condition.','List constraints, dependencies, owners, and risks.','Break the outcome into the smallest verifiable tasks.','Execute one authorized next step and record its evidence.','Review results, update the canonical task, and choose the next step.'],
      research:['Turn the question into a testable research brief.','Select trustworthy primary sources and record retrieval dates.','Separate source facts, inference, and unresolved questions.','Compare evidence, contradictions, freshness, and confidence.','Write a sourced summary with limitations and a next decision.'],
      learning:['Define the skill and observable mastery target.','Assess the starting level and prerequisite knowledge.','Choose a credible learning resource and practice task.','Practice, retrieve from memory, and record the outcome.','Verify mastery with a test or artifact and plan a review.'],
      decision:['State the decision, deadline, and non-negotiable constraints.','List viable options, including doing nothing.','Define decision criteria and gather evidence for each option.','Compare benefits, costs, reversibility, and failure scenarios.','Record the rationale, approver, and review trigger.'],
      report:['Define the audience, question, period, and scope.','Inventory authorized data sources, ownership, and freshness.','Validate completeness, definitions, and calculation methods.','Analyze results and separate observation from interpretation.','Publish findings with citations, caveats, and next actions.'],
      reminder:['Define the event or condition that should trigger a reminder.','Choose a time window, timezone, frequency, and quiet hours.','Confirm consent, recipient, and whether the reminder is sensitive.','Create the reminder in an existing authorized scheduling surface.','Verify delivery and provide a simple pause or opt-out route.']
    };
    form.addEventListener('submit',function(event){
      event.preventDefault();var goal=objective.value.trim();if(!goal){status.textContent='Enter an objective before generating a plan.';return;}
      var kind=type.value,steps=templates[kind]||templates.project;
      output.value='Ω ACTION PLAN · '+kind.toUpperCase()+'\nOBJECTIVE: '+goal+'\nSTATE: DRAFT ONLY · TEMPLATE-BASED · NOT AI-GENERATED · NOT PERSISTED\n\n'+steps.map(function(step,index){return (index+1)+'. '+step;}).join('\n')+'\n\nAPPROVAL BOUNDARY: No task was created, no reminder was scheduled, no message was sent, and no external action was performed. Copy this draft into the appropriate canonical workspace to track progress.';
      status.textContent='Draft generated in this page only. Copy it into the canonical workspace to persist and track progress.';
    });
    wrap.append(heading,note,form,outputLabel,output,status);root.appendChild(wrap);
  }
  function boot(){renderPlanComposer();render();window.addEventListener('omega:personal-context:changed',render);document.addEventListener('omega:consent-changed',render);window.addEventListener('focus',render);window.setTimeout(render,350);window.setTimeout(render,1200);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
