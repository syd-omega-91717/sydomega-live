// ============================================================================
// FILE:
// /core/identity/AuditEngine.ts
// ============================================================================

export class AuditEngine{

    log(

        action:string,

        actor:string

    ){

        return{

            action,

            actor,

            timestamp:Date.now()

        };

    }

}
