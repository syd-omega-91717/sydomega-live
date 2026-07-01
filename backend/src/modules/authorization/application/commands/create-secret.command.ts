// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/create-secret.command.ts
// NEW FILE
// ============================================================================

export class CreateSecretCommand{

    constructor(

        readonly name:string,

        readonly type:string,

        readonly ownerId:string

    ){}

}
