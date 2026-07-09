// ============================================================================
// FILE:
// /enterprise/commerce/WarehouseEngine.ts
// ============================================================================

export class WarehouseEngine{

    allocate(

        warehouseId:string

    ){

        return{

            warehouseId,

            allocated:true

        };

    }

}
