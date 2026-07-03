// ============================================================================
// FILE: /backend/src/modules/blockchain/domain/entities/smart-contract.ts
// NEW FILE
// ============================================================================

export class SmartContract{

    constructor(

        readonly contractId:string,

        readonly network:string,

        readonly address:string,

        readonly version:string

    ){}

}
