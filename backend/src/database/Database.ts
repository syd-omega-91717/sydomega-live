// ============================================================================
// FILE: /backend/src/database/Database.ts
// NEW FILE
// ============================================================================

import database from "./Supabase.js";

export class Database {

    public table(name: string) {

        return database

            .connection()

            .from(name);

    }

    public storage(bucket: string) {

        return database

            .connection()

            .storage

            .from(bucket);

    }

    public auth() {

        return database

            .connection()

            .auth;

    }

}

export default new Database();
