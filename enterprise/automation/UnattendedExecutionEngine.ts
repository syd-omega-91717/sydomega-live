// ============================================================================
// FILE:
// /enterprise/automation/UnattendedExecutionEngine.ts
// ============================================================================

export class UnattendedExecutionEngine{

    execute(

        automationId:string

    ){

        return{

            automationId,

            unattended:true

        };

    }

}
