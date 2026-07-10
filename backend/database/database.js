// ============================================================================
// FILE: backend/database/database.js
// Ω SYD OMEGA 91717
// Enterprise Database Manager
// ============================================================================

import supabase from "../config/supabase.js";

class DatabaseManager {

    async health() {

        const started = Date.now();

        try {

            const { error } = await supabase
                .from("system_health")
                .select("*")
                .limit(1);

            return {

                success: !error,

                latency: Date.now() - started,

                provider: "Supabase",

                timestamp: new Date().toISOString(),

                error: error?.message ?? null

            };

        }

        catch (err) {

            return {

                success: false,

                latency: Date.now() - started,

                provider: "Supabase",

                timestamp: new Date().toISOString(),

                error: err.message

            };

        }

    }

}

export default new DatabaseManager();
