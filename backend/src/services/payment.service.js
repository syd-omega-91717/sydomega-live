// ============================================================================
// FILE: /backend/src/services/payment.service.js
// REPLACE ENTIRE FILE
// ============================================================================

import { supabase } from "../database/supabase.js";
import * as Events from "./event.service.js";

export async function createPayment(userId,payload){

    const {data,error}=await supabase

    .from("payments")

    .insert({

        user_id:userId,

        amount:payload.amount,

        currency:payload.currency,

        payment_method:payload.payment_method,

        payment_provider:payload.payment_provider,

        reference:payload.reference,

        status:"pending"

    })

    .select()

    .single();

    if(error) throw error;

    await Events.publish(

        userId,
        userId,
        "payments",
        "payment_created",
        data

    );

    return data;

}

export async function complete(id){

    const {data,error}=await supabase

    .from("payments")

    .update({

        status:"completed",

        completed_at:new Date()

    })

    .eq("id",id)

    .select()

    .single();

    if(error) throw error;

    return data;

}

export async function history(userId){

    const {data}=await supabase

    .from("payments")

    .select("*")

    .eq("user_id",userId)

    .order("created_at",{ascending:false});

    return data||[];

}
