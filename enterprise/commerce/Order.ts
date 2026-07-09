// ============================================================================
// FILE:
// /enterprise/commerce/Order.ts
// ============================================================================

export interface Order{

    id:string;

    customerId:string;

    status:string;

    total:number;

    currency:string;

    createdAt:number;

}
