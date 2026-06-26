import { supabase } from "../database/supabase";

export async function createConversation(payload:any){

    const {data,error}=await supabase

        .from("ai_conversations")

        .insert(payload)

        .select()

        .single();

    if(error) throw error;

    return data;

}

export async function saveMessage(payload:any){

    const {data,error}=await supabase

        .from("ai_messages")

        .insert(payload)

        .select()

        .single();

    if(error) throw error;

    return data;

}

export async function listConversations(owner:string){

    const {data,error}=await supabase

        .from("ai_conversations")

        .select("*")

        .eq("owner_id",owner)

        .order("updated_at",{ascending:false});

    if(error) throw error;

    return data;

}
