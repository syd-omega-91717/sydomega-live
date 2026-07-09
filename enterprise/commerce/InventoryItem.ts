// ============================================================================
// FILE:
// /enterprise/commerce/InventoryItem.ts
// ============================================================================

export interface InventoryItem{

    id:string;

    productId:string;

    warehouseId:string;

    quantity:number;

    reorderLevel:number;

}
