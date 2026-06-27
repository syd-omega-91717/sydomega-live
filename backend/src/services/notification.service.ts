import { supabase } from "../database/supabase";

export async function createNotification(payload:any){

    const {data,error}=await supabase

        .from("approval_notifications")

        .insert(payload)

        .select()

        .single();

    if(error) throw error;

    return data;

}

export async function unread(user:string){

    const {data,error}=await supabase

        .from("approval_notifications")

        .select("*")

        .eq("recipient",user)

        .eq("status","unread")

        .order("created_at",{ascending:false});

    if(error) throw error;

    return data;

}

export async function markRead(id:string){

    const {error}=await supabase

        .from("approval_notifications")

        .update({

            status:"read",

            read_at:new Date()

        })

        .eq("id",id);

    if(error) throw error;

}
