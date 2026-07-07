// ============================================================================
// FILE:
// /core/governance/GovernanceContext.ts
// ============================================================================

export interface GovernanceContext{

    id:string;

    tenantId:string;

    userId:string;

    module:string;

    action:string;

    timestamp:number;

    metadata?:Record<string,unknown>;

}
