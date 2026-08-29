/* Ω CONTENT AGENT — governed content workflow
 * Research → brief → draft → repurpose → human review → publish.
 * This browser layer never publishes directly and never fabricates evidence.
 */
(function(global){'use strict';if(global.OmegaContentAgent)return;
const STATES=['INTAKE','RESEARCH','BRIEF','DRAFT','REPURPOSE','REVIEW','APPROVED','PUBLISHED'];
const GUARDRAILS=Object.freeze(['no invented statistics','cite or label external claims','preserve brand voice','flag ambiguity instead of guessing','human review before publishing','log outputs for quality evaluation']);
const DEFAULT_BRIEF={goal:'Create a useful, evidence-aware first draft.',audience:'',topic:'',sourceUrl:'',talkingPoints:'',voice:'Direct, concise, specific; no filler.',format:'LinkedIn post'};
function create(input){const x=Object.assign({},DEFAULT_BRIEF,input||{});return {id:'content-'+Date.now().toString(36),created_at:new Date().toISOString(),state:'INTAKE',input:x,guardrails:GUARDRAILS.slice(),outputs:[],scores:{tone:null,hook:null,editing_time:null}}}
function transition(run,next,meta){if(!run||!STATES.includes(next))return {ok:false,reason:'invalid_state'};const current=STATES.indexOf(run.state),target=STATES.indexOf(next);if(target!==current+1&&!(next==='REVIEW'&&current>=2))return {ok:false,reason:'invalid_transition'};run.state=next;run.updated_at=new Date().toISOString();run.history=run.history||[];run.history.push({state:next,at:run.updated_at,meta:meta||{}});if(global.OmegaEvidence)OmegaEvidence.record({capability:'content-agent',kind:'state',value:next,source:'omega-content-agent'});return {ok:true,run:run}}
function addOutput(run,type,text,source){if(!run||!text)return {ok:false,reason:'missing_output'};const item={type,type_label:type,text:String(text),source:source||'agent',created_at:new Date().toISOString(),human_review_required:run.state!=='PUBLISHED'};run.outputs.push(item);if(global.OmegaProvenance)OmegaProvenance.add({source:source||'content-agent',type:'content-output',claim:type,confidence:null,metadata:{run_id:run.id}});return item}
function score(run,scores){run.scores=Object.assign(run.scores||{},scores||{});run.quality_evaluated_at=new Date().toISOString();return run.scores}
global.OmegaContentAgent=Object.freeze({version:'1.0.0',states:STATES,guardrails:GUARDRAILS,create:create,transition:transition,addOutput:addOutput,score:score});
})(window);
