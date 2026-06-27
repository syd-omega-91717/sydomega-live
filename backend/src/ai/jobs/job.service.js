// ============================================================================
// FILE: /backend/src/ai/jobs/job.service.js
// ============================================================================

import { supabase } from "../../database/supabase.js";

export async function enqueue(job){

    const {data,error}=await supabase

    .from("ai_jobs")

    .insert({

        type:job.type,

        payload:job.payload,

        status:"queued"

    })

    .select()

    .single();

    if(error) throw error;

    return data;

}

export async function markRunning(id){

    return supabase

    .from("ai_jobs")

    .update({

        status:"running"

    })

    .eq("id",id);

}

export async function markCompleted(id,result){

    return supabase

    .from("ai_jobs")

    .update({

        status:"completed",

        result

    })

    .eq("id",id);

}
