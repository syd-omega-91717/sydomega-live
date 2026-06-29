// ============================================================================
// FILE: /backend/src/modules/organization/application/queries/list-organizations.query.ts
// NEW FILE
// ============================================================================

export interface ListOrganizationsQuery {

    ownerId?: string;

    search?: string;

    status?: string;

    page: number;

    limit: number;

}
