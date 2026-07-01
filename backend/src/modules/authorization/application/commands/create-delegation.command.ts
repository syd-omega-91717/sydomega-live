// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/create-delegation.command.ts
// NEW FILE
// ============================================================================

export class CreateDelegationCommand{

    constructor(

        readonly delegatorId:string,

        readonly delegateId:string,

        readonly permissions:unknown[],

        readonly validUntil:Date

    ){}

}
