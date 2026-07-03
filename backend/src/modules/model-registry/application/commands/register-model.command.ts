// ============================================================================
// FILE: /backend/src/modules/model-registry/application/commands/register-model.command.ts
// NEW FILE
// ============================================================================

export class RegisterModelCommand{

    constructor(

        readonly name:string,

        readonly version:string

    ){}

}
