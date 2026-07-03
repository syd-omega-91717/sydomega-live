// ============================================================================
// FILE: /backend/src/modules/event-bus/application/commands/replay-events.command.ts
// NEW FILE
// ============================================================================

export class ReplayEventsCommand{

    constructor(

        readonly topic:string,

        readonly fromOffset:number

    ){}

}
