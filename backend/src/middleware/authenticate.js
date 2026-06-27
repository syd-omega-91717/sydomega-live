// ============================================================================
// FILE: /backend/src/middleware/authenticate.js
// NEW FILE
// ============================================================================

import { supabase } from "../database/supabase.js";

export default async function authenticate(req, res, next) {

    try {

        const authorization = req.headers.authorization;

        if (!authorization) {

            return res.status(401).json({

                success: false,

                message: "Missing authorization header."

            });

        }

        const token = authorization.replace("Bearer ", "");

        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {

            return res.status(401).json({

                success: false,

                message: "Invalid token."

            });

        }

        const { data: profile } = await supabase

            .from("profiles")

            .select("*")

            .eq("id", data.user.id)

            .single();

        req.user = data.user;

        req.profile = profile;

        next();

    } catch (error) {

        next(error);

    }

}
