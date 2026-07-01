// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/provisioning-operation.ts
// NEW FILE
// ============================================================================

export class ProvisioningOperation{

    constructor(

        readonly operationId:string,

        readonly system:string,

        readonly action:string,

        readonly resource:string,

        readonly successful:boolean,

        readonly executedAt:Date|null

    ){}

}
