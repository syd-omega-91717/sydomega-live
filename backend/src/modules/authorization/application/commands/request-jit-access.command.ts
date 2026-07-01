// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/request-jit-access.command.ts
// NEW FILE
// ============================================================================

export class RequestJitAccessCommand{

    constructor(

        readonly principalId:string,

        readonly targetId:string,

        readonly type:string,

        readonly justification:string,

        readonly expiresAt:Date

    ){}

}
