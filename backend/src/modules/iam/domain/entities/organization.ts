// ============================================================================
// FILE: /backend/src/modules/iam/domain/entities/organization.ts
// NEW FILE
// ============================================================================

export class Organization{

    constructor(

        readonly organizationId:string,

        readonly tenantId:string,

        readonly name:string,

        readonly parentOrganization:string|null

    ){}

}
