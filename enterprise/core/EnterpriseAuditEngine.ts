// ============================================================================
// FILE:
// /enterprise/core/EnterpriseAuditEngine.ts
// ============================================================================

export class EnterpriseAuditEngine{

    audit(

        action:string,

        target:string

    ){

        return{

            action,

            target,

            timestamp:Date.now()

        };

    }

}
