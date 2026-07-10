============================================================================
FILE:
supabase.js

LOCATION:
sydomega-live-main/backend/config/supabase.js

CODE:
============================================================================

  // ============================================================================
// FILE: backend/config/supabase.js
// Ω SYD OMEGA 91717
// Enterprise Supabase Configuration
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import env from "./env.js";

const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        },
        db: {
            schema: "public"
        },
        global: {
            headers: {
                "X-Application": env.APP_NAME,
                "X-Version": env.APP_VERSION
            }
        }
    }
);

export default supabase;
