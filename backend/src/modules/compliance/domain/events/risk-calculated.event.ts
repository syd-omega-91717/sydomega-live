// ============================================================================
// FILE: /backend/src/modules/compliance/domain/events/risk-calculated.event.ts
// NEW FILE
// ============================================================================

export class RiskCalculatedEvent{

    constructor(

        readonly riskId:string,

        readonly score:number

    ){}

}
