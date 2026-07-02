// ============================================================================
// FILE: /backend/src/modules/audit/domain/entities/hash-chain-record.ts
// NEW FILE
// ============================================================================

import { HashChainId }
from "../value-objects/hash-chain-id";

import { HashChainStatus }
from "../enums/hash-chain-status";

export class HashChainRecord{

    constructor(

        readonly id:HashChainId,

        readonly sequence:number,

        readonly previousHash:string,

        readonly currentHash:string,

        readonly payloadHash:string,

        readonly algorithm:string,

        readonly status:HashChainStatus,

        readonly createdAt:Date

    ){}

}
