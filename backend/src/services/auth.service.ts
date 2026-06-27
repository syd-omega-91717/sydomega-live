// ============================================================================
// FILE: /backend/src/services/auth.service.js
// NEW FILE
// ============================================================================

import jwt from "jsonwebtoken";
import { supabase } from "../database/supabase.js";
import * as Approval from "./approval.service.js";

export async function login(email, password) {

    const { data: profile } = await supabase

        .from("profiles")

        .select("*")

        .eq("email", email)

        .single();

    if (!profile)

        throw new Error("Invalid credentials.");

    // TODO:
    // Replace with bcrypt password verification

    const token = jwt.sign(

        {

            sub: profile.id,

            email: profile.email

        },

        process.env.JWT_SECRET,

        {

            expiresIn: "24h"

        }

    );

    return {

        token,

        profile

    };

}

export async function requestAccess(profileId) {

    return Approval.createApprovalRequest(profileId);

}

export async function logout() {

    return true;

}
