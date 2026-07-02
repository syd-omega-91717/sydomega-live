// ============================================================================
// FILE: /backend/src/modules/audit/application/commands/append-event.command.ts
// NEW FILE
// ============================================================================

export class AppendEventCommand{

    constructor(

        readonly aggregateId:string,

        readonly aggregateType:string,

        readonly eventType:string,

        readonly payload:string

    ){}

}
