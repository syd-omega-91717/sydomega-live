// ============================================================================
// FILE: /backend/src/modules/ai-agents/domain/entities/agent-task.ts
// NEW FILE
// ============================================================================

export class AgentTask{

    constructor(

        readonly taskId:string,

        readonly agentId:string,

        readonly objective:string,

        readonly priority:number,

        readonly assignedAt:Date

    ){}

}
