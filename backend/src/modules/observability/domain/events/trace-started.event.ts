// ============================================================================
// FILE: /backend/src/modules/observability/domain/events/trace-started.event.ts
// NEW FILE
// ============================================================================

export class TraceStartedEvent{

    constructor(

        readonly traceId:string

    ){}

}
