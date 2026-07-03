// ============================================================================
// FILE: /backend/src/modules/evaluation/domain/entities/evaluation.ts
// NEW FILE
// ============================================================================

import { EvaluationId }
from "../value-objects/evaluation-id";

import { EvaluationStatus }
from "../enums/evaluation-status";

export class Evaluation{

    constructor(

        readonly id:EvaluationId,

        readonly tenantId:string,

        readonly model:string,

        readonly status:EvaluationStatus,

        readonly benchmark:string,

        readonly startedAt:Date,

        readonly completedAt:Date|null

    ){}

}
