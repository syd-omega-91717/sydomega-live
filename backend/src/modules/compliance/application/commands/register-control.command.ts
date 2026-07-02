// ============================================================================
// FILE: /backend/src/modules/compliance/application/commands/register-control.command.ts
// NEW FILE
// ============================================================================

export class RegisterControlCommand{

    constructor(

        readonly framework:string,

        readonly controlId:string,

        readonly owner:string

    ){}

}
