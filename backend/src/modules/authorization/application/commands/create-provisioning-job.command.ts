// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/create-provisioning-job.command.ts
// NEW FILE
// ============================================================================

export class CreateProvisioningJobCommand{

    constructor(

        readonly principalId:string,

        readonly operations:unknown[]

    ){}

}
