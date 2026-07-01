// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/approve-access-request.command.ts
// NEW FILE
// ============================================================================

export class ApproveAccessRequestCommand{

    constructor(

        readonly requestId:string,

        readonly approverId:string

    ){}

}
