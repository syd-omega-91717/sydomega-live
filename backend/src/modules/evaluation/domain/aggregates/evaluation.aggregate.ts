// ============================================================================
// FILE: /backend/src/modules/evaluation/domain/aggregates/evaluation.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { EvaluationId }
from "../value-objects/evaluation-id";

export class EvaluationAggregate
extends AggregateRoot<EvaluationId>{

    initialize(){}

    executeBenchmarks(){}

    compareBaseline(){}

    calculateScores(){}

    finalize(){}

}
