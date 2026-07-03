// ============================================================================
// FILE: /backend/src/modules/blockchain/infrastructure/repositories/blockchain.repository.ts
// NEW FILE
// ============================================================================

import { BlockchainAggregate }
from "../../domain/aggregates/blockchain.aggregate";

export interface BlockchainRepository{

    save(

        aggregate:BlockchainAggregate

    ):Promise<void>;

}
