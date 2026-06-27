// ============================================================================
// FILE: /backend/src/repositories/payment.repository.js
// NEW FILE
// ============================================================================

import BaseRepository from "./base.repository.js";

class PaymentRepository extends BaseRepository {

    constructor() {

        super("payments");

    }

    async successful() {

        const { data, error } = await this.query()

            .select("*")

            .eq("status", "completed")

            .order("created_at", { ascending: false });

        if (error) throw error;

        return data;

    }

    async byUser(userId) {

        return this.findMany("user_id", userId);

    }

}

export default new PaymentRepository();
