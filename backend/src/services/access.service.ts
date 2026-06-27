import { supabase } from "../database/supabase";

const ACCESS_DURATION_SECONDS = 557;

export async function activate(profileId: string) {

    const expires = new Date(
        Date.now() + ACCESS_DURATION_SECONDS * 1000
    );

    const { error } = await supabase
        .from("profiles")
        .update({
            account_enabled: true,
            access_state: "active",
            approval_status: "approved",
            approval_expires_at: expires,
            last_login_at: new Date()
        })
        .eq("id", profileId);

    if (error) throw error;

    return expires;
}

export async function validate(profileId: string) {

    const { data, error } = await supabase
        .from("profiles")
        .select(`
            id,
            account_enabled,
            access_state,
            approval_expires_at
        `)
        .eq("id", profileId)
        .single();

    if (error) throw error;

    if (!data.account_enabled)
        throw new Error("Account disabled");

    if (data.access_state !== "active")
        throw new Error("Approval required");

    if (
        data.approval_expires_at &&
        new Date(data.approval_expires_at) < new Date()
    ) {

        await expire(profileId);

        throw new Error("Approval expired");
    }

    await supabase
        .from("profiles")
        .update({
            last_access_at: new Date()
        })
        .eq("id", profileId);

    return data;
}

export async function expire(profileId: string) {

    await supabase
        .from("profiles")
        .update({

            account_enabled: false,

            access_state: "expired"

        })
        .eq("id", profileId);

}
