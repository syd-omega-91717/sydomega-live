/* Ω COMMAND ROUTER — routes intents; never grants authority.
 * A command is an intent. Authorization belongs to the destination service.
 */
(function(global){
  'use strict';
  if(global.OmegaCommandRouter) return;
  var handlers=Object.create(null);
  var restricted=/^(DEPLOY|DELETE|ADMIN|TRANSFER|PAY|WITHDRAW|ROTATE|MIGRATE)/i;
  function register(command,handler,meta){
    if(!command||typeof handler!=='function') throw new TypeError('Invalid command handler');
    handlers[String(command).toUpperCase()]={handler:handler,meta:meta||{}};
  }
  function dispatch(command,payload){
    var name=String(command||'').replace(/^\//,'').toUpperCase();
    var entry=handlers[name];
    var envelope={command:'/'+name,payload:payload||{},timestamp:new Date().toISOString(),privileged:restricted.test(name)};
    if(!entry){document.dispatchEvent(new CustomEvent('omega:command_unhandled',{detail:envelope}));return Promise.resolve({ok:false,reason:'unhandled',command:envelope.command});}
    if(envelope.privileged && !entry.meta.authorized){document.dispatchEvent(new CustomEvent('omega:command_denied',{detail:envelope}));return Promise.resolve({ok:false,reason:'authorization_required',command:envelope.command});}
    try{return Promise.resolve(entry.handler(envelope));}catch(error){document.dispatchEvent(new CustomEvent('omega:command_error',{detail:{command:envelope.command,error:String(error)}}));return Promise.reject(error);}
  }
  document.addEventListener('omega:command',function(e){if(e.detail&&e.detail.command)dispatch(e.detail.command,e.detail.payload);});
  global.OmegaCommandRouter=Object.freeze({register:register,dispatch:dispatch,version:'1.0.0'});
})(window);
