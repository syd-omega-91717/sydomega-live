// ============================================================================
// FILE: /backend/src/modules/organization/domain/repositories/organization-search.repository.ts
// NEW FILE
// ============================================================================

export interface OrganizationSearchRepository{

    index(

        organizationId:string

    ):Promise<void>;

    remove(

        organizationId:string

    ):Promise<void>;

}
