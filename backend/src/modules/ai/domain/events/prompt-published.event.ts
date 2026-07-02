// ============================================================================
// FILE: /backend/src/modules/ai/domain/events/prompt-published.event.ts
// NEW FILE
// ============================================================================

export class PromptPublishedEvent{

    constructor(

        readonly promptId:string,

        readonly version:string

    ){}

}
