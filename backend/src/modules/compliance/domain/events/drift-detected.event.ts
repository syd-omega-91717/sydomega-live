// ============================================================================
// FILE: /backend/src/modules/compliance/domain/events/drift-detected.event.ts
// NEW FILE
// ============================================================================

export class DriftDetectedEvent{

    constructor(

        readonly resourceId:string,

        readonly driftType:string

    ){}

}
