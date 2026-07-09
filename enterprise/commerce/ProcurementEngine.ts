// ============================================================================
// FILE:
// /enterprise/commerce/ProcurementEngine.ts
// ============================================================================

export class ProcurementEngine{

    purchase(

        supplierId:string

    ){

        return{

            supplierId,

            approved:true

        };

    }

}
