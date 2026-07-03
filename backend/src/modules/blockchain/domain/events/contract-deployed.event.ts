// ============================================================================
// FILE: /backend/src/modules/blockchain/domain/events/contract-deployed.event.ts
// NEW FILE
// ============================================================================

export class ContractDeployedEvent{

    constructor(

        readonly contractAddress:string,

        readonly network:string

    ){}

}
