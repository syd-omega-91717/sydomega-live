import { supabase } from "../database/supabase";

export async function search(

    query: string

) {

    const { data, error } = await supabase

        .from("search_index")

        .select("*")

        .ilike("title", `%${query}%`)

        .limit(50);

    if (error) throw error;

    return data;

}
