import { supabase } from "../database/supabase";

export async function pending() {

    const { data, error } = await supabase

        .from("approval_requests")

        .select(`
            *,
            profiles(*)
        `)

        .eq("current_status", "pending")

        .order("created_at", {

            ascending: false

        });

    if (error) throw error;

    return data;

}

export async function approve(

    requestId: string,

    founderId: string

) {

    const { data: request } = await supabase

        .from("approval_requests")

        .select("*")

        .eq("id", requestId)

        .single();

    if (!request) throw new Error("Request not found");

    await supabase

        .from("profiles")

        .update({

            approval_status: "approved",

            account_enabled: true,

            approved_at: new Date(),

            approved_by: founderId,

            verification_status: "verified"

        })

        .eq("id", request.profile_id);

    await supabase

        .from("approval_requests")

        .update({

            current_status: "approved",

            reviewed_by: founderId,

            reviewed_at: new Date()

        })

        .eq("id", requestId);

    return true;

}

export async function reject(

    requestId: string,

    founderId: string,

    reason: string

) {

    const { data: request } = await supabase

        .from("approval_requests")

        .select("*")

        .eq("id", requestId)

        .single();

    if (!request) throw new Error("Request not found");

    await supabase

        .from("profiles")

        .update({

            approval_status: "rejected",

            rejection_reason: reason,

            account_enabled: false

        })

        .eq("id", request.profile_id);

    await supabase

        .from("approval_requests")

        .update({

            current_status: "rejected",

            rejection_reason: reason,

            reviewed_by: founderId,

            reviewed_at: new Date()

        })

        .eq("id", requestId);

    return true;

}
