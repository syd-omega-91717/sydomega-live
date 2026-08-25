/* Ω COMMAND PALETTE — lightweight UI for the shared command catalog */
(function () {
  'use strict';
  function boot() {
    if (!window.OMEGA_COMMAND_CATALOG || document.getElementById('omega-command-palette')) return;
    const root=document.createElement('div'); root.id='omega-command-palette'; root.className='omega-command-palette'; root.hidden=true;
    root.innerHTML='<div class="omega-command-backdrop"></div><section class="omega-command-panel" role="dialog" aria-modal="true" aria-label="Omega command palette"><div class="omega-command-head"><span>Ω COMMAND</span><button type="button" data-close aria-label="Close">×</button></div><input class="omega-command-input" autocomplete="off" placeholder="Type /command or search…" aria-label="Search commands"><div class="omega-command-results"></div></section>';
    document.body.appendChild(root);
    const input=root.querySelector('input'), results=root.querySelector('.omega-command-results');
    function render(q=''){ const s=q.toLowerCase(); const rows=window.OMEGA_COMMAND_CATALOG.commands.filter(c=>(c.id+' '+c.description+' '+c.group).toLowerCase().includes(s)).slice(0,24); results.innerHTML=rows.map(c=>`<button class="omega-command-item" type="button" data-command="${c.id}"><strong>${c.id}</strong><span>${c.description}</span><small>${c.group}</small></button>`).join('')||'<div class="omega-command-empty">No matching command</div>'; }
    function open(){root.hidden=false; render(); input.focus();}
    function close(){root.hidden=true;}
    document.addEventListener('keydown',e=>{ if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();open();} if(e.key==='Escape'&&!root.hidden)close(); });
    root.querySelector('[data-close]').onclick=close; root.querySelector('.omega-command-backdrop').onclick=close; input.oninput=()=>render(input.value);
    results.addEventListener('click',e=>{const b=e.target.closest('[data-command]'); if(!b)return; const command=b.dataset.command; close(); document.dispatchEvent(new CustomEvent('omega:command',{detail:{command}}));});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
