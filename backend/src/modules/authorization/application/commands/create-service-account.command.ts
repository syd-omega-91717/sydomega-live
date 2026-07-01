// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/create-service-account.command.ts
// NEW FILE
// ============================================================================

export class CreateServiceAccountCommand{

    constructor(

        readonly name:string,

        readonly ownerId:string,

        readonly type:string

    ){}

}
