// ============================================================================
// FILE: /backend/src/modules/organization/domain/repositories/organization-projection.repository.ts
// NEW FILE
// ============================================================================

export interface OrganizationProjectionRepository{

    rebuild(

        organizationId:string

    ):Promise<void>;

    rebuildAll():Promise<void>;

}
