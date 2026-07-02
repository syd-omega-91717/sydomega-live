// ============================================================================
// FILE: /backend/src/modules/compliance/domain/aggregates/risk.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { RiskScoreId }
from "../value-objects/risk-score-id";

export class RiskAggregate
extends AggregateRoot<RiskScoreId>{

    calculate(){}

    classify(){}

    accept(){}

    mitigate(){}

    recalculate(){}

}
