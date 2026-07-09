// ============================================================================
// FILE:
// /enterprise/commerce/FleetManagementEngine.ts
// ============================================================================

export class FleetManagementEngine{

    assign(

        vehicleId:string,

        shipmentId:string

    ){

        return{

            vehicleId,

            shipmentId,

            assigned:true

        };

    }

}
