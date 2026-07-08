// ============================================================================
// FILE:
// /enterprise/finance/LedgerEntry.ts
// ============================================================================

export interface LedgerEntry{

    id:string;

    accountId:string;

    debit:number;

    credit:number;

    currency:string;

    timestamp:number;

}
