// ============================================================================
// FILE: /backend/src/modules/digital-twin/domain/aggregates/digital-twin.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { TwinId }
from "../value-objects/twin-id";

export class DigitalTwinAggregate
extends AggregateRoot<TwinId>{

    synchronize(){}

    simulate(){}

    predict(){}

    replay(){}

    archive(){}

}
