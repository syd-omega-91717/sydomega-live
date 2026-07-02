// ============================================================================
// FILE: /backend/src/modules/audit/infrastructure/repositories/hash-chain.repository.ts
// NEW FILE
// ============================================================================

import { HashChainAggregate }
from "../../domain/aggregates/hash-chain.aggregate";

export interface HashChainRepository{

    save(

        aggregate:HashChainAggregate

    ):Promise<void>;

    latest(

    ):Promise<HashChainAggregate|null>;

    chain(

    ):Promise<HashChainAggregate[]>;

}
