// ============================================================================
// FILE:
// /enterprise/operations/AlertingEngine.ts
// ============================================================================

export class AlertingEngine{

    trigger(

        alertId:string,

        severity:string

    ){

        return{

            alertId,

            severity,

            delivered:true

        };

    }

}
