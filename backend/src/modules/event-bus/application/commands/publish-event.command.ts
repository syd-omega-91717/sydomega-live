// ============================================================================
// FILE: /backend/src/modules/event-bus/application/commands/publish-event.command.ts
// NEW FILE
// ============================================================================

export class PublishEventCommand{

    constructor(

        readonly topic:string,

        readonly payload:Uint8Array

    ){}

}
