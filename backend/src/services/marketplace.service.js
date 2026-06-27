// ============================================================================
// FILE: /backend/src/services/marketplace.service.js
// ============================================================================

import {supabase} from "../database/supabase.js";
import * as Events from "./event.service.js";

export async function listings(){

    const {data,error}=await supabase

    .from("marketplace_listings")

    .select("*")

    .eq("status","active")

    .order("created_at",{ascending:false});

    if(error) throw error;

    return data;

}

export async function myListings(userId){

    const {data}=await supabase

    .from("marketplace_listings")

    .select("*")

    .eq("seller_id",userId);

    return data||[];

}

export async function create(userId,payload){

    const {data,error}=await supabase

    .from("marketplace_listings")

    .insert({

        seller_id:userId,

        ...payload,

        status:"pending"

    })

    .select()

    .single();

    if(error) throw error;

    await Events.publish(

        userId,

        userId,

        "marketplace",

        "listing_created",

        data

    );

    return data;

}

export async function approve(listingId){

    const {data,error}=await supabase

    .from("marketplace_listings")

    .update({

        status:"active"

    })

    .eq("id",listingId)

    .select()

    .single();

    if(error) throw error;

    return data;

}
