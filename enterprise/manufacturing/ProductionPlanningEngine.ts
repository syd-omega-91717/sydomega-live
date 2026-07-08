// ============================================================================
// FILE:
// /enterprise/manufacturing/ProductionPlanningEngine.ts
// ============================================================================

export class ProductionPlanningEngine{

    schedule(

        orderId:string

    ){

        return{

            orderId,

            scheduled:true

        };

    }

}
