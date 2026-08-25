/* Ω COMMAND ADAPTER — deterministic routing contract, no privileged execution */
(function(global){'use strict';
 const ROUTES={
  EMAIL:'writer.email',WRITE:'writer.edit',THINK:'reasoning.decision',LEARN:'tutor.explain',PLAN:'planner.organize',BRAINSTORM:'ideation.generate',MEETINGS:'meeting.intelligence',CAREER:'career.coach',CONTENT:'content.studio'
 };
 function resolve(command,payload){
  const name=String(command||'').replace(/^\//,'').toUpperCase();
  const item=(global.OMEGA_COMMAND_CATALOG&&global.OMEGA_COMMAND_CATALOG.commands||[]).find(c=>c.name===name);
  if(!item)return {ok:false,error:'UNKNOWN_COMMAND'};
  return {ok:true,command:item.id,group:item.group,route:ROUTES[item.group]||'omega.general',payload:payload||{},requiresAuthorization:true,execution:'handler-required'};
 }
 global.OMEGA_COMMAND_ADAPTER=Object.freeze({version:'1.0.0',resolve});
 document.addEventListener('omega:command',function(e){
  const detail=e.detail||{}; const result=resolve(detail.command,detail.payload);
  document.dispatchEvent(new CustomEvent('omega:command:resolved',{detail:result}));
 });
})(window);
