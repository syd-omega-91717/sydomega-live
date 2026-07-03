// ============================================================================
// FILE: /backend/src/modules/geospatial/infrastructure/postgis/postgis.config.ts
// NEW FILE
// ============================================================================

export const PostGISConfiguration={

    provider:"PostGIS",

    spatialIndexing:true,

    vectorTiles:true,

    rasterSupport:true,

    realtimeTracking:true,

    clustering:true,

    heatmaps:true

};
