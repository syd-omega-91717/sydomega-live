// ============================================================================
// FILE: /backend/src/modules/identity/application/commands/create-api-key.command.ts
// NEW FILE
// ============================================================================

export class CreateApiKeyCommand {

    constructor(

        readonly ownerId:string,

        readonly name:string,

        readonly scopes:string[]

    ){}

}
