/* Ω CONTENT LIBRARY — structured, user-friendly content workspace */
(function(global){'use strict';if(global.OmegaContentLibrary)return;var KEY='omega.content.library.v1',MAX=200;
function load(){try{var x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x.slice(0,MAX):[]}catch(e){return[]}}
function save(v){try{localStorage.setItem(KEY,JSON.stringify(v.slice(0,MAX)))}catch(e){}}
function add(item){if(!item||!item.title)return null;var v=load();var x={id:'content-'+Date.now().toString(36),title:String(item.title),body:String(item.body||''),type:String(item.type||'draft'),status:String(item.status||'draft'),tags:Array.isArray(item.tags)?item.tags.slice(0,12):[],created_at:new Date().toISOString(),updated_at:new Date().toISOString()};v.unshift(x);save(v);if(global.OmegaProvenance)OmegaProvenance.add({source:'omega-content-library',type:'content',claim:'stored '+x.id,confidence:1});return x}
function update(id,patch){var v=load(),i=v.findIndex(function(x){return x.id===id});if(i<0)return null;v[i]=Object.assign({},v[i],patch,{id:id,updated_at:new Date().toISOString()});save(v);return v[i]}
function remove(id){save(load().filter(function(x){return x.id!==id}))}function list(filter){var v=load();return filter?v.filter(function(x){return !filter.status||x.status===filter.status}):v}function clear(){save([])}
global.OmegaContentLibrary=Object.freeze({version:'1.0.0',add:add,update:update,remove:remove,list:list,clear:clear});})(window);
