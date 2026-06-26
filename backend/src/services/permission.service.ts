import { supabase } from "../database/supabase";

export async function permissions() {

    const { data, error } = await supabase

        .from("permissions")

        .select("*")

        .order("resource");

    if (error) throw error;

    return data;

}
