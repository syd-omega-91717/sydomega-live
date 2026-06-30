// ============================================================================
// FILE: /backend/src/modules/identity/domain/events/risk-evaluated.event.ts
// NEW FILE
// ============================================================================

export class RiskEvaluatedEvent{

    constructor(

        readonly userId:string,

        readonly score:number

    ){}

}
