/* Ω SYD OMEGA 91717 — EXPLICIT CONTENT DISCLOSURE BRIDGE
 * Single-purpose compatibility layer.
 * User-facing explanatory copy is owned by omega-content-sigil-system.js.
 * This file only handles elements explicitly marked data-omega-long-copy.
 */
(function(){
  'use strict';
  if(window.__omegaContentProgressive)return;
  window.__omegaContentProgressive=true;

  function preview(text){
    var clean=text.replace(/\s+/g,' ').trim();
    if(clean.length<=180)return clean;
    var cut=clean.slice(0,180).replace(/\s+\S*$/,'');
    return cut+(/[.!?]$/.test(cut)?'':'…');
  }

  function enhance(){
    document.querySelectorAll('[data-omega-long-copy]').forEach(function(p){
      if(p.dataset.omegaProgressive==='done'||p.closest('form,table,details,nav'))return;
      if(p.closest('[data-omega-no-progressive]'))return;
      var text=p.textContent.replace(/\s+/g,' ').trim();
      if(text.length<260)return;
      p.dataset.omegaProgressive='done';
      var parent=p.parentNode;
      if(!parent)return;
      var full=p.cloneNode(true);
      full.classList.add('omega-copy-full');
      p.textContent=preview(text);
      p.classList.add('omega-copy-preview');
      var details=document.createElement('details');
      details.className='omega-copy-details';
      var summary=document.createElement('summary');
      summary.textContent='More info';
      details.appendChild(summary);
      details.appendChild(full);
      parent.insertBefore(details,p.nextSibling);
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance,{once:true});
  else enhance();

  window.OmegaContentProgressive={enhance:enhance,version:'2.0.0'};
})();