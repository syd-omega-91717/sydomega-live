/* Ω Personal Context Graph
 * User-owned life context with explicit, revocable AI-use preferences.
 * This module never calls an AI provider and never stores personal content locally.
 */
(function(){
  'use strict';
  if(window.__omegaPersonalContextLoaded)return;
  window.__omegaPersonalContextLoaded=true;
  var POLICY_VERSION='2026-10-22-v1';
  var MAX_FILE_BYTES=1000000;
  var MAX_CONTENT_CHARS=200000;
  var sb=null,uid=null,items=[],links=[],dataAvailable=false,preferencesExists=false,preferences=defaultPreferences();
  var editingId=null,sourceKind='user_authored',sourceLabel=null,sourceMetadata={};
  var root=document.getElementById('omega-personal-context');
  var summary=document.getElementById('omega-personal-context-summary');

  function defaultPreferences(){return {ai_personalization_enabled:false,web_research_enabled:false,proactive_alerts_enabled:false,sensitive_data_processing_enabled:false,consent_version:POLICY_VERSION};}
  function client(){if(window.OmegaSB&&typeof window.OmegaSB.get==='function')return window.OmegaSB.get();return Promise.resolve(window.__omegaSb||null);}
  function node(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e;}
  function el(id){return document.getElementById(id);}
  function setStatus(message,kind){var e=el('pc-status');if(!e)return;e.textContent=message||'';e.dataset.kind=kind||'info';}
  function setTruth(message){var e=el('pc-truth');if(e)e.textContent=message;}
  function asDate(value){if(!value)return 'date unavailable';var d=new Date(value);return Number.isNaN(d.getTime())?'date unavailable':d.toLocaleString();}
  function dispatchAiConsent(){document.dispatchEvent(new CustomEvent('omega:consent-changed',{detail:{type:'ai_personalization',granted:preferences.ai_personalization_enabled===true}}));}
  function dispatchChanged(){window.dispatchEvent(new CustomEvent('omega:personal-context:changed',{detail:{count:items.length,linkedCount:links.length,aiEligibleCount:getAiEligibleContext().length}}));}
  function getAiEligibleContext(){
    if(!preferences.ai_personalization_enabled)return [];
    return items.filter(function(item){
      if(!item.ai_processing_allowed||item.review_status!=='confirmed')return false;
      if(item.sensitivity==='highly_sensitive'&&!preferences.sensitive_data_processing_enabled)return false;
      return true;
    }).map(function(item){return {id:item.id,title:item.title,context_kind:item.context_kind,sensitivity:item.sensitivity};});
  }
  function updatePublicApi(){
    window.OmegaPersonalContext={
      policyVersion:POLICY_VERSION,
      ready:!!uid,
      refresh:refresh,
      listMetadata:function(){return items.map(function(x){return {id:x.id,title:x.title,context_kind:x.context_kind,sensitivity:x.sensitivity,source_kind:x.source_kind||null,source_label:x.source_label||null,tags:Array.isArray(x.tags)?x.tags.slice():[],ai_processing_allowed:!!x.ai_processing_allowed,ai_consent_at:x.ai_consent_at||null,review_status:x.review_status,user_confirmed:x.user_confirmed===true,expires_at:x.expires_at||null,created_at:x.created_at||null,updated_at:x.updated_at||null};});},
      listLinkMetadata:function(){return links.map(function(x){return {id:x.id,from_item_id:x.from_item_id,to_item_id:x.to_item_id,relation_kind:x.relation_kind,source_kind:x.source_kind||null,user_confirmed:x.user_confirmed===true,created_at:x.created_at||null};});},
      getPreferences:function(){return Object.assign({},preferences);},
      getConsentedItemIds:function(){return getAiEligibleContext().map(function(x){return x.id;});},
      status:function(){return {authenticated:!!uid,dataAvailable:!!dataAvailable,preferencesAvailable:!!preferencesExists,items:items.length,links:links.length,aiEligible:getAiEligibleContext().length,aiPersonalizationEnabled:!!preferences.ai_personalization_enabled,webResearchEnabled:!!preferences.web_research_enabled,proactiveAlertsEnabled:!!preferences.proactive_alerts_enabled};}
    };
  }
  function renderSummary(){
    if(!summary)return;
    summary.replaceChildren();
    var title=node('h3','', 'YOUR PERSONAL CONTEXT');
    var summaryText=!uid?'Sign in to view your private context.':!dataAvailable?'Private context storage is unavailable. No records are being treated as empty; the schema migration or authenticated data source is not ready.':items.length+' private record(s) · '+links.length+' connection(s) · '+getAiEligibleContext().length+' AI-consented record(s).';
    var p=node('p','',summaryText);
    summary.append(title,p);
    var note=node('p','pc-mini','AI use is opt-in. No personal content is transmitted by this dashboard. Analysis requires a separately configured, governed AI route.');
    summary.appendChild(note);
    var link=node('a','pc-button','OPEN PERSONAL CONTEXT');
    link.href='/life.html#personal-context';
    summary.appendChild(link);
  }
  function syncPreferenceControls(){
    ['ai_personalization_enabled','web_research_enabled','proactive_alerts_enabled','sensitive_data_processing_enabled'].forEach(function(key){var input=el('pc-pref-'+key);if(input)input.checked=!!preferences[key];});
    var allowed=!!preferences.ai_personalization_enabled;
    var itemConsent=el('pc-item-ai-consent');
    if(itemConsent){itemConsent.disabled=!allowed;var lbl=el('pc-item-ai-consent-help');if(lbl)lbl.textContent=allowed?'Enable this item separately; this only records permission and does not transmit data.':'Enable AI personalization above first; item-level consent remains off by default.';}
    var sensitivity=el('pc-sensitivity');
    if(itemConsent&&sensitivity&&sensitivity.value==='highly_sensitive'&&!preferences.sensitive_data_processing_enabled){itemConsent.disabled=true;var help=el('pc-item-ai-consent-help');if(help)help.textContent='Highly sensitive items require the separate sensitive-data consent above.';}
  }
  function renderItems(){
    var count=el('pc-library-count');if(count)count.textContent=items.length+' RECORD(S) · '+links.length+' CONNECTION(S) · PRIVATE';
    var list=el('pc-items');if(!list)return;list.replaceChildren();
    var query=(el('pc-search')?.value||'').trim().toLowerCase();
    var kindFilter=el('pc-kind-filter')?.value||'';
    var filtered=items.filter(function(item){
      if(kindFilter&&item.context_kind!==kindFilter)return false;
      return !query||[item.title,item.content,item.context_kind,(item.tags||[]).join(' ')].join(' ').toLowerCase().includes(query);
    });
    if(!filtered.length){list.appendChild(node('div','pc-empty',items.length?'No records match this filter.':'Your private context is empty. Add a reflection, goal, skill, knowledge item, relationship note, or import a text file.'));return;}
    filtered.forEach(function(item){
      var card=node('article','pc-item');
      card.appendChild(node('h4','',item.title));
      var meta=node('div','pc-meta');
      meta.appendChild(node('span','pc-tag',item.context_kind.replace(/_/g,' ').toUpperCase()));
      meta.appendChild(node('span','pc-tag',String(item.sensitivity||'sensitive').toUpperCase()));
      meta.appendChild(node('span','pc-tag',item.ai_processing_allowed?'AI CONSENTED':'AI NOT CONSENTED'));
      meta.appendChild(node('span','pc-tag',item.source_kind==='file_import'?'IMPORTED FILE':'USER-CREATED'));
      card.appendChild(meta);
      var preview=item.content.length>260?item.content.slice(0,260)+'…':item.content;
      card.appendChild(node('p','pc-content',preview));
      var detail=node('details','');
      detail.appendChild(node('summary','', 'VIEW FULL CONTENT & PROVENANCE'));
      detail.appendChild(node('pre','pc-content',item.content));
      detail.appendChild(node('p','pc-mini','Source: '+(item.source_label||item.source_kind||'user authored')+' · Updated: '+asDate(item.updated_at)+' · Review: '+item.review_status));
      if(item.tags&&item.tags.length)detail.appendChild(node('p','pc-mini','Tags: '+item.tags.join(', ')));
      card.appendChild(detail);
      var actions=node('div','pc-item-actions');
      var edit=node('button','pc-button','EDIT');edit.type='button';edit.addEventListener('click',function(){loadForEdit(item);});
      var remove=node('button','pc-button danger','DELETE');remove.type='button';remove.addEventListener('click',function(){deleteItem(item);});
      actions.append(edit,remove);card.appendChild(actions);list.appendChild(card);
    });
  }
  function renderLinkControls(){
    var from=el('pc-link-from'),to=el('pc-link-to');if(!from||!to)return;
    [from,to].forEach(function(select){var prior=select.value;select.replaceChildren();select.appendChild(node('option','', 'Select a context item'));select.options[0].value='';items.forEach(function(item){var opt=node('option','',item.title);opt.value=item.id;select.appendChild(opt);});if(items.some(function(item){return item.id===prior;}))select.value=prior;});
    var save=el('pc-link-save');if(save)save.disabled=items.length<2;
    var list=el('pc-links');if(!list)return;list.replaceChildren();
    if(!links.length){list.appendChild(node('p','pc-mini','No relationships between context items have been recorded yet.'));return;}
    var map={};items.forEach(function(item){map[item.id]=item.title;});
    links.forEach(function(link){
      var row=node('div','pc-link-row');
      var label=node('span','',(map[link.from_item_id]||'Unavailable item')+' — '+link.relation_kind.replace(/_/g,' ')+' → '+(map[link.to_item_id]||'Unavailable item'));
      var del=node('button','pc-button danger','REMOVE');del.type='button';del.addEventListener('click',async function(){if(!window.confirm('Remove this private context link?'))return;var r=await sb.from('omega_personal_context_links').delete().eq('id',link.id).eq('user_id',uid);if(r.error){setStatus('Could not remove connection. No data was changed.','error');return;}await refresh();setStatus('Connection removed.','info');});
      row.append(label,del);list.appendChild(row);
    });
  }
  function renderAll(){renderItems();renderLinkControls();renderSummary();syncPreferenceControls();updatePublicApi();dispatchChanged();dispatchAiConsent();}
  async function refresh(){
    if(!sb||!uid)return;
    var summaryOnly=!root&&!!summary;
    var itemColumns=summaryOnly?'id,title,context_kind,sensitivity,ai_processing_allowed,review_status,updated_at':'id,user_id,title,context_kind,content,sensitivity,source_kind,source_label,tags,metadata,ai_processing_allowed,ai_consent_at,review_status,user_confirmed,expires_at,created_at,updated_at';
    var linkColumns=summaryOnly?'id':'id,user_id,from_item_id,to_item_id,relation_kind,source_kind,user_confirmed,note,created_at';
    var results=await Promise.all([
      sb.from('omega_personal_context_items').select(itemColumns).eq('user_id',uid).order('updated_at',{ascending:false}).limit(200),
      sb.from('omega_personal_context_preferences').select('user_id,ai_personalization_enabled,web_research_enabled,proactive_alerts_enabled,sensitive_data_processing_enabled,consent_version,consent_updated_at,updated_at').eq('user_id',uid).maybeSingle(),
      sb.from('omega_personal_context_links').select(linkColumns).eq('user_id',uid).order('created_at',{ascending:false}).limit(200)
    ]);
    if(results[0].error||results[2].error){
      items=[];links=[];dataAvailable=false;renderAll();setTruth('MIGRATION PENDING OR DATA SOURCE UNAVAILABLE');setStatus('Personal context storage is not available yet. The schema migration must pass review and be applied before this feature can save or load data.','warning');return;
    }
    if(results[1].error){setStatus('Preferences could not be loaded. AI consent remains disabled in this view.','warning');preferences=defaultPreferences();preferencesExists=false;}
    else {preferencesExists=!!results[1].data;preferences=Object.assign(defaultPreferences(),results[1].data||{});}
    items=results[0].data||[];links=results[2].data||[];dataAvailable=true;
    setTruth('LIVE · AUTHENTICATED PRIVATE DATA');
    setStatus(items.length>=200?'Loaded 200 records. Refine your search; older records may require pagination.':'Loaded '+items.length+' private record(s). No external AI call was made.','info');
    renderAll();
  }
  async function savePreferences(){
    if(!sb||!uid)return;
    var values={
      ai_personalization_enabled:!!preferences.ai_personalization_enabled,
      web_research_enabled:!!preferences.web_research_enabled,
      proactive_alerts_enabled:!!preferences.proactive_alerts_enabled,
      sensitive_data_processing_enabled:!!preferences.sensitive_data_processing_enabled,
      consent_version:POLICY_VERSION
    };
    var r=preferencesExists
      ?await sb.from('omega_personal_context_preferences').update(values).eq('user_id',uid)
      :await sb.from('omega_personal_context_preferences').insert(Object.assign({user_id:uid},values));
    if(r.error){setStatus('Preference update failed. Existing saved preferences remain authoritative. Refresh and retry if another tab changed these settings.','error');return false;}
    preferencesExists=true;
    setStatus('Privacy preferences saved. AI and web research are not invoked by this page.','info');
    dispatchAiConsent();
    return true;
  }
  function resetForm(){
    editingId=null;sourceKind='user_authored';sourceLabel=null;sourceMetadata={};
    var form=el('pc-form');if(form)form.reset();
    var id=el('pc-editing-id');if(id)id.value='';
    var title=el('pc-form-title');if(title)title.textContent='ADD PERSONAL CONTEXT';
    var cancel=el('pc-cancel-edit');if(cancel)cancel.hidden=true;
    var file=el('pc-file');if(file)file.value='';
    syncPreferenceControls();
  }
  function loadForEdit(item){
    editingId=item.id;sourceKind=item.source_kind||'user_authored';sourceLabel=item.source_label||null;sourceMetadata=item.metadata||{};
    el('pc-title').value=item.title;el('pc-kind').value=item.context_kind;el('pc-sensitivity').value=item.sensitivity;el('pc-content').value=item.content;el('pc-tags').value=(item.tags||[]).join(', ');el('pc-item-ai-consent').checked=!!item.ai_processing_allowed;
    var title=el('pc-form-title');if(title)title.textContent='EDIT PERSONAL CONTEXT';
    var cancel=el('pc-cancel-edit');if(cancel)cancel.hidden=false;
    syncPreferenceControls();el('pc-title').focus();
  }
  async function saveItem(event){
    event.preventDefault();if(!sb||!uid)return;
    var title=el('pc-title').value.trim(),content=el('pc-content').value;
    if(!title||!content.trim()){setStatus('A title and non-empty content are required.','error');return;}
    if(content.length>MAX_CONTENT_CHARS){setStatus('Content exceeds the 200,000-character limit. Split it into smaller records.','error');return;}
    var sensitivity=el('pc-sensitivity').value;
    var aiAllowed=!!el('pc-item-ai-consent').checked;
    if(aiAllowed&&!preferences.ai_personalization_enabled){setStatus('Enable account-level AI personalization before consenting to this item.','error');return;}
    if(aiAllowed&&sensitivity==='highly_sensitive'&&!preferences.sensitive_data_processing_enabled){setStatus('Highly sensitive processing requires separate explicit consent.','error');return;}
    var tags=el('pc-tags').value.split(',').map(function(t){return t.trim().slice(0,60);}).filter(Boolean).slice(0,20);
    var payload={
      user_id:uid,title:title,context_kind:el('pc-kind').value,content:content,
      sensitivity:sensitivity,source_kind:sourceKind,source_label:sourceLabel,
      tags:tags,metadata:sourceMetadata,ai_processing_allowed:aiAllowed,
      ai_consent_at:aiAllowed?new Date().toISOString():null,review_status:'confirmed',user_confirmed:true
    };
    var button=el('pc-save');button.disabled=true;
    var result=editingId?await sb.from('omega_personal_context_items').update(payload).eq('id',editingId).eq('user_id',uid):await sb.from('omega_personal_context_items').insert(payload);
    button.disabled=false;
    if(result.error){setStatus('Save failed. Check the migration status and your privacy-consent settings; no fallback copy was stored locally.','error');return;}
    resetForm();await refresh();setStatus('Private context saved to your authenticated account. AI use remains consent-gated.','info');
  }
  async function deleteItem(item){
    if(!window.confirm('Permanently delete “'+item.title+'” and its context links? This cannot be undone.'))return;
    var r=await sb.from('omega_personal_context_items').delete().eq('id',item.id).eq('user_id',uid);
    if(r.error){setStatus('Delete failed. The record was not removed.','error');return;}
    await refresh();setStatus('Record permanently deleted. Related links were removed by the database.','info');
  }
  async function addLink(event){
    event.preventDefault();if(!sb||!uid)return;
    var from=el('pc-link-from').value,to=el('pc-link-to').value,kind=el('pc-link-kind').value,note=el('pc-link-note').value.trim();
    if(!from||!to||from===to){setStatus('Choose two different context records to connect.','error');return;}
    var button=el('pc-link-save');button.disabled=true;
    var r=await sb.from('omega_personal_context_links').insert({user_id:uid,from_item_id:from,to_item_id:to,relation_kind:kind,source_kind:'user_authored',user_confirmed:true,note:note||null});
    button.disabled=false;
    if(r.error){setStatus('Connection could not be saved. Check that both records belong to your account.','error');return;}
    el('pc-link-note').value='';await refresh();setStatus('Private context connection saved.','info');
  }
  async function fetchAllForExport(table,columns,orderColumn){
    var rows=[],offset=0,pageSize=500,maxRows=10000;
    while(true){
      if(offset>=maxRows){
        var probe=await sb.from(table).select('id').eq('user_id',uid).range(offset,offset);
        if(probe.error)throw probe.error;
        if((probe.data||[]).length)throw new Error('export_record_limit');
        return rows;
      }
      var result=await sb.from(table).select(columns).eq('user_id',uid).order(orderColumn,{ascending:false}).range(offset,Math.min(offset+pageSize-1,maxRows-1));
      if(result.error)throw result.error;
      var page=result.data||[];rows=rows.concat(page);
      if(page.length<pageSize)return rows;
      offset+=page.length;
    }
  }
  async function exportData(){
    if(!uid||!sb)return;
    var button=el('pc-export');if(button)button.disabled=true;
    setStatus('Preparing a complete private export. No external service is contacted.','info');
    try{
      var results=await Promise.all([
        fetchAllForExport('omega_personal_context_items','id,user_id,title,context_kind,content,sensitivity,source_kind,source_label,tags,metadata,ai_processing_allowed,ai_consent_at,review_status,user_confirmed,expires_at,created_at,updated_at','updated_at'),
        fetchAllForExport('omega_personal_context_links','id,user_id,from_item_id,to_item_id,relation_kind,source_kind,user_confirmed,note,created_at','created_at'),
        fetchAllForExport('omega_personal_context_consent_events','id,user_id,consent_key,decision,policy_version,created_at','created_at'),
        sb.from('omega_personal_context_preferences').select('user_id,ai_personalization_enabled,web_research_enabled,proactive_alerts_enabled,sensitive_data_processing_enabled,consent_version,consent_updated_at,created_at,updated_at').eq('user_id',uid).maybeSingle()
      ]);
      if(results[3].error)throw results[3].error;
      var totalContentChars=results[0].reduce(function(total,item){return total+String(item.content||'').length;},0);
      if(totalContentChars>10000000)throw new Error('export_size_limit');
      var data={schema:'omega-personal-context-export/v1',exportedAt:new Date().toISOString(),policyVersion:POLICY_VERSION,privacy:{privateByDefault:true,aiProviderCalled:false,exportComplete:true},preferences:results[3].data||defaultPreferences(),items:results[0],links:results[1],consentEvents:results[2]};
      var serialized=JSON.stringify(data,null,2);
      if(serialized.length>20000000)throw new Error('export_size_limit');
      var blob=new Blob([serialized],{type:'application/json;charset=utf-8'});
      var url=URL.createObjectURL(blob),a=node('a','','Download personal context export');a.href=url;a.download='omega-personal-context-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();window.setTimeout(function(){URL.revokeObjectURL(url);},1000);
      setStatus('Complete export prepared: '+results[0].length+' records, '+results[1].length+' links and '+results[2].length+' consent events. Keep the downloaded file private.','info');
    }catch(e){
      setStatus(e&&e.message==='export_record_limit'?'Export stopped safely: more than 10,000 records were found. No partial file was downloaded.':e&&e.message==='export_size_limit'?'Export stopped safely: total text exceeds the 10 MB safety limit. Split the export into smaller sets; no partial file was downloaded.':'Export failed. No partial file was downloaded; retry when the private data source is available.','error');
    }finally{if(button)button.disabled=false;}
  }
  async function onFile(event){
    var file=event.target.files&&event.target.files[0];if(!file)return;
    var ext=(file.name.split('.').pop()||'').toLowerCase();
    if(!['txt','md','csv','json'].includes(ext)){setStatus('Use a text, Markdown, CSV, or JSON file. PDF and binary files are not parsed by this first release.','error');event.target.value='';return;}
    if(file.size>MAX_FILE_BYTES){setStatus('File exceeds the 1 MB import limit. Split it into smaller files.','error');event.target.value='';return;}
    try{
      var content=await file.text();if(!content.trim()){setStatus('The selected file is empty.','error');return;}
      if(content.length>MAX_CONTENT_CHARS){setStatus('Extracted text exceeds the 200,000-character record limit. Split the file.','error');return;}
      if(ext==='json'){try{JSON.parse(content);}catch(e){setStatus('The selected JSON file is not valid JSON.','error');return;}}
      el('pc-title').value=file.name.replace(/\.[^.]+$/,'').slice(0,160)||'Imported context';
      el('pc-content').value=content;
      sourceKind='file_import';sourceLabel=file.name;sourceMetadata={file_name:file.name,file_size_bytes:file.size,file_extension:ext};
      setStatus('File read locally for review. Nothing is saved until you press SAVE PERSONAL CONTEXT.','info');
    }catch(e){setStatus('Could not read this file in the browser.','error');}
  }
  function bind(){
    var form=el('pc-form');if(form)form.addEventListener('submit',saveItem);
    var file=el('pc-file');if(file)file.addEventListener('change',onFile);
    var search=el('pc-search');if(search)search.addEventListener('input',renderItems);
    var filter=el('pc-kind-filter');if(filter)filter.addEventListener('change',renderItems);
    var cancel=el('pc-cancel-edit');if(cancel)cancel.addEventListener('click',resetForm);
    var exp=el('pc-export');if(exp)exp.addEventListener('click',exportData);
    var linkForm=el('pc-link-form');if(linkForm)linkForm.addEventListener('submit',addLink);
    var sensitivity=el('pc-sensitivity');if(sensitivity)sensitivity.addEventListener('change',syncPreferenceControls);
    ['ai_personalization_enabled','web_research_enabled','proactive_alerts_enabled','sensitive_data_processing_enabled'].forEach(function(key){
      var input=el('pc-pref-'+key);if(!input)return;
      input.addEventListener('change',async function(){
        var previous=preferences[key];preferences[key]=input.checked;
        if(key==='ai_personalization_enabled'&&!preferences.ai_personalization_enabled){var itemConsent=el('pc-item-ai-consent');if(itemConsent)itemConsent.checked=false;}
        var ok=await savePreferences();if(!ok){preferences[key]=previous;input.checked=previous;syncPreferenceControls();updatePublicApi();dispatchChanged();return;}
        await refresh();syncPreferenceControls();updatePublicApi();dispatchChanged();
      });
    });
  }
  async function boot(){
    if(!root&&!summary)return;
    try{sb=await client();}catch(e){setTruth('DATABASE CLIENT UNAVAILABLE');setStatus('Database client is unavailable.','error');renderSummary();return;}
    if(!sb){setTruth('DATABASE CLIENT UNAVAILABLE');setStatus('Database client is unavailable.','error');renderSummary();return;}
    var session;try{session=(await sb.auth.getSession()).data.session;}catch(e){setTruth('SESSION CHECK FAILED');setStatus('Could not verify your sign-in.','error');renderSummary();return;}
    if(!session||!session.user){uid=null;setTruth('SIGN IN REQUIRED');setStatus('Sign in to create and access private personal context.','warning');renderSummary();updatePublicApi();return;}
    uid=session.user.id;
    if(root)bind();
    await refresh();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();