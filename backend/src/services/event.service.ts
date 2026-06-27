import {supabase} from "../database/supabase";

export async function publish(

actor:string,

profile:string,

module:string,

event:string,

payload:any={}

){

await supabase

.from("founder_dashboard_events")

.insert({

actor_id:actor,

profile_id:profile,

module,

event,

payload

});

}
