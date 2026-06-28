// ============================================================================
// FILE: /backend/src/repositories/profile.repository.js
// REPLACE THE ENTIRE FILE
// ============================================================================

import database from "../database/database.js";

class ProfileRepository {

    table() {

        return database.table("profiles");

    }

    async findById(id) {

        const { data, error } = await this.table()

            .select("*")

            .eq("id", id)

            .single();

        if (error) throw error;

        return data;

    }

    async approve(profileId, founderId, expiresAt) {

        const { data, error } = await this.table()

            .update({

                approval_status: "approved",

                verification_status: "verified",

                account_enabled: true,

                access_state: "active",

                approved_by: founderId,

                approved_at: new Date(),

                approval_expires_at: expiresAt,

                failed_login_count: 0,

                last_login_at: new Date()

            })

            .eq("id", profileId)

            .select()

            .single();

        if (error) throw error;

        return data;

    }

    async reject(profileId, reason) {

        const { data, error } = await this.table()

            .update({

                approval_status: "rejected",

                account_enabled: false,

                access_state: "rejected",

                rejection_reason: reason,

                approval_expires_at: null

            })

            .eq("id", profileId)

            .select()

            .single();

        if (error) throw error;

        return data;

    }

    async renew(profileId, expiresAt) {

        const { data, error } = await this.table()

            .update({

                account_enabled: true,

                access_state: "active",

                approval_expires_at: expiresAt

            })

            .eq("id", profileId)

            .select()

            .single();

        if (error) throw error;

        return data;

    }

}

export default new ProfileRepository();
