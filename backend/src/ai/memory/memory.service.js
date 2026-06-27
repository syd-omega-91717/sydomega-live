// ============================================================================
// FILE: /backend/src/ai/memory/memory.service.js
// ============================================================================

import { supabase } from "../../database/supabase.js";

export async function retrieve(userId, query) {

    const { data } = await supabase

        .from("ai_documents")

        .select("*")

        .eq("user_id", userId)

        .limit(20);

    return data || [];

}

export async function learn(userId, prompt, answer) {

    return supabase

        .from("ai_documents")

        .insert({

            user_id: userId,

            title: prompt.substring(0, 100),

            body: answer,

            source: "conversation"

        });

}

export async function clear(userId){

    return supabase

        .from("ai_documents")

        .delete()

        .eq("user_id",userId);

}
