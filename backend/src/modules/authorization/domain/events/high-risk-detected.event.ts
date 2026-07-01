// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/high-risk-detected.event.ts
// NEW FILE
// ============================================================================

export class HighRiskDetectedEvent{

    constructor(

        readonly principalId:string,

        readonly level:string

    ){}

}
