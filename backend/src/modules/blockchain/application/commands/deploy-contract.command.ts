// ============================================================================
// FILE: /backend/src/modules/blockchain/application/commands/deploy-contract.command.ts
// NEW FILE
// ============================================================================

export class DeployContractCommand{

    constructor(

        readonly bytecode:string,

        readonly network:string

    ){}

}
