// ============================================================================
// FILE: /backend/src/modules/ai/domain/events/prompt-executed.event.ts
// NEW FILE
// ============================================================================

export class PromptExecutedEvent{

    constructor(

        readonly executionId:string,

        readonly promptId:string

    ){}

}
