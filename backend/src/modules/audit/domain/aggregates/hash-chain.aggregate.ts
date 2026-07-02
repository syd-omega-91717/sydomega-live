// ============================================================================
// FILE: /backend/src/modules/audit/domain/aggregates/hash-chain.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { HashChainId }
from "../value-objects/hash-chain-id";

export class HashChainAggregate
extends AggregateRoot<HashChainId>{

    append(){}

    validate(){}

    verifyIntegrity(){}

    generateMerkleRoot(){}

    archive(){}

}
