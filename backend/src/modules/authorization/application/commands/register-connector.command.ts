// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/register-connector.command.ts
// NEW FILE
// ============================================================================

export class RegisterConnectorCommand{

    constructor(

        readonly name:string,

        readonly vendor:string,

        readonly endpoint:string

    ){}

}
