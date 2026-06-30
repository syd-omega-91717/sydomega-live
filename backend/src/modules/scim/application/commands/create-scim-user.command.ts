// ============================================================================
// FILE: /backend/src/modules/scim/application/commands/create-scim-user.command.ts
// NEW FILE
// ============================================================================

export class CreateScimUserCommand {

    constructor(

        readonly userName: string,

        readonly email: string,

        readonly active: boolean

    ) {}

}
