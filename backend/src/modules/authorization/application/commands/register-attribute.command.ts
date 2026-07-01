// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/register-attribute.command.ts
// NEW FILE
// ============================================================================

export class RegisterAttributeCommand{

    constructor(

        readonly name:string,

        readonly source:string,

        readonly type:string

    ){}

}
