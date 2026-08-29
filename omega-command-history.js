/* Ω COMMAND HISTORY — local, bounded, non-privileged intent history */
(function(){'use strict';
const KEY='omega.command.history.v1',MAX=40;
function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x.slice(0,MAX):[]}catch{return[]}}
function write(v){try{localStorage.setItem(KEY,JSON.stringify(v.slice(0,MAX)))}catch{}}
function add(command){if(!command)return;const v=read().filter(x=>x.command!==command);v.unshift({command,at:new Date().toISOString()});write(v);document.dispatchEvent(new CustomEvent('omega:history',{detail:{command}}))}
function clear(){write([]);document.dispatchEvent(new CustomEvent('omega:history_clear'))}
window.OmegaCommandHistory=Object.freeze({list:read,add,clear});
document.addEventListener('omega:command',e=>add(e.detail&&e.detail.command));
})();
