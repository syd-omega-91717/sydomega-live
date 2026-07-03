// ============================================================================
// FILE: /backend/src/modules/blockchain/domain/entities/ledger-transaction.ts
// NEW FILE
// ============================================================================

export class LedgerTransaction{

    constructor(

        readonly transactionId:string,

        readonly hash:string,

        readonly network:string,

        readonly status:TransactionStatus,

        readonly timestamp:Date

    ){}

}
