// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/sod-conflict.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { SodConflictId }
from "../value-objects/sod-conflict-id";

export class SodConflictAggregate
extends AggregateRoot<SodConflictId>{

    detect(){}

    mitigate(){}

    acceptRisk(){}

    resolve(){}

    close(){}

}
