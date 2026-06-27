// ============================================================================
// FILE: /backend/src/services/dashboard.service.js
// NEW FILE
// ============================================================================

import { supabase } from "../database/supabase.js";

export async function dashboard(profileId) {

    const [

        profile,

        notifications,

        certificates,

        medals,

        trophies,

        publications,

        marketplace,

        academy

    ] = await Promise.all([

        supabase

            .from("profiles")

            .select("*")

            .eq("id", profileId)

            .single(),

        supabase

            .from("approval_notifications")

            .select("*", {

                head: true,

                count: "exact"

            })

            .eq("recipient", profileId)

            .eq("status", "unread"),

        supabase

            .from("certificates")

            .select("*", {

                head: true,

                count: "exact"

            })

            .eq("user_id", profileId),

        supabase

            .from("medals")

            .select("*", {

                head: true,

                count: "exact"

            })

            .eq("user_id", profileId),

        supabase

            .from("trophies")

            .select("*", {

                head: true,

                count: "exact"

            })

            .eq("user_id", profileId),

        supabase

            .from("publications")

            .select("*", {

                head: true,

                count: "exact"

            })

            .eq("user_id", profileId),

        supabase

            .from("marketplace_listings")

            .select("*", {

                head: true,

                count: "exact"

            })

            .eq("seller_id", profileId),

        supabase

            .from("academy_enrollments")

            .select("*", {

                head: true,

                count: "exact"

            })

            .eq("user_id", profileId)

    ]);

    return {

        profile: profile.data,

        notifications: notifications.count || 0,

        certificates: certificates.count || 0,

        medals: medals.count || 0,

        trophies: trophies.count || 0,

        publications: publications.count || 0,

        marketplace: marketplace.count || 0,

        academy: academy.count || 0

    };

}
