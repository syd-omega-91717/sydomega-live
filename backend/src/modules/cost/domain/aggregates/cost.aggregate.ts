// ============================================================================
// FILE: /backend/src/modules/cost/domain/aggregates/cost.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { BudgetId }
from "../value-objects/budget-id";

export class CostAggregate
extends AggregateRoot<BudgetId>{

    estimate(){}

    optimize(){}

    enforceBudget(){}

    forecast(){}

    allocate(){}

}
