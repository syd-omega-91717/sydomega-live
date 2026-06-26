import { supabase } from "../database/supabase";

export async function listTasks(userId: string) {

    const { data, error } = await supabase

        .from("tasks")

        .select("*")

        .or(`creator_id.eq.${userId},assignee_id.eq.${userId}`)

        .order("created_at", {

            ascending: false

        });

    if (error) throw error;

    return data;

}

export async function createTask(payload: any) {

    const { data, error } = await supabase

        .from("tasks")

        .insert(payload)

        .select()

        .single();

    if (error) throw error;

    return data;

}

export async function updateTask(

    id: string,

    payload: any

) {

    const { data, error } = await supabase

        .from("tasks")

        .update(payload)

        .eq("id", id)

        .select()

        .single();

    if (error) throw error;

    return data;

}

export async function deleteTask(id: string) {

    const { error } = await supabase

        .from("tasks")

        .delete()

        .eq("id", id);

    if (error) throw error;

}
