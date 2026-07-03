// ============================================================================
// FILE: /backend/src/modules/cost/application/commands/estimate-cost.command.ts
// NEW FILE
// ============================================================================

export class EstimateCostCommand{

    constructor(

        readonly model:string,

        readonly estimatedTokens:number

    ){}

}
