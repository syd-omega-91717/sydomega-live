// ============================================================================
// FILE:
// /enterprise/kernel/EnterpriseCommandCenterEngine.ts
// ============================================================================

export class EnterpriseCommandCenterEngine{

    execute(

        command:string

    ){

        return{

            command,

            executed:true

        };

    }

}
