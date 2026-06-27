// ============================================================================
// FILE: /backend/src/services/organization.service.js
// REPLACE ENTIRE FILE
// ============================================================================

import {supabase} from "../database/supabase.js";
import * as Events from "./event.service.js";

export async function organizations(){

    const {data,error}=await supabase

    .from("organizations")

    .select("*")

    .order("created_at",{ascending:false});

    if(error) throw error;

    return data;

}

export async function myOrganizations(userId){

    const {data}=await supabase

    .from("organization_members")

    .select(`
        *,
        organizations(*)
    `)

    .eq("profile_id",userId);

    return data||[];

}

export async function create(userId,payload){

    const {data,error}=await supabase

    .from("organizations")

    .insert({

        ...payload,

        owner_id:userId,

        status:"pending"

    })

    .select()

    .single();

    if(error) throw error;

    await supabase

    .from("organization_members")

    .insert({

        organization_id:data.id,

        profile_id:userId,

        role:"owner"

    });

    await Events.publish(

        userId,

        userId,

        "organization",

        "created",

        data

    );

    return data;

}

export async function members(id){

    const {data}=await supabase

    .from("organization_members")

    .select("*,profiles(*)")

    .eq("organization_id",id);

    return data||[];

}
