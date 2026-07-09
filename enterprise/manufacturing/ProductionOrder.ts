// ============================================================================
// ENTERPRISE CORE EC-035
// FILE:
// /enterprise/manufacturing/ProductionOrder.ts
// ============================================================================

export interface ProductionOrder{

    id:string;

    workOrder:string;

    productId:string;

    quantity:number;

    status:string;

}
