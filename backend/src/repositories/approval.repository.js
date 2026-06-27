// ============================================================================
// FILE: /backend/src/repositories/approval.repository.js
// NEW FILE
// ============================================================================

import BaseRepository from "./base.repository.js";

class ApprovalRepository extends BaseRepository {

    constructor() {

        super("approval_requests");

    }

    async pending() {

        const { data, error } = await this.query()

            .select("*,profiles(*)")

            .eq("current_status", "pending")

            .order("created_at", {

                ascending: false

            });

        if (error) throw error;

        return data;

    }

    async byProfile(profileId) {

        const { data, error } = await this.query()

            .select("*")

            .eq("profile_id", profileId)

            .order("created_at", {

                ascending: false

            });

        if (error) throw error;

        return data;

    }

}

export default new ApprovalRepository();
