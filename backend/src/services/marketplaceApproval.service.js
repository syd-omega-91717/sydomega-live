// ============================================================================
// FILE: /backend/src/services/marketplaceApproval.service.js
// REPLACE ENTIRE FILE
// ============================================================================

import { supabase } from "../database/supabase.js";
import * as Events from "./event.service.js";

export async function pending() {

    const { data, error } = await supabase

        .from("marketplace_listings")

        .select("*")

        .eq("status", "pending")

        .order("created_at", {

            ascending: false

        });

    if (error) throw error;

    return data || [];

}

export async function approve(id, founderId) {

    const { data, error } = await supabase

        .from("marketplace_listings")

        .update({

            status: "active",

            approved_by: founderId,

            approved_at: new Date()

        })

        .eq("id", id)

        .select()

        .single();

    if (error) throw error;

    await Events.publish(

        founderId,

        data.seller_id,

        "marketplace",

        "listing_approved",

        data

    );

    return data;

}

export async function reject(id, founderId, reason) {

    const { data, error } = await supabase

        .from("marketplace_listings")

        .update({

            status: "rejected",

            rejection_reason: reason,

            approved_by: founderId,

            approved_at: new Date()

        })

        .eq("id", id)

        .select()

        .single();

    if (error) throw error;

    await Events.publish(

        founderId,

        data.seller_id,

        "marketplace",

        "listing_rejected",

        {

            reason

        }

    );

    return data;

}
