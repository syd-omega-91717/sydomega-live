// ============================================================================
// FILE: /backend/src/modules/scim/application/commands/update-scim-user.command.ts
// NEW FILE
// ============================================================================

export class UpdateScimUserCommand {

    constructor(

        readonly id: string,

        readonly operations: unknown[]

    ) {}

}
