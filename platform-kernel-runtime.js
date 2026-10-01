(function(){
'use strict';

function esc(value){
  return String(value==null?'':value).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}

function render(state){
  var capabilities=state.capabilities||[];
  var assets=state.assets||[];
  var gates=state.proofGates||[];

  document.getElementById('state').textContent=state.ready?'READY':'ERROR';
  document.getElementById('state').className=state.ready?'ok':'bad';
  document.getElementById('count').textContent=capabilities.length;
  document.getElementById('routes').textContent=assets.filter(function(x){return x.ok;}).length+'/'+assets.length;
  document.getElementById('open').textContent=gates.filter(function(x){return x.status==='blocked'||x.status==='partial';}).length;

  document.getElementById('caps').innerHTML=capabilities.map(function(x){
    return '<tr><td>'+esc(x.id)+'</td><td>'+esc(x.domain)+'</td><td>'+esc(x.state)+'</td><td>'+esc(x.route)+'</td><td class="'+(x.route_observed?'ok':'bad')+'">'+(x.route_observed?'OBSERVED':'UNVERIFIED')+'</td></tr>';
  }).join('');

  document.getElementById('gates').innerHTML=gates.map(function(x){
    return '<tr><td>'+esc(x.id)+'</td><td class="'+(x.status==='blocked'?'bad':'warn')+'">'+esc(x.status).toUpperCase()+'</td><td>'+esc(x.evidence)+'</td></tr>';
  }).join('');
}

document.addEventListener('omega:kernel',function(event){
  render(event.detail.payload||{});
});

setTimeout(function(){
  if(window.OmegaPlatformKernel){
    window.OmegaPlatformKernel.check().then(render);
  }
},300);
}());
