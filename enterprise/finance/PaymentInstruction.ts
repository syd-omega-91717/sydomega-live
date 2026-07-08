// ============================================================================
// FILE:
// /enterprise/finance/PaymentInstruction.ts
// ============================================================================

export interface PaymentInstruction{

    id:string;

    sourceAccount:string;

    destinationAccount:string;

    amount:number;

    currency:string;

    status:string;

}
