// ============================================================================
// FILE: /backend/src/services/analytics.service.js
// ============================================================================

import {supabase} from "../database/supabase.js";

export async function overview(){

    const [

        users,

        organizations,

        academy,

        marketplace,

        publications,

        ai

    ]=await Promise.all([

        supabase.from("profiles").select("*",{head:true,count:"exact"}),

        supabase.from("organizations").select("*",{head:true,count:"exact"}),

        supabase.from("academy_courses").select("*",{head:true,count:"exact"}),

        supabase.from("marketplace_listings").select("*",{head:true,count:"exact"}),

        supabase.from("publications").select("*",{head:true,count:"exact"}),

        supabase.from("ai_jobs").select("*",{head:true,count:"exact"})

    ]);

    return{

        users:users.count||0,

        organizations:organizations.count||0,

        academy:academy.count||0,

        marketplace:marketplace.count||0,

        publications:publications.count||0,

        aiJobs:ai.count||0

    };

}
