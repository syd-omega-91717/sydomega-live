// ============================================================================
// FILE: /backend/src/repositories/wallet.repository.js
// NEW FILE
// ============================================================================

import BaseRepository from "./base.repository.js";

class WalletRepository extends BaseRepository {

    constructor() {

        super("wallet_accounts");

    }

    async byOwner(ownerId) {

        return this.findOne("owner_id", ownerId);

    }

    async updateBalance(ownerId, balance) {

        const { data, error } = await this.query()

            .update({ balance })

            .eq("owner_id", ownerId)

            .select()

            .single();

        if (error) throw error;

        return data;

    }

}

export default new WalletRepository();
