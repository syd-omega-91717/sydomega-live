import { supabase } from "../database/supabase";

export async function expireAccessJob() {

    const { data } = await supabase

        .from("profiles")

        .select("id")

        .eq("access_state", "active")

        .lt("approval_expires_at", new Date().toISOString());

    if (!data?.length) return;

    for (const profile of data) {

        await supabase

            .from("profiles")

            .update({

                access_state: "expired",

                account_enabled: false

            })

            .eq("id", profile.id);

    }

}
