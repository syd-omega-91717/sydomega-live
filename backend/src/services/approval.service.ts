// ============================================================================
// FILE: /backend/src/services/approval.service.js
// REPLACE THE ENTIRE FILE
// ============================================================================

import { supabase } from "../database/supabase.js";
import * as Notify from "./notification.service.js";
import * as Events from "./event.service.js";

const ACCESS_DURATION_SECONDS = 557; // 9m17s

function expiresAt() {
    return new Date(Date.now() + ACCESS_DURATION_SECONDS * 1000);
}

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

export async function approved() {

    const { data, error } = await supabase

        .from("approval_requests")

        .select(`
            *,
            profiles(*)
        `)

        .eq("current_status", "approved")

        .order("reviewed_at", {
            ascending: false
        });

    if (error) throw error;

    return data;

}

export async function rejected() {

    const { data, error } = await supabase

        .from("approval_requests")

        .select(`
            *,
            profiles(*)
        `)

        .eq("current_status", "rejected")

        .order("reviewed_at", {
            ascending: false
        });

    if (error) throw error;

    return data;

}

export async function approve(requestId, founderId) {

    const { data: request, error } = await supabase

        .from("approval_requests")

        .select("*")

        .eq("id", requestId)

        .single();

    if (error) throw error;

    if (!request)
        throw new Error("Approval request not found.");

    const expiration = expiresAt();

    const { error: profileError } = await supabase

        .from("profiles")

        .update({

            approval_status: "approved",

            verification_status: "verified",

            account_enabled: true,

            access_state: "active",

            approved_by: founderId,

            approved_at: new Date(),

            approval_expires_at: expiration,

            last_login_at: new Date(),

            failed_login_count: 0

        })

        .eq("id", request.profile_id);

    if (profileError) throw profileError;

    const { error: requestError } = await supabase

        .from("approval_requests")

        .update({

            current_status: "approved",

            reviewed_by: founderId,

            reviewed_at: new Date()

        })

        .eq("id", requestId);

    if (requestError) throw requestError;

    await Notify.createNotification({

        approval_request_id: requestId,

        recipient: request.profile_id,

        sender: founderId,

        title: "Account Approved",

        body: `Access granted for ${ACCESS_DURATION_SECONDS} seconds.`,

        notification_type: "approval",

        action_url: "/dashboard"

    });

    await Events.publish(

        founderId,

        request.profile_id,

        "approval",

        "approved",

        {

            expires_at: expiration,

            duration_seconds: ACCESS_DURATION_SECONDS,

            request

        }

    );

    return {

        success: true,

        expires_at: expiration,

        duration_seconds: ACCESS_DURATION_SECONDS

    };

}

export async function reject(requestId, founderId, reason) {

    const { data: request, error } = await supabase

        .from("approval_requests")

        .select("*")

        .eq("id", requestId)

        .single();

    if (error) throw error;

    if (!request)
        throw new Error("Approval request not found.");

    await supabase

        .from("profiles")

        .update({

            approval_status: "rejected",

            account_enabled: false,

            access_state: "rejected",

            rejection_reason: reason,

            approval_expires_at: null

        })

        .eq("id", request.profile_id);

    await supabase

        .from("approval_requests")

        .update({

            current_status: "rejected",

            reviewed_by: founderId,

            reviewed_at: new Date(),

            rejection_reason: reason

        })

        .eq("id", requestId);

    await Notify.createNotification({

        approval_request_id: requestId,

        recipient: request.profile_id,

        sender: founderId,

        title: "Account Rejected",

        body: reason,

        notification_type: "rejection",

        action_url: "/login"

    });

    await Events.publish(

        founderId,

        request.profile_id,

        "approval",

        "rejected",

        {

            reason,

            request

        }

    );

    return {

        success: true

    };

}

export async function renew(profileId) {

    const expiration = expiresAt();

    const { error } = await supabase

        .from("profiles")

        .update({

            access_state: "active",

            account_enabled: true,

            approval_expires_at: expiration

        })

        .eq("id", profileId);

    if (error) throw error;

    return expiration;

}

export async function createApprovalRequest(profileId, payload = {}) {

    const { data, error } = await supabase

        .from("approval_requests")

        .insert({

            profile_id: profileId,

            request_type: payload.request_type || "platform_access",

            requested_role: payload.requested_role || "user",

            requested_plan: payload.requested_plan || "free",

            notes: payload.notes || "",

            current_status: "pending"

        })

        .select()

        .single();

    if (error) throw error;

    await Events.publish(

        profileId,

        profileId,

        "approval",

        "request_created",

        data

    );

    return data;

}
