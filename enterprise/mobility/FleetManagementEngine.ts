// ============================================================================
// FILE:
// /enterprise/mobility/FleetManagementEngine.ts
// ============================================================================

export class FleetManagementEngine{

    dispatch(

        fleetId:string

    ){

        return{

            fleetId,

            dispatched:true

        };

    }

}
