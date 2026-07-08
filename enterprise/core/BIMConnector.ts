// ============================================================================
// FILE:
// /enterprise/core/BIMConnector.ts
// ============================================================================

export interface BIMConnector{

    id:string;

    project:string;

    synchronizeModels():Promise<void>;

    synchronizeAssets():Promise<void>;

    synchronizeFacilities():Promise<void>;

}
