// ============================================================================
// FILE: /backend/src/services/notification.service.js
// REPLACE THE ENTIRE FILE
// ============================================================================

import { supabase } from "../database/supabase.js";
import * as Events from "./event.service.js";

export async function createNotification(payload) {

    const { data, error } = await supabase

        .from("approval_notifications")

        .insert({

            title: payload.title,

            body: payload.body,

            recipient: payload.recipient,

            sender: payload.sender,

            approval_request_id: payload.approval_request_id,

            notification_type: payload.notification_type || "system",

            status: "unread",

            action_url: payload.action_url || null

        })

        .select()

        .single();

    if (error) throw error;

    await Events.publish(

        payload.sender,

        payload.recipient,

        "notification",

        "created",

        data

    );

    return data;

}

export async function unread(profileId) {

    const { data, error } = await supabase

        .from("approval_notifications")

        .select("*")

        .eq("recipient", profileId)

        .eq("status", "unread")

        .order("created_at", {

            ascending: false

        });

    if (error) throw error;

    return data;

}

export async function all(profileId) {

    const { data, error } = await supabase

        .from("approval_notifications")

        .select("*")

        .eq("recipient", profileId)

        .order("created_at", {

            ascending: false

        });

    if (error) throw error;

    return data;

}

export async function read(notificationId) {

    const { data, error } = await supabase

        .from("approval_notifications")

        .update({

            status: "read",

            read_at: new Date()

        })

        .eq("id", notificationId)

        .select()

        .single();

    if (error) throw error;

    return data;

}

export async function markAllRead(profileId) {

    const { error } = await supabase

        .from("approval_notifications")

        .update({

            status: "read",

            read_at: new Date()

        })

        .eq("recipient", profileId)

        .eq("status", "unread");

    if (error) throw error;

    return true;

}

export async function remove(notificationId) {

    const { error } = await supabase

        .from("approval_notifications")

        .delete()

        .eq("id", notificationId);

    if (error) throw error;

    return true;

}

export async function count(profileId) {

    const { count, error } = await supabase

        .from("approval_notifications")

        .select("*", {

            head: true,

            count: "exact"

        })

        .eq("recipient", profileId)

        .eq("status", "unread");

    if (error) throw error;

    return count || 0;

}
