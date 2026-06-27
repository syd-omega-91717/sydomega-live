import { supabase } from "../database/supabase";

export async function statistics() {

    const [

        pending,

        approved,

        rejected,

        active,

        expired,

        organizations,

        publications,

        marketplace

    ] = await Promise.all([

        supabase.from("profiles").select("*",{count:"exact",head:true}).eq("approval_status","pending"),

        supabase.from("profiles").select("*",{count:"exact",head:true}).eq("approval_status","approved"),

        supabase.from("profiles").select("*",{count:"exact",head:true}).eq("approval_status","rejected"),

        supabase.from("profiles").select("*",{count:"exact",head:true}).eq("access_state","active"),

        supabase.from("profiles").select("*",{count:"exact",head:true}).eq("access_state","expired"),

        supabase.from("organizations").select("*",{count:"exact",head:true}),

        supabase.from("publications").select("*",{count:"exact",head:true}),

        supabase.from("marketplace_listings").select("*",{count:"exact",head:true})

    ]);

    return {

        pendingUsers:pending.count||0,

        approvedUsers:approved.count||0,

        rejectedUsers:rejected.count||0,

        activeUsers:active.count||0,

        expiredUsers:expired.count||0,

        organizations:organizations.count||0,

        publications:publications.count||0,

        marketplaceListings:marketplace.count||0

    };

}

export async function timeline(){

    const {data,error}=await supabase

    .from("founder_dashboard_events")

    .select("*")

    .order("created_at",{ascending:false})

    .limit(200);

    if(error) throw error;

    return data;

}
