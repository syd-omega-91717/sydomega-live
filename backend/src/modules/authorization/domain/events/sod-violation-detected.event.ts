// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/sod-violation-detected.event.ts
// NEW FILE
// ============================================================================

export class SodViolationDetectedEvent{

    constructor(

        readonly userId:string,

        readonly ruleId:string

    ){}

}
