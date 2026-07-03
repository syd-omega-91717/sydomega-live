// ============================================================================
// FILE: /backend/src/modules/geospatial/domain/aggregates/geospatial.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { SpatialId }
from "../value-objects/spatial-id";

export class GeospatialAggregate
extends AggregateRoot<SpatialId>{

    createLayer(){}

    analyze(){}

    optimizeRoute(){}

    generateHeatmap(){}

    processGeofence(){}

}
