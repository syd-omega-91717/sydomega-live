// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/risk-assessment-completed.event.ts
// NEW FILE
// ============================================================================

export class RiskAssessmentCompletedEvent{

    constructor(

        readonly principalId:string,

        readonly score:number

    ){}

}
