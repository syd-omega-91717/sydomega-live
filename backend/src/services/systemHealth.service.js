// ============================================================================
// FILE: /backend/src/services/systemHealth.service.js
// ============================================================================

import {supabase} from "../database/supabase.js";

export async function health(){

    const started=Date.now();

    const {error}=await supabase

    .from("profiles")

    .select("id")

    .limit(1);

    return{

        api:"online",

        database:error?"offline":"online",

        latency:Date.now()-started,

        timestamp:new Date()

    };

}
