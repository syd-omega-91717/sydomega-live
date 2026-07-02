// ============================================================================
// FILE: /backend/src/modules/ai-agents/domain/events/task-delegated.event.ts
// NEW FILE
// ============================================================================

export class TaskDelegatedEvent{

    constructor(

        readonly taskId:string,

        readonly fromAgent:string,

        readonly toAgent:string

    ){}

}
