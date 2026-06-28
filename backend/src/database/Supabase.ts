// ============================================================================
// FILE: /backend/src/database/Supabase.ts
// REPLACE THE ENTIRE FILE
// ============================================================================

import {

    createClient,

    SupabaseClient

} from "@supabase/supabase-js";

import env from "../config/env.js";

class SupabaseDatabase {

    private client: SupabaseClient;

    constructor() {

        this.client = createClient(

            env.SUPABASE_URL,

            env.SUPABASE_SERVICE_ROLE_KEY,

            {

                auth: {

                    autoRefreshToken: false,

                    persistSession: false

                }

            }

        );

    }

    public connection(): SupabaseClient {

        return this.client;

    }

}

const database = new SupabaseDatabase();

export default database;
