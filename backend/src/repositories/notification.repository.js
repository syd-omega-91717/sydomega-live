// ============================================================================
// FILE: /backend/src/repositories/notification.repository.js
// NEW FILE
// ============================================================================

import BaseRepository from "./base.repository.js";

class NotificationRepository extends BaseRepository {

    constructor() {

        super("notifications");

    }

    async unread(userId) {

        const { data, error } = await this.query()

            .select("*")

            .eq("recipient", userId)

            .eq("is_read", false)

            .order("created_at", {

                ascending: false

            });

        if (error) throw error;

        return data;

    }

}

export default new NotificationRepository();
