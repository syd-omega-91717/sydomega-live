// ============================================================================
// FILE: /backend/src/repositories/publication.repository.js
// NEW FILE
// ============================================================================

import BaseRepository from "./base.repository.js";

class PublicationRepository extends BaseRepository {

    constructor() {

        super("publications");

    }

    async published() {

        const { data, error } = await this.query()

            .select("*")

            .eq("status", "published")

            .order("created_at", { ascending: false });

        if (error) throw error;

        return data;

    }

    async byAuthor(userId) {

        return this.findMany("user_id", userId);

    }

}

export default new PublicationRepository();
