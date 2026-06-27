// ============================================================================
// FILE: /backend/src/services/subscription.service.js
// ============================================================================

import { supabase } from "../database/supabase.js";
import * as Events from "./event.service.js";

export async function current(userId){

    const {data}=await supabase

    .from("subscriptions")

    .select("*")

    .eq("user_id",userId)

    .single();

    return data;

}

export async function subscribe(userId,plan){

    const expires=new Date();

    expires.setFullYear(

        expires.getFullYear()+1

    );

    const {data,error}=await supabase

    .from("subscriptions")

    .upsert({

        user_id:userId,

        plan,

        status:"active",

        expires_at:expires

    })

    .select()

    .single();

    if(error) throw error;

    await Events.publish(

        userId,

        userId,

        "subscription",

        "activated",

        data

    );

    return data;

}

export async function expired(){

    const {data}=await supabase

    .from("subscriptions")

    .select("*")

    .lt(

        "expires_at",

        new Date().toISOString()

    );

    return data||[];

}
