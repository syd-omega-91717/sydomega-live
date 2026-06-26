import { supabase } from "../database/supabase";

export async function uploadFile(payload: any) {

    const { data, error } = await supabase

        .from("storage_files")

        .insert(payload)

        .select()

        .single();

    if (error) throw error;

    return data;

}

export async function listFiles(ownerId: string) {

    const { data, error } = await supabase

        .from("storage_files")

        .select("*")

        .eq("owner_id", ownerId)

        .order("created_at", { ascending: false });

    if (error) throw error;

    return data;

}

export async function deleteFile(id: string) {

    const { error } = await supabase

        .from("storage_files")

        .delete()

        .eq("id", id);

    if (error) throw error;

}
