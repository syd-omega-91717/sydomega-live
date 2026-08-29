/* Ω PROVENANCE LEDGER — bounded client-side provenance index */
(function(global){'use strict';if(global.OmegaProvenance)return;var entries=[],MAX=250;
function add(item){if(!item||!item.source)return null;var e={id:'prov-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),source:String(item.source),type:String(item.type||'runtime'),claim:item.claim==null?null:String(item.claim),confidence:Number.isFinite(Number(item.confidence))?Math.max(0,Math.min(1,Number(item.confidence))):null,timestamp:new Date().toISOString(),metadata:item.metadata||{}};entries.unshift(e);if(entries.length>MAX)entries.length=MAX;if(global.OmegaEvidence&&typeof global.OmegaEvidence.record==='function')global.OmegaEvidence.record({capability:'provenance',kind:'record',value:e.id,source:e.source});document.dispatchEvent(new CustomEvent('omega:provenance',{detail:e}));return e}
function list(){return entries.slice()}
function clear(){entries.length=0}
global.OmegaProvenance=Object.freeze({version:'1.0.0',add:add,list:list,clear:clear});
})(window);
