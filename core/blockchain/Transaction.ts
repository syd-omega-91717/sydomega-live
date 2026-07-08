// ============================================================================
// FILE:
// /core/blockchain/Transaction.ts
// ============================================================================

export interface Transaction{

    id:string;

    walletId:string;

    hash:string;

    amount:number;

    asset:string;

    status:string;

    timestamp:number;

}
