// ============================================================================
// FILE: /backend/src/modules/geospatial/infrastructure/repositories/geospatial.repository.ts
// NEW FILE
// ============================================================================

import { GeospatialAggregate }
from "../../domain/aggregates/geospatial.aggregate";

export interface GeospatialRepository{

    save(

        aggregate:GeospatialAggregate

    ):Promise<void>;

}
