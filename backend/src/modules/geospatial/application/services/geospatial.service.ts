// ============================================================================
// FILE: /backend/src/modules/geospatial/application/services/geospatial.service.ts
// NEW FILE
// ============================================================================

export interface GeospatialService{

    analyze():Promise<void>;

    optimizeRoute():Promise<void>;

    generateHeatmap():Promise<void>;

    monitorGeofence():Promise<void>;

}
