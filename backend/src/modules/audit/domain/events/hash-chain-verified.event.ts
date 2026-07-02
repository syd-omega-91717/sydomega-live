// ============================================================================
// FILE: /backend/src/modules/audit/domain/events/hash-chain-verified.event.ts
// NEW FILE
// ============================================================================

export class HashChainVerifiedEvent{

    constructor(

        readonly chainId:string,

        readonly valid:boolean

    ){}

}
