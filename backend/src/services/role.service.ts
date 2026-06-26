import { supabase } from "../database/supabase";

export async function listRoles() {

    const { data, error } = await supabase

        .from("roles")

        .select("*")

        .order("name");

    if (error) throw error;

    return data;

}

export async function createRole(payload: any) {

    const { data, error } = await supabase

        .from("roles")

        .insert(payload)

        .select()

        .single();

    if (error) throw error;

    return data;

}
