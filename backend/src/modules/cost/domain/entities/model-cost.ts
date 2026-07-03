// ============================================================================
// FILE: /backend/src/modules/cost/domain/entities/model-cost.ts
// NEW FILE
// ============================================================================

import { ModelTier }
from "../enums/model-tier";

export class ModelCost{

    constructor(

        readonly model:string,

        readonly tier:ModelTier,

        readonly promptCost:number,

        readonly completionCost:number,

        readonly cachedCost:number

    ){}

}
