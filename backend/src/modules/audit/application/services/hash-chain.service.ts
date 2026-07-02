// ============================================================================
// FILE: /backend/src/modules/audit/application/services/hash-chain.service.ts
// NEW FILE
// ============================================================================

import { HashChainRecord }
from "../../domain/entities/hash-chain-record";

export interface HashChainService{

    append(

        record:HashChainRecord

    ):Promise<void>;

    verify():Promise<boolean>;

}
