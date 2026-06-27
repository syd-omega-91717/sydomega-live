// ============================================================================
// FILE: /backend/src/services/founderDashboard.service.js
// REPLACE THE ENTIRE FILE
// ============================================================================

import { supabase } from "../database/supabase.js";

export async function statistics() {

    const [

        pending,

        approved,

        rejected,

        active,

        organizations,

        academy,

        publications,

        listings,

        notifications

    ] = await Promise.all([

        supabase

            .from("profiles")

            .select("*",{head:true,count:"exact"})

            .eq("approval_status","pending"),

        supabase

            .from("profiles")

            .select("*",{head:true,count:"exact"})

            .eq("approval_status","approved"),

        supabase

            .from("profiles")

            .select("*",{head:true,count:"exact"})

            .eq("approval_status","rejected"),

        supabase

            .from("profiles")

            .select("*",{head:true,count:"exact"})

            .eq("access_state","active"),

        supabase

            .from("organizations")

            .select("*",{head:true,count:"exact"}),

        supabase

            .from("academy_courses")

            .select("*",{head:true,count:"exact"}),

        supabase

            .from("publications")

            .select("*",{head:true,count:"exact"}),

        supabase

            .from("marketplace_listings")

            .select("*",{head:true,count:"exact"}),

        supabase

            .from("approval_notifications")

            .select("*",{head:true,count:"exact"})

    ]);

    return {

        users:{

            pending:pending.count||0,

            approved:approved.count||0,

            rejected:rejected.count||0,

            active:active.count||0

        },

        organizations:organizations.count||0,

        academy:academy.count||0,

        publications:publications.count||0,

        marketplace:listings.count||0,

        notifications:notifications.count||0

    };

}

export async function timeline(limit=100){

    const {data,error}=await supabase

        .from("founder_dashboard_events")

        .select("*")

        .order("created_at",{

            ascending:false

        })

        .limit(limit);

    if(error) throw error;

    return data;

}
