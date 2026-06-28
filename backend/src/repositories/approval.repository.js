// ============================================================================
// FILE: /backend/src/repositories/approval.repository.js
// REPLACE THE ENTIRE FILE
// ============================================================================

import database from "../database/database.js";

class ApprovalRepository {

    table() {

        return database.table("approval_requests");

    }

    async findById(id) {

        const { data, error } = await this.table()

            .select("*")

            .eq("id", id)

            .single();

        if (error) throw error;

        return data;

    }

    async pending() {

        const { data, error } = await this.table()

            .select(`
                *,
                profiles(*)
            `)

            .eq("current_status", "pending")

            .order("created_at", {

                ascending: false

            });

        if (error) throw error;

        return data;

    }

    async approved() {

        const { data, error } = await this.table()

            .select(`
                *,
                profiles(*)
            `)

            .eq("current_status", "approved")

            .order("reviewed_at", {

                ascending: false

            });

        if (error) throw error;

        return data;

    }

    async rejected() {

        const { data, error } = await this.table()

            .select(`
                *,
                profiles(*)
            `)

            .eq("current_status", "rejected")

            .order("reviewed_at", {

                ascending: false

            });

        if (error) throw error;

        return data;

    }

    async approve(requestId, founderId) {

        const { data, error } = await this.table()

            .update({

                current_status: "approved",

                reviewed_by: founderId,

                reviewed_at: new Date()

            })

            .eq("id", requestId)

            .select()

            .single();

        if (error) throw error;

        return data;

    }

    async reject(requestId, founderId, reason) {

        const { data, error } = await this.table()

            .update({

                current_status: "rejected",

                reviewed_by: founderId,

                reviewed_at: new Date(),

                rejection_reason: reason

            })

            .eq("id", requestId)

            .select()

            .single();

        if (error) throw error;

        return data;

    }

    async createRequest(payload) {

        const { data, error } = await this.table()

            .insert(payload)

            .select()

            .single();

        if (error) throw error;

        return data;

    }

}

export default new ApprovalRepository();
