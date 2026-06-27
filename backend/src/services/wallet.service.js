// ============================================================================
// FILE: /backend/src/services/wallet.service.js
// REPLACE ENTIRE FILE
// ============================================================================

import { supabase } from "../database/supabase.js";
import * as Events from "./event.service.js";

export async function account(userId){

    const {data,error}=await supabase

        .from("wallet_accounts")

        .select("*")

        .eq("user_id",userId)

        .single();

    if(error) throw error;

    return data;

}

export async function transactions(userId){

    const {data,error}=await supabase

        .from("wallet_transactions")

        .select("*")

        .eq("user_id",userId)

        .order("created_at",{ascending:false});

    if(error) throw error;

    return data||[];

}

export async function transfer(from,to,amount,note=""){

    const {data,error}=await supabase

        .from("wallet_transactions")

        .insert({

            sender_id:from,

            receiver_id:to,

            amount,

            note,

            transaction_type:"transfer",

            status:"completed"

        })

        .select()

        .single();

    if(error) throw error;

    await Events.publish(

        from,
        from,
        "wallet",
        "transfer_sent",
        data

    );

    await Events.publish(

        from,
        to,
        "wallet",
        "transfer_received",
        data

    );

    return data;

}

export async function deposit(userId,amount){

    return transfer(null,userId,amount,"Deposit");

}

export async function withdraw(userId,amount){

    return transfer(userId,null,amount,"Withdrawal");

}
