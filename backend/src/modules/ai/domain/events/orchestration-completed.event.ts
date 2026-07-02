// ============================================================================
// FILE: /backend/src/modules/ai/domain/events/orchestration-completed.event.ts
// NEW FILE
// ============================================================================

export class OrchestrationCompletedEvent{

    constructor(

        readonly orchestrationId:string,

        readonly selectedModel:string

    ){}

}
