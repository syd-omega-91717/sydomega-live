// ============================================================================
// FILE:
// /enterprise/commerce/InventoryEngine.ts
// ============================================================================

export class InventoryEngine{

    reserve(

        sku:string,

        quantity:number

    ){

        return{

            sku,

            quantity,

            reserved:true

        };

    }

}
