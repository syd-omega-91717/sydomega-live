import { supabase } from "../database/supabase";

export async function listWebhooks(owner: string) {

    const { data, error } = await supabase

        .from("webhooks")

        .select("*")

        .eq("owner_id", owner);

    if (error) throw error;

    return data;

}

export async function createWebhook(payload: any) {

    const { data, error } = await supabase

        .from("webhooks")

        .insert(payload)

        .select()

        .single();

    if (error) throw error;

    return data;

}
