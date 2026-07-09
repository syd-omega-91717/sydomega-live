// ============================================================================
// FILE:
// /enterprise/defense/BorderSecurityEngine.ts
// ============================================================================

export class BorderSecurityEngine{

    monitor(

        checkpoint:string

    ){

        return{

            checkpoint,

            monitored:true

        };

    }

}
