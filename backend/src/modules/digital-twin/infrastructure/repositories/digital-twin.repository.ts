// ============================================================================
// FILE: /backend/src/modules/digital-twin/infrastructure/repositories/digital-twin.repository.ts
// NEW FILE
// ============================================================================

import { DigitalTwinAggregate }
from "../../domain/aggregates/digital-twin.aggregate";

export interface DigitalTwinRepository{

    save(

        aggregate:DigitalTwinAggregate

    ):Promise<void>;

}
