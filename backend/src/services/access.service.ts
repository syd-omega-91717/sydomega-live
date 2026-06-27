// ============================================================================
// FILE: /backend/src/services/access.service.js
// REPLACE THE ENTIRE FILE
// ============================================================================

import { supabase } from "../database/supabase.js";
import * as Events from "./event.service.js";

const ACCESS_DURATION_SECONDS = 557;

export async function validate(profileId) {

    const { data, error } = await supabase

        .from("profiles")

        .select(`
            id,
            approval_status,
            verification_status,
            account_enabled,
            access_state,
            approval_expires_at,
            last_access_at
        `)

        .eq("id", profileId)

        .single();

    if (error) throw error;

    if (!data)
        throw new Error("Profile not found.");

    if (!data.account_enabled)
        throw new Error("Account disabled.");

    if (data.approval_status !== "approved")
        throw new Error("Approval required.");

    if (data.access_state !== "active")
        throw new Error("Account inactive.");

    if (
        data.approval_expires_at &&
        new Date(data.approval_expires_at) <= new Date()
    ) {

        await expire(profileId);

        throw new Error("Approval expired.");

    }

    await heartbeat(profileId);

    return data;

}

export async function heartbeat(profileId) {

    await supabase

        .from("profiles")

        .update({

            last_access_at: new Date()

        })

        .eq("id", profileId);

}

export async function remaining(profileId) {

    const { data, error } = await supabase

        .from("profiles")

        .select("approval_expires_at")

        .eq("id", profileId)

        .single();

    if (error) throw error;

    if (!data.approval_expires_at)
        return 0;

    const remaining =

        Math.floor(

            (

                new Date(data.approval_expires_at).getTime()

                -

                Date.now()

            ) / 1000

        );

    return remaining > 0 ? remaining : 0;

}

export async function extend(profileId) {

    const expires = new Date(

        Date.now()

        +

        ACCESS_DURATION_SECONDS * 1000

    );

    await supabase

        .from("profiles")

        .update({

            approval_expires_at: expires,

            access_state: "active",

            account_enabled: true

        })

        .eq("id", profileId);

    await Events.publish(

        profileId,

        profileId,

        "access",

        "extended",

        {

            expires_at: expires

        }

    );

    return expires;

}

export async function expire(profileId) {

    await supabase

        .from("profiles")

        .update({

            account_enabled: false,

            access_state: "expired"

        })

        .eq("id", profileId);

    await Events.publish(

        profileId,

        profileId,

        "access",

        "expired",

        {}

    );

}

export async function expireAll() {

    const { data } = await supabase

        .from("profiles")

        .select("id")

        .eq("access_state","active")

        .lt(

            "approval_expires_at",

            new Date().toISOString()

        );

    if (!data)

        return 0;

    let count = 0;

    for (const row of data) {

        await expire(row.id);

        count++;

    }

    return count;

}

export async function loginSuccess(profileId) {

    await supabase

        .from("profiles")

        .update({

            failed_login_count:0,

            last_login_at:new Date()

        })

        .eq("id",profileId);

}

export async function loginFailure(profileId){

    const {data}=await supabase

    .from("profiles")

    .select("failed_login_count")

    .eq("id",profileId)

    .single();

    const attempts=(data?.failed_login_count||0)+1;

    const payload={

        failed_login_count:attempts

    };

    if(attempts>=5){

        payload.locked_until=

            new Date(

                Date.now()+15*60*1000

            );

    }

    await supabase

    .from("profiles")

    .update(payload)

    .eq("id",profileId);

}

export async function unlock(profileId){

    await supabase

    .from("profiles")

    .update({

        failed_login_count:0,

        locked_until:null

    })

    .eq("id",profileId);

}
