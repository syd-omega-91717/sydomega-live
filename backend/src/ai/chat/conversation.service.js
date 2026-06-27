// ============================================================================
// FILE: /backend/src/ai/chat/conversation.service.js
// ============================================================================

import { supabase } from "../../database/supabase.js";

export async function loadOrCreate(userId, conversationId) {

    if (conversationId) {

        const { data } = await supabase

            .from("ai_conversations")

            .select("*")

            .eq("id", conversationId)

            .single();

        if (data) return data;

    }

    const { data, error } = await supabase

        .from("ai_conversations")

        .insert({

            user_id: userId,

            title: "New Conversation",

            status: "active"

        })

        .select()

        .single();

    if (error) throw error;

    return data;

}

export async function storeUserMessage(conversationId, content) {

    return supabase

        .from("ai_messages")

        .insert({

            conversation_id: conversationId,

            role: "user",

            content

        });

}

export async function storeAssistantMessage(conversationId, content) {

    return supabase

        .from("ai_messages")

        .insert({

            conversation_id: conversationId,

            role: "assistant",

            content

        });

}

export async function history(conversationId) {

    const { data } = await supabase

        .from("ai_messages")

        .select("*")

        .eq("conversation_id", conversationId)

        .order("created_at", {

            ascending: true

        });

    return data || [];

}
