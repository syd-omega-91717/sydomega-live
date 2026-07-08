// ============================================================================
// FILE:
// /enterprise/core/CRMConnector.ts
// ============================================================================

export interface CRMConnector{

    id:string;

    provider:string;

    connected:boolean;

    syncCustomers():Promise<void>;

    syncOrganizations():Promise<void>;

    syncLeads():Promise<void>;

}
