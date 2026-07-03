// ============================================================================
// FILE: /backend/src/modules/blockchain/domain/events/transaction-confirmed.event.ts
// NEW FILE
// ============================================================================

export class TransactionConfirmedEvent{

    constructor(

        readonly transactionHash:string,

        readonly confirmations:number

    ){}

}
