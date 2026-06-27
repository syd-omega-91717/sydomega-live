// ============================================================================
// FILE: /backend/src/services/profile.service.js
// NEW FILE
// ============================================================================

import { supabase } from "../database/supabase.js";
import * as Events from "./event.service.js";

export async function me(profileId) {

    const { data, error } = await supabase

        .from("profiles")

        .select("*")

        .eq("id", profileId)

        .single();

    if (error) throw error;

    return data;

}

export async function update(profileId, payload) {

    payload.updated_at = new Date();

    const { data, error } = await supabase

        .from("profiles")

        .update(payload)

        .eq("id", profileId)

        .select()

        .single();

    if (error) throw error;

    await Events.publish(

        profileId,

        profileId,

        "profile",

        "updated",

        payload

    );

    return data;

}

export async function preferences(profileId) {

    const { data } = await supabase

        .from("settings")

        .select("*")

        .eq("profile_id", profileId);

    return data || [];

}

export async function savePreferences(profileId, settings) {

    for (const item of settings) {

        await supabase

            .from("settings")

            .upsert({

                profile_id: profileId,

                key: item.key,

                value: item.value

            });

    }

    await Events.publish(

        profileId,

        profileId,

        "settings",

        "updated"

    );

    return true;

}

export async function devices(profileId){

    const {data}=await supabase

        .from("devices")

        .select("*")

        .eq("profile_id",profileId)

        .order("last_seen",{ascending:false});

    return data||[];

}

export async function activity(profileId){

    const {data}=await supabase

        .from("activity_logs")

        .select("*")

        .eq("profile_id",profileId)

        .order("created_at",{ascending:false})

        .limit(100);

    return data||[];

}
