// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/provisioning-result.ts
// NEW FILE
// ============================================================================

export class ProvisioningResult{

    constructor(

        readonly operationId:string,

        readonly connectorId:string,

        readonly success:boolean,

        readonly message:string,

        readonly completedAt:Date

    ){}

}
