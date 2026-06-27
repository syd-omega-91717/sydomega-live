// ============================================================================
// FILE: /backend/src/services/audit.service.js
// ============================================================================

import {supabase} from "../database/supabase.js";

export async function log({

    actor,

    entity,

    entity_id,

    operation,

    payload

}){

    const {data,error}=await supabase

    .from("audit_logs")

    .insert({

        actor,

        entity,

        entity_id,

        operation,

        payload

    })

    .select()

    .single();

    if(error) throw error;

    return data;

}

export async function latest(limit=100){

    const {data}=await supabase

    .from("audit_logs")

    .select("*")

    .order("created_at",{

        ascending:false

    })

    .limit(limit);

    return data||[];

}
