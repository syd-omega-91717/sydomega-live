// ============================================================================
// FILE:
// /enterprise/transport/MaritimePortManagementEngine.ts
// ============================================================================

export class MaritimePortManagementEngine{

    assignBerth(

        vesselId:string,

        berthId:string

    ){

        return{

            vesselId,

            berthId,

            assigned:true

        };

    }

}
