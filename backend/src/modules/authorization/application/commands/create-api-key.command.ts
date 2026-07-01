// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/create-api-key.command.ts
// NEW FILE
// ============================================================================

export class CreateApiKeyCommand{

    constructor(

        readonly ownerId:string,

        readonly name:string,

        readonly scopes:string[]

    ){}

}
