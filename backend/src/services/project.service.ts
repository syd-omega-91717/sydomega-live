import { supabase } from "../database/supabase";

export async function listProjects(userId: string) {

    const { data, error } = await supabase

        .from("projects")

        .select("*")

        .eq("owner_id", userId)

        .order("created_at", { ascending: false });

    if (error) throw error;

    return data;

}

export async function createProject(payload: any) {

    const { data, error } = await supabase

        .from("projects")

        .insert(payload)

        .select()

        .single();

    if (error) throw error;

    return data;

}
