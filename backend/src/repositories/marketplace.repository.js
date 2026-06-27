// ============================================================================
// FILE: /backend/src/repositories/marketplace.repository.js
// NEW FILE
// ============================================================================

import BaseRepository from "./base.repository.js";

class MarketplaceRepository extends BaseRepository {

    constructor() {

        super("marketplace_listings");

    }

    async active() {

        const { data, error } = await this.query()

            .select("*")

            .eq("status", "active")

            .order("created_at", { ascending: false });

        if (error) throw error;

        return data;

    }

    async bySeller(sellerId) {

        return this.findMany("seller_id", sellerId);

    }

    async byCategory(categoryId) {

        return this.findMany("category_id", categoryId);

    }

}

export default new MarketplaceRepository();
