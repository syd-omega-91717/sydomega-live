// ============================================================================
// FILE: /backend/src/modules/cost/domain/events/budget-exceeded.event.ts
// NEW FILE
// ============================================================================

export class BudgetExceededEvent{

    constructor(

        readonly tenantId:string,

        readonly amount:number

    ){}

}
