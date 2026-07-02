// ============================================================================
// FILE: /backend/src/modules/ai/domain/entities/orchestration-plan.ts
// NEW FILE
// ============================================================================

import { OrchestrationStrategy }
from "../enums/orchestration-strategy";

export class OrchestrationPlan{

    constructor(

        readonly orchestrationId:string,

        readonly strategy:OrchestrationStrategy,

        readonly primaryModel:string,

        readonly fallbackModels:string[],

        readonly parallelModels:string[]

    ){}

}
