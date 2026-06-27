// ============================================================================
// FILE: /backend/src/middleware/rbac.js
// REPLACE THE ENTIRE FILE
// ============================================================================

import { supabase } from "../database/supabase.js";

const FOUNDER_EMAILS = [
    "s.y.dagher@gmail.com",
    "slmndghr@gmail.com"
];

const FOUNDER_PHONES = [
    "+9613062576",
    "+96170599588"
];

async function loadProfile(profileId) {

    const { data, error } = await supabase

        .from("profiles")

        .select(`
            id,
            email,
            mobile,
            role,
            account_enabled,
            approval_status,
            verification_status
        `)

        .eq("id", profileId)

        .single();

    if (error) throw error;

    return data;

}

function isFounder(profile) {

    return (

        FOUNDER_EMAILS.includes(profile.email) ||

        FOUNDER_PHONES.includes(profile.mobile)

    );

}

export function authorize(resource, action) {

    return async (req, res, next) => {

        try {

            const profile = await loadProfile(req.user.id);

            if (!profile.account_enabled)

                return res.status(403).json({

                    success: false,

                    message: "Account disabled."

                });

            if (

                profile.approval_status !== "approved" ||

                profile.verification_status !== "verified"

            )

                return res.status(403).json({

                    success: false,

                    message: "Verification required."

                });

            if (isFounder(profile)) {

                req.permissions = ["*"];

                req.profile = profile;

                return next();

            }

            const { data } = await supabase

                .from("role_permissions")

                .select(`
                    permissions(
                        resource,
                        action
                    )
                `)

                .eq("role_id", profile.role);

            const allowed = (data || []).some(item => {

                const permission = item.permissions;

                if (!permission) return false;

                return (

                    permission.resource === resource &&

                    permission.action === action

                );

            });

            if (!allowed)

                return res.status(403).json({

                    success: false,

                    message: "Permission denied."

                });

            req.profile = profile;

            next();

        }

        catch (error) {

            console.error(error);

            return res.status(500).json({

                success: false,

                message: error.message

            });

        }

    };

}
