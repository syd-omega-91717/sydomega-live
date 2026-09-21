/* Ω SYD OMEGA 91717 — UNIVERSAL CONTENT PROGRESSIVE DISCLOSURE
 * Conservative enhancement: only long paragraphs inside common content surfaces.
 * Never changes forms, tables, links, headings, or explicitly opted-out nodes.
 */
(function(){
  'use strict';
  if(window.__omegaContentProgressive)return;
  window.__omegaContentProgressive=true;
  var STYLE='omega-content-progressive-style';
  function installStyle(){
    if(document.getElementById(STYLE))return;
    var s=document.createElement('style');s.id=STYLE;
    s.textContent='.omega-copy-preview{margin:0 0 8px;color:inherit}.omega-copy-details{margin-top:8px;border-top:1px solid rgba(201,168,76,.16);padding-top:8px}.omega-copy-details>summary{cursor:pointer;color:var(--cyan,#00e5ff);font:11px/1.5 var(--M,"Share Tech Mono",monospace);letter-spacing:1.5px;text-transform:uppercase}.omega-copy-details>summary:focus-visible{outline:2px solid var(--cyan,#00e5ff);outline-offset:3px}.omega-copy-full{margin-top:10px}';
    (document.head||document.documentElement).appendChild(s);
  }
  function preview(text){
    var clean=text.replace(/\s+/g,' ').trim();
    if(clean.length<=180)return clean;
    var cut=clean.slice(0,180).replace(/\s+\S*$/,'');
    return cut+(/[.!?]$/.test(cut)?'':'…');
  }
  function enhance(){
    installStyle();
    var selector='.card p,.panel p,.module p,.tile p,.widget p,[data-omega-long-copy]';
    document.querySelectorAll(selector).forEach(function(p){
      if(p.dataset.omegaProgressive==='done'||p.closest('form,table,details,nav'))return;
      if(p.closest('[data-omega-no-progressive]'))return;
      var text=p.textContent.replace(/\s+/g,' ').trim();
      if(text.length<260)return;
      p.dataset.omegaProgressive='done';
      var parent=p.parentNode;if(!parent)return;
      var full=p.cloneNode(true);full.classList.add('omega-copy-full');
      p.textContent=preview(text);p.classList.add('omega-copy-preview');
      var details=document.createElement('details');details.className='omega-copy-details';
      var summary=document.createElement('summary');summary.textContent='More info';
      details.appendChild(summary);details.appendChild(full);parent.insertBefore(details,p.nextSibling);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance,{once:true});else enhance();
  window.OmegaContentProgressive={enhance:enhance,version:'1.0.0'};
})();
