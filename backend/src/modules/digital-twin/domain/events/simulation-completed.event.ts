// ============================================================================
// FILE: /backend/src/modules/digital-twin/domain/events/simulation-completed.event.ts
// NEW FILE
// ============================================================================

export class SimulationCompletedEvent{

    constructor(

        readonly simulationId:string,

        readonly twinId:string

    ){}

}
