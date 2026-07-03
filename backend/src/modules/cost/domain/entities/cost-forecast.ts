// ============================================================================
// FILE: /backend/src/modules/cost/domain/entities/cost-forecast.ts
// NEW FILE
// ============================================================================

export class CostForecast{

    constructor(

        readonly tenantId:string,

        readonly projectedMonthlySpend:number,

        readonly projectedTokens:number,

        readonly confidence:number

    ){}

}
