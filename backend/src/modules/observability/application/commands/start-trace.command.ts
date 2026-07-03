// ============================================================================
// FILE: /backend/src/modules/observability/application/commands/start-trace.command.ts
// NEW FILE
// ============================================================================

export class StartTraceCommand{

    constructor(

        readonly requestId:string,

        readonly service:string

    ){}

}
