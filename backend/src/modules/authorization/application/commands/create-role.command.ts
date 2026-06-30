// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/create-role.command.ts
// NEW FILE
// ============================================================================

export class CreateRoleCommand{

    constructor(

        readonly name:string,

        readonly description:string

    ){}

}
