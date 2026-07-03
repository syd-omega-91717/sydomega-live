// ============================================================================
// FILE: /backend/src/modules/iam/application/commands/provision-user.command.ts
// NEW FILE
// ============================================================================

export class ProvisionUserCommand{

    constructor(

        readonly tenantId:string,

        readonly email:string

    ){}

}
