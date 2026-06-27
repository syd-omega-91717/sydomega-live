// ============================================================================
// FILE: /backend/src/repositories/consultancy.repository.js
// NEW FILE
// ============================================================================

import BaseRepository from "./base.repository.js";

class ConsultancyRepository extends BaseRepository {

    constructor() {

        super("consult_requests");

    }

    async pending() {

        const { data, error } = await this.query()

            .select("*")

            .eq("status", "pending")

            .order("created_at", { ascending: false });

        if (error) throw error;

        return data;

    }

    async byClient(clientId) {

        return this.findMany("client_id", clientId);

    }

}

export default new ConsultancyRepository();
