// ============================================================================
// FILE: /backend/src/repositories/access.repository.js
// NEW FILE
// ============================================================================

import BaseRepository from "./base.repository.js";

class AccessRepository extends BaseRepository {

    constructor() {

        super("temporary_access");

    }

    async expired(now = new Date().toISOString()) {

        const { data, error } = await this.query()

            .select("*")

            .lt("expires_at", now)

            .eq("active", true);

        if (error) throw error;

        return data;

    }

}

export default new AccessRepository();
