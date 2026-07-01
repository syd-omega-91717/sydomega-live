// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/submit-access-request.command.ts
// NEW FILE
// ============================================================================

export class SubmitAccessRequestCommand{

    constructor(

        readonly requesterId:string,

        readonly requestedRoles:unknown[]

    ){}

}
