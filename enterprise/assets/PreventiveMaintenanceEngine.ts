// ============================================================================
// FILE:
// /enterprise/assets/PreventiveMaintenanceEngine.ts
// ============================================================================

export class PreventiveMaintenanceEngine{

    schedule(

        assetId:string,

        execution:number

    ){

        return{

            assetId,

            execution,

            scheduled:true

        };

    }

}
