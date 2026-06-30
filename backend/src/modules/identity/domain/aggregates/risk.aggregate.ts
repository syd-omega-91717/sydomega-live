// ============================================================================
// FILE: /backend/src/modules/identity/domain/aggregates/risk.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot } from "@/kernel/domain/aggregate-root";
import { UserId } from "../value-objects/user-id";

export class RiskAggregate
extends AggregateRoot<UserId>{

    evaluate(){}

    increase(){}

    decrease(){}

    reset(){}

}
