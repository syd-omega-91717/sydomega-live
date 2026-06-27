// ============================================================================
// FILE: /backend/src/services/event.service.js
// REPLACE THE ENTIRE FILE
// ============================================================================

import { supabase } from "../database/supabase.js";

export async function publish(

    actorId,

    profileId,

    module,

    event,

    payload = {},

    severity = "info"

) {

    const { data, error } = await supabase

        .from("founder_dashboard_events")

        .insert({

            actor_id: actorId,

            profile_id: profileId,

            module,

            event,

            severity,

            payload

        })

        .select()

        .single();

    if (error) throw error;

    return data;

}

export async function timeline(limit = 200) {

    const { data, error } = await supabase

        .from("founder_dashboard_events")

        .select(`
            *,
            profiles(
                id,
                first_name,
                last_name,
                avatar_url
            )
        `)

        .order("created_at", {

            ascending: false

        })

        .limit(limit);

    if (error) throw error;

    return data;

}

export async function byModule(module, limit = 100) {

    const { data, error } = await supabase

        .from("founder_dashboard_events")

        .select("*")

        .eq("module", module)

        .order("created_at", {

            ascending: false

        })

        .limit(limit);

    if (error) throw error;

    return data;

}

export async function byProfile(profileId, limit = 100) {

    const { data, error } = await supabase

        .from("founder_dashboard_events")

        .select("*")

        .eq("profile_id", profileId)

        .order("created_at", {

            ascending: false

        })

        .limit(limit);

    if (error) throw error;

    return data;

}

export async function dashboardMetrics() {

    const [

        approvals,

        access,

        academy,

        marketplace,

        ai,

        wallet,

        publishing,

        organizations

    ] = await Promise.all([

        supabase

            .from("founder_dashboard_events")

            .select("*", {

                count: "exact",

                head: true

            })

            .eq("module", "approval"),

        supabase

            .from("founder_dashboard_events")

            .select("*", {

                count: "exact",

                head: true

            })

            .eq("module", "access"),

        supabase

            .from("founder_dashboard_events")

            .select("*", {

                count: "exact",

                head: true

            })

            .eq("module", "academy"),

        supabase

            .from("founder_dashboard_events")

            .select("*", {

                count: "exact",

                head: true

            })

            .eq("module", "marketplace"),

        supabase

            .from("founder_dashboard_events")

            .select("*", {

                count: "exact",

                head: true

            })

            .eq("module", "ai"),

        supabase

            .from("founder_dashboard_events")

            .select("*", {

                count: "exact",

                head: true

            })

            .eq("module", "wallet"),

        supabase

            .from("founder_dashboard_events")

            .select("*", {

                count: "exact",

                head: true

            })

            .eq("module", "publishing"),

        supabase

            .from("founder_dashboard_events")

            .select("*", {

                count: "exact",

                head: true

            })

            .eq("module", "organization")

    ]);

    return {

        approvals: approvals.count || 0,

        access: access.count || 0,

        academy: academy.count || 0,

        marketplace: marketplace.count || 0,

        ai: ai.count || 0,

        wallet: wallet.count || 0,

        publishing: publishing.count || 0,

        organizations: organizations.count || 0

    };

}

export async function latest(limit = 25) {

    const { data, error } = await supabase

        .from("founder_dashboard_events")

        .select("*")

        .order("created_at", {

            ascending: false

        })

        .limit(limit);

    if (error) throw error;

    return data;

}

export async function clearOld(days = 90) {

    const cutoff = new Date(

        Date.now() - days * 24 * 60 * 60 * 1000

    ).toISOString();

    const { error } = await supabase

        .from("founder_dashboard_events")

        .delete()

        .lt("created_at", cutoff);

    if (error) throw error;

    return true;

}

export async function securityEvent(

    actorId,

    profileId,

    event,

    payload = {}

) {

    return publish(

        actorId,

        profileId,

        "security",

        event,

        payload,

        "critical"

    );

}

export async function auditEvent(

    actorId,

    profileId,

    module,

    action,

    payload = {}

) {

    return publish(

        actorId,

        profileId,

        module,

        action,

        payload,

        "audit"

    );

}
