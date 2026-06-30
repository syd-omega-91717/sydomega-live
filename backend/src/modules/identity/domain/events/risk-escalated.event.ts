// ============================================================================
// FILE: /backend/src/modules/identity/domain/events/risk-escalated.event.ts
// NEW FILE
// ============================================================================

export class RiskEscalatedEvent{

    constructor(

        readonly userId:string,

        readonly level:string

    ){}

}
