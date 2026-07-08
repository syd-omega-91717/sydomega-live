// ============================================================================
// FILE:
// /enterprise/core/MESConnector.ts
// ============================================================================

export interface MESConnector{

    id:string;

    factory:string;

    synchronizeProduction():Promise<void>;

    synchronizeMachines():Promise<void>;

    synchronizeQuality():Promise<void>;

}
