// ============================================================================
// FILE: /backend/src/modules/audit/domain/events/hash-chain-appended.event.ts
// NEW FILE
// ============================================================================

export class HashChainAppendedEvent{

    constructor(

        readonly chainId:string,

        readonly sequence:number

    ){}

}
