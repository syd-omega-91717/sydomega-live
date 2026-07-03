// ============================================================================
// FILE: /backend/src/modules/blockchain/application/commands/sign-transaction.command.ts
// NEW FILE
// ============================================================================

export class SignTransactionCommand{

    constructor(

        readonly walletId:string,

        readonly payload:string

    ){}

}
