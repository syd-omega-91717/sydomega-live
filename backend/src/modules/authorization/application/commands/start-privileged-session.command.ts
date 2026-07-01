// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/start-privileged-session.command.ts
// NEW FILE
// ============================================================================

export class StartPrivilegedSessionCommand{

    constructor(

        readonly principalId:string,

        readonly approverId:string,

        readonly justification:string

    ){}

}
