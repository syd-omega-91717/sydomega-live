// ============================================================================
// FILE: /backend/src/modules/organization/domain/read-models/organization-overview.projection.ts
// NEW FILE
// ============================================================================

export interface OrganizationOverviewProjection{

    id:string;

    name:string;

    slug:string;

    ownerId:string;

    members:number;

    workspaces:number;

    departments:number;

    teams:number;

    invitations:number;

    status:string;

    createdAt:Date;

}
