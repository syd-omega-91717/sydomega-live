// ============================================================================
// FILE: /backend/src/modules/blockchain/domain/aggregates/blockchain.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { LedgerId }
from "../value-objects/ledger-id";

export class BlockchainAggregate
extends AggregateRoot<LedgerId>{

    createWallet(){}

    deployContract(){}

    signTransaction(){}

    broadcast(){}

    synchronizeLedger(){}

}
