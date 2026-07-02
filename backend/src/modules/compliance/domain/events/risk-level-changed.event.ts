// ============================================================================
// FILE: /backend/src/modules/compliance/domain/events/risk-level-changed.event.ts
// NEW FILE
// ============================================================================

export class RiskLevelChangedEvent{

    constructor(

        readonly riskId:string,

        readonly previousLevel:string,

        readonly currentLevel:string

    ){}

}
