// ============================================================================
// FILE: /backend/database/database.js
// REPLACE THE ENTIRE FILE
// ============================================================================

import supabase from "./supabase.js";

class Database {

    from(table) {
        return supabase.from(table);
    }

    table(table) {
        return this.from(table);
    }

    rpc(fn, params = {}) {
        return supabase.rpc(fn, params);
    }

    storage(bucket) {
        return supabase.storage.from(bucket);
    }

    auth() {
        return supabase.auth;
    }

    raw() {
        return supabase;
    }

}

export default new Database();
