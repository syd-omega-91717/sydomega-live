// ============================================================================
// FILE: /backend/src/modules/evaluation/infrastructure/repositories/evaluation.repository.ts
// NEW FILE
// ============================================================================

import { EvaluationAggregate }
from "../../domain/aggregates/evaluation.aggregate";

export interface EvaluationRepository{

    save(

        aggregate:EvaluationAggregate

    ):Promise<void>;

    find(

        evaluationId:string

    ):Promise<EvaluationAggregate|null>;

}
