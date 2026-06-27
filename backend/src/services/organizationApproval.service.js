// ============================================================================
// FILE: /backend/src/services/organizationApproval.service.js
// REPLACE ENTIRE FILE
// ============================================================================

import { supabase } from "../database/supabase.js";
import * as Events from "./event.service.js";

export async function pending() {

    const { data } = await supabase

        .from("organizations")

        .select("*")

        .eq("status","pending");

    return data || [];

}

export async function approve(id, founderId) {

    const { data } = await supabase

        .from("organizations")

        .update({

            status:"approved",

            approved_by:founderId,

            approved_at:new Date()

        })

        .eq("id",id)

        .select()

        .single();

    await Events.publish(

        founderId,

        data.owner_id,

        "organization",

        "approved",

        data

    );

    return data;

}

export async function reject(id, founderId, reason) {

    const { data } = await supabase

        .from("organizations")

        .update({

            status:"rejected",

            rejection_reason:reason

        })

        .eq("id",id)

        .select()

        .single();

    await Events.publish(

        founderId,

        data.owner_id,

        "organization",

        "rejected",

        {

            reason

        }

    );

    return data;

}
