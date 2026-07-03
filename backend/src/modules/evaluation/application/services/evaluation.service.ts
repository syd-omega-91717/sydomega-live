// ============================================================================
// FILE: /backend/src/modules/evaluation/application/services/evaluation.service.ts
// NEW FILE
// ============================================================================

import { BenchmarkResult }
from "../../domain/entities/benchmark-result";

export interface EvaluationService{

    evaluate(

        model:string

    ):Promise<BenchmarkResult[]>;

    compare(

        evaluationId:string

    ):Promise<void>;

}
