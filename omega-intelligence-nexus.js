/* Ω INTELLIGENCE NEXUS — production-safe relationship and evidence graph */
(function(global){'use strict';if(global.OmegaNexus)return;
const nodes=new Map(),edges=[];
function id(){return 'n_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7)}
function addNode(input){const n={id:input.id||id(),type:String(input.type||'unknown'),label:String(input.label||input.id||'Node'),status:input.status||'unknown',source:input.source||'runtime',updatedAt:new Date().toISOString()};nodes.set(n.id,n);return n}
function link(input){if(!input||!input.from||!input.to)return null;const e={id:id(),from:input.from,to:input.to,relation:String(input.relation||'related'),confidence:Math.max(0,Math.min(1,Number(input.confidence??1))),source:input.source||'runtime',createdAt:new Date().toISOString()};edges.push(e);if(edges.length>2000)edges.shift();return e}
function snapshot(){return {version:'1.0.0',generatedAt:new Date().toISOString(),nodes:Array.from(nodes.values()),edges:edges.slice()}}
function summary(){const byType={};nodes.forEach(n=>byType[n.type]=(byType[n.type]||0)+1);return {nodes:nodes.size,edges:edges.length,types:byType}}
function seed(){[['system','Ω Sovereign OS'],['capability','Unified Interface'],['capability','Command System'],['capability','Evidence Engine'],['capability','Mission Control'],['security','Authorization Boundary']].forEach(x=>addNode({id:x[1].toLowerCase().replace(/[^a-z0-9]+/g,'-'),type:x[0],label:x[1],status:'runtime'}));link({from:'ω-sovereign-os',to:'unified-interface',relation:'hosts'});link({from:'unified-interface',to:'command-system',relation:'exposes'});link({from:'unified-interface',to:'evidence-engine',relation:'records'});link({from:'unified-interface',to:'mission-control',relation:'opens'});link({from:'command-system',to:'authorization-boundary',relation:'requires'});}
seed();
global.OmegaNexus=Object.freeze({addNode,link,snapshot,summary});
if(global.OmegaEvidence)OmegaEvidence.record({capability:'intelligence-nexus',kind:'runtime',value:'initialized',source:'omega-intelligence-nexus'});
})(window);
