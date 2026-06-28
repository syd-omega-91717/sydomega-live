// ============================================================================
// FILE: /backend/src/database/supabase.js
// NEW FILE
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import env from "../config/env.js";

if (!env.SUPABASE_URL) {
    throw new Error("SUPABASE_URL is not configured.");
}

if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
}

const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        global: {
            headers: {
                "X-Client-Info": "Omega-SYD-Backend"
            }
        }
    }
);

export default supabase;
