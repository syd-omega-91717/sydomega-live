// ============================================================================
// FILE: /backend/src/database/database.js
// NEW FILE
// ============================================================================

import supabase from "./supabase.js";

class Database {

    table(name) {

        return supabase.from(name);

    }

    from(name) {

        return supabase.from(name);

    }

    rpc(name, payload = {}) {

        return supabase.rpc(name, payload);

    }

    bucket(name) {

        return supabase.storage.from(name);

    }

    auth() {

        return supabase.auth;

    }

    client() {

        return supabase;

    }

}

export default new Database();
