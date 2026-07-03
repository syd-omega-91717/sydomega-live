// ============================================================================
// FILE: /backend/src/modules/cost/domain/entities/ai-budget.ts
// NEW FILE
// ============================================================================

import { BudgetId }
from "../value-objects/budget-id";

import { BudgetStatus }
from "../enums/budget-status";

export class AIBudget{

    constructor(

        readonly id:BudgetId,

        readonly tenantId:string,

        readonly monthlyLimit:number,

        readonly currentSpend:number,

        readonly status:BudgetStatus,

        readonly currency:string

    ){}

}
