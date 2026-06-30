// ============================================================================
// FILE: /backend/src/modules/identity/application/commands/create-service-account.command.ts
// NEW FILE
// ============================================================================

export class CreateServiceAccountCommand{

    constructor(

        readonly ownerId:string,

        readonly name:string,

        readonly scopes:string[]

    ){}

}
