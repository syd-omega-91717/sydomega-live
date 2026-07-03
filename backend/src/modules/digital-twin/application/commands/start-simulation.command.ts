// ============================================================================
// FILE: /backend/src/modules/digital-twin/application/commands/start-simulation.command.ts
// NEW FILE
// ============================================================================

export class StartSimulationCommand{

    constructor(

        readonly twinId:string,

        readonly scenario:string

    ){}

}
