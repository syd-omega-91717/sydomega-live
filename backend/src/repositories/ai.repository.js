// ============================================================================
// FILE: /backend/src/repositories/ai.repository.js
// NEW FILE
// ============================================================================

import BaseRepository from "./base.repository.js";

class AIRepository extends BaseRepository {

    constructor() {

        super("ai_conversations");

    }

    async byUser(userId) {

        return this.findMany("user_id", userId);

    }

    async latest(userId) {

        const { data, error } = await this.query()

            .select("*")

            .eq("user_id", userId)

            .order("created_at", { ascending: false })

            .limit(1)

            .single();

        if (error) throw error;

        return data;

    }

}

export default new AIRepository();
