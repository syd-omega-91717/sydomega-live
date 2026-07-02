// ============================================================================
// FILE: /backend/src/modules/compliance/domain/events/control-evaluated.event.ts
// NEW FILE
// ============================================================================

export class ControlEvaluatedEvent{

    constructor(

        readonly controlId:string,

        readonly compliant:boolean

    ){}

}
