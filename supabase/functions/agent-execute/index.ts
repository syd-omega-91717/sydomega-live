import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.4";
import registry from "./agent-tools.json" with { type: "json" };
const allowedOrigin=(origin:string|null)=>{if(!origin)return null;try{const u=new URL(origin);if(u.protocol==="https:"&&(u.hostname==="sydomega.com"||u.hostname.endsWith(".sydomega.com")))return origin;}catch{}return null;};
const headers=(origin:string|null)=>{const a=allowedOrigin(origin);return {...(a?{"Access-Control-Allow-Origin":a,Vary:"Origin"}:{}),"Access-Control-Allow-Headers":"authorization,content-type,apikey,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json"};};
const reply=(body:unknown,status=200,origin:string|null=null)=>new Response(JSON.stringify(body),{status,headers:headers(origin)});
const text=(v:unknown,max=240)=>typeof v==="string"?v.trim().slice(0,max):"";
const digest=(v:unknown)=>{let s=JSON.stringify(v),h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193);}return(h>>>0).toString(16).padStart(8,"0").repeat(4);};
const record=async(admin:any,userId:string,agent:string,tool:string,intent:string,status:string,reason:string,payload:unknown)=>admin.rpc("omega_record_agent_operation",{p_user_id:userId,p_agent_name:agent,p_tool_id:tool,p_intent:intent,p_risk:"low",p_status:status,p_reason:reason,p_payload_digest:digest(payload)});
Deno.serve(async(req)=>{
 const origin=req.headers.get("Origin"); if(req.method==="OPTIONS")return new Response("ok",{headers:headers(origin)}); if(req.method!=="POST")return reply({error:"method_not_allowed"},405,origin);
 const auth=req.headers.get("Authorization")||""; if(!/^Bearer\s+\S+$/i.test(auth))return reply({error:"authentication_required"},401,origin);
 let body:any; try{if(Number(req.headers.get("content-length")||0)>4096)return reply({error:"request_too_large"},413,origin);body=await req.json();}catch{return reply({error:"invalid_json"},400,origin);}
 if(!body||typeof body!=="object"||Array.isArray(body))return reply({error:"invalid_request"},400,origin);
 const agent=text(body.agent,40),tool=text(body.tool,80),intent=text(body.intent,240),payload=body.payload&&typeof body.payload==="object"&&!Array.isArray(body.payload)?body.payload:{};
 if(!agent||!tool||!intent)return reply({error:"agent_tool_intent_required"},400,origin); if(JSON.stringify(payload).length>1200)return reply({error:"payload_too_large"},413,origin);
 const bound=(registry.agents as Record<string,string[]>)[agent],spec=(registry.tools as Record<string,{risk:string;mutation:boolean}>)[tool];
 if(!bound||!spec||!bound.includes(tool)||spec.mutation||spec.risk!=="low")return reply({error:"tool_not_permitted",governance:{agent,tool,risk:spec?.risk||"unknown",status:"BLOCKED"}},403,origin);
 const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_ANON_KEY"),serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); if(!url||!key||!serviceKey)return reply({error:"runtime_configuration_unavailable"},503,origin);
 const s=createClient(url,key,{global:{headers:{Authorization:auth}}}); const who=await s.auth.getUser(); if(who.error||!who.data.user)return reply({error:"authentication_required"},401,origin);
 const admin=createClient(url,serviceKey); const userId=who.data.user.id;
 const approved=await record(admin,userId,agent,tool,intent,"AUTHORIZED","read_only_tool_authorized",payload); if(approved.error)return reply({error:"audit_unavailable"},503,origin);
 try{
   let data:any;
   if(tool==="member.context.read"){const r=await s.from("profiles").select("id,display_name,sign,element,agent,membership_tier,material_tier,matrix_phase,node_index,authority,updated_at").eq("id",who.data.user.id).maybeSingle();if(r.error)throw r.error;data=r.data;}
   else if(tool==="mission.state.read"){const [m,q]=await Promise.all([s.from("omega_member_mission_state").select("mission_id,status,attempt_count,started_at,completed_at,failed_at,last_transition_at").eq("user_id",who.data.user.id).order("last_transition_at",{ascending:false}).limit(50),s.from("omega_member_quest_state").select("quest_id,status,current_mission_id,started_at,completed_at,failed_at,last_transition_at").eq("user_id",who.data.user.id).order("last_transition_at",{ascending:false}).limit(50)]);if(m.error||q.error)throw new Error("mission_state_read_failed");data={missions:m.data||[],quests:q.data||[]};}
   else if(tool==="simulation.history.read"){const r=await s.from("omega_simulation_runs").select("id,model_key,model_version,deterministic_seed,input_snapshot,result_snapshot,created_at").eq("user_id",who.data.user.id).order("created_at",{ascending:false}).limit(50);if(r.error)throw r.error;data=r.data||[];}
   else return reply({error:"tool_not_implemented"},501,origin);
   const done=await record(admin,userId,agent,tool,intent,"EXECUTED","read_only_execution_completed",payload);if(done.error)return reply({error:"audit_finalize_failed"},503,origin);
   return reply({ok:true,reality:"LIVE",governance:{agent,tool,risk:"low",status:"EXECUTED",mutation:false},data},200,origin);
  }catch{await record(admin,userId,agent,tool,intent,"FAILED","read_only_execution_failed",payload);return reply({error:"tool_execution_failed",governance:{agent,tool,risk:"low",status:"FAILED"}},502,origin);}
});