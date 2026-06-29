// ============================================================================
// FILE: /backend/src/modules/organization/domain/read-models/organization-statistics.projection.ts
// NEW FILE
// ============================================================================

export interface OrganizationStatisticsProjection{

    activeMembers:number;

    inactiveMembers:number;

    activeWorkspaces:number;

    activeTeams:number;

    pendingInvitations:number;

    storageUsed:number;

    storageLimit:number;

    apiKeys:number;

    lastActivity:Date|null;

}
